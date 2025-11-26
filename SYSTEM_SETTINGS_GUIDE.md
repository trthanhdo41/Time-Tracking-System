# ⚙️ Hướng Dẫn Sử Dụng System Settings

## 🎯 Tổng Quan

Tính năng **System Settings** cho phép Admin điều chỉnh các thông số hệ thống **realtime** mà không cần restart server hay sửa file `.env`.

---

## 📍 Truy Cập

### Admin Dashboard
1. Đăng nhập với tài khoản Admin/Department Admin
2. Click nút **"Cài Đặt Hệ Thống"** ở góc trên bên phải
3. Hoặc truy cập: `http://localhost:3000/system-settings`

---

## 🔧 Các Cài Đặt

### 1. CAPTCHA Settings

#### CAPTCHA Interval (phút)
- **Mặc định:** 30 phút
- **Test Mode:** 1 phút
- **Khuyến nghị:** 
  - Production: 30-60 phút
  - Testing: 1-5 phút

#### Max Attempts (lần)
- **Mặc định:** 3 lần
- Số lần nhập sai tối đa trước khi auto check out
- **Khuyến nghị:** 3-5 lần

#### Timeout (giây)
- **Mặc định:** 180 giây (3 phút)
- Thời gian tối đa để hoàn thành CAPTCHA
- **Khuyến nghị:** 120-300 giây

---

### 2. Face Verification Settings

#### CAPTCHA Count Before Face Check
- **Mặc định:** 3 lần
- Sau bao nhiêu lần CAPTCHA thành công thì yêu cầu Face Verification
- **Khuyến nghị:** 3-5 lần

#### Face Similarity Threshold
- **Mặc định:** 0.6
- **Range:** 0.1 - 1.0
- **Ý nghĩa:**
  - 0.1-0.4: Rất dễ pass (không an toàn)
  - 0.5-0.6: Cân bằng (khuyến nghị)
  - 0.7-1.0: Rất khó pass (có thể từ chối người đúng)

---

### 3. General Settings

#### Auto Logout
- Tự động check out nhân viên khi hết session timeout

#### Session Timeout (giờ)
- **Mặc định:** 12 giờ
- Thời gian tối đa của 1 session làm việc

---

## 🔄 Realtime Sync

### Cách Hoạt Động:
1. **Admin thay đổi setting** → Lưu vào Firebase
2. **Firebase → Realtime Sync** → Tất cả client đang online
3. **Staff nhận setting mới** → Áp dụng ngay lập tức

### Không cần:
- ❌ Restart server
- ❌ Refresh browser
- ❌ Re-login

### Console Logs:
```javascript
// Admin
✅ System settings updated successfully

// Staff (auto)
🔄 System settings updated for staff: {...}
🔄 Captcha settings updated: {...}
```

---

## 🧪 Test Flow

### 1. Setup Test Mode
```bash
# Admin
1. Truy cập System Settings
2. CAPTCHA Interval → Đổi thành 1 phút
3. Click "Lưu & Đồng Bộ"
```

### 2. Test với Staff
```bash
# Staff Dashboard (tab khác/browser khác)
1. Check In
2. Đợi 55s → Nghe âm thanh cảnh báo
3. Đợi 1 phút → CAPTCHA xuất hiện!
4. Nhập đúng → Success
```

### 3. Test Realtime Update
```bash
# Admin: Đổi CAPTCHA Interval từ 1 → 2 phút
# Staff: Console log sẽ báo settings updated
# Staff: Lần CAPTCHA tiếp theo sẽ là 2 phút (không phải 1 phút nữa)
```

---

## 📊 Monitoring

### Kiểm Tra Firebase
```
Firestore → systemSettings → main
```

**Document Structure:**
```json
{
  "captcha": {
    "intervalMinutes": 1,
    "maxAttempts": 3,
    "timeoutSeconds": 180
  },
  "faceVerification": {
    "captchaCountBeforeFace": 3,
    "similarityThreshold": 0.6
  },
  "general": {
    "autoLogoutEnabled": true,
    "sessionTimeoutHours": 12
  },
  "updatedAt": 1234567890,
  "updatedBy": "admin01"
}
```

---

## ⚠️ Lưu Ý

### 1. Threshold quá cao
```
Face Similarity Threshold > 0.7
→ Có thể từ chối người đúng
→ Nên test kỹ với nhiều nhân viên
```

### 2. Interval quá ngắn
```
CAPTCHA Interval < 5 phút
→ Làm phiền nhân viên
→ Giảm năng suất
→ Chỉ dùng để test
```

### 3. Timeout quá ngắn
```
CAPTCHA Timeout < 60s
→ Nhân viên không đủ thời gian nhập
→ Bị auto checkout oan
```

---

## 🔐 Quyền Truy Cập

| Role             | Read | Write |
|------------------|------|-------|
| Admin            | ✅   | ✅    |
| Department Admin | ✅   | ✅    |
| Staff            | ✅   | ❌    |

---

## 🐛 Troubleshooting

### Settings không sync?
```bash
# Check console
→ Nếu có lỗi "permission denied"
→ Deploy Firestore Rules lại:

firebase deploy --only firestore:rules
```

### CAPTCHA vẫn dùng setting cũ?
```bash
# Staff phải online khi Admin thay đổi
# Nếu Staff offline → Sẽ nhận setting mới khi login lại
```

### Setting quay về default?
```bash
# Kiểm tra Firebase
Firestore → systemSettings → main
# Nếu document bị xóa → System tự tạo lại từ .env
```

---

## 📝 Best Practices

### Production Settings
```javascript
{
  "captcha": {
    "intervalMinutes": 30,      // 30 phút
    "maxAttempts": 3,
    "timeoutSeconds": 180       // 3 phút
  },
  "faceVerification": {
    "captchaCountBeforeFace": 3,
    "similarityThreshold": 0.6
  },
  "general": {
    "autoLogoutEnabled": true,
    "sessionTimeoutHours": 12
  }
}
```

### Testing Settings
```javascript
{
  "captcha": {
    "intervalMinutes": 1,       // 1 phút để test nhanh
    "maxAttempts": 3,
    "timeoutSeconds": 180
  },
  "faceVerification": {
    "captchaCountBeforeFace": 2, // Giảm để test nhanh
    "similarityThreshold": 0.5   // Dễ hơn để test
  }
}
```

---

## 🚀 Deployment Checklist

- [x] Deploy Firestore Rules (`firebase deploy --only firestore:rules`)
- [x] Khởi tạo default settings (auto khi Admin mở Settings page lần đầu)
- [x] Test với Staff account
- [x] Monitor console logs
- [x] Đổi về Production settings sau khi test xong

---

**Tài liệu được tạo tự động bởi System Settings Feature**
