import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, UserRole } from '@/types';
import { logActivity } from './activityLog';
import { getVietnamTimestamp } from '@/utils/time';
import { startUserStatusTracking, stopUserStatusTracking } from '@/utils/userStatusTracker';

/**
 * Find user by username or email in Firestore
 */
const findUserByUsernameOrEmail = async (usernameOrEmail: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const searchLower = usernameOrEmail.toLowerCase().trim();
    
    // Try exact match first for username
    const usernameQuery = query(usersRef, where('username', '==', usernameOrEmail));
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      const userData = { ...usernameSnapshot.docs[0].data(), id: usernameSnapshot.docs[0].id } as User;
      console.log('User found by exact username:', userData.username, 'Email:', userData.email);
      return userData;
    }
    
    // Try exact match for email
    const emailQuery = query(usersRef, where('email', '==', usernameOrEmail));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      const userData = { ...emailSnapshot.docs[0].data(), id: emailSnapshot.docs[0].id } as User;
      console.log('User found by exact email:', userData.email);
      return userData;
    }
    
    // If exact match fails, try case-insensitive search
    // Get all users and search in memory (Firestore doesn't support case-insensitive queries)
    // Only do this if we have permission to read users
    try {
      const allUsersSnapshot = await getDocs(usersRef);
      
      for (const userDoc of allUsersSnapshot.docs) {
        const userData = userDoc.data() as User;
        
        // Case-insensitive username match
        if (userData.username?.toLowerCase().trim() === searchLower) {
          console.log('User found by username (case-insensitive):', userData.username, 'Email:', userData.email);
          return { ...userData, id: userDoc.id };
        }
        
        // Case-insensitive email match
        if (userData.email?.toLowerCase().trim() === searchLower) {
          console.log('User found by email (case-insensitive):', userData.email);
          return { ...userData, id: userDoc.id };
        }
      }
    } catch (error: any) {
      // If we can't read all users (permissions issue), just log and continue
      console.warn('Could not perform case-insensitive search:', error.message);
    }
    
    console.log('User not found for:', usernameOrEmail);
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

export const signIn = async (usernameOrEmail: string, password: string): Promise<User> => {
  try {
    let userEmail = usernameOrEmail;
    let user: User | null = null;
    
    // Try to find user by username or email in Firestore first
    user = await findUserByUsernameOrEmail(usernameOrEmail);
    
    if (user) {
      // User found in Firestore, use their email
      userEmail = user.email;
      console.log('Using email from Firestore for login:', userEmail);
    } else {
      console.log('User not found in Firestore, trying direct email login or legacy accounts');
      // User not found in Firestore, try to login directly with email
      // If input is username (no @), treat it as username and try to find matching email
      if (!usernameOrEmail.includes('@')) {
        // This is a username - try to construct email from common patterns
        // Since username is auto-generated from email (part before @), we need to find the original email
        // Try common email patterns based on username
        const possibleEmails = [
          `${usernameOrEmail}@demo.com`,
          `${usernameOrEmail}@example.com`,
          `${usernameOrEmail}@company.com`,
          `${usernameOrEmail}@gmail.com`,
          `${usernameOrEmail}@yahoo.com`,
          `${usernameOrEmail}@outlook.com`,
        ];
        
        let loginSuccess = false;
        let lastError: any = null;
        
        // Try each possible email format
        for (const email of possibleEmails) {
          try {
            console.log('Trying to login with email:', email);
            const testCredential = await signInWithEmailAndPassword(auth, email, password);
            // If successful, use this email
            userEmail = email;
            loginSuccess = true;
            
            // Check if Firestore document exists before creating a new one
            // This prevents overwriting user data with default admin role
            const firebaseUser = testCredential.user;
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              // User document exists, use it (don't overwrite with default admin role)
              user = userDoc.data() as User;
              console.log('User document found in Firestore:', user.role);
            } else {
              // Only create default document if user doesn't exist
              // This should not happen for newly created users, but handle it anyway
              console.warn('User document not found in Firestore for newly created account. Creating default document.');
              const emailParts = email.split('@');
              const defaultUser: User = {
                id: firebaseUser.uid,
                username: emailParts[0] || usernameOrEmail,
                email: email,
                role: 'staff', // Default to staff instead of admin for new accounts
                department: 'System',
                position: 'Employee',
                createdAt: getVietnamTimestamp(),
                updatedAt: getVietnamTimestamp(),
                isActive: true,
                notificationsEnabled: true,
              };
              
              await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
              user = defaultUser;
            }
            
            // Update user status
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              status: 'online',
              lastLoginAt: getVietnamTimestamp(),
              lastActivityAt: getVietnamTimestamp()
            });
            
            // Start user status tracking (no sessionId on login, will be updated on check-in)
            startUserStatusTracking(firebaseUser.uid);
            
            await logActivity(
              user.id,
              user.username,
              user.role,
              user.department,
              user.position,
              'login',
              'User logged in to the system'
            );
            
            return {
              ...user,
              status: 'online'
            };
          } catch (error: any) {
            lastError = error;
            // Continue to next email format
          }
        }
        
        // If all email formats failed, throw error
        if (!loginSuccess) {
          throw new Error('Account does not exist');
        }
      } else {
        // Input is already an email, use it directly
        userEmail = usernameOrEmail;
      }
    }
    
    // Login with Firebase Auth using the email
    const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    // If user document doesn't exist in Firestore, try to create it from Firebase Auth data
    if (!userDoc.exists()) {
      // This is a legacy account, create a basic user document
      const firebaseUser = userCredential.user;
      const emailParts = firebaseUser.email?.split('@') || ['user', 'example.com'];
      const vietnamTime = getVietnamTimestamp();
      const defaultUser: User = {
        id: firebaseUser.uid,
        username: emailParts[0] || 'user',
        email: firebaseUser.email || '',
        role: 'staff', // Default to staff instead of admin for safety
        department: 'System',
        position: 'Employee',
        createdAt: vietnamTime,
        updatedAt: vietnamTime,
        isActive: true,
        notificationsEnabled: true,
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), defaultUser);
      user = defaultUser;
    } else {
      user = userDoc.data() as User;
    }

    const userData = user;

    // Update user status to online immediately
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      status: 'online',
      lastLoginAt: getVietnamTimestamp(),
      lastActivityAt: getVietnamTimestamp()
    });

    // Start user status tracking
    startUserStatusTracking(userCredential.user.uid);
    
    console.log(`User ${userData.username} logged in and status tracking started`);

    await logActivity(
      userData.id,
      userData.username,
      userData.role,
      userData.department,
      userData.position,
      'login',
      'User logged in to the system'
    );

    // Return updated user data with online status
    return {
      ...userData,
      status: 'online'
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // User-friendly error messages
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('Username or password is incorrect');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('Account does not exist');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid username or email');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later');
    } else {
      throw new Error(error.message || 'Login failed');
    }
  }
};

