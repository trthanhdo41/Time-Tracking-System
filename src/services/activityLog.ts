import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ActivityLog, ActionType, UserRole } from '@/types';

export const logActivity = async (
  userId: string,
  userName: string,
  userRole: UserRole,
  userDepartment: string,
  userPosition: string,
  actionType: ActionType,
  actionDetails: string,
  performedBy?: string,
  performedByRole?: UserRole,
  performedByDepartment?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const activityLog: any = {
      userId,
      userName,
      userRole,
      userDepartment,
      userPosition,
      actionType,
      actionDetails,
      timestamp: Date.now(),
      createdAt: Timestamp.now(),
    };

    // Only add optional fields if they exist
    if (performedBy) activityLog.performedBy = performedBy;
    if (performedByRole) activityLog.performedByRole = performedByRole;
    if (performedByDepartment) activityLog.performedByDepartment = performedByDepartment;
    if (metadata) activityLog.metadata = metadata;

    await addDoc(collection(db, 'activityLogs'), activityLog);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getActivityLogs = async (
  userId?: string,
  department?: string,
  startDate?: number,
  endDate?: number
): Promise<ActivityLog[]> => {
  try {
    let q = query(collection(db, 'activityLogs'));

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (department) {
      q = query(q, where('userDepartment', '==', department));
    }

    if (startDate) {
      q = query(q, where('timestamp', '>=', startDate));
    }

    if (endDate) {
      q = query(q, where('timestamp', '<=', endDate));
    }

    q = query(q, orderBy('timestamp', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityLog));
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return [];
  }
};

export const getAllActivityLogs = async (): Promise<ActivityLog[]> => {
  try {
    const q = query(collection(db, 'activityLogs'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityLog));
  } catch (error) {
    console.error('Error getting all activity logs:', error);
    return [];
  }
};

