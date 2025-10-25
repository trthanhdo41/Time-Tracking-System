// User management service with real Firebase operations
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import { User, UserRole, Session } from '@/types';
import { logActivity } from './activityLog';
import { Timestamp } from 'firebase/firestore';

/**
 * Get all users from Firestore
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as User));
  } catch (error) {
    console.error('Error getting users:', error);
    throw new Error('Không thể tải danh sách người dùng');
  }
};

/**
 * Get users by department
 */
export const getUsersByDepartment = async (department: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('department', '==', department));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as User));
  } catch (error) {
    console.error('Error getting users by department:', error);
    throw new Error('Không thể tải danh sách người dùng');
  }
};

/**
 * Create new user
 */
export const createNewUser = async (
  email: string,
  password: string,
  username: string,
  role: UserRole,
  department: string,
  position: string,
  performedBy: User,
  faceImageUrl?: string // Optional Face0 URL
): Promise<User> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const newUser: User = {
      id: userCredential.user.uid,
      username,
      email,
      role,
      department,
      position,
      faceImageUrl, // Face0 - base face image
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      notificationsEnabled: true,
    };

    // Save to Firestore
    await setDoc(doc(db, 'users', newUser.id), newUser);

    // Log activity
    await logActivity(
      newUser.id,
      newUser.username,
      newUser.role,
      newUser.department,
      newUser.position,
      'account_created',
      `Tài khoản được tạo bởi ${performedBy.username}`,
      performedBy.id,
      performedBy.role,
      performedBy.department
    );

    // IMPORTANT: Sign out the new user to prevent auto-login
    // This keeps the admin logged in
    await signOut(auth);
    
    // Note: In production, use Firebase Admin SDK on server to avoid this issue

    return newUser;
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email đã được sử dụng');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Mật khẩu quá yếu (tối thiểu 6 ký tự)');
    } else {
      throw new Error('Không thể tạo người dùng');
    }
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string, performedBy: User): Promise<void> => {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
    
    if (userDoc.empty) {
      throw new Error('Không tìm thấy người dùng');
    }

    const userData = userDoc.docs[0].data() as User;

    // Delete from Firestore
    await deleteDoc(doc(db, 'users', userId));

    // Log activity
    await logActivity(
      userId,
      userData.username,
      userData.role,
      userData.department,
      userData.position,
      'account_deleted',
      `Tài khoản bị xóa bởi ${performedBy.username}`,
      performedBy.id,
      performedBy.role,
      performedBy.department
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Không thể xóa người dùng');
  }
};

/**
 * Update user information
 */
export const updateUser = async (
  userId: string,
  updates: Partial<Pick<User, 'username' | 'department' | 'position' | 'role' | 'faceImageUrl'>>,
  performedBy: User
): Promise<void> => {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
    
    if (userDoc.empty) {
      throw new Error('Không tìm thấy người dùng');
    }

    const userData = userDoc.docs[0].data() as User;
    const userDocRef = doc(db, 'users', userId);

    // Update Firestore
    await setDoc(userDocRef, {
      ...userData,
      ...updates,
      updatedAt: Date.now()
    }, { merge: true });

    // Log activity
    const changes = Object.keys(updates).join(', ');
    await logActivity(
      userId,
      userData.username,
      userData.role,
      userData.department,
      userData.position,
      'account_updated',
      `Thông tin tài khoản được cập nhật: ${changes} bởi ${performedBy.username}`,
      performedBy.id,
      performedBy.role,
      performedBy.department
    );
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Không thể cập nhật thông tin người dùng');
  }
};

/**
 * Get all sessions for a specific user
 */
export const getUserSessions = async (userId: string): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('checkInTime', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        checkInTime: data.checkInTime instanceof Timestamp ? data.checkInTime.toMillis() : data.checkInTime,
        checkOutTime: data.checkOutTime instanceof Timestamp ? data.checkOutTime?.toMillis() : data.checkOutTime,
        lastActivityTime: data.lastActivityTime instanceof Timestamp ? data.lastActivityTime.toMillis() : data.lastActivityTime,
        lastCaptchaTime: data.lastCaptchaTime instanceof Timestamp ? data.lastCaptchaTime?.toMillis() : data.lastCaptchaTime,
      } as Session;
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw new Error('Không thể tải lịch sử làm việc');
  }
};

/**
 * Reset user password
 * Note: This requires Firebase Admin SDK on backend in production
 */
export const resetUserPassword = async (
  userId: string,
  performedBy: User
): Promise<void> => {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
    
    if (userDoc.empty) {
      throw new Error('Không tìm thấy người dùng');
    }

    const userData = userDoc.docs[0].data() as User;

    // Note: In production, you'd use Firebase Admin SDK on backend
    // For now, just log the activity
    
    await logActivity(
      userId,
      userData.username,
      userData.role,
      userData.department,
      userData.position,
      'password_reset',
      `Mật khẩu được reset bởi ${performedBy.username}`,
      performedBy.id,
      performedBy.role,
      performedBy.department
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new Error('Không thể reset mật khẩu');
  }
};

/**
 * Listen to users real-time
 */
export const listenToUsers = (
  callback: (users: User[]) => void,
  department?: string
): (() => void) => {
  try {
    const usersRef = collection(db, 'users');
    const q = department 
      ? query(usersRef, where('department', '==', department))
      : usersRef;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as User));
      callback(users);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error listening to users:', error);
    return () => {};
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  try {
    const users = await getAllUsers();
    
    // Count users by status
    const onlineCount = users.filter(user => user.status === 'online').length;
    const backSoonCount = users.filter(user => user.status === 'back_soon').length;
    const offlineCount = users.filter(user => user.status === 'offline').length;

    return {
      total: users.length,
      online: onlineCount,
      backSoon: backSoonCount,
      offline: offlineCount
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      total: 0,
      online: 0,
      backSoon: 0,
      offline: 0
    };
  }
};

