-- Add avatar column to User table if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Make branch_id nullable for existing tables if needed
ALTER TABLE "Room" ALTER COLUMN branch_id DROP NOT NULL;
ALTER TABLE "Prescription" ALTER COLUMN branch_id DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN branch_id DROP NOT NULL;
