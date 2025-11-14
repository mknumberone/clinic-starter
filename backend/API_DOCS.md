# Clinic Backend API Documentation

Base URL: `http://localhost:3000/api`

## 🔐 Authentication APIs

### 1. Send OTP
Gửi mã OTP đến số điện thoại

**Endpoint:** `POST /auth/send-otp`

**Body:**
```json
{
  "phone": "0912345678"
}
```

**Response:**
```json
{
  "message": "Mã OTP đã được gửi đến số điện thoại của bạn",
  "expiresIn": 300,
  "otp": "123456"  // Only in development mode
}
```

---

### 2. Register (Đăng ký)
Đăng ký tài khoản mới bằng SĐT + OTP

**Endpoint:** `POST /auth/register`

**Body:**
```json
{
  "phone": "0912345678",
  "full_name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": "uuid",
    "phone": "0912345678",
    "email": "nguyenvana@gmail.com",
    "full_name": "Nguyễn Văn A",
    "role": "patient",
    "patient_id": "uuid"
  },
  "token": "jwt_token_here"
}
```

---

### 3. Login (Đăng nhập)
Đăng nhập bằng SĐT + OTP

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "phone": "0912345678",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": "uuid",
    "phone": "0912345678",
    "email": "nguyenvana@gmail.com",
    "full_name": "Nguyễn Văn A",
    "role": "patient",
    "patient_id": "uuid",
    "doctor_id": null
  },
  "token": "jwt_token_here"
}
```

---

### 4. Get Profile (Lấy thông tin user)
Lấy thông tin người dùng hiện tại

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "phone": "0912345678",
  "email": "nguyenvana@gmail.com",
  "full_name": "Nguyễn Văn A",
  "role": "patient",
  "patient_id": "uuid"
}
```

---

## 👤 Patient APIs

**All endpoints require Authorization header with JWT token**

### 1. Get Patient Profile
**Endpoint:** `GET /patients/:id`

### 2. Update Patient Profile
**Endpoint:** `PUT /patients/:id`

**Body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "emergency_contact": {
    "name": "Nguyễn Thị B",
    "phone": "0987654321",
    "relationship": "Vợ"
  },
  "insurance": {
    "provider": "BHYT",
    "number": "DN1234567890"
  }
}
```

### 3. Get Patient Appointments
**Endpoint:** `GET /patients/:id/appointments`

### 4. Get Patient Prescriptions
**Endpoint:** `GET /patients/:id/prescriptions`

### 5. Get Patient Invoices
**Endpoint:** `GET /patients/:id/invoices`

---

## 📊 Dashboard APIs

**All endpoints require Authorization header with JWT token**

### Admin Dashboard

#### 1. Get Admin Stats
**Endpoint:** `GET /dashboard/admin/stats`

**Response:**
```json
{
  "totalPatients": 100,
  "totalDoctors": 20,
  "todayAppointments": 15,
  "totalAppointments": 500,
  "pendingInvoices": 10,
  "totalRevenue": 50000000
}
```

#### 2. Get Appointments by Date Range
**Endpoint:** `GET /dashboard/admin/appointments?startDate=2025-01-01&endDate=2025-12-31`

#### 3. Get Revenue by Date Range
**Endpoint:** `GET /dashboard/admin/revenue?startDate=2025-01-01&endDate=2025-12-31`

#### 4. Get Upcoming Appointments
**Endpoint:** `GET /dashboard/admin/upcoming-appointments?limit=10`

---

### Patient Dashboard

#### Get Patient Dashboard
**Endpoint:** `GET /dashboard/patient`

**Response:**
```json
{
  "upcomingAppointments": [...],
  "recentPrescriptions": [...],
  "unpaidInvoices": [...],
  "totalUnpaid": 1000000
}
```

---

### Doctor Dashboard

#### Get Doctor Dashboard
**Endpoint:** `GET /dashboard/doctor`

**Response:**
```json
{
  "todayAppointments": [...],
  "todayShifts": [...],
  "weeklyStats": [
    { "status": "completed", "count": 20 },
    { "status": "cancelled", "count": 2 }
  ]
}
```

---

## 🔒 Authentication Flow

### Đăng ký (Register):
1. Client gọi `POST /auth/send-otp` với số điện thoại
2. Server gửi OTP (trong dev mode: luôn là `123456`)
3. Client nhập OTP + thông tin cá nhân
4. Client gọi `POST /auth/register`
5. Server trả về JWT token
6. Client lưu token vào localStorage/AsyncStorage

### Đăng nhập (Login):
1. Client gọi `POST /auth/send-otp` với số điện thoại
2. Server gửi OTP
3. Client nhập OTP
4. Client gọi `POST /auth/login`
5. Server trả về JWT token

### Sử dụng API được bảo vệ:
```javascript
fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 📱 Dashboard Suggestions

### Admin/Staff Dashboard:
- **Tổng quan:**
  - Tổng số bệnh nhân, bác sĩ
  - Số cuộc hẹn hôm nay
  - Doanh thu tổng
  - Hóa đơn chưa thanh toán
  
- **Biểu đồ:**
  - Cuộc hẹn theo ngày/tuần/tháng
  - Doanh thu theo thời gian
  - Trạng thái cuộc hẹn (scheduled, completed, cancelled)
  
- **Danh sách:**
  - Cuộc hẹn sắp tới
  - Bệnh nhân mới
  - Thông báo quan trọng

### Patient Dashboard:
- Lịch hẹn sắp tới
- Lịch sử khám bệnh
- Đơn thuốc của tôi
- Hóa đơn chưa thanh toán
- Tổng tiền cần thanh toán

### Doctor Dashboard:
- Ca trực hôm nay/tuần này
- Danh sách bệnh nhân hôm nay
- Thống kê số lượng khám tuần này
- Lịch sử khám bệnh

---

## 🧪 Testing với Postman/Thunder Client

### 1. Test đăng ký:
```bash
# Send OTP
POST http://localhost:3000/api/auth/send-otp
Content-Type: application/json

{
  "phone": "0912345678"
}

# Register
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "phone": "0912345678",
  "full_name": "Nguyễn Văn A",
  "email": "test@example.com",
  "otp": "123456"
}
```

### 2. Test đăng nhập:
```bash
# Send OTP
POST http://localhost:3000/api/auth/send-otp
Content-Type: application/json

{
  "phone": "0912345678"
}

# Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "0912345678",
  "otp": "123456"
}
```

### 3. Test protected routes:
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer {your_token_here}
```

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://clinic:clinic@localhost:5432/clinic
MONGO_URI=mongodb://localhost:27017/clinic
REDIS_URL=redis://localhost:6379

JWT_SECRET=clinic-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

OTP_EXPIRES_IN=300
DEFAULT_OTP=123456
```

---

## 📝 Notes

- OTP mặc định trong development: `123456`
- OTP hết hạn sau 5 phút (300 giây)
- JWT token hết hạn sau 7 ngày
- Số điện thoại phải đúng định dạng Việt Nam: `0[3|5|7|8|9]xxxxxxxx`
