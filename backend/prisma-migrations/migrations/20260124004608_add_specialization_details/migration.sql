-- AlterTable
ALTER TABLE "Specialization" ADD COLUMN     "content" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT 'temp-slug';
