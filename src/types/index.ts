export type UserRole = 'admin' | 'department_admin' | 'staff';

export type UserStatus = 'online' | 'offline' | 'back_soon';

export type ActionType = 
  | 'check_in'
  | 'check_out'
  | 'back_soon'
  | 'back_online'
  | 'captcha_verify'
  | 'captcha_failed'
  | 'face_verify'
  | 'face_verification_failed'
  | 'delete_image_request'
  | 'account_created'
  | 'account_updated'
  | 'account_deleted'
  | 'password_reset'
  | 'permission_changed';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  status?: UserStatus; // Add status field
  faceImageUrl?: string; // Face0 - base face image
  face1Url?: string;     // First check-in face image
  face2Url?: string;     // Periodic verification face image
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  notificationsEnabled: boolean;
}


export interface Session {
  id: string;
  userId: string;
  username: string;
  department: string;
  position: string;
  checkInTime: number;
  checkOutTime?: number;
  totalOnlineTime: number; // in seconds
  totalBackSoonTime: number; // in seconds
  status: UserStatus;
  faceImageUrl?: string; // Face0 - base face (from user profile)
  face1Url?: string; // Face1 - First check-in face
  face2Url?: string; // Face2 - Periodic verification face
  lastActivityTime: number;
  captchaAttempts: number;
  captchaSuccessCount: number; // Track successful CAPTCHA completions
  faceVerificationCount: number;
  lastCaptchaTime?: number;
  checkOutReason?: string;
  backSoonEvents?: BackSoonRecord[];
}

export interface BackSoonRecord {
  id: string;
  sessionId: string;
  userId: string;
  reason: 'meeting' | 'wc' | 'other';
  customReason?: string;
  startTime: number;
  endTime?: number;
  duration?: number; // in seconds
}

export interface HistoryRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkInTime: number;
  checkOutTime?: number;
  backSoonTime: number; // total in seconds
  onlineTime: number; // total in seconds
  backSoonRecords: BackSoonRecord[];
  reason?: string;
}

export interface CaptchaChallenge {
  id: string;
  userId: string;
  sessionId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

export interface FaceVerification {
  id: string;
  userId: string;
  sessionId: string;
  imageUrl: string;
  matchScore: number;
  verified: boolean;
  createdAt: number;
  type: 'check_in' | 'periodic' | 'check_out';
}

export interface ImageDeleteRequest {
  id: string;
  userId: string;
  imageUrl: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewerComment?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string; // Add username field
  userName?: string; // Keep userName for backward compatibility
  department: string; // Add department field
  userDepartment?: string; // Keep userDepartment for backward compatibility
  position: string; // Add position field
  userPosition?: string; // Keep userPosition for backward compatibility
  userRole: UserRole;
  actionType: ActionType;
  description: string; // Add description field
  actionDetails?: string; // Keep actionDetails for backward compatibility
  performedBy?: string; // For admin actions
  performedByRole?: UserRole;
  performedByDepartment?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Department {
  id: string;
  name: string;
  adminId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'captcha' | 'face_verify' | 'check_out_warning' | 'system';
  title: string;
  message: string;
  playSound: boolean;
  requireAcknowledgment: boolean;
  acknowledged: boolean;
  createdAt: number;
  expiresAt?: number;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  department: string;
  position: string;
  period: {
    start: number;
    end: number;
  };
  totalWorkDays: number;
  totalOnlineTime: number; // in seconds
  totalBackSoonTime: number; // in seconds
  averageOnlineTime: number; // in seconds per day
  punctualityRate: number; // percentage
  generatedAt: number;
  generatedBy: string;
}

export interface SystemConfig {
  captchaIntervalMinutes: number;
  captchaMaxAttempts: number;
  captchaTimeoutSeconds: number;
  faceCheckInterval: number; // number of captcha verifications before face check
  faceMatchThreshold: number; // 0-1, confidence threshold
  notificationSoundDuration: number; // seconds
  captchaWarningTime: number; // seconds before captcha, show notification
}

