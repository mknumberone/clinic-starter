# 🏥 Clinic Management System - Backend

Backend API cho hệ thống quản lý phòng khám được xây dựng với NestJS, PostgreSQL, MongoDB, và Redis.

## ✨ Tính năng đã hoàn thành

### 🔐 Authentication
- ✅ Đăng ký bằng số điện thoại + OTP
- ✅ Đăng nhập bằng số điện thoại + OTP
- ✅ JWT authentication
- ✅ Redis để lưu OTP với thời gian hết hạn

### 👤 Patient Management
- ✅ Xem và cập nhật hồ sơ bệnh nhân
- ✅ Xem lịch sử cuộc hẹn
- ✅ Xem đơn thuốc
- ✅ Xem hóa đơn

### 📊 Dashboard
- ✅ Dashboard cho Admin (thống kê tổng quan, doanh thu, cuộc hẹn)
- ✅ Dashboard cho Bệnh nhân (lịch hẹn, đơn thuốc, hóa đơn)
- ✅ Dashboard cho Bác sĩ (ca trực, bệnh nhân hôm nay, thống kê)

## 🏗️ Kiến trúc

```
backend/
├── src/
│   ├── auth/              # Authentication module (OTP + JWT)
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── patients/          # Patient management
│   │   ├── dto/
│   │   ├── patients.controller.ts
│   │   ├── patients.service.ts
│   │   └── patients.module.ts
│   ├── dashboard/         # Dashboard & statistics
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.service.ts
│   │   └── dashboard.module.ts
│   ├── prisma/            # Database service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── redis/             # Redis service
│   │   ├── redis.service.ts
│   │   └── redis.module.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma-migrations/
│   ├── schema.prisma      # Database schema
│   └── migrations/
├── .env
├── API_DOCS.md           # API documentation
└── api-test.http         # REST Client test file
```

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi động database
```bash
# Từ thư mục root
cd ..
docker-compose up -d
```

### 3. Generate Prisma Client & Push schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Chạy backend
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm start
```

Server sẽ chạy tại: `http://localhost:3000/api`

## 📚 API Documentation

Xem chi tiết tại [API_DOCS.md](./API_DOCS.md)

### Endpoints chính:

**Authentication:**
- `POST /api/auth/send-otp` - Gửi OTP
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

**Patient:**
- `GET /api/patients/:id` - Xem hồ sơ
- `PUT /api/patients/:id` - Cập nhật hồ sơ
- `GET /api/patients/:id/appointments` - Lịch hẹn
- `GET /api/patients/:id/prescriptions` - Đơn thuốc
- `GET /api/patients/:id/invoices` - Hóa đơn

**Dashboard:**
- `GET /api/dashboard/admin/stats` - Thống kê admin
- `GET /api/dashboard/patient` - Dashboard bệnh nhân
- `GET /api/dashboard/doctor` - Dashboard bác sĩ

## 🧪 Testing

### Sử dụng REST Client (VS Code)
1. Cài đặt extension "REST Client"
2. Mở file `api-test.http`
3. Click "Send Request" trên mỗi endpoint

### Sử dụng Postman
Import collection từ API_DOCS.md

### Test flow đăng ký:
```bash
1. POST /api/auth/send-otp
   Body: { "phone": "0912345678" }
   
2. POST /api/auth/register
   Body: {
     "phone": "0912345678",
     "full_name": "Nguyễn Văn A",
     "email": "test@example.com",
     "otp": "123456"
   }
   
3. Lưu token từ response
4. Sử dụng token cho các API khác
```

## 🗄️ Database Schema

Database được quản lý bằng Prisma với các bảng chính:
- **User** - Người dùng hệ thống
- **Patient** - Bệnh nhân
- **Doctor** - Bác sĩ
- **Specialization** - Chuyên khoa
- **Room** - Phòng khám
- **DoctorShift** - Ca trực bác sĩ
- **Appointment** - Cuộc hẹn
- **Prescription** - Đơn thuốc
- **Medication** - Thuốc
- **Invoice** - Hóa đơn
- **Payment** - Thanh toán

### Xem database với Prisma Studio:
```bash
npx prisma studio
```

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL=postgresql://clinic:clinic@localhost:5432/clinic
MONGO_URI=mongodb://localhost:27017/clinic
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=clinic-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# OTP (Development)
OTP_EXPIRES_IN=300
DEFAULT_OTP=123456
```

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- ✅ Setup database & Prisma
- ✅ Auth module với OTP
- ✅ Patient module
- ✅ Dashboard APIs

### Phase 2 (Next)
- ⏳ Doctor management module
- ⏳ Appointment booking module
- ⏳ Prescription management
- ⏳ Invoice & Payment module
- ⏳ Real-time notifications (WebSocket)
- ⏳ File upload (Avatar, medical documents)

### Phase 3 (Future)
- ⏳ EHR (Electronic Health Record) with MongoDB
- ⏳ SMS integration for real OTP
- ⏳ Email notifications
- ⏳ Role-based access control (RBAC)
- ⏳ Audit logs
- ⏳ Report generation

## 📱 Integration với Frontend

### React Web (Axios example):
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login example
const login = async (phone: string, otp: string) => {
  const response = await api.post('/auth/login', { phone, otp });
  localStorage.setItem('token', response.data.token);
  return response.data;
};
```

### React Native (Fetch example):
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api';

const login = async (phone: string, otp: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, otp }),
  });
  
  const data = await response.json();
  await AsyncStorage.setItem('token', data.token);
  return data;
};
```

## 🛠️ Technologies

- **Framework:** NestJS 10
- **Language:** TypeScript 5
- **Database:** PostgreSQL 15 (Prisma ORM)
- **NoSQL:** MongoDB 6
- **Cache:** Redis 7
- **Authentication:** JWT + Passport
- **Validation:** class-validator
- **API Style:** RESTful

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Database containers đang chạy: `docker ps`
2. Environment variables đúng
3. Prisma client đã generate: `npx prisma generate`
4. Schema đã push: `npx prisma db push`

## 📄 License

MIT
