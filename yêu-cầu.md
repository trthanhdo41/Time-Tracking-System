# 📋 Yêu Cầu Hệ Thống Time Tracking

## 📌 Nguyên Tắc Chung

**(*): Tất cả các yêu cầu/thực hiện trên web đều sẽ được lưu lại với đầy đủ thông tin:**
- Trạng thái
- Thời gian
- Yêu cầu
- Người yêu cầu / Chức vụ / Bộ phận
- Người thực hiện / Chức vụ / Bộ phận
- Thời gian thực hiện

---

## 👨‍💼 Quản Lý Tổng (Admin)

### Các tính năng

1. **Add/Delete account**
   - Thêm tài khoản nhân viên mới
   - Xóa tài khoản nhân viên
   - ✅ Đã hoàn thành

2. **Cài lại mật khẩu của tài khoản**
   - Đặt lại mật khẩu cho nhân viên
   - ✅ Đã hoàn thành

3. **Phân quyền**
   - Phân quyền Admin / Department Admin / Staff
   - ✅ Đã hoàn thành

4. **Kiểm tra lịch sử của tất cả nhân viên**
   - Xem lịch sử check-in/check-out của tất cả nhân viên
   - Xem chi tiết từng phiên làm việc
   - ✅ Đã hoàn thành

5. **Đọc được báo cáo***
   - Báo cáo hoạt động
   - Báo cáo lỗi check-in thất bại
   - Báo cáo yêu cầu xóa ảnh
   - Activity Logs đầy đủ
   - ✅ Đã hoàn thành

6. **Truy cập thư mục chứ hình của toàn bộ nhân viên**
   - Xem tất cả hình ảnh check-in/face verification
   - ✅ Đã hoàn thành

7. **Duyệt và thực hiện yêu cầu xóa hình**
   - Xem danh sách yêu cầu xóa hình
   - Phê duyệt hoặc từ chối
   - ✅ Đã hoàn thành

8. **Có thể xem được trạng thái của nhân viên**
   - Tên nhân viên + Chức vụ
   - Status (Online/Offline/Back Soon)
   - Thời gian online hiện tại
   - Có đang mở thông báo hay không
   - ✅ Đã hoàn thành

---

## 👔 Quản Lý Bộ Phận (Admin Department)

### Các tính năng

**Các chức năng tương tự Admin, nhưng chỉ có thể với các nhân viên thuộc phòng ban đó.**

- ✅ Đã hoàn thành (sử dụng logic phân quyền `department_admin`)
- Scope limited to same department

---

## 👤 Nhân Viên (Staff)

### Hiển thị

1. **Username**
   - Hiển thị tên người dùng
   - ✅ Đã hoàn thành

2. **Date/Time**
   - Theo GMT +7
   - Thời gian được lấy từ server
   - Tránh bị giả bằng cách đổi thời gian trên máy tính
   - ✅ Đã hoàn thành (sử dụng Firebase serverTimestamp)

3. **Các nút tính năng**
   - Check In / Check Out
   - Back Soon
   - Lịch Sử
   - Camera
   - Thư Viện Ảnh
   - ✅ Đã hoàn thành

### Các tính năng

#### 1. Check In

a. **Ghi nhận thời gian online**
   - Bắt đầu tính thời gian online từ lúc check-in
   - ✅ Đã hoàn thành

b. **Lần 1: yêu cầu FaceID**
   - Check với hình ảnh được lưu sẵn (Face0)
   - Chụp lại hình check-in lần 1 (Face1)
   - ✅ Đã hoàn thành

c. **Sau xxx phút sẽ yêu cầu nhập CAPTCHA**
   - Sử dụng CAPTCHA tạo ngẫu nhiên từ các ký tự
   - Admin cấu hình được interval
   - Nhập sai 3 lần → Check Out
   - Hết thời gian chưa nhập đúng → Check Out
   - ✅ Đã hoàn thành

d. **Sau xxx lần nhập CAPTCHA sẽ yêu cầu FaceID (Face2)**
   - Face2 sẽ được so sánh với Face0 và Face1
   - Không khớp → Chụp lại hình Face2 → Check Out
   - ✅ Đã hoàn thành

