# ⚡ Quick Start Guide

Hướng dẫn nhanh để chạy ứng dụng trong 5 phút!

## 🚀 Bước 1: Cài Đặt Dependencies

```bash
cd "/Users/mac/Desktop/web check in theo dõi thời gian online"
npm install
```

## 🔥 Bước 2: Cấu Hình Firebase

1. Tạo file `.env` trong thư mục root
2. Copy nội dung từ `.env.example`
3. Điền thông tin Firebase của bạn

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

## 🤖 Bước 3: Download Face Models

```bash
mkdir -p public/models
cd public/models
```

Download từ: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Hoặc bỏ qua bước này để test các tính năng khác trước.

## 🏃‍♂️ Bước 4: Chạy Ứng Dụng

```bash
npm run dev
```

Mở trình duyệt: http://localhost:3000

## 👤 Bước 5: Tạo Admin User

### Trong Firebase Console:

1. **Authentication > Users > Add user**
   - Email: admin@demo.com
   - Password: admin123

2. **Firestore Database > Start collection**
   - Collection ID: `users`
   - Document ID: (paste UID từ Authentication)
   - Fields:
     ```
     id: [UID]
     username: "Admin"
     email: "admin@demo.com"
     role: "admin"
     department: "Management"
     position: "System Administrator"
     createdAt: 1729656000000
     updatedAt: 1729656000000
     isActive: true
     notificationsEnabled: true
     ```

## ✅ Đăng Nhập

- Email: `admin@demo.com`
- Password: `admin123`

## 🎯 Test Các Tính Năng

1. **Tạo Staff User** (trong Admin Dashboard)
2. **Đăng nhập với Staff account**
3. **Test Check-in** (cần camera)
4. **Test CAPTCHA** (tự động sau 30s)
5. **Test Back Soon**
6. **Xem History**
7. **Xem Camera**

## 📚 Documentation

- [README.md](./README.md) - Overview và tính năng
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Hướng dẫn chi tiết
- [FEATURES.md](./FEATURES.md) - Danh sách tính năng
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Hướng dẫn deploy production

## 🆘 Troubleshooting

### Camera không hoạt động
- Cho phép quyền camera trong browser
- Sử dụng HTTPS hoặc localhost

### Face detection không hoạt động
- Download đầy đủ models vào `public/models/`
- Check console log để xem lỗi cụ thể

### Firebase permission denied
- Kiểm tra Firestore Rules
- Đảm bảo user đã được tạo trong collection `users`

## 🎉 Hoàn Thành!

Bây giờ bạn đã có một hệ thống Time Tracking enterprise-level hoàn chỉnh!

---

**Need Help?** Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

