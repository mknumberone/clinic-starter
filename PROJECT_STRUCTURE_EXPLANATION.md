# 📋 GIẢI THÍCH CHI TIẾT CẤU TRÚC DỰ ÁN CLINIC SYSTEM

## 🎯 TỔNG QUAN DỰ ÁN

Đây là một hệ thống quản lý phòng khám hoàn chỉnh với 3 phần chính:
- **Backend**: API server sử dụng NestJS
- **Web**: Giao diện web sử dụng React + Vite
- **Mobile**: Ứng dụng di động sử dụng React Native + Expo

---

## 📁 CẤU TRÚC THƯ MỤC GỐC

### 📄 `README.md`
- **Mục đích**: File hướng dẫn tổng quan về dự án
- **Nội dung**: Hướng dẫn nhanh cách chạy từng phần (web, mobile, backend)
- **Vai trò**: Điểm bắt đầu cho người mới tham gia dự án

### 📄 `docker-compose.yml`
- **Mục đích**: Cấu hình Docker để chạy các dịch vụ cơ sở dữ liệu
- **Các service được định nghĩa**:
  - **PostgreSQL** (port 5432): Database chính cho dữ liệu quan hệ
  - **MongoDB** (port 27017): Database cho dữ liệu không cấu trúc (EHR)
  - **Redis** (port 6379): Cache và lưu trữ tạm thời (OTP, session)
- **Vai trò**: Giúp khởi động nhanh các database mà không cần cài đặt thủ công

### 📄 `TEST_ADMIN_USER.md`
- **Mục đích**: Hướng dẫn tạo tài khoản admin để test hệ thống
- **Nội dung**: Các cách tạo user admin, doctor, patient để test

---

## 🖥️ THƯ MỤC `backend/` - API SERVER

### 📄 `package.json`
- **Mục đích**: Quản lý dependencies và scripts của backend
- **Dependencies chính**:
  - `@nestjs/*`: Framework NestJS và các module
  - `@prisma/client`: ORM để làm việc với PostgreSQL
  - `@nestjs/jwt`: Xử lý JWT authentication
  - `bcrypt`: Mã hóa mật khẩu
  - `ioredis`: Client Redis
  - `mongoose`: ODM để làm việc với MongoDB
- **Scripts**:
  - `npm run start:dev`: Chạy ở chế độ development (auto-reload)
  - `npm run build`: Build project thành JavaScript
  - `npm start`: Chạy ở chế độ production

### 📄 `tsconfig.json`
- **Mục đích**: Cấu hình TypeScript compiler
- **Vai trò**: Định nghĩa cách TypeScript compile code (target, module, paths, etc.)

### 📄 `nest-cli.json`
- **Mục đích**: Cấu hình NestJS CLI
- **Vai trò**: Định nghĩa cách NestJS build và generate code

### 📁 `src/` - Source code chính

#### 📄 `main.ts`
- **Mục đích**: Entry point của ứng dụng NestJS
- **Chức năng**:
  - Khởi tạo NestJS application
  - Cấu hình global prefix `/api` (tất cả routes sẽ có prefix này)
  - Thiết lập ValidationPipe để validate dữ liệu đầu vào
  - Bật CORS để frontend có thể gọi API
  - Cấu hình Swagger documentation tại `/api/docs`
  - Lắng nghe trên port 3000

#### 📄 `app.module.ts`
- **Mục đích**: Module gốc của ứng dụng, import tất cả các module khác
- **Các module được import**:
  - `ConfigModule`: Quản lý biến môi trường (.env)
  - `PrismaModule`: Kết nối với PostgreSQL
  - `RedisModule`: Kết nối với Redis
  - `AuthModule`: Xử lý authentication
  - `PatientsModule`: Quản lý bệnh nhân
  - `DoctorsModule`: Quản lý bác sĩ
  - `AppointmentsModule`: Quản lý lịch hẹn
  - `PrescriptionsModule`: Quản lý đơn thuốc
  - `DashboardModule`: Thống kê và dashboard

### 📁 `src/auth/` - Module xác thực

#### 📄 `auth.module.ts`
- **Mục đích**: Module định nghĩa các dependencies cho authentication
- **Export**: AuthService, AuthController

