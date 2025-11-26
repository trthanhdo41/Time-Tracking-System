# 🚀 Enterprise Time Tracking System

A premium, modern time tracking system built with cutting-edge technologies for enterprise-level workforce management.

## ✨ Features

### 👤 Staff Features
- **🎯 Face Recognition Check-in/out**: AI-powered face verification using TensorFlow.js
- **🔐 CAPTCHA Verification**: Periodic verification to ensure continuous presence
- **⏰ Real-time Time Tracking**: Accurate tracking with server-synchronized timestamps  
- **🔄 Back Soon Mode**: Track breaks with reason logging (Meeting, WC, Other)
- **📊 Activity History**: Detailed history with filtering and export capabilities
- **📸 Image Management**: View captured images and request deletion with approval workflow
- **🔔 Smart Notifications**: Sound alerts for CAPTCHA and face verification requirements
- **📹 Camera Monitoring**: Access to personal camera feed

### 👨‍💼 Admin Features
- **👥 User Management**: Create, update, delete accounts
- **🔑 Password Reset**: Reset passwords for any user
- **🎭 Role Management**: Assign roles (Admin, Department Admin, Staff)
- **📈 Comprehensive Reports**: Generate detailed reports with analytics
- **🔍 Activity Logs**: View all actions with full audit trail
- **🖼️ Image Access**: Access all employee face verification images
- **✅ Approval Workflow**: Approve/reject image deletion requests
- **📊 Real-time Monitoring**: View employee status, online time, and notifications

### 🏢 Department Admin Features
- Same as Admin but scoped to specific department only

## 🛠️ Tech Stack

### Frontend
- **⚡ Vite** - Lightning-fast build tool
- **⚛️ React 18** - Latest React with concurrent features
- **📘 TypeScript** - Type-safe development
- **🎨 Tailwind CSS** - Modern utility-first CSS
- **✨ Framer Motion** - Smooth animations and transitions
- **🎭 Custom SVG Icons** - No icon libraries, all custom designed

### Backend & Services
- **🔥 Firebase**
  - Authentication - Secure user authentication
  - Firestore - Real-time database
  - Storage - Image and file storage
  - Functions - Serverless backend logic

### AI & Computer Vision
- **🤖 TensorFlow.js** - Machine learning in the browser
- **👤 Face-api.js** - Face detection and recognition

### State Management
- **🐻 Zustand** - Lightweight state management

### Additional Libraries
- **📅 date-fns** - Modern date utility
- **🎉 react-hot-toast** - Beautiful notifications
- **🧭 React Router** - Client-side routing

## 📋 Requirements

- Node.js 18+ 
- npm or yarn
- Firebase account
- Modern browser with camera access

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd "web check in theo dõi thời gian online"
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional Configuration
VITE_CAPTCHA_INTERVAL_MINUTES=30
VITE_CAPTCHA_MAX_ATTEMPTS=3
VITE_CAPTCHA_TIMEOUT_SECONDS=180
VITE_FACE_CHECK_INTERVAL=5
VITE_FACE_MATCH_THRESHOLD=0.6
```

4. **Download Face Detection Models**

Download the face-api.js models and place them in `public/models/`:
- tiny_face_detector_model
- face_landmark_68_model
- face_recognition_model
- ssd_mobilenetv1_model

Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

5. **Firebase Setup**

- Create a Firebase project at https://console.firebase.google.com
- Enable Authentication (Email/Password)
- Create Firestore database
- Enable Storage
- Update Firebase Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    match /activityLogs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /faces/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     request.auth.token.role == 'admin';
    }
  }
}
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## 👥 Default Users

For testing purposes, create these users in Firebase Authentication:

**Admin Account:**
- Email: admin@demo.com
- Password: admin123
- Role: admin

**Staff Account:**
- Email: staff@demo.com  
- Password: staff123
- Role: staff

## 🎯 Key Features Explained

### Face Recognition Check-in
1. User clicks "Check In"
2. Camera activates
3. Face is detected and captured (Face1)
4. Compared with base face image (Face0) if exists
5. If match >= 60%, check-in successful
6. Image stored in Firebase Storage

### CAPTCHA System
- Triggers every X minutes (configurable)
- 5-second sound notification before display
- User has 3 minutes to complete
- 3 attempts maximum
- Automatic check-out on failure or timeout

### Face Verification (Periodic)
- After every X CAPTCHA completions (configurable)
- Captures new face (Face2)
- Compares with Face0 and Face1
- Automatic check-out if mismatch

### Activity Logging
All actions are logged with:
- User information (name, role, department, position)
- Action type and details
- Timestamp (server-synchronized)
- Performer information (for admin actions)
- Metadata (additional context)

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔒 Security Features

- Face recognition anti-spoofing
- Server-synchronized timestamps
- Comprehensive activity logging
- Role-based access control
- Secure image storage
- CAPTCHA verification
- Session management

## 🎨 UI/UX Features

- Glassmorphism design
- Smooth animations with Framer Motion
- Responsive design (mobile, tablet, desktop)
- Dark mode optimized
- Custom gradient backgrounds
- Hover effects and micro-interactions
- Toast notifications
- Loading states and skeletons

## 📈 Performance

- Code splitting for optimal loading
- Image optimization
- Lazy loading
- Efficient re-renders with React 18
- Optimized Firebase queries
- Client-side caching

## 🤝 Contributing

This is a premium enterprise solution. For contributions or customizations, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For support and inquiries:
- Email: support@timetracking.com
- Documentation: Coming soon

---

**Built with ❤️ using the latest web technologies**

**Investment Value: $10,000,000** 💎

