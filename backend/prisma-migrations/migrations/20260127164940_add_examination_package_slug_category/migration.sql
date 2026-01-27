/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `ExaminationPackage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ExaminationPackage" ADD COLUMN     "category" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT 'temp-slug';

-- CreateIndex
CREATE UNIQUE INDEX "ExaminationPackage_slug_key" ON "ExaminationPackage"("slug");