#### 📄 `auth.service.ts`
- **Mục đích**: Business logic cho authentication
- **Các chức năng chính**:
  - `sendOtp()`: Gửi mã OTP đến số điện thoại (lưu vào Redis)
  - `verifyOtp()`: Xác thực mã OTP
  - `register()`: Đăng ký tài khoản bệnh nhân mới (yêu cầu OTP)
  - `login()`: Đăng nhập bằng số điện thoại + OTP
  - `generateToken()`: Tạo JWT token
  - `validateUser()`: Validate user từ JWT token

#### 📄 `auth.controller.ts`
- **Mục đích**: Định nghĩa các API endpoints cho authentication
- **Endpoints**: `/auth/send-otp`, `/auth/register`, `/auth/login`, `/auth/me`

#### 📁 `auth/dto/`
- **Mục đích**: Data Transfer Objects - định nghĩa cấu trúc dữ liệu cho request/response
- **File**: `auth.dto.ts` - chứa các class như `SendOtpDto`, `LoginDto`, `RegisterDto`

#### 📁 `auth/guards/`
- **Mục đích**: Guards để bảo vệ routes
- **File**: `jwt-auth.guard.ts` - Kiểm tra JWT token trước khi cho phép truy cập

#### 📁 `auth/strategies/`
- **Mục đích**: Passport strategies cho authentication
- **File**: `jwt.strategy.ts` - Strategy để validate JWT token

### 📁 `src/patients/` - Module quản lý bệnh nhân

#### 📄 `patients.module.ts`
- **Mục đích**: Module cho quản lý bệnh nhân

#### 📄 `patients.service.ts`
- **Mục đích**: Business logic cho quản lý bệnh nhân
- **Chức năng**: CRUD operations cho Patient (Create, Read, Update, Delete)

#### 📄 `patients.controller.ts`
- **Mục đích**: API endpoints cho bệnh nhân
- **Endpoints**: `/patients` (GET, POST), `/patients/:id` (GET, PUT, DELETE)

#### 📁 `patients/dto/`
- **File**: `patient.dto.ts` - Định nghĩa cấu trúc dữ liệu cho Patient

### 📁 `src/doctors/` - Module quản lý bác sĩ

#### Cấu trúc tương tự `patients/`
- `doctors.module.ts`: Module definition
- `doctors.service.ts`: Business logic
- `doctors.controller.ts`: API endpoints
- `doctors/dto/doctor.dto.ts`: DTOs

### 📁 `src/appointments/` - Module quản lý lịch hẹn

#### Cấu trúc tương tự
- Quản lý việc đặt lịch khám
- Xử lý trạng thái appointment (scheduled, confirmed, completed, cancelled)
- Liên kết với Patient, Doctor, Room

### 📁 `src/prescriptions/` - Module quản lý đơn thuốc

#### Cấu trúc tương tự
- Quản lý đơn thuốc
- Liên kết với Appointment, Patient, Doctor
- Quản lý các item trong đơn thuốc (PrescriptionItem)

### 📁 `src/dashboard/` - Module thống kê

#### Cấu trúc tương tự
- Cung cấp dữ liệu thống kê cho dashboard
- Thống kê số lượng bệnh nhân, bác sĩ, appointments, doanh thu, etc.

### 📁 `src/prisma/` - Module Prisma

#### 📄 `prisma.module.ts`
- **Mục đích**: Export PrismaService để các module khác sử dụng

#### 📄 `prisma.service.ts`
- **Mục đích**: Service wrapper cho Prisma Client
- **Chức năng**: 
  - Kết nối với PostgreSQL khi module khởi động
  - Ngắt kết nối khi module dừng
  - Cung cấp Prisma Client để query database

### 📁 `src/redis/` - Module Redis

#### 📄 `redis.module.ts` & `redis.service.ts`
- **Mục đích**: Quản lý kết nối Redis
- **Chức năng**: 
  - Lưu trữ OTP tạm thời
  - Cache dữ liệu
  - Session management

### 📁 `prisma-migrations/` - Database schema

#### 📄 `schema.prisma`
- **Mục đích**: Định nghĩa database schema (cấu trúc bảng)
- **Các model chính**:
  - `User`: Người dùng (admin, doctor, patient)
  - `Patient`: Thông tin bệnh nhân
  - `Doctor`: Thông tin bác sĩ
  - `Specialization`: Chuyên khoa
  - `Room`: Phòng khám
  - `DoctorShift`: Ca làm việc của bác sĩ
  - `Appointment`: Lịch hẹn khám
  - `AppointmentStatusLog`: Lịch sử thay đổi trạng thái appointment
  - `Prescription`: Đơn thuốc
  - `PrescriptionItem`: Chi tiết đơn thuốc
  - `Medication`: Thuốc
  - `Invoice`: Hóa đơn
  - `InvoiceItem`: Chi tiết hóa đơn
  - `Payment`: Thanh toán
  - `File`: File đính kèm

