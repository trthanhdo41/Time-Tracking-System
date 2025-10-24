# 🎭 FACE VERIFICATION WORKFLOW - HOÀN CHỈNH

## 📋 **OVERVIEW**

Hệ thống Face Verification hoàn chỉnh kết hợp ý khách + logic tốt nhất!

---

## 🔄 **WORKFLOW LOGIC**

### **1. Admin Tạo User (Face0)**
```typescript
// Admin Dashboard - Thêm Nhân Viên
- Upload Face0 (optional) - Ảnh khuôn mặt gốc
- Nếu không có Face0 → Face1 sẽ làm ảnh gốc
- Face0 được lưu vào user.faceImageUrl
```

### **2. Check-In Lần Đầu (Face1)**
```typescript
// Staff Dashboard - Check In
- Bật camera, detect face
- So sánh với Face0 (nếu có)
- Chụp Face1 → Upload Imgbb
- Session.faceImageUrl = Face0 || Face1
- Session.face1Url = Face1
- Session.captchaSuccessCount = 0
```

### **3. CAPTCHA Định Kỳ**
```typescript
// Mỗi VITE_CAPTCHA_INTERVAL_MINUTES (30 phút)
- Show CAPTCHA modal
- Max 3 attempts (VITE_CAPTCHA_MAX_ATTEMPTS)
- Timeout 60s (VITE_CAPTCHA_TIMEOUT_SECONDS)

SUCCESS:
  ✅ captchaSuccessCount++
  ✅ captchaAttempts = 0
  ✅ Check if captchaSuccessCount >= VITE_CAPTCHA_COUNT_BEFORE_FACE (3)
  ✅ If yes → Trigger Face Verification

FAIL (3 lần hoặc timeout):
  ❌ Auto Check-Out
```

### **4. Face Verification (Face2)**
```typescript
// Sau VITE_CAPTCHA_COUNT_BEFORE_FACE (3) lần CAPTCHA thành công
- Show Face Verification modal
- Detect face từ camera
- Compare với Face0 (nếu có)
- Compare với Face1
- Similarity threshold: 0.6

SUCCESS:
  ✅ Chụp Face2 → Upload Imgbb
  ✅ Save Face2 vào session.face2Url
  ✅ Reset captchaSuccessCount = 0
  ✅ faceVerificationCount++
  ✅ Continue working

FAIL:
  ❌ Auto Check-Out
  ❌ Log reason
```

---

## 🗂️ **DATA STRUCTURE**

### **User Interface**
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  faceImageUrl?: string;  // Face0 - base face (optional)
  face1Url?: string;      // Face1 - first check-in
  face2Url?: string;      // Face2 - verification
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  notificationsEnabled: boolean;
}
```

### **Session Interface**
```typescript
interface Session {
  id: string;
  userId: string;
  username: string;
  department: string;
  position: string;
  checkInTime: number;
  checkOutTime?: number;
  totalOnlineTime: number;
  totalBackSoonTime: number;
  status: UserStatus;
  faceImageUrl?: string;        // Face0 (from user) or Face1
  face1Url?: string;             // Check-in face
  face2Url?: string;             // Verification face
  lastActivityTime: number;
  captchaAttempts: number;
  captchaSuccessCount: number;   // 🆕 Track CAPTCHA successes
  faceVerificationCount: number;
  lastCaptchaTime?: number;
  checkOutReason?: string;
  backSoonEvents?: BackSoonRecord[];
}
```

---

## ⚙️ **ENVIRONMENT VARIABLES**

```env
# CAPTCHA Configuration
VITE_CAPTCHA_INTERVAL_MINUTES=30          # Thời gian giữa các CAPTCHA (phút)
VITE_CAPTCHA_MAX_ATTEMPTS=3               # Số lần nhập sai tối đa
VITE_CAPTCHA_TIMEOUT_SECONDS=60           # Timeout (giây)

# Face Verification Configuration
VITE_CAPTCHA_COUNT_BEFORE_FACE=3          # 🆕 Số CAPTCHA thành công trước khi verify face
VITE_FACE_VERIFICATION_SIMILARITY_THRESHOLD=0.6  # Ngưỡng so sánh khuôn mặt

