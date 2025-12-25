# Upload API Documentation

## Tổng quan
API Upload cho phép upload file và ảnh với các tính năng:
- Upload ảnh đơn với tự động tối ưu hóa
- Upload nhiều ảnh cùng lúc
- Upload tài liệu (PDF, Word, Excel)
- Tạo thumbnail tự động
- Resize ảnh theo kích thước mong muốn
- Xóa file
- Kiểm tra thông tin file

## Base URL
```
http://localhost:3000/api/upload
```

## Authentication
Tất cả các endpoint đều yêu cầu JWT token trong header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Upload Single Image
Upload một ảnh với tối ưu hóa tự động.

**Endpoint:** `POST /api/upload/image`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required): File ảnh (JPEG, JPG, PNG, WEBP)
- `width` (optional): Chiều rộng resize
- `height` (optional): Chiều cao resize  
- `quality` (optional): Chất lượng ảnh (1-100, default: 80)

**Giới hạn:**
- Kích thước tối đa: 5MB
- Định dạng: JPEG, JPG, PNG, WEBP
- Output: Tự động convert sang WEBP

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "1733123456789-abc123def456.webp",
    "path": "D:\\clinic-starter\\backend\\uploads\\images\\1733123456789-abc123def456.webp",
    "url": "/uploads/images/1733123456789-abc123def456.webp",
    "size": 123456
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "width=800" \
  -F "quality=85"
```

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('width', '800');
formData.append('quality', '85');

const response = await fetch('http://localhost:3000/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.data.url); // /uploads/images/1733123456789-abc123def456.webp
```

---

### 2. Upload Document
Upload tài liệu (PDF, Word, Excel).

**Endpoint:** `POST /api/upload/document`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required): File tài liệu

**Giới hạn:**
- Kích thước tối đa: 10MB
- Định dạng: PDF, DOC, DOCX, XLS, XLSX

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "1733123456789-abc123def456.pdf",
    "path": "D:\\clinic-starter\\backend\\uploads\\documents\\1733123456789-abc123def456.pdf",
    "url": "/uploads/documents/1733123456789-abc123def456.pdf",
    "size": 234567
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/upload/document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

---

### 3. Upload Multiple Images
Upload nhiều ảnh cùng lúc (tối đa 10 ảnh).

**Endpoint:** `POST /api/upload/images/multiple`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `files` (required): Nhiều file ảnh
- `width` (optional): Chiều rộng resize cho tất cả ảnh
- `height` (optional): Chiều cao resize cho tất cả ảnh
- `quality` (optional): Chất lượng cho tất cả ảnh (1-100, default: 80)

**Giới hạn:**
- Số lượng tối đa: 10 ảnh/request
- Kích thước mỗi ảnh: 5MB
- Định dạng: JPEG, JPG, PNG, WEBP

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "filename": "1733123456789-abc123.webp",
      "path": "D:\\clinic-starter\\backend\\uploads\\images\\1733123456789-abc123.webp",
      "url": "/uploads/images/1733123456789-abc123.webp",
      "size": 123456
    },
    {
      "filename": "1733123456790-def456.webp",
      "path": "D:\\clinic-starter\\backend\\uploads\\images\\1733123456790-def456.webp",
      "url": "/uploads/images/1733123456790-def456.webp",
      "size": 134567
    }
  ],
  "count": 2
}
```

**JavaScript Example:**
```javascript
const formData = new FormData();
for (let file of fileInput.files) {
  formData.append('files', file);
}
formData.append('width', '800');
formData.append('quality', '85');

