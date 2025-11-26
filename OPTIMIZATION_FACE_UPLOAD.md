# Tối ưu hóa Upload Face Images

## ✅ Vấn đề đã sửa

### **Trước:**
❌ Mỗi lần check-in → Upload Face1 mới → Lãng phí storage  
❌ Mỗi lần captcha verification → Upload Face2 mới → Lãng phí storage  
❌ Dữ liệu tăng không kiểm soát

### **Sau:**
✅ **Lần đầu check-in** → Upload và lưu Face1 vào user document  
✅ **Các lần sau** → Dùng Face1 đã lưu, không upload lại  
✅ **Lần đầu captcha** → Upload và lưu Face2 vào user document  
✅ **Các lần sau** → Dùng Face2 đã lưu, không upload lại  

---

## 📊 So sánh:

### **Trước khi tối ưu:**
```
User check-in 100 lần/tháng
→ 100 Face1 images uploaded
→ 100 × 50KB = 5MB/user/tháng
→ 100 users = 500MB/tháng
```

### **Sau khi tối ưu:**
```
User check-in 100 lần/tháng
→ 1 Face1 image uploaded (lần đầu)
→ 1 × 50KB = 50KB/user (một lần duy nhất)
→ 100 users = 5MB (một lần duy nhất)

Tiết kiệm: 99% storage! 🎉
```

---

## 🔧 Files đã cập nhật:

### 1. **src/components/staff/CheckInCamera.tsx**
```typescript
// Trước:
face1Url = await uploadImageToImgbb(imageBlob, `checkin_${user.id}_${Date.now()}`);

// Sau:
let face1Url = user.face1Url || ''; // Dùng Face1 đã lưu

if (!user.face1Url && isImageUploadConfigured()) {
  // Chỉ upload lần đầu
  face1Url = await uploadImageToImgbb(imageBlob, `${user.username}_face1_${Date.now()}`);
  
  // Lưu vào user document
  await updateDoc(doc(db, 'users', user.id), {
    face1Url: face1Url,
    updatedAt: getVietnamTimestamp()
  });
}
```

### 2. **src/components/staff/CheckInButton.tsx**
- ✅ Tương tự CheckInCamera.tsx
- ✅ Chỉ upload Face1 lần đầu
- ✅ Các lần sau dùng Face1 đã lưu

### 3. **src/components/staff/FaceVerificationModal.tsx**
- ✅ Chỉ upload Face2 lần đầu (captcha verification)
- ✅ Các lần sau dùng Face2 đã lưu

---

## 🎯 Luồng hoạt động:

### **Check-in lần đầu:**
1. User check-in
2. Capture face image
3. ❓ Kiểm tra: `user.face1Url` có tồn tại?
   - ❌ **Không** → Upload Face1 → Lưu vào user document
   - ✅ **Có** → Dùng Face1 đã lưu
4. Tạo session với Face1 URL

### **Check-in các lần sau:**
1. User check-in
2. Capture face image (để verify)
3. ✅ Dùng `user.face1Url` đã lưu
4. **Không upload** → Tiết kiệm bandwidth & storage
5. Tạo session với Face1 URL đã có

### **Captcha verification:**
1. User verify captcha
2. Capture face image
3. ❓ Kiểm tra: `user.face2Url` có tồn tại?
   - ❌ **Không** → Upload Face2 → Lưu vào user document
   - ✅ **Có** → Dùng Face2 đã lưu
4. Reset captcha count

---

## 📝 Database Schema:

### **User Document:**
```typescript
{
  id: string;
  username: string;
  faceImageUrl?: string;  // Face0 - Base face (admin upload khi tạo user)
  face1Url?: string;      // Face1 - Check-in face (lần đầu check-in)
  face2Url?: string;      // Face2 - Captcha verification face (lần đầu verify)
  // ...
}
```

### **Session Document:**
```typescript
{
  id: string;
  userId: string;
  faceImageUrl: string;   // Face0 URL (từ user)
  face1Url: string;       // Face1 URL (từ user, không upload mới)
  checkInTime: number;
  // ...
}
```

---

## ✅ Lợi ích:

1. **Tiết kiệm storage**: 99% giảm dung lượng lưu trữ
2. **Tăng tốc độ**: Không cần upload mỗi lần check-in
3. **Giảm bandwidth**: Không tốn băng thông upload
4. **UX tốt hơn**: Check-in nhanh hơn (không chờ upload)
5. **Chi phí thấp hơn**: Giảm chi phí storage & bandwidth

---

## 🧪 Test Cases:

### Test 1: Check-in lần đầu
1. User chưa có `face1Url`
2. Check-in
3. ✅ Upload Face1
4. ✅ Lưu `face1Url` vào user document
5. ✅ Console log: "✅ Face1 saved for first check-in"

### Test 2: Check-in lần 2+
1. User đã có `face1Url`
2. Check-in
3. ✅ Không upload
4. ✅ Dùng `face1Url` đã lưu
5. ✅ Console log: "✅ Using existing Face1 - No upload needed"

### Test 3: Captcha verification lần đầu
1. User chưa có `face2Url`
2. Verify captcha
3. ✅ Upload Face2
4. ✅ Lưu `face2Url` vào user document
5. ✅ Console log: "✅ Face2 saved for first captcha verification"

### Test 4: Captcha verification lần 2+
1. User đã có `face2Url`
2. Verify captcha
3. ✅ Không upload
4. ✅ Dùng `face2Url` đã lưu
5. ✅ Console log: "✅ Using existing Face2 - No upload needed"

---

## 🔍 Monitoring:

### Console logs để theo dõi:
```
✅ Face1 saved for first check-in
✅ Using existing Face1 - No upload needed
✅ Face2 saved for first captcha verification
✅ Using existing Face2 - No upload needed
```

### Kiểm tra trong Firestore:
- User document có `face1Url` sau lần check-in đầu
- User document có `face2Url` sau lần captcha đầu
- Session document dùng `face1Url` từ user

---

## ⚠️ Lưu ý:

1. **Face0 (faceImageUrl)**: Admin upload khi tạo user → Không thay đổi
2. **Face1 (face1Url)**: Lưu lần đầu check-in → Dùng mãi mãi
3. **Face2 (face2Url)**: Lưu lần đầu captcha → Dùng mãi mãi
4. **Existing users**: Nếu chưa có face1Url/face2Url → Upload lần đầu tiên
5. **New users**: Lần đầu check-in/captcha sẽ upload và lưu

