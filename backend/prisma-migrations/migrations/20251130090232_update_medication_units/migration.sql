/*
  Warnings:

  - You are about to drop the column `price` on the `Medication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "price",
ADD COLUMN     "base_unit" TEXT NOT NULL DEFAULT 'Viên',
ADD COLUMN     "conversion_factor" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "cost_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "import_unit" TEXT DEFAULT 'Hộp',
ADD COLUMN     "profit_margin" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
ADD COLUMN     "sell_price" DECIMAL(10,2) NOT NULL DEFAULT 0;