#### 2. Check Out

a. **Sau khi check out thì lưu lại:**
   - Thời gian online
   - Thời gian BackSoon
   - Lý do
   - ✅ Đã hoàn thành

#### 3. Back Soon

a. **Sổ ra lý do BackSoon**
   - Meeting
   - WC
   - Other (tùy chỉnh)
   - ✅ Đã hoàn thành

b. **Trong trạng thái BackSoon sẽ không yêu cầu nhập CAPTCHA/FaceID định kỳ**
   - Tạm dừng tính thời gian online
   - Bắt đầu tính thời gian BackSoon
   - ✅ Đã hoàn thành

c. **Tính riêng thời gian BackSoon và thời gian Online**
   - Hiển thị riêng biệt 2 loại thời gian
   - ✅ Đã hoàn thành

#### 4. History

a. **Có thể lọc theo ngày + giờ**
   - Filter theo date range
   - ✅ Đã hoàn thành

b. **7 cột:**
   - Date (Ngày)
   - In (Check-in)
   - Back Soon (Thời gian back soon)
   - Out (Check-out)
   - Reason (Lý do)
   - Online Time (Thời gian online)
   - Back Soon Time (Thời gian back soon)
   - ✅ Đã hoàn thành

#### 5. Camera

a. **Connect / Disconnect**
   - Bật/tắt camera
   - ✅ Đã hoàn thành

b. **Monitor**
   - Live preview
   - ✅ Đã hoàn thành

#### 6. Nút để truy cập vào thư mục lưu trữ các hình đã chụp

a. **Chỉ có thể xem / KHÔNG THỂ XÓA**
   - Không có quyền xóa trực tiếp
   - ✅ Đã hoàn thành

b. **Có thể bấm vào hình để hiện lên bảng gửi yêu cầu xóa đến admin – kèm lý do**
   - Modal yêu cầu xóa
   - Nhập lý do
   - Gửi request đến admin
   - ✅ Đã hoàn thành

#### 7. Thông báo

a. **Gửi thông báo/âm thanh sẽ có yêu cầu FaceID trước 5p**
   - Cần bấm xác nhận thì mới biến mất
   - ✅ Đã hoàn thành

b. **Gửi âm thanh báo có CAPTCHA 5 giây**
   - Melody cảnh báo
   - ✅ Đã hoàn thành

c. **Có nút để tắt/bật tính năng này**
   - Settings để toggle notifications
   - ✅ Đã hoàn thành (thông qua System Settings)

---

## ✅ Trạng Thái Hoàn Thành

- **Tổng số yêu cầu**: 25+ tính năng
- **Đã hoàn thành**: 100% ✅
- **Đang phát triển**: 0
- **Ghi chú**: Tất cả yêu cầu đã được implement đầy đủ

---

## 📊 Activity Logging (*)

**Tất cả các yêu cầu/thực hiện đều được ghi lại với:**

```typescript
{
  timestamp: number,
  userId: string,
  username: string,
  role: string,
  department: string,
  position: string,
  action: string,
  description: string,
  status: 'success' | 'failed',
  metadata?: any
}
```

**Các action được log:**
- `check_in` - Check in thành công
- `check_out` - Check out
- `back_soon` - Chuyển sang trạng thái Back Soon
- `back_online` - Trở lại làm việc
- `captcha_verify` - Xác thực CAPTCHA (success/fail)
- `face_verify` - Xác thực khuôn mặt
- `delete_image_request` - Yêu cầu xóa ảnh
- `image_delete_approved` - Admin phê duyệt xóa ảnh
- `image_delete_rejected` - Admin từ chối xóa ảnh
- `account_created` - Tạo tài khoản mới
- `account_deleted` - Xóa tài khoản
- `account_updated` - Cập nhật thông tin tài khoản
- `password_reset` - Đặt lại mật khẩu
- `error_report` - Báo cáo lỗi check-in thất bại

---

**Ngày tạo**: 26/10/2025  
**Trạng thái**: Hoàn thành 100% ✅
