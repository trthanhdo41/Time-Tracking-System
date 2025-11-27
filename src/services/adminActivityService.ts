import { db } from '@/config/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { getVietnamTimestamp } from '@/utils/time';

export type AdminActionType = 
  | 'approve_image_delete'
  | 'reject_image_delete'
  | 'delete_image'
  | 'change_password'
  | 'create_user'
  | 'delete_user'
  | 'update_user'
  | 'update_system_settings'
  | 'approve_forgot_password'
  | 'reject_forgot_password'
  | 'force_checkout'
  | 'view_reports'
  | 'export_data';

export interface AdminActivityLog {
  id?: string;
  adminUsername: string;
  adminRole: 'admin' | 'department_admin';
  actionType: AdminActionType;
  actionDescription: string;
  targetUser?: string; // Username of affected user
  targetResource?: string; // ID of affected resource (image, session, etc.)
  metadata?: Record<string, any>; // Additional context
  timestamp: number;
  ipAddress?: string;
}

const ADMIN_LOGS_COLLECTION = 'adminActivityLogs';

// Log an admin action
export const logAdminActivity = async (
  log: Omit<AdminActivityLog, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    await addDoc(collection(db, ADMIN_LOGS_COLLECTION), {
      ...log,
      timestamp: getVietnamTimestamp(),
    });
  } catch (error) {
    console.error('Error logging admin activity:', error);
    // Don't throw - logging should not break the main action
  }
};

// Get admin activity logs with filters
export const getAdminActivityLogs = async (options?: {
  adminUsername?: string;
  actionType?: AdminActionType;
  targetUser?: string;
  startDate?: number;
  endDate?: number;
  limitCount?: number;
}): Promise<AdminActivityLog[]> => {
  try {
    const logsRef = collection(db, ADMIN_LOGS_COLLECTION);
    let q = query(logsRef, orderBy('timestamp', 'desc'));

    // Apply filters
    if (options?.adminUsername) {
      q = query(q, where('adminUsername', '==', options.adminUsername));
    }
    if (options?.actionType) {
      q = query(q, where('actionType', '==', options.actionType));
    }
    if (options?.targetUser) {
      q = query(q, where('targetUser', '==', options.targetUser));
    }
    if (options?.startDate) {
      q = query(q, where('timestamp', '>=', options.startDate));
    }
    if (options?.endDate) {
      q = query(q, where('timestamp', '<=', options.endDate));
    }

    // Apply limit
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    } else {
      q = query(q, limit(100)); // Default limit
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AdminActivityLog));
  } catch (error) {
    console.error('Error fetching admin activity logs:', error);
    return [];
  }
};

// Get activity statistics
export const getAdminActivityStats = async (
  startDate?: number,
  endDate?: number
): Promise<{
  totalActions: number;
  actionsByType: Record<AdminActionType, number>;
  actionsByAdmin: Record<string, number>;
}> => {
  try {
    const logs = await getAdminActivityLogs({ startDate, endDate, limitCount: 1000 });
    
    const actionsByType: Record<string, number> = {};
    const actionsByAdmin: Record<string, number> = {};

    logs.forEach(log => {
      // Count by type
      actionsByType[log.actionType] = (actionsByType[log.actionType] || 0) + 1;
      
      // Count by admin
      actionsByAdmin[log.adminUsername] = (actionsByAdmin[log.adminUsername] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      actionsByType: actionsByType as Record<AdminActionType, number>,
      actionsByAdmin,
    };
  } catch (error) {
    console.error('Error fetching admin activity stats:', error);
    return {
      totalActions: 0,
      actionsByType: {} as Record<AdminActionType, number>,
      actionsByAdmin: {},
    };
  }
};

// Helper to format action description
export const formatActionDescription = (actionType: AdminActionType, metadata?: Record<string, any>): string => {
  const descriptions: Record<AdminActionType, string> = {
    approve_image_delete: `Approved image deletion request${metadata?.imageId ? ` for image ${metadata.imageId}` : ''}`,
    reject_image_delete: `Rejected image deletion request${metadata?.imageId ? ` for image ${metadata.imageId}` : ''}`,
    delete_image: `Deleted image${metadata?.imageId ? ` ${metadata.imageId}` : ''}`,
    change_password: 'Changed user password',
    create_user: 'Created new user account',
    delete_user: 'Deleted user account',
    update_user: 'Updated user information',
    update_system_settings: `Updated system settings${metadata?.section ? ` (${metadata.section})` : ''}`,
    approve_forgot_password: 'Approved password reset request',
    reject_forgot_password: 'Rejected password reset request',
    force_checkout: 'Forced user check-out',
    view_reports: 'Viewed reports',
    export_data: `Exported data${metadata?.reportType ? ` (${metadata.reportType})` : ''}`,
  };

  return descriptions[actionType] || 'Unknown action';
};