#### 📁 `migrations/`
- **Mục đích**: Lưu trữ các migration files (thay đổi database schema)

### 📁 `dist/` - Compiled output
- **Mục đích**: Chứa code JavaScript đã được compile từ TypeScript
- **Lưu ý**: Không nên chỉnh sửa trực tiếp, được generate tự động khi build

### 📄 `seed-complete.ts` & `seed-users.ts`
- **Mục đích**: Scripts để tạo dữ liệu mẫu (seed data) cho database
- **Chức năng**: Tạo các user, patient, doctor mẫu để test

### 📄 `BACKEND_README.md`
- **Mục đích**: Hướng dẫn chi tiết cách setup và chạy backend

### 📄 `API_DOCS.md` & `COMPLETE_API_REFERENCE.md`
- **Mục đích**: Tài liệu API (có thể được generate tự động từ Swagger)

---

## 🌐 THƯ MỤC `web/` - FRONTEND WEB

### 📄 `package.json`
- **Mục đích**: Quản lý dependencies cho web app
- **Dependencies chính**:
  - `react`, `react-dom`: React framework
  - `react-router-dom`: Routing
  - `antd`: UI component library (Ant Design)
  - `@tanstack/react-query`: Quản lý server state (data fetching, caching)
  - `axios`: HTTP client để gọi API
  - `zustand`: State management (lightweight alternative to Redux)
  - `tailwindcss`: CSS framework
  - `vite`: Build tool (nhanh hơn webpack)

### 📄 `vite.config.ts`
- **Mục đích**: Cấu hình Vite build tool
- **Chức năng**: Định nghĩa plugins, build options, dev server config

### 📄 `tailwind.config.cjs`
- **Mục đích**: Cấu hình Tailwind CSS
- **Chức năng**: Định nghĩa theme, colors, custom utilities

### 📄 `postcss.config.cjs`
- **Mục đích**: Cấu hình PostCSS (cần cho Tailwind)

### 📄 `tsconfig.json` & `tsconfig.node.json`
- **Mục đích**: Cấu hình TypeScript cho web app

### 📁 `src/` - Source code

#### 📄 `main.tsx`
- **Mục đích**: Entry point của React app
- **Chức năng**: Render App component vào DOM

#### 📄 `index.html`
- **Mục đích**: HTML template chính
- **Chức năng**: Container cho React app

#### 📄 `App.tsx`
- **Mục đích**: Component gốc của ứng dụng
- **Chức năng**:
  - Cấu hình routing (React Router)
  - Bảo vệ routes (ProtectedRoute)
  - Phân quyền theo role (ADMIN, DOCTOR, PATIENT)
  - Setup QueryClient và Ant Design ConfigProvider

#### 📁 `src/pages/` - Các trang chính

##### 📁 `pages/admin/` - Trang dành cho Admin
- **Dashboard.tsx**: Trang dashboard tổng quan
- **PatientList.tsx**: Danh sách bệnh nhân
- **PatientDetail.tsx**: Chi tiết bệnh nhân
- **DoctorList.tsx**: Danh sách bác sĩ
- **DoctorDetail.tsx**: Chi tiết bác sĩ
- **SpecializationAndRoom.tsx**: Quản lý chuyên khoa và phòng khám

##### 📁 `pages/doctor/` - Trang dành cho Bác sĩ
- **Dashboard.tsx**: Dashboard của bác sĩ

##### 📁 `pages/patient/` - Trang dành cho Bệnh nhân
- **Dashboard.tsx**: Dashboard của bệnh nhân

##### 📄 `LoginPage.tsx`
- **Mục đích**: Trang đăng nhập
- **Chức năng**: Form đăng nhập với OTP

##### 📄 `RegisterPage.tsx`
- **Mục đích**: Trang đăng ký
- **Chức năng**: Form đăng ký tài khoản mới

