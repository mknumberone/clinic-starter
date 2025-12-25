# Upload Avatar Feature - Web Frontend

## Tổng quan
Đã tích hợp chức năng upload ảnh đại diện cho bác sĩ và bệnh nhân trên web app.

## Files đã tạo/cập nhật

### 1. Upload Service (`web/src/services/upload.service.ts`)
Service xử lý tất cả các tác vụ upload file:
- Upload single image với options (resize, quality)
- Upload multiple images
- Upload documents
- Upload with thumbnail
- Delete file
- Get file URL helper

### 2. Avatar Upload Component (`web/src/components/upload/AvatarUpload.tsx`)
Component tái sử dụng cho upload avatar:
- Preview ảnh hiện tại
- Click để upload ảnh mới
- Hover effect để hiển thị icon camera
- Loading state khi đang upload
- Validation file type và size
- Tự động resize và optimize ảnh

**Props:**
```typescript
interface AvatarUploadProps {
  currentAvatar?: string;      // URL ảnh hiện tại
  onUploadSuccess?: (url: string) => void;  // Callback khi upload thành công
  size?: number;                // Kích thước avatar (default: 100)
  disabled?: boolean;           // Disable upload (default: false)
}
```

### 3. Updated Patient Profile (`web/src/pages/patient/PatientProfile.tsx`)
- Thêm AvatarUpload component khi edit mode
- Hiển thị avatar từ server khi view mode
- Lưu avatar URL vào database khi submit

### 4. Updated Doctor Profile (`web/src/pages/doctor/DoctorProfile.tsx`)
- Thêm AvatarUpload component khi edit mode
- Hiển thị avatar từ server khi view mode
- Lưu avatar URL vào database khi submit

### 5. Backend DTOs Updated
**Doctor DTO:**
- `UpdateDoctorDto` thêm field `avatar?: string`

**Patient DTO:**
- `UpdatePatientDto` thêm field `avatar?: string`

### 6. Backend Services Updated
**Doctor Service:**
- `updateDoctor()` bao gồm update avatar vào user table

**Patient Service:**
- `updateProfile()` bao gồm update avatar vào user table

## Luồng hoạt động

### 1. Upload Avatar - Patient
```
1. Patient vào Profile → Click "Chỉnh sửa"
2. Click vào avatar hiện tại để upload ảnh mới
3. Chọn file ảnh (JPEG, PNG, WEBP < 5MB)
4. File được upload lên server:
   - Backend validate file type & size
   - Convert sang WebP format
   - Resize về 400x400px
   - Quality 85%
   - Lưu vào /uploads/images/
5. Server trả về URL: /uploads/images/timestamp-random.webp
6. Frontend hiển thị preview
7. Patient click "Lưu thay đổi"
8. Avatar URL được lưu vào database (user.avatar)
```

### 2. Upload Avatar - Doctor
```
1. Doctor vào Profile → Click "Chỉnh sửa thông tin"
2. Click vào avatar hiện tại để upload ảnh mới
3. Chọn file ảnh (JPEG, PNG, WEBP < 5MB)
4. File được upload lên server (tương tự patient)
5. Doctor click "Lưu thay đổi"
6. Avatar URL được lưu vào database (user.avatar)
```

## File Structure
```
web/src/
├── components/
│   └── upload/
│       └── AvatarUpload.tsx          # Component upload avatar
├── services/
│   └── upload.service.ts             # Service xử lý upload
└── pages/
    ├── patient/
    │   └── PatientProfile.tsx        # Patient profile với avatar
    └── doctor/
        └── DoctorProfile.tsx         # Doctor profile với avatar

backend/
├── src/
│   ├── upload/                       # Upload module
│   │   ├── upload.controller.ts
│   │   ├── upload.service.ts
│   │   └── dto/upload.dto.ts
│   ├── doctors/
│   │   └── dto/doctor.dto.ts         # Updated: thêm avatar
│   └── patients/
│       └── dto/patient.dto.ts        # Updated: thêm avatar
└── uploads/
    ├── images/                       # Ảnh đã upload
    └── documents/                    # Documents đã upload
```

## API Endpoints

### Upload Image
```
POST /api/upload/image
Headers: Authorization: Bearer {token}
Body: multipart/form-data
  - file: File
  - width: 400 (optional)
  - height: 400 (optional)
  - quality: 85 (optional)

Response:
{
  "success": true,
  "data": {
    "filename": "1733123456789-abc123.webp",
    "url": "/uploads/images/1733123456789-abc123.webp",
    "size": 45678
  }
}
```

