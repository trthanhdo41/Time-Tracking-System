# 🚀 Hướng Dẫn Cài Đặt Chi Tiết

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: phiên bản 18.x hoặc cao hơn
- **npm** hoặc **yarn**: package manager
- **Firebase Account**: tài khoản Google Firebase
- **Browser**: Chrome, Firefox, Safari, hoặc Edge phiên bản mới nhất
- **Camera**: Webcam hoặc camera tích hợp cho tính năng nhận diện khuôn mặt

## 🛠️ Bước 1: Clone và Cài Đặt Dependencies

```bash
# Clone repository
cd "/Users/mac/Desktop/web check in theo dõi thời gian online"

# Cài đặt các dependencies
npm install

# Hoặc nếu dùng yarn
yarn install
```

## 🔥 Bước 2: Cấu Hình Firebase

### 2.1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" hoặc "Thêm dự án"
3. Đặt tên project: `time-tracking-system`
4. Tắt Google Analytics (không bắt buộc)
5. Click "Create project"

### 2.2. Tạo Web App

1. Trong Firebase Console, chọn project vừa tạo
2. Click vào biểu tượng Web `</>`
3. Đặt tên app: `Time Tracking Web`
4. **Không** chọn Firebase Hosting (chúng ta sẽ deploy riêng)
5. Click "Register app"
6. Copy toàn bộ config object

### 2.3. Tạo File `.env`

Tạo file `.env` trong thư mục root của project:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=time-tracking-system.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=time-tracking-system
VITE_FIREBASE_STORAGE_BUCKET=time-tracking-system.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Application Configuration (tùy chọn)
VITE_CAPTCHA_INTERVAL_MINUTES=30
VITE_CAPTCHA_MAX_ATTEMPTS=3
VITE_CAPTCHA_TIMEOUT_SECONDS=180
VITE_FACE_CHECK_INTERVAL=5
VITE_FACE_MATCH_THRESHOLD=0.6
```

**⚠️ Quan trọng**: Thay thế các giá trị trên bằng config từ Firebase của bạn!

## 🔐 Bước 3: Cấu Hình Firebase Authentication

1. Trong Firebase Console, chọn **Authentication**
2. Click **Get started**
3. Chọn **Sign-in method**
4. Enable **Email/Password**
5. Click **Save**

## 💾 Bước 4: Cấu Hình Firestore Database

1. Trong Firebase Console, chọn **Firestore Database**
2. Click **Create database**
3. Chọn location gần nhất (ví dụ: `asia-southeast1`)
4. Chọn **Start in production mode**
5. Click **Enable**

### 4.1. Cập Nhật Firestore Rules

Vào tab **Rules** và paste code sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'department_admin'];
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      (request.auth.uid == resource.data.userId || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'department_admin']);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Activity Logs
    match /activityLogs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // History Records
    match /history/{recordId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Back Soon Records
    match /backSoonRecords/{recordId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Image Delete Requests
    match /imageDeleteRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'department_admin'];
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

Click **Publish**

## 📦 Bước 5: Cấu Hình Firebase Storage

1. Trong Firebase Console, chọn **Storage**
2. Click **Get started**
3. Chọn **Start in production mode**
4. Click **Next** và chọn location
5. Click **Done**

### 5.1. Cập Nhật Storage Rules

Vào tab **Rules** và paste code sau:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Face images
    match /faces/{userId}/{allPaths=**} {
      // Users can read their own images
      // Admins can read all images
      allow read: if request.auth != null && 
                    (request.auth.uid == userId || 
                     firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['admin', 'department_admin']);
      
      // Users can only write to their own folder
      // Admins can write to any folder
      allow write: if request.auth != null && 
                     (request.auth.uid == userId || 
                      firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['admin', 'department_admin']);
    }
  }
}
```

Click **Publish**

## 🤖 Bước 6: Download Face Detection Models

1. Tạo thư mục `public/models` trong project
2. Download models từ [face-api.js repository](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

Cần download 4 models sau:

- `tiny_face_detector_model-weights_manifest.json` + `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json` + `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json` + `face_recognition_model-shard1`
- `ssd_mobilenetv1_model-weights_manifest.json` + `ssd_mobilenetv1_model-shard1` + `ssd_mobilenetv1_model-shard2`

Hoặc chạy script sau:

```bash
mkdir -p public/models
cd public/models

# Download tiny face detector
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Download face landmarks
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

# Download face recognition
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1

# Download SSD MobileNet
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2
```

## 👥 Bước 7: Tạo User Admin Đầu Tiên

### Cách 1: Sử dụng Firebase Console

1. Vào **Authentication** > **Users**
2. Click **Add user**
3. Nhập:
   - Email: `admin@demo.com`
   - Password: `admin123`
4. Click **Add user**
5. Copy UID của user vừa tạo

6. Vào **Firestore Database** > **Start collection**
7. Collection ID: `users`
8. Document ID: paste UID vừa copy
9. Thêm các fields:

```
id: [UID vừa copy]
username: Admin
email: admin@demo.com
role: admin
department: Management
position: System Administrator
createdAt: [timestamp hiện tại, ví dụ: 1729656000000]
updatedAt: [timestamp hiện tại]
isActive: true
notificationsEnabled: true
```

### Cách 2: Sử dụng Script (Recommend)

Tạo file `scripts/createAdmin.js`:

```javascript
// Chạy: node scripts/createAdmin.js
```

## 🏃‍♂️ Bước 8: Chạy Ứng Dụng

### Development Mode

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## 🧪 Bước 9: Test Hệ Thống

1. Mở `http://localhost:3000`
2. Đăng nhập với:
   - Email: `admin@demo.com`
   - Password: `admin123`
3. Tạo thêm user Staff để test
4. Test các tính năng:
   - ✅ Check-in với Face Recognition
   - ✅ CAPTCHA verification
   - ✅ Back Soon
   - ✅ Check-out
   - ✅ View History
   - ✅ Camera Monitor

## 🚀 Bước 10: Deploy Production

### Deploy lên Firebase Hosting

```bash
npm run build
firebase login
firebase init hosting
firebase deploy
```

### Deploy lên Vercel

```bash
npm run build
vercel --prod
```

### Deploy lên Netlify

```bash
npm run build
# Kéo thả folder dist vào Netlify
```

## 🔧 Troubleshooting

### Lỗi Camera không hoạt động
- Kiểm tra quyền truy cập camera trong browser
- Đảm bảo đang chạy trên HTTPS (hoặc localhost)

### Lỗi Face Detection models không load
- Kiểm tra folder `public/models` có đầy đủ files
- Check console log để xem lỗi cụ thể

### Lỗi Firebase Authentication
- Kiểm tra lại Firebase config trong `.env`
- Đảm bảo Email/Password đã được enable

### Lỗi Firestore Permission Denied
- Kiểm tra lại Firestore Rules
- Đảm bảo user đã được tạo trong collection `users`

## 📞 Hỗ Trợ

Nếu gặp vấn đề, liên hệ:
- Email: support@timetracking.com
- Documentation: [Link to docs]

---

**Chúc bạn triển khai thành công! 🎉**