# Notification
VITE_FACE_VERIFICATION_WARNING_MINUTES=5   # Cảnh báo trước khi verify face
```

---

## 🎯 **FEATURES IMPLEMENTED**

### ✅ **Admin Dashboard**
- [x] Upload Face0 khi tạo user mới
- [x] Preview ảnh Face0 trước khi tạo
- [x] Optional - nếu không có sẽ dùng Face1

### ✅ **Staff Dashboard - Check In**
- [x] Camera inline (không dùng modal)
- [x] Detect face với TensorFlow.js
- [x] Compare với Face0 (nếu có)
- [x] Capture Face1 → Upload Imgbb
- [x] Create session với Face0/Face1

### ✅ **CAPTCHA System**
- [x] Random CAPTCHA generation
- [x] Max attempts tracking
- [x] Timeout handling
- [x] Success counter (captchaSuccessCount) 🆕
- [x] Auto check-out on fail
- [x] Sound notification

### ✅ **Face Verification**
- [x] Trigger sau N lần CAPTCHA thành công 🆕
- [x] Compare với Face0 + Face1
- [x] Capture Face2 → Upload Imgbb
- [x] Reset captchaSuccessCount sau verify
- [x] Auto check-out on fail
- [x] Activity logging

### ✅ **Services Updated**
- [x] `sessionService.ts`: captchaSuccessCount
- [x] `userService.ts`: Face0 upload
- [x] `activityLog.ts`: New action types

### ✅ **Types Updated**
- [x] Session interface: captchaSuccessCount, face fields
- [x] ActionType: back_online, captcha_failed

---

## 🚀 **TESTING WORKFLOW**

### **Scenario 1: User Có Face0**
1. Admin upload Face0 khi tạo user
2. Staff check-in → Compare với Face0 → Capture Face1
3. Sau 30 phút → CAPTCHA #1 → Success (count = 1)
4. Sau 30 phút → CAPTCHA #2 → Success (count = 2)
5. Sau 30 phút → CAPTCHA #3 → Success (count = 3)
6. **Trigger Face Verification** → Compare Face0 + Face1 → Capture Face2
7. Reset count = 0 → Lặp lại

### **Scenario 2: User Không Có Face0**
1. Admin không upload Face0
2. Staff check-in → Capture Face1 → Face1 làm base
3. Session.faceImageUrl = Face1
4. Workflow CAPTCHA → Face Verification như trên
5. Compare với Face1 thay vì Face0

### **Scenario 3: CAPTCHA Fail**
1. Staff nhập sai 3 lần → Auto Check-Out
2. Hoặc timeout → Auto Check-Out

### **Scenario 4: Face Verification Fail**
1. Face không khớp → Auto Check-Out
2. Log activity với reason

---

## 📊 **FILES CHANGED**

### **1. Types**
- `src/types/index.ts`
  - Added `captchaSuccessCount` to Session
  - Added face fields (faceImageUrl, face1Url, face2Url)
  - Added ActionType: back_online, captcha_failed

### **2. Services**
- `src/services/sessionService.ts`
  - `createCheckInSession`: Initialize captchaSuccessCount
  - `updateCaptchaAttempt`: Increment captchaSuccessCount on success

- `src/services/userService.ts`
  - `createNewUser`: Accept optional faceImageUrl (Face0)

### **3. Components**
- `src/pages/StaffDashboard.tsx`
  - `handleCaptchaSuccess`: Check captchaSuccessCount → Trigger Face Verification

- `src/components/staff/FaceVerificationModal.tsx`
  - Reset captchaSuccessCount after successful verification
  - Save Face2 to session

- `src/pages/AdminDashboard.tsx`
  - Face0 upload field
  - Image preview
  - Upload to Imgbb before creating user

---

## 🎨 **UI/UX ENHANCEMENTS**

- ✨ Face0 upload với preview đẹp
- ✨ File input với hover effects
- ✨ 5MB file size limit
- ✨ Image type validation
- ✨ Toast notifications cho từng bước
- ✨ Smooth transitions

---

## 🔐 **SECURITY**

- ✅ Face comparison threshold: 0.6 (60%)
- ✅ Max 3 CAPTCHA attempts
- ✅ Timeout protection
- ✅ Auto check-out on violations
- ✅ Activity logging
- ✅ Firestore security rules

---

## 📝 **NOTES**

1. **Face0 Optional**: Nếu admin không upload, Face1 sẽ làm base face
2. **Flexible Timing**: Tất cả timing có thể config qua env vars
3. **Imgbb Required**: Cần VITE_IMGBB_API_KEY để upload ảnh
4. **Models Required**: Face detection models phải có trong `/public/models/`
5. **Firebase Indexes**: Queries đã optimize để tránh cần indexes phức tạp

---

## 🎯 **KẾT LUẬN**

✅ **Logic hoàn chỉnh**: Kết hợp ý khách + best practices
✅ **Flexible**: Admin có thể upload Face0 hoặc không
✅ **Secure**: Multi-layer verification
✅ **Scalable**: Dễ dàng điều chỉnh thresholds và timing
✅ **User-friendly**: UX mượt mà, thông báo rõ ràng

🚀 **READY FOR PRODUCTION!**
