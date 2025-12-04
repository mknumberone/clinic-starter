/*
  Warnings:

  - Added the required column `branch_id` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_id` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "branch_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "medication_id" TEXT;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "branch_id" TEXT NOT NULL;
