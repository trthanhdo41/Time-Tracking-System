# Timezone Update - GMT+7 (Vietnam)

## ✅ Đã hoàn thành

### **Vấn đề:**
- Hệ thống đang lưu timestamp theo thời gian máy local (Date.now())
- Gây ra sai lệch thời gian khi máy ở múi giờ khác

### **Giải pháp:**
- Tạo function `getVietnamTimestamp()` để lấy timestamp GMT+7
- Thay thế tất cả `Date.now()` bằng `getVietnamTimestamp()`

---

## 📝 Files đã cập nhật:

### 1. **src/utils/time.ts**
- ✅ Thêm function `getVietnamTimestamp()` - lấy timestamp GMT+7
- ✅ Deprecated `getServerTimestamp()` - redirect về `getVietnamTimestamp()`

### 2. **src/services/activityLog.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Dùng `getVietnamTimestamp()` cho `timestamp` field

### 3. **src/services/sessionService.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Check-in: Dùng `getVietnamTimestamp()` cho checkInTime, lastActivityTime, lastCaptchaTime
- ✅ Back Soon: Dùng `getVietnamTimestamp()` cho startTime, updatedAt
- ✅ Back Online: Dùng `getVietnamTimestamp()` cho endTime, updatedAt
- ✅ Check-out: Dùng `getVietnamTimestamp()` cho checkOutTime

### 4. **src/utils/activityTracker.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Dùng `getVietnamTimestamp()` cho lastActivityTime updates

### 5. **src/utils/userStatusTracker.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Heartbeat: Dùng `getVietnamTimestamp()` cho lastActivityAt
- ✅ BeforeUnload: Dùng `getVietnamTimestamp()` cho cleanup
- ✅ Visibility change: Dùng `getVietnamTimestamp()` cho activity updates
- ✅ updateUserStatus: Dùng `getVietnamTimestamp()`

### 6. **src/utils/cleanupStaleSessions.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Dùng `getVietnamTimestamp()` cho checkOutTime, updatedAt

### 7. **src/services/auth.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Login (legacy user): Dùng `getVietnamTimestamp()` cho createdAt, updatedAt
- ✅ Create user: Dùng `getVietnamTimestamp()` cho createdAt, updatedAt

### 8. **src/services/userService.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Create user: Dùng `getVietnamTimestamp()` cho createdAt, updatedAt

### 9. **src/services/imageDeleteService.ts**
- ✅ Import `getVietnamTimestamp`
- ✅ Create request: Dùng `getVietnamTimestamp()` cho requestedAt
- ✅ Approve request: Dùng `getVietnamTimestamp()` cho reviewedAt
- ✅ Reject request: Dùng `getVietnamTimestamp()` cho reviewedAt

---

## 🧪 Test Cases:

### Test 1: Check-in
1. Check-in vào hệ thống
2. Kiểm tra `checkInTime` trong Firestore
3. ✅ Phải là thời gian GMT+7 (không phải thời gian máy local)

### Test 2: Activity Log
1. Thực hiện action bất kỳ (check-in, check-out, back soon)
2. Kiểm tra `timestamp` trong `activityLogs` collection
3. ✅ Phải là thời gian GMT+7

### Test 3: Session timestamps
1. Check-in → Back Soon → Back Online → Check-out
2. Kiểm tra tất cả timestamps trong session
3. ✅ Tất cả phải là GMT+7

### Test 4: User creation
1. Admin tạo user mới
2. Kiểm tra `createdAt`, `updatedAt`
3. ✅ Phải là thời gian GMT+7

---

## 🔍 Verify Timestamp:

```javascript
// Console test
import { getVietnamTimestamp } from '@/utils/time';

const vnTime = getVietnamTimestamp();
const localTime = Date.now();

console.log('Vietnam Time:', new Date(vnTime).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
console.log('Local Time:', new Date(localTime).toLocaleString());
```

---

## ⚠️ Lưu ý:

1. **Display timestamps**: Các function `formatTime()`, `formatDate()`, `formatDateTime()` vẫn hoạt động bình thường vì chúng chỉ format, không tạo timestamp
2. **Existing data**: Dữ liệu cũ trong database vẫn giữ nguyên timestamp cũ
3. **New data**: Tất cả dữ liệu mới sẽ dùng GMT+7
4. **Consistency**: Tất cả timestamps trong hệ thống giờ đã đồng bộ theo GMT+7

---

## [object Object]:

- ✅ Check-in/Check-out time: Chính xác GMT+7
- ✅ Activity logs: Chính xác GMT+7
- ✅ Session tracking: Chính xác GMT+7
- ✅ User creation: Chính xác GMT+7
- ✅ Reports: Sẽ tính toán chính xác theo GMT+7

