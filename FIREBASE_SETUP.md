# 🔥 Firebase Database Schema

## Collections Structure

### 1. users
```typescript
{
  id: string;              // Firebase Auth UID
  username: string;        // Tên hiển thị
  email: string;          // Email đăng nhập
  role: 'admin' | 'department_admin' | 'staff';
  department: string;     // Tên phòng ban
  position: string;       // Chức vụ
  faceImageUrl?: string;  // Face0 - base face image URL
  createdAt: number;      // Timestamp
  updatedAt: number;      // Timestamp
  isActive: boolean;      // Trạng thái active
  notificationsEnabled: boolean;
}
```

### 2. sessions
```typescript
{
  id: string;                    // userId_timestamp
  userId: string;                // Reference to users
  checkInTime: number;           // Timestamp check-in
  checkOutTime?: number;         // Timestamp check-out
  totalOnlineTime: number;       // Tổng thời gian online (seconds)
  totalBackSoonTime: number;     // Tổng thời gian back soon (seconds)
  status: 'online' | 'offline' | 'back_soon';
  face1Url?: string;            // First check-in face image
  lastActivityTime: number;      // Last activity timestamp
  captchaAttempts: number;       // Số lần thử captcha
  faceVerificationCount: number; // Số lần verify face
}
```

### 3. backSoonRecords
```typescript
{
  id: string;
  sessionId: string;            // Reference to sessions
  userId: string;               // Reference to users
  reason: 'meeting' | 'wc' | 'other';
  customReason?: string;        // Nếu reason = 'other'
  startTime: number;            // Timestamp bắt đầu
  endTime?: number;             // Timestamp kết thúc
  duration?: number;            // Thời gian (seconds)
}
```

### 4. history
```typescript
{
  id: string;
  userId: string;               // Reference to users
  date: string;                 // YYYY-MM-DD
  checkInTime: number;          // Timestamp
  checkOutTime?: number;        // Timestamp
  backSoonTime: number;         // Tổng thời gian back soon (seconds)
  onlineTime: number;           // Tổng thời gian online (seconds)
  backSoonRecords: BackSoonRecord[];
  reason?: string;              // Lý do đặc biệt (nếu có)
}
```

### 5. activityLogs
```typescript
{
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'department_admin' | 'staff';
  userDepartment: string;
  userPosition: string;
  actionType: 'check_in' | 'check_out' | 'back_soon' | 'captcha_verify' | 
              'face_verify' | 'delete_image_request' | 'account_created' | 
              'account_deleted' | 'password_reset' | 'permission_changed';
  actionDetails: string;
  performedBy?: string;         // Admin ID (nếu là admin action)
  performedByRole?: string;
  performedByDepartment?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

### 6. imageDeleteRequests
```typescript
{
  id: string;
  userId: string;               // Người yêu cầu
  imageUrl: string;             // URL hình ảnh cần xóa
  reason: string;               // Lý do xóa
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;          // Timestamp
  reviewedAt?: number;          // Timestamp
  reviewedBy?: string;          // Admin ID
  reviewerComment?: string;     // Comment của reviewer
}
```

### 7. notifications
```typescript
{
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
```

### 8. faceVerifications
```typescript
{
  id: string;
  userId: string;
  sessionId: string;
  imageUrl: string;             // URL của ảnh verify
  matchScore: number;           // Độ chính xác (0-1)
  verified: boolean;
  createdAt: number;
  type: 'check_in' | 'periodic' | 'check_out';
}
```

### 9. captchaChallenges
```typescript
{
  id: string;
  userId: string;
  sessionId: string;
  code: string;                 // Mã captcha
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}
```

### 10. departments
```typescript
{
  id: string;
  name: string;
  adminId?: string;             // Department Admin ID
  createdAt: number;
  updatedAt: number;
}
```

## Storage Structure

```
storage/
├── faces/
│   ├── {userId}/
│   │   ├── face0.jpg          // Base face (uploaded khi tạo account)
│   │   ├── checkin_{timestamp}.jpg
│   │   ├── verify_{timestamp}.jpg
│   │   └── checkout_{timestamp}.jpg
```

## Indexes (Firestore)

Tạo indexes sau trong Firestore:

### activityLogs
- Collection: `activityLogs`
- Fields: `userId` (Ascending), `timestamp` (Descending)

### activityLogs (Department)
- Collection: `activityLogs`
- Fields: `userDepartment` (Ascending), `timestamp` (Descending)

### sessions
- Collection: `sessions`
- Fields: `userId` (Ascending), `checkInTime` (Descending)

### history
- Collection: `history`
- Fields: `userId` (Ascending), `date` (Descending)

### notifications
- Collection: `notifications`
- Fields: `userId` (Ascending), `createdAt` (Descending)

## Security Considerations

1. **Authentication Required**: Tất cả operations đều require authentication
2. **Role-Based Access**: 
   - Staff: Chỉ đọc/ghi dữ liệu của mình
   - Department Admin: Quản lý users trong department
   - Admin: Full access
3. **Image Storage**: Users chỉ có thể đọc ảnh của mình, Admin đọc tất cả
4. **Activity Logs**: Không ai được xóa logs (chỉ Admin mới có quyền)

## Initial Setup Script

Để tạo admin user đầu tiên, sử dụng Firebase Console hoặc script:

```javascript
// admin user
{
  id: "generated-uid",
  username: "Admin",
  email: "admin@demo.com",
  role: "admin",
  department: "Management",
  position: "System Administrator",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isActive: true,
  notificationsEnabled: true
}
```

