# 🚀 Vercel Deployment Guide - Time Tracking System

## ⚠️ VẤN ĐỀ THƯỜNG GẶP

### Lỗi: Firestore 400 Bad Request sau khi deploy
**Nguyên nhân:** Environment variables trên Vercel bị lỗi do có ký tự `\n` (newline) ở cuối mỗi value khi add bằng `echo`.

---

## ✅ CÁCH DEPLOY ĐÚNG

### Bước 1: Xóa Environment Variables Cũ (Nếu bị lỗi)

```bash
cd "/Users/mac/Desktop/web check in theo dõi thời gian online"

# Xóa các env variables bị lỗi
vercel env rm VITE_FIREBASE_API_KEY production --yes
vercel env rm VITE_FIREBASE_AUTH_DOMAIN production --yes
vercel env rm VITE_FIREBASE_PROJECT_ID production --yes
vercel env rm VITE_FIREBASE_STORAGE_BUCKET production --yes
vercel env rm VITE_FIREBASE_MESSAGING_SENDER_ID production --yes
vercel env rm VITE_FIREBASE_APP_ID production --yes
vercel env rm VITE_FIREBASE_MEASUREMENT_ID production --yes
vercel env rm VITE_IMGBB_API_KEY production --yes
vercel env rm VITE_CAPTCHA_MAX_ATTEMPTS production --yes
vercel env rm VITE_CAPTCHA_TIMEOUT_SECONDS production --yes
vercel env rm VITE_FACE_CHECK_INTERVAL production --yes
vercel env rm VITE_FACE_MATCH_THRESHOLD production --yes
vercel env rm VITE_CAPTCHA_INTERVAL_MINUTES production --yes
```

---

### Bước 2: Thêm Environment Variables ĐÚNG CÁCH

**⚠️ QUAN TRỌNG:** Dùng `printf` thay vì `echo` để tránh ký tự newline!

```bash
# Firebase Config
printf "AIzaSyDv_m3Q6kySNo8p_hrqHEJsu84_M9wgDao" | vercel env add VITE_FIREBASE_API_KEY production
printf "enterprise-time-trackin.firebaseapp.com" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production
printf "enterprise-time-trackin" | vercel env add VITE_FIREBASE_PROJECT_ID production
printf "enterprise-time-trackin.firebasestorage.app" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production
printf "143042385879" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
printf "1:143042385879:web:3dc5410d4549813a339d92" | vercel env add VITE_FIREBASE_APP_ID production
printf "" | vercel env add VITE_FIREBASE_MEASUREMENT_ID production

# Imgbb Config
printf "ae21ac039240a7d40788bcda9a822d8e" | vercel env add VITE_IMGBB_API_KEY production

# System Settings (Optional - có thể lấy từ Firebase)
printf "3" | vercel env add VITE_CAPTCHA_MAX_ATTEMPTS production
printf "180" | vercel env add VITE_CAPTCHA_TIMEOUT_SECONDS production
printf "5" | vercel env add VITE_FACE_CHECK_INTERVAL production
printf "0.7" | vercel env add VITE_FACE_MATCH_THRESHOLD production
printf "2" | vercel env add VITE_CAPTCHA_INTERVAL_MINUTES production
```

---

### Bước 3: Deploy lên Production

```bash
# Force rebuild để apply tất cả env variables
vercel --prod --force --yes
```

**Giải thích:**
- `--prod`: Deploy lên Production (không phải Preview)
- `--force`: Force rebuild toàn bộ (không dùng cache)
- `--yes`: Auto confirm tất cả prompts

---

### Bước 4: Kiểm tra Deploy thành công

1. Đợi 30 giây để build hoàn tất
2. Truy cập: https://time-tracking-system-rho.vercel.app
3. Hard Refresh: `Cmd + Shift + R` (Mac) hoặc `Ctrl + Shift + R` (Windows)
4. Mở Console (F12) - Không có lỗi 400 Bad Request
5. Login thành công

---

## 🔍 CÁCH KIỂM TRA ENV

### Xem danh sách env trên Vercel:
```bash
vercel env ls production
```

### Pull env về local để kiểm tra:
```bash
vercel env pull .env.vercel --environment production
cat .env.vercel
```

**⚠️ CHÚ Ý:** Nếu thấy `\n` ở cuối mỗi value → Phải xóa và thêm lại!

---

## 📋 DEPLOY NHANH (Khi code đã thay đổi)

Nếu env đã setup đúng, chỉ cần:

```bash
cd "/Users/mac/Desktop/web check in theo dõi thời gian online"
vercel --prod --yes
```

---

## 🗑️ XÓA FILE ENV LOCAL (Quan trọng!)

Các file này có thể gây conflict:

```bash
# Xóa các file env do Vercel CLI tạo ra
rm -f .env.local
rm -f .env.production.local
rm -f .env.vercel

# Chỉ giữ file .env (cho development local)
```

**Lý do:** 
- Vite load env theo thứ tự: `.env.production.local` → `.env.local` → `.env`
- File `.env.local` và `.env.production.local` do Vercel tạo ra CHỈ CÓ `VERCEL_OIDC_TOKEN`
- Điều này sẽ override file `.env` gốc và làm app thiếu Firebase config

---

## ✅ CHECKLIST DEPLOY

- [ ] Xóa file `.env.local`, `.env.production.local` nếu có
- [ ] Kiểm tra env trên Vercel: `vercel env ls production`
- [ ] Nếu env có vấn đề → Xóa và thêm lại bằng `printf`
- [ ] Deploy với `--force`: `vercel --prod --force --yes`
- [ ] Đợi 30 giây
- [ ] Test trên Production URL
- [ ] Hard Refresh browser
- [ ] Check Console không có lỗi

---

## 🆘 TROUBLESHOOTING

### Lỗi: Firestore 400 Bad Request
→ Env variables chưa được inject đúng
→ Làm lại Bước 1, 2, 3

### Lỗi: Firebase Config Missing
→ Check Console log sẽ show thiếu key nào
→ Add lại key đó bằng `printf`

### Lỗi: Loading mãi không vào
→ Hard Refresh: `Cmd + Shift + R`
→ Clear Cache & Hard Reload (trong DevTools)

---

## 📚 TÀI LIỆU THAM KHẢO

- Vercel CLI: https://vercel.com/docs/cli
- Vite Env: https://vitejs.dev/guide/env-and-mode.html
- Firebase Setup: Xem file `firebase.ts`

---

## 🎯 PRODUCTION URL

- **Custom Domain:** https://time-tracking-system-rho.vercel.app
- **Vercel Dashboard:** https://vercel.com/mrdos-projects/time-tracking-system

---

**📝 Ghi chú cuối:**
- ✅ LUÔN dùng `printf` khi add env (KHÔNG dùng `echo`)
- ✅ Xóa file `.env.local` và `.env.production.local` sau khi pull
- ✅ Deploy với `--force` để đảm bảo rebuild hoàn toàn
- ✅ Test trên Production sau mỗi lần deploy

**Created:** 2025-01-30  
**Last Updated:** 2025-01-30  
**Status:** ✅ WORKING

