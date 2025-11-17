# 🏥 Clinic Management System

Hệ thống quản lý phòng khám toàn diện với Backend API, Web Admin Dashboard và Mobile App cho bệnh nhân.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
- [Tài khoản mẫu](#tài-khoản-mẫu)
- [Tính năng](#tính-năng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)

## 🎯 Tổng quan

Hệ thống bao gồm 3 phần chính:
- **Backend**: NestJS API với Swagger documentation
- **Web**: React Admin Dashboard cho Admin/Doctor
- **Mobile**: React Native App cho Patient

## 🛠 Công nghệ sử dụng

### Backend
- **NestJS 10** + TypeScript 5
- **PostgreSQL 15** + Prisma ORM
- **Redis 7** (OTP storage)
- **MongoDB 6** (EHR storage - prepared)
- **Docker & Docker Compose**
- JWT Authentication + Passport
- Swagger/OpenAPI Documentation

### Web Frontend
- **React 18** + Vite 5
- **TypeScript 5**
- **Ant Design 5** (UI Components)
- **TanStack Query v4** (Server State)
- **Zustand 4** (Client State)
- **Tailwind CSS v4**
- React Router v6
- FullCalendar (Appointment scheduling)
- Recharts (Charts & Analytics)

### Mobile App
- **Expo SDK 48**
- **React Native 0.71.8**
- **React Native Paper** (Material Design)
- **React Navigation 6**
- **TanStack Query v4**
- **Zustand 4**
- Expo SecureStore (Token storage)

## 💻 Yêu cầu hệ thống

- **Node.js**: v20 trở lên
- **Docker Desktop**: Phiên bản mới nhất
- **npm**: v10 trở lên
- **Git**: Phiên bản mới nhất

**Cho Mobile (Optional):**
- **iOS**: Xcode và iOS Simulator
- **Android**: Android Studio và Android Emulator
- **Expo Go App** (cho test trên điện thoại thật)

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd clinic-starter
```

### Bước 2: Khởi động Backend

#### 2.1. Cài đặt dependencies
```bash
cd backend
npm install
```

#### 2.2. Cấu hình môi trường
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

#### 2.3. Khởi động Docker (PostgreSQL, Redis, MongoDB)
```bash
# Về thư mục gốc
cd ..

# Khởi động containers
docker-compose up -d

# Kiểm tra containers đang chạy
docker-compose ps
```

Kết quả mong đợi:
```
NAME                IMAGE               STATUS
clinic-mongo        mongo:6             Up
clinic-postgres     postgres:15         Up
clinic-redis        redis:7-alpine      Up
```

#### 2.4. Setup database
```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Tạo database schema
npx prisma db push

# (Optional) Seed data mẫu
npm run build
node dist/prisma/seed.js
```

#### 2.5. Chạy backend
```bash
npm run start:dev
```

Backend sẽ chạy tại: **http://localhost:3000/api**
Swagger UI: **http://localhost:3000/api-docs**

### Bước 3: Khởi động Web Frontend

Mở terminal mới:

```bash
cd web
npm install
npm run dev
```

Web sẽ chạy tại: **http://localhost:5174**

### Bước 4: Khởi động Mobile App

Mở terminal mới:

```bash
cd mobile
npm install
npm start
```

Sau đó chọn:
- Nhấn **`i`** để mở iOS Simulator
- Nhấn **`a`** để mở Android Emulator
- Quét **QR code** bằng Expo Go app trên điện thoại

## 🔐 Tài khoản mẫu

Sau khi seed data, sử dụng các tài khoản sau để đăng nhập:

### Admin
- **SĐT**: `0912345678`
- **OTP**: `123456`

### Bác sĩ
- **SĐT**: `0987654321` (Bs. Nguyễn Văn A)
- **SĐT**: `0987654322` (Bs. Trần Thị B)
- **OTP**: `123456`

### Bệnh nhân
- **SĐT**: `0901234567` (Nguyễn Văn X)
- **SĐT**: `0901234568` (Trần Thị Y)
- **OTP**: `123456`

**Lưu ý**: Mã OTP sẽ được in ra console của backend khi request gửi OTP.

## ✨ Tính năng

### Backend API (90+ endpoints)
- ✅ Authentication (OTP-based với JWT)
- ✅ User Management
- ✅ Patient Management
- ✅ Doctor Management
- ✅ Specialization & Room Management
- ✅ Doctor Schedule Management
- ✅ Appointment Booking & Management
- ✅ Prescription Management
- ✅ Medication Management
- ✅ Invoice & Payment Management
- ✅ File Upload/Download
- ✅ Dashboard Analytics
- ✅ Role-based Access Control (ADMIN, DOCTOR, PATIENT)
- ✅ Data filtering by role (Doctor chỉ thấy bệnh nhân của mình)

### Web Dashboard
- ✅ Responsive Dashboard cho 3 roles
- ✅ Patient Management (CRUD, Search, Filter)
- ✅ Doctor Management (CRUD với Specializations)
- ✅ Appointment Management (List, Calendar View, Booking Wizard)
- ✅ Prescription Management (CRUD, Print)
- ✅ Invoice Management (CRUD, Payment tracking)
- ✅ Doctor Schedule Management
- ✅ Profile Management (View/Edit)
- ✅ Charts & Analytics
- ✅ Role-based Navigation

### Mobile App (Patient)
- ✅ OTP Login
- ✅ Dashboard với thống kê
- ✅ Danh sách lịch khám
- ✅ Xem thông tin chi tiết lịch khám
- ✅ Profile management
- ✅ Pull-to-refresh
- ✅ Bottom tab navigation

## 📁 Cấu trúc dự án

```
clinic-starter/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma-migrations/  # Database schema
│   └── package.json
│
├── web/                    # React Web Admin
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── stores/        # Zustand stores
│   │   └── lib/           # Utilities
│   └── package.json
│
├── mobile/                 # React Native Mobile
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── services/      # API services
│   │   ├── stores/        # Zustand stores
│   │   └── lib/           # Utilities
│   └── package.json
│
└── docker-compose.yml      # Docker services
```

## 🔧 Các lệnh hữu ích

### Backend
```bash
# Xem Prisma Studio (Database GUI)
npx prisma studio

# Tạo migration mới
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

### Docker
```bash
# Dừng containers
docker-compose down

# Xóa volumes (reset data)
docker-compose down -v

# Xem logs
docker-compose logs -f postgres
```

## ⚠️ Lưu ý quan trọng

### 🔴 Trước khi chạy dự án

1. **Docker Desktop phải chạy trước**
   - Mở Docker Desktop và đợi cho đến khi trạng thái "Engine running"
   - Chạy `docker-compose up -d` từ thư mục gốc
   - Verify: `docker-compose ps` để kiểm tra 3 containers đang chạy

2. **Thứ tự khởi động đúng**
   ```
   1️⃣ Docker (PostgreSQL, Redis, MongoDB)
   2️⃣ Backend (port 3000)
   3️⃣ Web (port 5174)
   4️⃣ Mobile (Expo dev server)
   ```

3. **Seed data trước khi test**
   ```bash
   cd backend
   npm run build
   node dist/prisma/seed.js
   ```

### 🔴 Khi test Mobile App

1. **Backend PHẢI chạy trước** khi mở mobile app
2. **Sửa API URL** trong `mobile/src/lib/axios.ts`:
   - iOS Simulator: `http://localhost:3000/api` ✅
   - Android Emulator: `http://10.0.2.2:3000/api`
   - iPhone/Android thật: `http://<YOUR_LOCAL_IP>:3000/api`

3. **Lấy IP local của máy**:
   ```bash
   # Windows
   ipconfig
   # Tìm "IPv4 Address" (ví dụ: 192.168.11.27)
   
   # macOS/Linux
   ifconfig
   # Tìm "inet" (ví dụ: 192.168.1.100)
   ```

4. **Cùng mạng WiFi**: Máy tính và điện thoại phải cùng WiFi

5. **Tắt VPN** nếu mobile không kết nối được

### 🔴 Lỗi thường gặp

1. **"Cannot connect to database"**
   - Kiểm tra Docker Desktop đang chạy
   - Chạy: `docker-compose restart postgres`

2. **"Port 3000 already in use"**
   - Dừng process đang dùng port 3000
   - Hoặc đổi port trong `backend/src/main.ts`

3. **"There was a problem running the requested app" (Mobile)**
   - Cập nhật Expo Go lên version mới nhất
   - Clear cache: `npx expo start -c`
   - Fix dependencies: `npx expo install --fix`

4. **Không nhận được OTP**
   - Kiểm tra Redis đang chạy: `docker-compose logs redis`
   - Xem mã OTP trong console backend (không gửi SMS thật)

5. **Blank page sau login (Web)**
   - Clear browser cache
   - Check console cho errors
   - Verify token trong localStorage

### 🔴 Bảo mật

1. **Đổi credentials trong production**:
   - Database password trong `docker-compose.yml`
   - JWT secret trong `backend/.env`
   - API keys nếu có

2. **CORS**: Backend đã config CORS cho localhost, update cho production

3. **Rate limiting**: Chưa implement, cần thêm cho production

4. **Validation**: Backend có validation cơ bản, có thể cải thiện thêm

## 🐛 Troubleshooting

### Backend không kết nối được database
```bash
# Kiểm tra Docker containers
docker-compose ps

# Nếu containers không chạy, khởi động lại
docker-compose down
docker-compose up -d

# Xem logs để debug
docker-compose logs -f postgres
```

### Port đã được sử dụng
- Backend (3000): Đổi port trong `backend/src/main.ts`
- Web (5174): Vite tự động đổi port nếu conflict
- PostgreSQL (5432): Đổi port trong `docker-compose.yml`
- Expo (19000): Tự động đổi port nếu conflict

### Mobile không kết nối được backend

**Lấy IP local:**
```bash
# Windows PowerShell
ipconfig | Select-String "IPv4"

# macOS/Linux
ifconfig | grep "inet "
```

**Sửa API URL trong `mobile/src/lib/axios.ts`:**

```typescript
// iOS Simulator (chỉ hoạt động trên simulator)
const API_BASE_URL = 'http://localhost:3000/api';

// Android Emulator
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// iPhone/Android thật (thay YOUR_IP bằng IP thật của máy)
const API_BASE_URL = 'http://192.168.11.27:3000/api';
```

**Kiểm tra:**
- ✅ Backend đang chạy tại port 3000
- ✅ Điện thoại và máy tính cùng WiFi
- ✅ Firewall không block port 3000
- ✅ VPN đã tắt

## 📝 License

MIT

## 👥 Contributors

- Your Team

---

**Chúc bạn code vui vẻ! 🎉**