const response = await fetch('http://localhost:3000/api/upload/images/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(`Uploaded ${result.count} images`);
```

---

### 4. Upload with Thumbnail
Upload ảnh và tự động tạo thumbnail.

**Endpoint:** `POST /api/upload/thumbnail`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required): File ảnh
- `thumbnailWidth` (optional): Chiều rộng thumbnail (default: 200)
- `thumbnailHeight` (optional): Chiều cao thumbnail (default: 200)

**Response:**
```json
{
  "success": true,
  "data": {
    "original": {
      "filename": "1733123456789-abc123.webp",
      "path": "D:\\clinic-starter\\backend\\uploads\\images\\1733123456789-abc123.webp",
      "url": "/uploads/images/1733123456789-abc123.webp",
      "size": 123456
    },
    "thumbnail": {
      "filename": "thumb-1733123456789-def456.webp",
      "path": "D:\\clinic-starter\\backend\\uploads\\images\\thumb-1733123456789-def456.webp",
      "url": "/uploads/images/thumb-1733123456789-def456.webp",
      "size": 12345
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/upload/thumbnail \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "thumbnailWidth=300" \
  -F "thumbnailHeight=300"
```

---

### 5. Delete File
Xóa file đã upload.

**Endpoint:** `DELETE /api/upload/file`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "filepath": "/uploads/images/1733123456789-abc123.webp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/upload/file \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filepath": "/uploads/images/1733123456789-abc123.webp"}'
```

---

### 6. Get File Info
Kiểm tra thông tin file.

**Endpoint:** `POST /api/upload/file/info`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "filepath": "/uploads/images/1733123456789-abc123.webp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "size": 123456,
    "extension": ".webp"
  }
}
```

---

## Cách sử dụng trong Frontend

### React Example
```jsx
import { useState } from 'react';
import axios from 'axios';

function ImageUpload() {
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('width', '800');
    formData.append('quality', '85');

    try {
      const response = await axios.post(
        'http://localhost:3000/api/upload/image',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadedUrl(response.data.data.url);
      alert('Upload thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Đang upload...' : 'Upload'}
      </button>
      
      {uploadedUrl && (
        <img 
          src={`http://localhost:3000${uploadedUrl}`} 
          alt="Uploaded" 
          style={{ maxWidth: '300px' }}
        />
      )}
    </div>
  );
}
```

### React Native Example
```jsx
import { useState } from 'react';
import { View, Button, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

function ImageUploadScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return;

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });
    formData.append('width', '800');
    formData.append('quality', '85');

    try {
      const response = await axios.post(
        'http://192.168.11.27:3000/api/upload/image',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadedUrl(response.data.data.url);
      alert('Upload thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload thất bại!');
    }
  };

  return (
    <View>
      <Button title="Chọn ảnh" onPress={pickImage} />
      <Button title="Upload" onPress={uploadImage} />
      
      {uploadedUrl && (
        <Image 
          source={{ uri: `http://192.168.11.27:3000${uploadedUrl}` }}
          style={{ width: 300, height: 300 }}
        />
      )}
    </View>
  );
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 413 Payload Too Large
```json
{
  "statusCode": 400,
  "message": "File too large. Maximum size: 5MB",
  "error": "Bad Request"
}
```

---

## Tips & Best Practices

1. **Tối ưu hóa ảnh trước khi upload:**
   - Sử dụng `quality` parameter để giảm dung lượng
   - Sử dụng `width` và `height` để resize ảnh phù hợp

2. **Xử lý lỗi:**
   - Luôn kiểm tra file type trước khi upload
   - Xử lý timeout cho file lớn
   - Hiển thị progress bar cho UX tốt hơn

3. **Bảo mật:**
   - Luôn gửi JWT token trong header
   - Validate file type ở cả client và server
   - Không upload file nhạy cảm

4. **Performance:**
   - Sử dụng thumbnail cho danh sách ảnh
   - Lazy load ảnh trong list
   - Compress ảnh trước khi upload nếu có thể

---

## File Structure
```
backend/
├── uploads/
│   ├── images/          # Ảnh đã upload
│   ├── documents/       # Tài liệu đã upload
│   └── temp/           # Thư mục tạm
└── src/
    └── upload/
        ├── upload.module.ts
        ├── upload.controller.ts
        ├── upload.service.ts
        └── dto/
            └── upload.dto.ts
```

---

## Testing với Swagger
Truy cập Swagger UI để test API:
```
http://localhost:3000/api/docs
```

1. Click "Authorize" và nhập JWT token
2. Chọn endpoint muốn test
3. Click "Try it out"
4. Upload file và điền parameters
5. Click "Execute"

---

## Support
Nếu gặp vấn đề, kiểm tra:
- JWT token còn hợp lệ không
- File có đúng định dạng và kích thước không
- Thư mục `uploads/` có quyền ghi không
- Backend có chạy không (http://localhost:3000)
