# 📱 Mobile App - Clinic Management System

Ứng dụng mobile dành cho bệnh nhân, xây dựng bằng React Native + Expo.

## 📋 Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt](#cài-đặt)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Tài khoản mẫu](#tài-khoản-mẫu)
- [Cấu trúc dự án](#cấu-trúc-dự-án)

## ✨ Tính năng

### Cho Bệnh nhân
- 🔐 Đăng nhập OTP (xác thực bằng số điện thoại)
- 🏠 Dashboard với thống kê
  - Tổng số lượt khám
  - Số lịch khám sắp tới
  - Danh sách 3 lịch khám gần nhất
- 📅 Quản lý lịch khám
  - Xem danh sách tất cả lịch khám
  - Chi tiết lịch khám (bác sĩ, giờ, phòng, trạng thái)
  - Pull-to-refresh
- 👤 Hồ sơ cá nhân
  - Xem thông tin cá nhân
  - Đăng xuất

## 🛠 Công nghệ

- **Expo SDK 48** - React Native framework
- **React Native 0.71.8** - Mobile framework
- **TypeScript 5** - Type safety
- **React Native Paper** - Material Design UI
- **React Navigation 6** - Navigation (Stack & Bottom Tabs)
- **TanStack Query v4** - Server state management
- **Zustand 4** - Client state management
- **Axios** - HTTP client
- **Expo SecureStore** - Secure token storage
- **dayjs** - Date manipulation

## 💻 Yêu cầu

### Bắt buộc
- Node.js v20+
- npm v10+
- Backend API chạy tại `http://localhost:3000/api`

### Cho iOS (Optional)
- macOS
- Xcode 14+
- iOS Simulator

### Cho Android (Optional)
- Android Studio
- Android SDK
- Android Emulator

### Cho Test trên điện thoại thật
- **Expo Go App** (iOS & Android)
  - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình API endpoint

Mặc định app connect tới `http://localhost:3000/api` (chỉ hoạt động trên iOS Simulator).

**Để test trên Android Emulator hoặc điện thoại thật**, cần sửa URL trong `src/lib/axios.ts`:

#### Android Emulator:
```typescript
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

#### Điện thoại thật (cùng WiFi):
```typescript
// Thay <YOUR_LOCAL_IP> bằng IP của máy chạy backend
const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

**Cách lấy IP local:**
- Windows: `ipconfig` → tìm IPv4 Address
- macOS/Linux: `ifconfig` → tìm inet

## 🎮 Chạy ứng dụng

### Start Expo Dev Server

```bash
npm start
```

Sau khi start, bạn sẽ thấy QR code và menu:

```
› Press i │ open iOS simulator
› Press a │ open Android emulator  
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
```

### Chạy trên iOS Simulator (macOS only)

```bash
npm run ios

# Hoặc sau khi start
# Nhấn phím 'i'
```

### Chạy trên Android Emulator

```bash
npm run android

# Hoặc sau khi start
# Nhấn phím 'a'
```

**Lưu ý**: Phải mở Android Emulator trước khi chạy lệnh.

### Chạy trên điện thoại thật

1. Cài đặt **Expo Go** từ App Store/Play Store
2. Chạy `npm start`
3. Quét QR code:
   - **iOS**: Dùng Camera app → Quét QR → Mở Expo Go
   - **Android**: Mở Expo Go → Scan QR code

**Quan trọng**: Điện thoại và máy tính phải cùng mạng WiFi!

## 🔐 Tài khoản mẫu

Đảm bảo đã seed data trong backend trước khi test.

### Bệnh nhân
- **Số điện thoại**: `0901234567` (Nguyễn Văn X)
- **Số điện thoại**: `0901234568` (Trần Thị Y)
- **Số điện thoại**: `0901234569` (Lê Thị Z)
- **Mã OTP**: `123456`

**Lấy mã OTP**: Kiểm tra console backend sau khi nhấn "Gửi mã OTP"

```
[AuthService] OTP for 0901234567: 123456
```

## 📁 Cấu trúc dự án

```
mobile/
├── src/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.tsx       # OTP login
│   │   ├── HomeScreen.tsx        # Dashboard
│   │   ├── AppointmentsScreen.tsx # Appointments list
│   │   └── ProfileScreen.tsx     # Profile
│   ├── services/          # API services
│   │   ├── auth.service.ts
│   │   └── appointment.service.ts
│   ├── stores/            # Zustand stores
│   │   └── authStore.ts
│   └── lib/               # Utilities
│       └── axios.ts       # Axios instance with interceptors
├── App.tsx                # Root component with navigation
├── app.json               # Expo configuration
├── package.json
└── tsconfig.json
```

## 🎨 UI Components

App sử dụng **React Native Paper** (Material Design):

- **TextInput** - Input fields
- **Button** - Buttons với loading state
- **Card** - Cards
- **Text** - Typography
- **Avatar** - Avatar icons
- **Chip** - Status badges
- **Divider** - Separators
- **Surface** - Elevated surfaces

## 🧭 Navigation

### Stack Navigator (Auth Flow)
- `Login` - Login screen
- `Main` - Main tabs (sau khi login)

### Bottom Tab Navigator (Main)
- `Home` - Dashboard (Icon: home)
- `Appointments` - Lịch khám (Icon: calendar-clock)
- `Profile` - Cá nhân (Icon: account)

## 🔄 State Management

### Auth Store (Zustand + SecureStore)
```typescript
const { user, login, logout, isAuthenticated } = useAuthStore();
```

Token được lưu an toàn trong **Expo SecureStore** (encrypted storage).

### Server State (TanStack Query)
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ['myAppointments'],
  queryFn: appointmentService.getMyAppointments,
});
```

## 🐛 Troubleshooting

### "There was a problem running the requested app" trên iPhone

Lỗi này xảy ra khi quét QR code với Expo Go. Nguyên nhân và cách fix:

#### 1. Expo Go app cũ
- Cập nhật Expo Go lên version mới nhất từ App Store
- Version yêu cầu: **2.28.0 trở lên** (cho SDK 48)

#### 2. Dependencies không tương thích
```bash
# Fix tất cả dependencies
cd mobile
npx expo install --fix
```

#### 3. Clear cache và restart
```bash
# Clear cache
npx expo start -c

