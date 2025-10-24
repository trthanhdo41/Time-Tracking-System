# �� Deploy Firestore Rules - System Settings

## Bước 1: Copy Rules

Rules đã được cập nhật trong file `firestore.rules` để hỗ trợ **System Settings**.

## Bước 2: Deploy

```bash
firebase deploy --only firestore:rules
```

## Bước 3: Verify

Kiểm tra trong Firebase Console:
- Firestore Database → Rules
- Xác nhận rule `systemSettings` đã có

## 📋 Quyền truy cập:

- **Read:** Tất cả user đã đăng nhập (staff, admin, department_admin)
- **Write:** Chỉ admin và department_admin

---

**Lưu ý:** Rules phải được deploy trước khi test tính năng System Settings!
