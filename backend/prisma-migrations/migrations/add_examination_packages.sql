-- CreateTable
CREATE TABLE "ExaminationPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "specialization_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "original_price" DECIMAL(10,2),
    "image" TEXT,
    "services" JSONB,
    "duration" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExaminationPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExaminationPackage_specialization_id_idx" ON "ExaminationPackage"("specialization_id");

-- CreateIndex
CREATE INDEX "ExaminationPackage_is_active_idx" ON "ExaminationPackage"("is_active");

-- AddForeignKey
ALTER TABLE "ExaminationPackage" ADD CONSTRAINT "ExaminationPackage_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "Specialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
