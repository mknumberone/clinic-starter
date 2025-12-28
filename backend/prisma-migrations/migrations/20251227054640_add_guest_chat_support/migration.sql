-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "guest_session_id" TEXT,
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "GuestSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
