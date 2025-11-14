# Tạo User Admin để test

## Cách 1: Sử dụng Swagger API

1. Mở Swagger: http://localhost:3000/api/docs
2. Đăng ký user mới với API `/auth/register`
3. Vào database (PostgreSQL) và update role:

```sql
-- Xem danh sách users
SELECT id, phone, full_name, role FROM "User";

-- Update role thành ADMIN
UPDATE "User" 
SET role = 'ADMIN' 
WHERE phone = '0987654321';
```

## Cách 2: Tạo seed script

Tạo file `backend/src/seed-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Tạo admin user
  const admin = await prisma.user.upsert({
    where: { phone: '0999999999' },
    update: {},
    create: {
      phone: '0999999999',
      full_name: 'Admin User',
      email: 'admin@clinic.com',
      role: 'ADMIN',
    },
  });
  
  console.log('Admin user created:', admin);
  
  // Tạo doctor
  const doctor = await prisma.user.upsert({
    where: { phone: '0888888888' },
    update: {},
    create: {
      phone: '0888888888',
      full_name: 'Bác sĩ Nguyễn Văn A',
      email: 'doctor@clinic.com',
      role: 'DOCTOR',
    },
  });
  
  console.log('Doctor user created:', doctor);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Chạy: `npx ts-node src/seed-admin.ts`

## Test credentials:

- **Admin**: 
  - Phone: `0999999999`
  - OTP: `123456`

- **Doctor**: 
  - Phone: `0888888888`
  - OTP: `123456`

- **Patient**: Đăng ký mới qua UI (role mặc định là PATIENT)
