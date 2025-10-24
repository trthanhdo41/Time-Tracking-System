# 📸 imgbb Setup Guide - Free Image Hosting

Hệ thống sử dụng **imgbb** để lưu trữ ảnh (thay vì Firebase Storage) vì:
- ✅ **Free unlimited storage**
- ✅ **Free unlimited bandwidth**
- ✅ **Không cần thẻ tín dụng**
- ✅ **API đơn giản**

---

## 🚀 Cách Lấy API Key (1 phút)

### Bước 1: Đăng Ký imgbb
1. Truy cập: https://api.imgbb.com/
2. Click **"Get API Key"**
3. Điền thông tin:
   - **Email**: email của bạn
   - **Username**: tên username
   - **Password**: mật khẩu
4. Click **"Sign up"**

### Bước 2: Lấy API Key
1. Sau khi đăng nhập, bạn sẽ thấy API Key ngay
2. Copy API Key (dạng: `1234567890abcdef1234567890abcdef`)

### Bước 3: Thêm Vào .env
```env
VITE_IMGBB_API_KEY=1234567890abcdef1234567890abcdef
```

---

## ✅ Hoàn Tất!

Bây giờ hệ thống sẽ:
- Upload ảnh Face lên imgbb
- Lưu URL vào Firestore
- **Không tốn tiền Firebase Storage**

---

## 📊 imgbb Free Tier

| Feature | Free Tier |
|---------|-----------|
| Storage | **Unlimited** |
| Bandwidth | **Unlimited** |
| File Size | **Max 32MB/file** |
| API Calls | **Unlimited** |
| Cost | **$0 forever** |

---

## 🔧 Troubleshooting

### Lỗi: "IMGBB API Key not configured"
- Kiểm tra file `.env` đã có `VITE_IMGBB_API_KEY`
- Restart dev server: `npm run dev`

### Lỗi: "imgbb upload failed"
- Kiểm tra API key đúng chưa
- Kiểm tra kết nối internet
- Thử tạo API key mới

### Ảnh không hiển thị
- Kiểm tra URL có đúng không
- URL format: `https://i.ibb.co/xxxxx/image.jpg`
- URL public, không cần authentication

---

## 🌟 Ưu Điểm Của imgbb

### So với Firebase Storage:
- ✅ **Free unlimited** vs Firebase 5GB free
- ✅ **Không cần setup billing** vs Firebase cần thẻ tín dụng cho production
- ✅ **Không lo vượt quota** vs Firebase tính phí khi vượt
- ✅ **CDN global** vs Firebase hosting region-based

### So với Cloudinary:
- ✅ **Unlimited storage** vs Cloudinary 25GB
- ✅ **Unlimited bandwidth** vs Cloudinary 25GB/month
- ✅ **Đơn giản hơn** vs Cloudinary nhiều features phức tạp

---

## 🔐 Security

### imgbb Security:
- ✅ Ảnh được lưu trên CDN toàn cầu
- ✅ HTTPS by default
- ✅ Rate limiting tự động
- ⚠️ Ảnh là **public** (ai có link đều xem được)

### Bảo Mật Trong Hệ Thống:
- URL ảnh lưu trong Firestore (protected by rules)
- Chỉ authenticated users mới xem được URL
- Admin có thể xóa record trong Firestore (URL vẫn tồn tại trên imgbb)

---

## 🎯 Best Practices

### 1. Naming Convention
Ảnh được đặt tên theo format:
```
{username}_checkin_{timestamp}
Ví dụ: admin_checkin_1729656000000
```

### 2. Error Handling
- Nếu upload fail, check-in vẫn tiếp tục
- User được thông báo lỗi
- System log error để debug

### 3. Cleanup (Optional)
- imgbb không tự động xóa ảnh
- Nếu cần xóa: Delete request trên imgbb dashboard
- Hoặc dùng imgbb delete API (nâng cao)

---

## 📱 Alternative Image Hosts

Nếu imgbb không hoạt động, bạn có thể dùng:

### 1. **Imgur** (Free unlimited)
- API: https://api.imgur.com/
- Giống imgbb nhưng rate limit ketat hơn

### 2. **Cloudinary** (25GB free)
- More features, phức tạp hơn
- API: https://cloudinary.com/

### 3. **Postimages** (No limit)
- https://postimages.org/
- Không cần API key, chỉ cần upload

---

## 💡 Tips

### Tối Ưu Ảnh Trước Khi Upload
```typescript
// Trong code đã có sẵn
canvas.toBlob((blob) => {
  // ...
}, 'image/jpeg', 0.85); // Quality 85% = balance giữa chất lượng và size
```

### Monitor Usage
- imgbb dashboard: https://imgbb.com/
- Xem số ảnh đã upload
- Xem bandwidth usage

---

## ✅ Checklist

```
✅ Đăng ký imgbb account
✅ Lấy API key
✅ Thêm vào .env: VITE_IMGBB_API_KEY
✅ Restart dev server
✅ Test check-in với camera
✅ Verify ảnh upload thành công
```

---

**🎉 Xong! Bây giờ bạn có image hosting MIỄN PHÍ VĨNH VIỄN!**