### Update Patient Profile
```
PUT /api/patients/{patientId}
Headers: Authorization: Bearer {token}
Body:
{
  "full_name": "Nguyễn Văn A",
  "avatar": "/uploads/images/1733123456789-abc123.webp",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  ...
}
```

### Update Doctor Profile
```
PUT /api/doctors/{doctorId}
Headers: Authorization: Bearer {token}
Body:
{
  "avatar": "/uploads/images/1733123456789-abc123.webp",
  "title": "Bác sĩ CKI",
  "biography": "10 năm kinh nghiệm...",
  ...
}
```

## Features

### ✅ Đã implement
- Upload ảnh đại diện cho patient
- Upload ảnh đại diện cho doctor
- Preview ảnh trước khi lưu
- Validation file type (chỉ ảnh)
- Validation file size (< 5MB)
- Auto resize ảnh về 400x400px
- Auto optimize (WebP, quality 85%)
- Hover effect trên avatar
- Loading state khi upload
- Error handling với message
- Lưu avatar URL vào database
- Hiển thị avatar từ server

### 🎨 UI/UX
- Click vào avatar để upload (khi edit mode)
- Hover hiển thị icon camera
- Loading spinner khi đang upload
- Success message khi upload thành công
- Error message khi upload thất bại
- Responsive design

### 🔒 Security
- JWT authentication required
- File type validation (client + server)
- File size validation (client + server)
- Chỉ accept image files
- Auto sanitize filename

### ⚡ Performance
- Auto resize về 400x400px (đủ cho avatar)
- Convert sang WebP (giảm 30-50% dung lượng)
- Quality 85% (balance giữa chất lượng và size)
- Lazy load images

## Testing

### Test Upload Avatar (Manual)
1. **Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Frontend:**
   ```bash
   cd web
   npm run dev
   ```

3. **Test Patient:**
   - Login với tài khoản patient
   - Vào "Hồ sơ của tôi"
   - Click "Chỉnh sửa"
   - Click vào avatar
   - Chọn ảnh (< 5MB)
   - Chờ upload xong
   - Click "Lưu thay đổi"
   - Kiểm tra avatar đã đổi

4. **Test Doctor:**
   - Login với tài khoản doctor
   - Vào "Hồ sơ của tôi"
   - Click "Chỉnh sửa thông tin"
   - Click vào avatar
   - Chọn ảnh (< 5MB)
   - Chờ upload xong
   - Click "Lưu thay đổi"
   - Kiểm tra avatar đã đổi

### Test với REST Client
Xem file: `backend/upload-test.http`

### Test với Swagger
Truy cập: http://localhost:3000/api/docs
- Authorize với JWT token
- Tìm section "Upload"
- Test endpoint `/api/upload/image`

## Troubleshooting

### Lỗi "Failed to upload image"
- Kiểm tra file có phải ảnh không (JPEG/PNG/WEBP)
- Kiểm tra file < 5MB
- Kiểm tra JWT token còn hợp lệ
- Kiểm tra backend có chạy không

### Avatar không hiển thị
- Kiểm tra URL trong database
- Kiểm tra thư mục `backend/uploads/images/` có file không
- Kiểm tra static file serving đã config đúng
- Hard refresh browser (Ctrl + Shift + R)

### CORS error
- Kiểm tra backend CORS config
- Kiểm tra frontend đang call đúng URL

### File quá lớn
- Resize ảnh trước khi upload
- Hoặc tăng limit trong backend (không khuyến khích)

## Next Steps (Optional)

### Có thể mở rộng:
1. **Crop ảnh trước khi upload**
   - Sử dụng thư viện như `react-image-crop`
   - User tự crop ảnh thành hình vuông

2. **Multiple photos**
   - Album ảnh cho medical records
   - Gallery cho doctor's work

3. **Avatar templates**
   - Default avatars để chọn
   - Avatar generator

4. **Image compression client-side**
   - Compress trước khi upload để giảm bandwidth
   - Sử dụng `browser-image-compression`

5. **CDN integration**
   - Upload lên AWS S3 / Cloudinary
   - Faster delivery worldwide

## Kết luận
Chức năng upload avatar đã được tích hợp hoàn chỉnh cho cả Patient và Doctor profile. User có thể dễ dàng cập nhật ảnh đại diện của mình với UI trực quan và UX mượt mà.
