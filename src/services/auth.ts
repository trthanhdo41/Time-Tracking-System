import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, UserRole } from '@/types';
import { logActivity } from './activityLog';

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }

    const userData = userDoc.data() as User;

    // Update user status to online
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      status: 'online',
      lastLoginAt: Date.now()
    });

    await logActivity(
      userData.id,
      userData.username,
      userData.role,
      userData.department,
      userData.position,
      'check_in',
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
      throw new Error('Email hoặc mật khẩu không đúng');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('Tài khoản không tồn tại');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email không hợp lệ');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Quá nhiều lần thử. Vui lòng thử lại sau');
    } else {
      throw new Error(error.message || 'Đăng nhập thất bại');
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
        
        // Update user status to offline
        await updateDoc(doc(db, 'users', user.uid), {
          status: 'offline',
          lastLogoutAt: Date.now()
        });
        
        await logActivity(
          userData.id,
          userData.username,
          userData.role,
          userData.department,
          userData.position,
          'check_out',
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
    
    const newUser: User = {
      id: userCredential.user.uid,
      username,
      email,
      role,
      department,
      position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

export const resetUserPasswordByAdmin = async (userId: string, newPassword: string): Promise<void> => {
  try {
    // This would typically require Firebase Admin SDK
    // For now, we'll use the client-side approach
    // In production, this should be done server-side
    
    const { updateDoc, doc } = await import('firebase/firestore');
    const { db } = await import('@/config/firebase');
    
    // Update user document with reset flag
    await updateDoc(doc(db, 'users', userId), {
      passwordResetRequired: true,
      passwordResetTime: Date.now(),
      updatedAt: Date.now()
    });
    
    // Log activity
    const { logActivity } = await import('@/services/activityLog');
    await logActivity(
      userId,
      'System',
      'admin',
      'System',
      'Admin',
      'password_reset',
      'Password reset initiated by admin',
      'admin',
      'admin',
      'System'
    );
    
  } catch (error: any) {
    console.error('Error resetting password by admin:', error);
    throw new Error('Không thể reset mật khẩu người dùng');
  }
};

