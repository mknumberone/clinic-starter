-- AlterTable
-- Thêm cột is_verified vào bảng User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- Thêm cột verification_token vào bảng User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verification_token" TEXT;
