-- DropForeignKey
ALTER TABLE "DoctorShift" DROP CONSTRAINT "DoctorShift_doctor_id_fkey";

-- DropIndex
DROP INDEX "DoctorShift_doctor_id_start_time_end_time_key";

-- AlterTable
ALTER TABLE "DoctorShift" ADD COLUMN     "staff_id" TEXT,
ALTER COLUMN "doctor_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "DoctorShift_staff_id_start_time_idx" ON "DoctorShift"("staff_id", "start_time");

-- AddForeignKey
ALTER TABLE "DoctorShift" ADD CONSTRAINT "DoctorShift_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorShift" ADD CONSTRAINT "DoctorShift_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
