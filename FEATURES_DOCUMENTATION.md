# 📋 TÀI LIỆU CHỨC NĂNG HỆ THỐNG
## Time Tracking System - Web Check-in & Quản lý thời gian

---

## 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống quản lý thời gian làm việc với 2 vai trò chính:
1. **Nhân viên (Staff)** - Sử dụng để check-in/out và theo dõi thời gian làm việc
2. **Quản trị viên (Admin)** - Quản lý nhân viên và hệ thống

---

## 👤 CHỨC NĂNG NHÂN VIÊN (STAFF)

### 📱 1. TRANG ĐĂNG NHẬP
**URL:** `/login`

#### Chức năng:
- ✅ Đăng nhập bằng email và mật khẩu
- ✅ Hiển thị lỗi nếu thông tin không chính xác
- ✅ Chuyển hướng đến Dashboard sau khi đăng nhập thành công

#### Luồng xử lý:
1. Nhập email và mật khẩu
2. Click "Đăng nhập"
3. Hệ thống kiểm tra thông tin
4. Nếu đúng → Chuyển đến Dashboard
5. Nếu sai → Hiển thị thông báo lỗi

---

### 🏠 2. DASHBOARD - TRANG CHỦ
**URL:** `/dashboard`

#### 2.1. Header Navigation
- **Logo:** "Time Tracker" bên trái
- **Avatar:** Hiển thị ảnh đại diện nhân viên (hoặc chữ cái đầu nếu không có ảnh)
- **Đăng xuất:** Nút ở góc phải

#### 2.2. Thanh Navigation dưới Header
**4 Nút chính:**
1. **Trang Chủ** - Dashboard hiện tại
2. **Lịch Sử** - Xem lịch sử check-in/out
3. **Camera** - Chụp ảnh check-in/out
4. **Thư Viện Ảnh** - Xem tất cả ảnh đã chụp

#### 2.3. Hero Section
- Chào hỏi: "Xin chào, [Tên nhân viên]"
- Vị trí: [Phòng ban/Chức vụ]

#### 2.4. Thống Kê (Stats Cards)
**2 thẻ hiển thị:**
1. **Tổng Giờ (Total Hours)**
   - Tổng số giờ làm việc hôm nay
   - Icon: Clock
   
2. **Ca Làm Việc (Sessions Today)**
   - Số lần check-in trong ngày
   - Icon: Calendar

#### 2.5. Nút Hành Động (Action Buttons)
**5 nút chính:**
1. **Check In** (Xanh lá)
   - Mở camera để chụp ảnh check-in
   - Xác thực khuôn mặt
   - Lưu thời gian check-in
   
2. **Check Out** (Đỏ)
   - Mở camera để chụp ảnh check-out
   - Xác thực khuôn mặt
   - Tính tổng thời gian làm việc
   
3. **Xem Lịch Sử** (Xanh dương)
   - Chuyển đến trang History
   
4. **Xem Camera** (Tím)
   - Chuyển đến trang Camera để xem live feed
   
5. **Thư Viện Ảnh** (Cam)
   - Chuyển đến trang Image Gallery

---

### 📅 3. TRANG LỊCH SỬ (HISTORY)
**URL:** `/history`

#### Chức năng:
- Hiển thị tất cả lịch sử check-in/out của nhân viên
- Sắp xếp theo thời gian mới nhất
- Tìm kiếm theo ngày, tháng, năm

#### Thông tin hiển thị:
- ✅ **Ngày giờ:** Ngày check-in/out
- ✅ **Check In:** Thời gian vào (màu xanh lá)
- ✅ **Check Out:** Thời gian ra (màu đỏ)
- ✅ **Tổng thời gian:** Số giờ làm việc trong ca
- ✅ **Ảnh Check In:** Xem ảnh đã chụp lúc check-in
- ✅ **Ảnh Check Out:** Xem ảnh đã chụp lúc check-out

#### Thống kê tóm tắt:
1. **Tổng Giờ** - Tổng giờ làm việc trong kỳ
2. **Số Ca** - Tổng số ca làm việc

---

### 📷 4. TRANG CAMERA
**URL:** `/camera`

#### Chức năng:
- ✅ Xem live feed từ camera
- ✅ Chụp ảnh bằng nút "Chụp Ảnh"
- ✅ Hiển thị 2 ảnh đã chụp gần nhất:
  - Ảnh Check In (trái)
  - Ảnh Check Out (phải)
- ✅ Tải lại trang để làm mới camera feed

---

### 🖼️ 5. TRANG THƯ VIỆN ẢNH (IMAGE GALLERY)
**URL:** `/images`

#### Chức năng:
- ✅ Xem tất cả ảnh đã chụp (check-in, check-out, face verification)
- ✅ Lọc theo loại ảnh
- ✅ Tìm kiếm theo ngày
- ✅ Xóa ảnh (nếu có quyền)

#### Hiển thị:
- Ảnh thumbnail
- Loại ảnh (Check-in/Check-out/Face Verification)
- Ngày giờ chụp

---

