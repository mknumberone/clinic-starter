# 📌 CHANGELOG – BẢN CẬP NHẬT TRƯỚC

## 🗓 Thời gian
- Tháng 01 / 2026

---

## 🚀 TỔNG QUAN
Bản cập nhật này tập trung vào:
- Mở rộng **chức năng quản lý tin tức**
- Bổ sung **gói khám, chuyên khoa**
- Nâng cấp **chấm công, ca làm việc**
- Hoàn thiện **các trang landing page**
- Cập nhật **cấu trúc cơ sở dữ liệu (Prisma Migration)**

---

## 🗄️ BACKEND (NestJS + Prisma)

### ✨ TÍNH NĂNG MỚI
- Thêm **module Tin tức (News)**
- Thêm **quản lý Gói khám (Examination Packages)**
- Bổ sung **chuyên khoa và thông tin chi tiết**
- Thêm chức năng **chấm công theo ca làm việc**
- Bổ sung trường **isActive** cho thuốc
- Cập nhật **xác thực người dùng** và thông tin nhân sự

### 🧱 DATABASE – PRISMA MIGRATION
Thêm các migration mới:
- `add_user_verification_fields`
- `fix_user_nullable_fields`
- `add_staff_update`
- `add_attendance_to_shift`
- `add_is_active_to_medication`
- `add_specialization_details`
- `add_examination_packages`
- `add_examination_package_slug_category`
- `add_news_model`

### 📁 FILE / MODULE MỚI
- `backend/src/news/`
- `backend/src/medications/`
- `backend/src/users/`
- `backend/src/doctors/dto/examination-package.dto.ts`
- `backend/src/inventory/inventory.scheduler.ts`
- SQL hỗ trợ gói khám:
  - `add_examination_packages.sql`

### ✏️ FILE ĐƯỢC CẬP NHẬT
- `auth.service.ts`
- `doctors.controller.ts`
- `medications.service.ts`
- `users.service.ts`
- `appointments.service.ts`

---

## 🌐 FRONTEND WEB (React + TypeScript)

### ✨ TRANG MỚI
#### Landing Page
- Trang Liên hệ (`ContactPage`)
- Trang Tin tức (`NewsPage`)
- Trang Danh sách Gói khám (`PackagesPage`)
- Trang Chi tiết Gói khám (`PackageDetailPage`)
- Trang Chi tiết Chuyên khoa (`SpecialtyDetailPage`)

#### Trang Quản trị
- Quản lý Tin tức (`NewsManagement`)
- Theo dõi Chấm công (`AttendanceTracking`)

### ✏️ CẬP NHẬT
- Điều chỉnh `Navbar`
- Cập nhật routing trong `App.tsx`
- Chỉnh sửa các trang quản lý lịch hẹn, nhân sự

---

## 📱 MOBILE (React Native / Expo)

### ✨ MỚI
- Thêm service quản lý hồ sơ y tế:
  - `medical-record.service.ts`

### ⚠️ LƯU Ý
- Thư mục `.expo/` chỉ là cache, **không thuộc mã nguồn**
- Đã được đề xuất đưa vào `.gitignore`

---

## 🛠️ CẢI TIẾN KHÁC
- Tối ưu cấu trúc thư mục
- Chuẩn hóa DTO và service
- Chuẩn bị nền tảng cho các tính năng mở rộng tiếp theo

---

## ✅ TRẠNG THÁI
- Các tính năng đã hoàn thiện và sẵn sàng sử dụng
- Cần test thêm phần:
  - Tin tức
  - Gói khám
  - Chấm công

---

📌 *Tài liệu này dùng để theo dõi thay đổi giữa các phiên bản dự án.*