export const signOut = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        
        // Stop user status tracking
        await stopUserStatusTracking(user.uid);
        
        await logActivity(
          userData.id,
          userData.username,
          userData.role,
          userData.department,
          userData.position,
          'logout',
          'User logged out from the system'
        );
      }
    }
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const createUser = async (
  email: string,
  password: string,
  username: string,
  role: UserRole,
  department: string,
  position: string,
  createdBy: User
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    const vietnamTime = getVietnamTimestamp();
    const newUser: User = {
      id: userCredential.user.uid,
      username,
      email,
      role,
      department,
      position,
      createdAt: vietnamTime,
      updatedAt: vietnamTime,
      isActive: true,
      notificationsEnabled: true,
    };

    await setDoc(doc(db, 'users', newUser.id), newUser);

    await logActivity(
      newUser.id,
      newUser.username,
      newUser.role,
      newUser.department,
      newUser.position,
      'account_created',
      `Account created by ${createdBy.username}`,
      createdBy.id,
      createdBy.role,
      createdBy.department
    );

    return newUser;
  } catch (error: any) {
    console.error('Create user error:', error);
    throw new Error(error.message || 'Failed to create user');
  }
};

export const updateUserPassword = async (
  userId: string,
  newPassword: string,
  performedBy: User
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    await firebaseUpdatePassword(user, newPassword);

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      await logActivity(
        userData.id,
        userData.username,
        userData.role,
        userData.department,
        userData.position,
        'password_reset',
        `Password reset by ${performedBy.username}`,
        performedBy.id,
        performedBy.role,
        performedBy.department
      );
    }
  } catch (error: any) {
    console.error('Update password error:', error);
    throw new Error(error.message || 'Failed to update password');
  }
};

export const getCurrentUser = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const resetUserPasswordByAdmin = async (userId: string, newPassword: string): Promise<{ email: string; password: string }> => {
  try {
    // Get user document to find email
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as User;
    const userEmail = userData.email;

    // Store new password in Firestore for admin reference
    await updateDoc(doc(db, 'users', userId), {
      passwordResetRequired: true,
      passwordResetTime: getVietnamTimestamp(),
      intendedPassword: newPassword, // Store for admin to share with user
      updatedAt: getVietnamTimestamp()
    });

    // Log activity
    await logActivity(
      userId,
      userData.username,
      userData.role,
      userData.department,
      userData.position,
      'password_reset',
      'Password reset by admin (password ready to share)',
      'admin',
      'admin',
      'System'
    );

    // Return email and password for admin to share with user
    // Admin will manually send email or share password with user
    return {
      email: userEmail,
      password: newPassword
    };
    
  } catch (error: any) {
    console.error('Error resetting password by admin:', error);
    throw new Error(error.message || 'Unable to generate password reset');
  }
};

