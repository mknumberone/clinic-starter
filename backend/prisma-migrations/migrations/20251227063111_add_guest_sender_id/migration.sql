-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_sender_id_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "guest_sender_id" TEXT,
ALTER COLUMN "sender_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_guest_sender_id_fkey" FOREIGN KEY ("guest_sender_id") REFERENCES "GuestSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