# Hoặc xóa cache thủ công
rm -rf node_modules .expo
npm install
npm start
```

#### 4. Kiểm tra network
- iPhone và máy tính **PHẢI cùng WiFi**
- Tắt VPN nếu đang bật
- Check firewall không block port 19000 (Metro bundler)

#### 5. ⭐ Fix API URL (Quan trọng nhất!)
```typescript
// File: src/lib/axios.ts
// PHẢI dùng IP local, KHÔNG dùng localhost!
const API_BASE_URL = 'http://192.168.11.27:3000/api';
```

**Reload app sau khi sửa:**
- Trong Metro bundler terminal, nhấn **`r`**
- Hoặc lắc iPhone → chọn "Reload"

### "Request timeout" hoặc "Cannot connect"

#### Nguyên nhân:
- Backend chưa chạy
- API URL sai (dùng localhost thay vì IP)
- Firewall block port 3000
- Không cùng WiFi

#### Cách fix:

**1. Kiểm tra backend đang chạy:**
```bash
# Terminal 1: Chạy backend
cd backend
npm run start:dev

# Phải thấy: "Backend listening on http://localhost:3000/api"
```

**2. Verify IP của máy:**
```powershell
# Windows
ipconfig | Select-String "IPv4"

# Kết quả ví dụ:
# IPv4 Address. . . . . . . . . . . : 192.168.11.27
```

**3. Update API URL trong mobile:**
```typescript
// src/lib/axios.ts
const API_BASE_URL = 'http://192.168.11.27:3000/api'; // ← Dùng IP này!
```

**4. Test backend accessible:**
- Mở Safari trên iPhone
- Truy cập: `http://192.168.11.27:3000/api-docs`
- Nếu thấy Swagger UI = backend accessible ✅

**5. Allow firewall (nếu cần):**
```powershell
# Windows PowerShell (Run as Administrator)
netsh advfirewall firewall add rule name="Node Backend Port 3000" dir=in action=allow protocol=TCP localport=3000
```

### Không kết nối được backend

#### Trên iOS Simulator:
- Dùng `http://localhost:3000/api` ✅

#### Trên Android Emulator:
- Dùng `http://10.0.2.2:3000/api` (Android internal IP cho localhost)
- Hoặc dùng IP local: `http://192.168.x.x:3000/api`

#### Trên điện thoại thật (iPhone/Android):
- **PHẢI** dùng IP local: `http://192.168.x.x:3000/api`
- Kiểm tra cùng WiFi
- Kiểm tra firewall không block port 3000

**Lấy IP local của máy:**
```bash
# Windows
ipconfig
# Tìm "IPv4 Address" (ví dụ: 192.168.11.27)

# macOS/Linux  
ifconfig
# Tìm "inet" (ví dụ: 192.168.1.100)
```

**Sửa API URL trong `src/lib/axios.ts`:**
```typescript
const API_BASE_URL = 'http://192.168.11.27:3000/api';
```

### Cannot connect to Metro bundler

```bash
# Xóa cache và restart
npx expo start -c

# Hoặc
rm -rf node_modules
npm install
npm start
```

### App crashes sau khi build

```bash
# Clear cache
npx expo start -c

# Reset Metro bundler
watchman watch-del-all
```

### "Cannot find module" errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### OTP không hoạt động
1. Kiểm tra backend đang chạy
2. Kiểm tra Redis đang chạy (cho OTP storage)
3. Check console backend để lấy mã OTP
4. Đảm bảo số điện thoại đúng với data seed

## 📝 Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS

# Shortcuts (trong Expo)
i                      # Open iOS simulator
a                      # Open Android emulator
r                      # Reload app
j                      # Open debugger
```

## 🎨 Customization

### Thay đổi theme colors

Edit trong `App.tsx`:

```typescript
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};
```

### Thay đổi app name & icon

Edit `app.json`:

```json
{
  "expo": {
    "name": "Clinic App",
    "slug": "clinic-app",
    "icon": "./assets/icon.png"
  }
}
```

## 🚀 Build Production

### iOS (macOS only)

```bash
# Development build
eas build --platform ios --profile development

# Production build
eas build --platform ios --profile production
```

### Android

```bash
# Development build
eas build --platform android --profile development

# Production APK
eas build --platform android --profile production
```

**Lưu ý**: Cần setup **EAS (Expo Application Services)** account.

## 📖 Thêm tài liệu

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query](https://tanstack.com/query/latest)

## 🔜 Tính năng sắp tới

- [ ] Đặt lịch hẹn mới
- [ ] Xem đơn thuốc
- [ ] Xem hóa đơn
- [ ] Thông báo push
- [ ] Chat với bác sĩ
- [ ] Video call

---

**Happy Coding! 🎉**
