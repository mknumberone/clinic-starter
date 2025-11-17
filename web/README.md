# 🖥️ Web Admin Dashboard - Clinic Management System

Dashboard quản lý phòng khám dành cho Admin và Bác sĩ, xây dựng bằng React + Vite + TypeScript.

## 📋 Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt](#cài-đặt)
- [Tài khoản mẫu](#tài-khoản-mẫu)
- [Cấu trúc dự án](#cấu-trúc-dự-án)

## ✨ Tính năng

### Cho Admin
- 📊 Dashboard với thống kê tổng quan
- 👥 Quản lý bệnh nhân (CRUD, tìm kiếm, filter)
- 👨‍⚕️ Quản lý bác sĩ (CRUD với chuyên khoa)
- 🏥 Quản lý chuyên khoa & phòng khám
- 📅 Quản lý lịch hẹn (List, Calendar, Booking)
- 💊 Quản lý đơn thuốc
- 💰 Quản lý hóa đơn
- 👤 Quản lý hồ sơ cá nhân

### Cho Bác sĩ
- 📊 Dashboard cá nhân
- 👥 Danh sách bệnh nhân của mình
- 📅 Lịch hẹn của mình
- 💊 Đơn thuốc đã kê
- 🕐 Quản lý lịch làm việc
- 👤 Hồ sơ cá nhân

### Cho Bệnh nhân
- 👤 Xem và chỉnh sửa hồ sơ cá nhân

## 🛠 Công nghệ

- **React 18** - UI Library
- **Vite 5** - Build tool
- **TypeScript 5** - Type safety
- **Ant Design 5** - UI Component library
- **TanStack Query v4** - Server state management
- **Zustand 4** - Client state management
- **React Router v6** - Routing
- **Tailwind CSS v4** - Styling
- **Axios** - HTTP client
- **FullCalendar** - Calendar views
- **Recharts** - Charts & graphs
- **dayjs** - Date manipulation

## 💻 Yêu cầu

- Node.js v20+
- npm v10+
- Backend API chạy tại `http://localhost:3000/api`

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường (Optional)

Mặc định app sẽ connect tới `http://localhost:3000/api`. 

Nếu muốn thay đổi, tạo file `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Chạy development server

```bash
npm run dev
```

App sẽ chạy tại: **http://localhost:5174** (hoặc port khác nếu 5174 đã được sử dụng)

### 4. Build production

```bash
npm run build
```

Output trong thư mục `dist/`

### 5. Preview production build

```bash
npm run preview
```

## 🔐 Tài khoản mẫu

Đảm bảo đã seed data trong backend trước khi đăng nhập.

### Admin
- **Số điện thoại**: `0912345678`
- **Mã OTP**: `123456`

### Bác sĩ
- **Số điện thoại**: `0987654321` (Bs. Nguyễn Văn A - Tim mạch)
- **Số điện thoại**: `0987654322` (Bs. Trần Thị B - Nội khoa)
- **Mã OTP**: `123456`

### Bệnh nhân
- **Số điện thoại**: `0901234567` (Nguyễn Văn X)
- **Số điện thoại**: `0901234568` (Trần Thị Y)
- **Mã OTP**: `123456`

**Lưu ý**: Mã OTP được in ra console backend khi bạn click "Gửi mã OTP"

## 📁 Cấu trúc dự án

```
web/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── layouts/    # Layout components
│   │   └── ui/         # UI components
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin pages
│   │   ├── doctor/     # Doctor pages
│   │   └── patient/    # Patient pages
│   ├── services/       # API services
│   │   ├── api.ts      # Axios instance
│   │   ├── auth.ts     # Auth API
│   │   ├── patients.ts # Patients API
│   │   ├── doctors.ts  # Doctors API
│   │   └── ...
│   ├── stores/         # Zustand stores
│   │   └── authStore.ts
│   ├── lib/            # Utilities
│   ├── App.tsx         # Root component with routes
│   └── main.tsx        # Entry point
├── package.json
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server with HMR

# Build
npm run build            # Build for production
npm run preview          # Preview production build

# Lint
npm run lint             # Run ESLint
```

## 🎨 UI Components

App sử dụng **Ant Design 5** với các component chính:

- **Table** - Danh sách với pagination, search, filter
- **Form** - Forms với validation
- **Modal** - Dialogs
- **Drawer** - Side panels
- **Card** - Cards
- **DatePicker** - Date selection
- **Select** - Dropdowns
- **Button** - Buttons
- **Tag/Badge** - Status indicators

## 🔄 State Management

### Server State (TanStack Query)
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['patients'],
  queryFn: patientService.getAll,
});
```

### Client State (Zustand)
```typescript
const { user, login, logout } = useAuthStore();
```

## 🛣️ Routing

Routes được define trong `src/App.tsx`:

```
/login              - Login page
/admin/dashboard    - Admin dashboard
/admin/patients     - Patient management
/admin/doctors      - Doctor management
/admin/appointments - Appointment management
/doctor/dashboard   - Doctor dashboard
/doctor/appointments - Doctor's appointments
/patient/profile    - Patient profile
```

## 🔒 Protected Routes

Routes được bảo vệ bởi `ProtectedRoute` component với role-based access:

```tsx
<Route
  path="/admin/*"
  element={<ProtectedRoute allowedRoles={['ADMIN']} />}
/>
```

## 🐛 Troubleshooting

### Port 5174 đã được sử dụng
Vite sẽ tự động chọn port khác (5175, 5176, ...)

### Cannot connect to API
Kiểm tra:
1. Backend đang chạy tại `http://localhost:3000/api`
2. CORS được enable trong backend
3. Check console để xem error message

### Login không thành công
1. Kiểm tra console backend để lấy mã OTP
2. Đảm bảo Redis đang chạy (cho OTP storage)
3. Kiểm tra network tab trong DevTools

### Blank page sau khi login
1. Check console cho errors
2. Đảm bảo token được lưu trong localStorage
3. Clear browser cache và thử lại

## 📱 Responsive Design

App responsive cho các kích thước:
- Desktop: ≥1024px
- Tablet: 768px - 1023px
- Mobile: <768px

## 🚀 Performance

- **Code splitting** với React.lazy
- **Memoization** với React.memo, useMemo, useCallback
- **Virtual scrolling** cho danh sách dài
- **Image optimization** với lazy loading
- **Bundle optimization** với Vite

## 📖 Thêm tài liệu

- [Ant Design Documentation](https://ant.design/components/overview/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)

---

**Happy Coding! 🎉**