## 👨‍💼 CHỨC NĂNG QUẢN TRỊ VIÊN (ADMIN)

### 🏠 1. ADMIN DASHBOARD - TRANG QUẢN TRỊ
**URL:** `/admin`

#### 1.1. Thanh Navigation
**7 tab chính:**
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

#### 2.1. Thống Kê Tổng Quan
**4 thẻ metrics:**
1. **Tổng Nhân Viên** - Số lượng nhân viên trong hệ thống
2. **Đang Online** - Số nhân viên đang online
3. **Đang Offline** - Số nhân viên đang offline
4. **Tổng Ca Làm Việc** - Tổng số ca trong ngày

#### 2.2. Danh Sách Nhân Viên
**Hiển thị:**
- 📸 Ảnh đại diện
- 👤 Tên nhân viên
- 📧 Email
- 🏢 Phòng ban (Department)
- 💼 Chức vụ (Position)
- 🟢 Trạng thái (Online/Offline)
- 👤 Vai trò (Admin/Staff)

#### 2.3. Thêm Nhân Viên Mới
**Modal Form gồm:**
- ✅ **Họ và Tên** (Full Name) - Bắt buộc
- ✅ **Email** (Email) - Bắt buộc, dùng để đăng nhập
- ✅ **Mật khẩu** (Password) - Bắt buộc, tối thiểu 6 ký tự
- ✅ **Phòng ban** (Department) - Dropdown chọn
- ✅ **Chức vụ** (Position) - Dropdown chọn
- ✅ **Face0** - Upload ảnh khuôn mặt đầu tiên
- ✅ **Face1** - Upload ảnh khuôn mặt thứ hai
- ✅ **Face2** - Upload ảnh khuôn mặt thứ ba

**Chức năng:**
- Tạo tài khoản nhân viên mới
- Upload 3 ảnh khuôn mặt để xác thực
- Thiết lập quyền truy cập

#### 2.4. Xóa Nhân Viên
**Chức năng:**
- Click nút "Xóa" bên cạnh mỗi nhân viên
- Xác nhận trước khi xóa
- Xóa khỏi Firebase Authentication và Firestore

---

### ⚙️ 3. TAB QUẢN LÝ HỆ THỐNG

#### Chức năng:
- ✅ Thay đổi cài đặt hệ thống
- ✅ Quản lý cấu hình chung
- ⚠️ *(Chức năng đang phát triển)*

---

### 🗑️ 4. TAB YÊU CẦU XÓA ẢNH

#### Chức năng:
- ✅ Xem tất cả yêu cầu xóa ảnh từ nhân viên
- ✅ Phê duyệt hoặc từ chối yêu cầu
- ✅ Xem ảnh cần xóa và lý do

#### Hiển thị:
- Tên nhân viên yêu cầu
- Ảnh cần xóa (thumbnail)
- Lý do xóa
- Ngày yêu cầu
- Nút "Phê duyệt" (xanh lá)
- Nút "Từ chối" (đỏ)

---

### 📋 5. TAB NHẬT KÝ HOẠT ĐỘNG

#### Chức năng:
- ✅ Xem tất cả hoạt động trong hệ thống
- ✅ Lọc theo:
  - Nhân viên
  - Phòng ban
  - Loại hành động
  - Khoảng thời gian

#### Hoạt động được ghi lại:
- 🔐 Đăng nhập/Đăng xuất
- ✅ Check-in
- 🚪 Check-out
- 📝 Tạo/Xóa nhân viên
- 📸 Upload ảnh
- 🗑️ Xóa dữ liệu

#### Hiển thị:
- Thời gian
- Tên nhân viên
- Phòng ban
- Chức vụ
- Hành động
- Chi tiết

#### Export:
- ✅ Xuất ra file CSV
- ✅ Tải về máy

---

### 📊 6. TAB BÁO CÁO

#### Chức năng:
- ✅ Tạo báo cáo theo khoảng thời gian
- ✅ Xem thống kê chi tiết
- ✅ Phân tích hiệu suất nhân viên

#### Báo cáo có sẵn:
1. **Báo Cáo Ngày** - Thống kê theo ngày
2. **Báo Cáo Tuần** - Thống kê theo tuần
3. **Báo Cáo Tháng** - Thống kê theo tháng

#### Thông tin báo cáo:
- Tổng giờ làm việc
- Số ca làm việc
- Nhân viên có giờ làm nhiều nhất
- Xu hướng theo thời gian

---

### ⏰ 7. TAB THEO DÕI SẼ QUAY LẠI

#### Chức năng:
- ✅ Theo dõi nhân viên đã check-out nhưng sẽ quay lại
- ✅ Hiển thị thời gian check-out và dự kiến quay lại
- ✅ Thông báo khi nhân viên quay lại

#### Hiển thị:
- Tên nhân viên
- Thời gian check-out
- Thời gian dự kiến quay lại
- Trạng thái (Đã quay lại/Chưa quay lại)

---

### 🖼️ 8. TAB XEM TẤT CẢ ẢNH

