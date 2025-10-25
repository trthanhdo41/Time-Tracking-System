### 🏠 2. DASHBOARD - TRANG CHỦ
**URL:** `/dashboard`

#### Chức năng chính:
- Xem thống kê giờ làm việc hôm nay
- Xem số ca làm việc trong ngày
- Check In với camera
- Check Out với camera
- Chuyển đến trang Lịch Sử
- Chuyển đến trang Camera
- Chuyển đến Thư Viện Ảnh

---

### 📅 3. TRANG LỊCH SỬ
**URL:** `/history`

#### Chức năng:
- Xem tất cả lịch sử check-in/out
- Sắp xếp theo thời gian mới nhất
- Tìm kiếm theo ngày, tháng, năm
- Xem thống kê tổng giờ làm việc
- Xem thống kê số ca làm việc
- Xem ảnh check-in/check-out

---

### 📷 4. TRANG CAMERA
**URL:** `/camera`

#### Chức năng:
- Xem live feed từ camera
- Chụp ảnh
- Xem 2 ảnh đã chụp gần nhất (Check In và Check Out)

---

### 🖼️ 5. TRANG THƯ VIỆN ẢNH
**URL:** `/images`

#### Chức năng:
- Xem tất cả ảnh đã chụp (check-in, check-out, face verification)
- Lọc theo loại ảnh
- Tìm kiếm theo ngày
- Xóa ảnh (nếu có quyền)

---

## 👨‍💼 CHỨC NĂNG QUẢN TRỊ VIÊN (ADMIN)

### 🏠 1. ADMIN DASHBOARD
**URL:** `/admin`

#### Các Tab:
1. **Thống Kê Tổng Quan** - Dashboard
2. **Quản Lý Hệ Thống** - System Settings
3. **Yêu Cầu Xóa Ảnh** - Image Delete Requests
4. **Nhật Ký Hoạt Động** - Activity Logs
5. **Báo Cáo** - Reports
6. **Theo Dõi Sẽ Quay Lại** - Back Soon Tracking
7. **Xem Tất Cả Ảnh** - All Images
8. **Dọn Dẹp Dữ Liệu** - Data Cleanup

---

### 📊 2. TAB THỐNG KÊ TỔNG QUAN

#### Chức năng:
- Xem tổng số nhân viên
- Xem số nhân viên đang online/offline
- Xem tổng ca làm việc trong ngày
- Xem danh sách tất cả nhân viên

#### Quản lý nhân viên:
- Thêm nhân viên mới:
  - Họ và Tên
  - Email (để đăng nhập)
  - Mật khẩu
  - Phòng ban
  - Chức vụ
  - Upload 3 ảnh khuôn mặt (Face0, Face1, Face2)
  
- Xóa nhân viên:
  - Xóa khỏi Firebase Authentication
  - Xóa khỏi Firestore

---

### ⚙️ 3. TAB QUẢN LÝ HỆ THỐNG

#### Chức năng:
- Thay đổi cài đặt hệ thống
- Quản lý cấu hình chung

---

### 🗑️ 4. TAB YÊU CẦU XÓA ẢNH

#### Chức năng:
- Xem tất cả yêu cầu xóa ảnh từ nhân viên
- Phê duyệt yêu cầu xóa ảnh
- Từ chối yêu cầu xóa ảnh
- Xem lý do xóa

---

### 📋 5. TAB NHẬT KÝ HOẠT ĐỘNG

#### Chức năng:
- Xem tất cả hoạt động trong hệ thống
- Lọc theo nhân viên
- Lọc theo phòng ban
- Lọc theo loại hành động
- Lọc theo khoảng thời gian
- Xuất dữ liệu ra file CSV

#### Các hoạt động được ghi lại:
- Đăng nhập/Đăng xuất
- Check-in
- Check-out
- Tạo/Xóa nhân viên
- Upload ảnh
- Xóa dữ liệu

---

### 📊 6. TAB BÁO CÁO

#### Chức năng:
- Tạo báo cáo theo khoảng thời gian
- Xem thống kê chi tiết
- Phân tích hiệu suất nhân viên
- Báo cáo theo ngày/tuần/tháng

