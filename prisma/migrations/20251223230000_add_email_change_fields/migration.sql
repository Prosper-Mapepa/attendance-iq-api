-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pendingEmail" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);