#### Chức năng:
- ✅ Xem tất cả ảnh của tất cả nhân viên
- ✅ Lọc theo:
  - Nhân viên
  - Loại ảnh (Check-in/Check-out/Face Verification)
  - Khoảng thời gian
- ✅ Tìm kiếm nhanh

#### Hiển thị:
- Thumbnail ảnh
- Tên nhân viên
- Phòng ban
- Chức vụ
- Loại ảnh
- Ngày giờ chụp

---

### 🧹 9. TAB DỌN DẸP DỮ LIỆU

#### Chức năng:
- ✅ Xóa dữ liệu test
- ✅ Xóa nhật ký hoạt động cũ
- ✅ Xóa ảnh cũ

⚠️ **CẢNH BÁO:** Chức năng này xóa vĩnh viễn, không thể khôi phục!

#### Tùy chọn xóa:
1. **Xóa Nhật Ký Hoạt Động** - Xóa tất cả activity logs
2. **Xóa Tất Cả Ảnh** - Xóa tất cả ảnh check-in/out
3. **Xóa Tất Cả** - Xóa toàn bộ dữ liệu (nguy hiểm!)

---

## 🔐 BẢO MẬT VÀ PHÂN QUYỀN

### 1. Authentication
- ✅ Firebase Authentication
- ✅ Email/Password login
- ✅ Session management
- ✅ Auto logout khi không hoạt động

### 2. Authorization
- ✅ Role-based access control (Admin/Staff)
- ✅ Admin chỉ truy cập được Admin Dashboard
- ✅ Staff chỉ truy cập được Staff Dashboard
- ✅ Tự động redirect nếu truy cập sai trang

### 3. Data Security
- ✅ Firebase Firestore Rules
- ✅ Chỉ user đăng nhập mới xem được dữ liệu của mình
- ✅ Admin xem được tất cả dữ liệu

---

## 🌐 TÍNH NĂNG BỔ SUNG

### 1. Real-time Updates
- ✅ Cập nhật trạng thái online/offline real-time
- ✅ Sử dụng Firebase onSnapshot

### 2. Responsive Design
- ✅ Tối ưu cho mobile
- ✅ Tối ưu cho tablet
- ✅ Tối ưu cho desktop

### 3. Image Handling
- ✅ Upload ảnh lên ImgBB
- ✅ Xác thực khuôn mặt
- ✅ Hiển thị thumbnail
- ✅ Xóa ảnh

### 4. User Status Tracking
- ✅ Heartbeat system
- ✅ Tự động offline khi đóng browser
- ✅ Tự động online khi mở lại

---

## 📝 QUY TRÌNH TEST

### BƯỚC 1: Test Nhân Viên (Staff)
1. ✅ Đăng nhập với tài khoản nhân viên
2. ✅ Kiểm tra Dashboard hiển thị đúng
3. ✅ Test Check-in với camera
4. ✅ Test Check-out với camera
5. ✅ Kiểm tra Lịch sử có hiển thị đúng
6. ✅ Xem ảnh trong Thư Viện Ảnh
7. ✅ Test Camera page hoạt động
8. ✅ Test đăng xuất

### BƯỚC 2: Test Quản Trị Viên (Admin)
1. ✅ Đăng nhập với tài khoản admin
2. ✅ Kiểm tra thống kê tổng quan
3. ✅ Xem danh sách nhân viên
4. ✅ Test thêm nhân viên mới
5. ✅ Test xóa nhân viên
6. ✅ Xem Nhật Ký Hoạt Động
7. ✅ Test xuất CSV
8. ✅ Xem tất cả ảnh
9. ✅ Test các tab khác

### BƯỚC 3: Test Bảo Mật
1. ✅ Staff không thể truy cập Admin Dashboard
2. ✅ Admin không thể truy cập Staff Dashboard (đang xem xét)
3. ✅ Không đăng nhập không xem được dữ liệu

### BƯỚC 4: Test Real-time
1. ✅ Mở 2 browser với 2 tài khoản khác nhau
2. ✅ Check-in từ 1 browser
3. ✅ Kiểm tra browser kia có cập nhật real-time
4. ✅ Test trạng thái online/offline

---

## 🐛 CÁC LỖI THƯỜNG GẶP

### 1. Camera không hoạt động
- ✅ Kiểm tra quyền truy cập camera
- ✅ Dùng HTTPS hoặc localhost

### 2. Ảnh không upload được
- ✅ Kiểm tra API key ImgBB
- ✅ Kiểm tra kết nối mạng

### 3. Đăng nhập lỗi
- ✅ Kiểm tra Firebase config
- ✅ Kiểm tra email/password đúng chưa

### 4. Real-time không cập nhật
- ✅ Kiểm tra Firebase Rules
- ✅ Kiểm tra internet connection

---

## 📞 SUPPORT

Nếu có vấn đề, vui lòng liên hệ:
- 📧 Email: support@example.com
- 📱 Phone: +84 xxx xxx xxx

---

**Cập nhật lần cuối:** $(date)
**Version:** 1.0.0
