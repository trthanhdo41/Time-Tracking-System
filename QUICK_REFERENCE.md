# 🚀 Quick Reference - Admin Activity Logs

## 📍 Access Path
```
Admin Dashboard → Reports Tab → Admin Activity Logs Tab
```

---

## 🎯 Main Features

### 1. **Stats Overview**
- 📊 Total Actions
- 👥 Active Admins  
- 🔢 Filtered Results

### 2. **Filter Options[object Object]earch**: Admin, user, or action description
- 📋 **Action Type**: 13 types available
- 📅 **Date Range**: Start & End date

### 3. **Logs Table**
| Column | Description |
|--------|-------------|
| Admin | Username + Role badge |
| Action | Color-coded action type |
| Target User | Affected user (if any) |
| Description | Detailed description |
| Timestamp | Date & Time |

---

## 🎨 Color Coding

| Color | Actions |
|-------|---------|
| 🟢 Green | Approve actions, Create user |
| 🔴 Red | Reject actions, Delete user/image |
| [object Object] Change password |
| 🔵 Blue | Update user, Export data |
| 🟣 Purple | Update settings |
| 🟠 Orange | Force checkout |
| ⚪ Gray | View reports |

---

## 📊 Action Types Quick List

```
✅ approve_image_delete      - Phê duyệt xóa hình
❌ reject_image_delete       - Từ chối xóa hình
🗑️ delete_image              - Xóa hình
🔑 change_password           - Đổi mật khẩu
➕ create_user               - Tạo user
🗑️ delete_user               - Xóa user
✏️ update_user               - Cập nhật user
⚙️ update_system_settings    - Cập nhật settings
✅ approve_forgot_password   - Phê duyệt reset
❌ reject_forgot_password    - Từ chối reset
⏹️ force_checkout            - Bắt buộc checkout
📊 view_reports              - Xem báo cáo
📥 export_data               - Xuất dữ liệu
```

---

## 🔍 Search Examples

### By Admin:
```
admin_user
dept_admin
```

### By Target User:
```
staff_001
john_doe
```

### By Description:
```
approved
deleted
password
```

---

## 📅 Date Filter Tips

- **Today**: Set both start & end to today
- **This Week**: Monday to Sunday
- **This Month**: 1st to last day
- **Custom**: Any range you want

---

## 💡 Pro Tips

1. **Quick Search**: Type in search box for instant filtering
2. **Combine Filters**: Use multiple filters together
3. **Clear Filters**: Clear all to see everything
4. **Sort**: Click column headers to sort (future)
5. **Export**: Export filtered results (future)

---

## 🔒 Security Notes

- ✅ Only Admin & Department Admin can access
- ✅ Logs cannot be edited or deleted
- ✅ All actions are permanently recorded
- ✅ Full audit trail maintained

---

## 📱 Responsive Design

- ✅ Desktop: Full table view
- ✅ Tablet: Scrollable table
- ✅ Mobile: Card-based view (future)

---

## 🚨 Important Actions to Monitor

### High Priority:
- 🔴 Delete user
- 🔴 Delete image
- 🔑 Change password
- ⚙️ Update system settings

### Medium Priority:
- ✅ Approve/Reject requests
- ✏️ Update user info

### Low Priority:
[object Object]iew repo[object Object] Export data

---

## 📈 Common Use Cases

### 1. **Audit Trail**
```
Who deleted user X?
→ Filter by "delete_user" + Search "user X"
```

### 2. **Admin Activity**
```
What did admin Y do today?
→ Search "admin Y" + Date = Today
```

### 3. **Password Changes**
```
All password changes this month?
→ Filter "change_password" + This month
```

### 4. **Settings Changes**
```
Who changed settings?
→ Filter "update_system_settings"
```

---

## 🎓 Training Guide

### For New Admins:
1. Access Admin Activity Logs
2. Try different filters
3. Understand action types
4. Review recent activities
5. Practice searching

### For Auditors:
1. Set date range
2. Filter by action type
3. Export results (future)
4. Review anomalies
5. Report findings

---

## 📞 Support

**Questions?** Contact system administrator

**Issues?** Report via admin dashboard

**Suggestions?** Submit feedback form

---

**Version**: 1.0  
**Last Updated**: 2025-11-26  
**Status**: ✅ Production Ready

