-- AlterTable
-- Sửa email thành nullable (vì đăng ký bằng SĐT có thể không có email)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
-- Sửa password_hash thành nullable (vì đăng ký bằng SĐT không cần password)
ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;
