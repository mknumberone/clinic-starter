/*
  Warnings:

  - Added the required column `initial_quantity` to the `BranchInventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mfg_date` to the `BranchInventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `BranchInventory` table without a default value. This is not possible if the table is not empty.
  - Made the column `batch_number` on table `BranchInventory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expiry_date` on table `BranchInventory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BranchInventory" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "import_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "initial_quantity" INTEGER NOT NULL,
ADD COLUMN     "is_expired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfg_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sold_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "batch_number" SET NOT NULL,
ALTER COLUMN "expiry_date" SET NOT NULL;
