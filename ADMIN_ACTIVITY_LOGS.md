# 🛡️ Admin Activity Logs - Documentation

## 📋 Tổng quan

Hệ thống **Admin Activity Logs** ghi nhận tất cả các hành động quan trọng của Admin và Department Admin, giúp theo dõi và kiểm toán các thay đổi trong hệ thống.

---

## 🎯 Các loại hành động được ghi nhận

### 1. **Image Management**
- ✅ `approve_image_delete` - Phê duyệt xóa hình
- ❌ `reject_image_delete` - Từ chối xóa hình
- 🗑️ `delete_image` - Xóa hình trực tiếp

### 2. **User Management**
- ➕ `create_user` - Tạo tài khoản mới
- 🗑️ `delete_user` - Xóa tài khoản
- ✏️ `update_user` - Cập nhật thông tin user
- 🔑 `change_password` - Đổi mật khẩu

### 3. **Password Reset**
- ✅ `approve_forgot_password` - Phê duyệt reset mật khẩu
- ❌ `reject_forgot_password` - Từ chối reset mật khẩu

### 4. **System Settings**
- ⚙️ `update_system_settings` - Cập nhật cấu hình hệ thống

### 5. **Other Actions**
- ⏹️ `force_checkout` - Bắt buộc check-out
- 📊 `view_reports` - Xem báo cáo
- 📥 `export_data` - Xuất dữ liệu

---

## 📊 Thông tin được ghi nhận

Mỗi log entry bao gồm:

```typescript
{
  adminUsername: string;        // Tên admin thực hiện
  adminRole: 'admin' | 'department_admin';
  actionType: AdminActionType;  // Loại hành động
  actionDescription: string;    // Mô tả chi tiết
  targetUser?: string;          // User bị ảnh hưởng
  targetResource?: string;      // Resource ID (image, session, etc.)
  metadata?: Record<string, any>; // Thông tin bổ sung
  timestamp: number;            // Thời gian thực hiện
  ipAddress?: string;           // IP address (tùy chọn)
}
```

---

## 🔍 Tính năng lọc và tìm kiếm

### Filters:
1. **Search** - Tìm theo admin, user, hoặc mô tả
2. **Action Type** - Lọc theo loại hành động
3. **Date Range** - Lọc theo khoảng thời gian
4. **Admin** - Lọc theo admin cụ thể

### Statistics:
- 📈 Tổng số hành động
- 👥 Số admin hoạt đ[object Object]hân loại theo action type
- 📉 Phân tích theo admin

---

## 🎨 UI Components

### 1. **Admin Activity Logs Table**
- Hiển thị danh sách logs
- Màu sắc theo loại hành động
- Thông tin chi tiết: Admin, Action, Target User, Description, Timestamp

### 2. **Stats Cards**
- Total Actions
- Active Admins
- Filtered Results

### 3. **Filter Panel**
- Search box
- Action type dropdown
- Date range pickers

---

## 🔧 Cách sử dụng

### Trong Admin Dashboard:
1. Vào tab **Reports**
2. Chọn **Admin Activity Logs**
3. Sử dụng filters để tìm kiếm
4. Xem chi tiết từng log entry

### Tự động ghi log:
Logs được tự động ghi nhận khi admin thực hiện các hành động sau:

```typescript
// Ví dụ: Approve image delete
await logAdminActivity({
  adminUsername: admin.username,
  adminRole: admin.role === 'admin' ? 'admin' : 'department_admin',
  actionType: 'approve_image_delete',
  actionDescription: `Approved image deletion request`,
  targetUser: requestData.userId,
  targetResource: requestId,
  metadata: { imageUrl, deletedCount }
});
```

---

## 📈 Thống kê và Báo cáo

### Activity by Type:
- Số lượng mỗi loại hành động
- Xu hướng theo thời gian

### Activity by Admin:
- Số hành động của từng admin
- So sánh hiệu suất

### Audit Trail:
- Theo dõi ai làm gì, khi nào
- Phát hiện hành vi bất thường

---

## 🔒 Bảo mật

- ✅ Chỉ Admin và Department Admin có quyền xem
- ✅ Logs không thể xóa hoặc chỉnh sửa
- ✅ Timestamp chính xác (Vietnam timezone)
- ✅ Ghi nhận đầy đủ metadata

---

## 🚀 Tích hợp

Admin Activity Logging đã được tích hợp vào:

1. ✅ **Image Delete Service** - approve/reject
2. ✅ **User Service** - create/delete/update
3. ✅ **Forgot Password Service** - approve/reject
4. ✅ **System Settings Service** - update settings

---

## 📝 Ví dụ Logs

### Approve Image Delete:
```
Admin: admin_user (admin)
Action: Approve Image Delete
Target: user123
Description: Approved image deletion request and deleted image from 3 location(s)
Time: 2025-11-26 12:44:00
```

### Create User:
```
Admin: dept_admin (department_admin)
Action: Create User
Target: new_staff
Description: Created new staff account for new_staff
Time: 2025-11-26 12:30:00
```

---

## 🎯 Best Practices

1. **Review logs định kỳ** - Kiểm tra logs hàng tuần
2. **Monitor unusual activity** - Phát hiện hành vi bất thường
3. **Export for compliance** - Xuất báo cáo cho kiểm toán
4. **Use filters effectively** - Tìm kiếm nhanh với filters

---

## 🔄 Realtime Updates

- Logs được cập nhật ngay lập tức
- Không cần refresh trang
- Firestore realtime sync

---

**Created:** 2025-11-26  
**Version:** 1.0  
**Status:** ✅ Production Ready