#### Thông tin báo cáo:
- Tổng giờ làm việc
- Số ca làm việc
- Nhân viên có giờ làm nhiều nhất
- Xu hướng theo thời gian

---

### ⏰ 7. TAB THEO DÕI SẼ QUAY LẠI

#### Chức năng:
- Theo dõi nhân viên đã check-out nhưng sẽ quay lại
- Hiển thị thời gian check-out và dự kiến quay lại
- Thông báo khi nhân viên quay lại

---

### 🖼️ 8. TAB XEM TẤT CẢ ẢNH

#### Chức năng:
- Xem tất cả ảnh của tất cả nhân viên
- Lọc theo nhân viên
- Lọc theo loại ảnh (Check-in/Check-out/Face Verification)
- Lọc theo khoảng thời gian
- Tìm kiếm nhanh

---

### 🧹 9. TAB DỌN DẸP DỮ LIỆU

#### Chức năng:
- Xóa nhật ký hoạt động
- Xóa tất cả ảnh
- Xóa toàn bộ dữ liệu

⚠️ **CẢNH BÁO:** Xóa vĩnh viễn, không thể khôi phục!

---

## 🔐 BẢO MẬT VÀ PHÂN QUYỀN

### Authentication
- Firebase Authentication
- Email/Password login
- Session management
- Auto logout khi không hoạt động

### Authorization
- Role-based access control (Admin/Staff)
- Admin chỉ truy cập được Admin Dashboard
- Staff chỉ truy cập được Staff Dashboard
- Tự động redirect nếu truy cập sai trang

### Data Security
- Firebase Firestore Rules
- Chỉ user đăng nhập mới xem được dữ liệu của mình
- Admin xem được tất cả dữ liệu

---

## 🌐 TÍNH NĂNG BỔ SUNG

### Real-time Updates
- Cập nhật trạng thái online/offline real-time
- Sử dụng Firebase onSnapshot

### Responsive Design
- Tối ưu cho mobile/tablet/desktop

### Image Handling
- Upload ảnh lên ImgBB
- Xác thực khuôn mặt
- Xóa ảnh

### User Status Tracking
- Heartbeat system
- Tự động offline khi đóng browser
- Tự động online khi mở lại

---

## 📝 QUY TRÌNH TEST

### BƯỚC 1: Test Nhân Viên (Staff)
1. Đăng nhập với tài khoản nhân viên
2. Kiểm tra Dashboard
3. Test Check-in với camera
4. Test Check-out với camera
5. Kiểm tra Lịch sử
6. Xem Thư Viện Ảnh
7. Test Camera page
8. Test đăng xuất

### BƯỚC 2: Test Quản Trị Viên (Admin)
1. Đăng nhập với tài khoản admin
2. Kiểm tra thống kê tổng quan
3. Xem danh sách nhân viên
4. Test thêm nhân viên mới
5. Test xóa nhân viên
6. Xem Nhật Ký Hoạt Động
7. Test xuất CSV
8. Xem tất cả ảnh
9. Test các tab khác

### BƯỚC 3: Test Bảo Mật
1. Staff không thể truy cập Admin Dashboard
2. Không đăng nhập không xem được dữ liệu

### BƯỚC 4: Test Real-time
1. Mở 2 browser với 2 tài khoản khác nhau
2. Check-in từ 1 browser
3. Kiểm tra browser kia có cập nhật real-time
4. Test trạng thái online/offline

---

## 🐛 CÁC LỖI THƯỜNG GẶP

### 1. Camera không hoạt động
- Kiểm tra quyền truy cập camera
- Dùng HTTPS hoặc localhost

### 2. Ảnh không upload được
- Kiểm tra API key ImgBB
- Kiểm tra kết nối mạng

### 3. Đăng nhập lỗi
- Kiểm tra Firebase config
- Kiểm tra email/password đúng chưa

### 4. Real-time không cập nhật
- Kiểm tra Firebase Rules
- Kiểm tra internet connection

---

**Version:** 1.0.0
