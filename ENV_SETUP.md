# 🔑 Environment Variables Setup

## ✅ Your Configuration

Tôi đã tạo file `.env.production` với config của bạn.

**Bạn cần đổi tên file:**
```bash
cp .env.production .env
```

Hoặc tạo file `.env` mới với nội dung:

```env
# FIREBASE CONFIGURATION
VITE_FIREBASE_API_KEY=AIzaSyDv_m3Q6kySNo8p_hrqHEJsu84_M9wgDao
VITE_FIREBASE_AUTH_DOMAIN=enterprise-time-trackin.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=enterprise-time-trackin
VITE_FIREBASE_STORAGE_BUCKET=enterprise-time-trackin.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=143042385879
VITE_FIREBASE_APP_ID=1:143042385879:web:3dc5410d4549813a339d92
VITE_FIREBASE_MEASUREMENT_ID=

# IMGBB IMAGE UPLOAD
VITE_IMGBB_API_KEY=ae21ac039240a7d40788bcda9a822d8e

# APPLICATION CONFIGURATION
VITE_CAPTCHA_INTERVAL_MINUTES=30
VITE_CAPTCHA_MAX_ATTEMPTS=3
VITE_CAPTCHA_TIMEOUT_SECONDS=180
VITE_FACE_CHECK_INTERVAL=5
VITE_FACE_MATCH_THRESHOLD=0.6
```

## 🚀 Next Steps

1. **Copy file .env:**
   ```bash
   cp .env.production .env
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

Done! 🎉