##### 📄 `UnauthorizedPage.tsx`
- **Mục đích**: Trang báo lỗi khi không có quyền truy cập

#### 📁 `src/components/` - Reusable components

##### 📁 `components/layouts/`
- **DashboardLayout.tsx**: Layout chung cho các trang dashboard (sidebar, header, footer)

#### 📁 `src/services/` - API services

- **auth.service.ts**: Service gọi API authentication
- **patients.service.ts**: Service gọi API bệnh nhân
- **doctors.service.ts**: Service gọi API bác sĩ
- **appointments.service.ts**: Service gọi API lịch hẹn
- **dashboard.service.ts**: Service gọi API dashboard
- **patient.service.ts**: Service cho patient (có thể trùng với patients.service.ts)
- **doctor.service.ts**: Service cho doctor (có thể trùng với doctors.service.ts)

#### 📁 `src/stores/` - State management

##### 📄 `authStore.ts`
- **Mục đích**: Zustand store quản lý authentication state
- **State**: `user`, `token`, `isAuthenticated`
- **Actions**: `login()`, `logout()`, `updateUser()`
- **Persistence**: Lưu vào localStorage để giữ trạng thái khi refresh

#### 📁 `src/lib/` - Utilities

##### 📄 `axios.ts`
- **Mục đích**: Cấu hình axios instance
- **Chức năng**:
  - Set base URL
  - Request interceptor: Thêm JWT token vào header
  - Response interceptor: Xử lý lỗi 401 (unauthorized) - redirect về login

#### 📄 `index.css`
- **Mục đích**: Global CSS styles
- **Chức năng**: Import Tailwind CSS và custom styles

---

## 📱 THƯ MỤC `mobile/` - MOBILE APP

### 📄 `package.json`
- **Mục đích**: Quản lý dependencies cho mobile app
- **Dependencies chính**:
  - `expo`: Framework React Native
  - `react-native`: React Native core
  - `react-native-paper`: UI component library
  - `@react-navigation/native`: Navigation
  - `axios`: HTTP client
  - `@tanstack/react-query`: State management
  - `zustand`: State management

### 📄 `App.tsx`
- **Mục đích**: Component gốc của mobile app
- **Trạng thái hiện tại**: Chỉ là scaffold cơ bản, chưa có chức năng đầy đủ

### 📄 `README.md`
- **Mục đích**: Hướng dẫn setup và chạy mobile app

---

## 🔄 LUỒNG HOẠT ĐỘNG TỔNG QUAN

### 1. Authentication Flow
1. User nhập số điện thoại → Gọi API `/auth/send-otp`
2. Backend tạo OTP và lưu vào Redis (expire sau 5 phút)
3. User nhập OTP → Gọi API `/auth/login` hoặc `/auth/register`
4. Backend verify OTP, tạo JWT token
5. Frontend lưu token vào localStorage và Zustand store
6. Các request sau đó gửi kèm token trong header `Authorization: Bearer <token>`

### 2. Protected Routes
- Frontend kiểm tra token và role trước khi cho phép truy cập
- Backend sử dụng JWT Guard để validate token
- Nếu không có quyền → redirect về `/unauthorized`

### 3. Data Flow
- Frontend gọi API qua axios instance (đã config sẵn token)
- Backend xử lý request, query database qua Prisma
- Response trả về cho frontend
- React Query cache và quản lý state

---

## 🗄️ DATABASE ARCHITECTURE

### PostgreSQL (Quan hệ)
- Lưu trữ dữ liệu có cấu trúc: User, Patient, Doctor, Appointment, Prescription, Invoice, etc.
- Sử dụng Prisma ORM để query

### MongoDB (NoSQL)
- Dự kiến lưu trữ EHR (Electronic Health Records) - dữ liệu không cấu trúc
- Sử dụng Mongoose ODM

### Redis (In-memory)
- Cache dữ liệu thường xuyên truy cập
- Lưu OTP tạm thời
- Session management

---

## 🎯 TÓM TẮT

**Backend**: API server với NestJS, xử lý business logic, authentication, database operations

**Web**: React app với Ant Design, quản lý UI cho admin, doctor, patient

**Mobile**: React Native app (đang trong giai đoạn phát triển)

**Database**: PostgreSQL (chính), MongoDB (EHR), Redis (cache)

**Authentication**: JWT + OTP qua số điện thoại

**State Management**: Zustand (frontend), React Query (server state)

