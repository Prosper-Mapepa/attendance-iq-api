-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('CLOCKED_IN', 'CLOCKED_OUT', 'COMPLETED');

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN "clockInTime" TIMESTAMP(3),
ADD COLUMN "clockOutTime" TIMESTAMP(3),
ADD COLUMN "status" "AttendanceStatus" NOT NULL DEFAULT 'CLOCKED_IN';

-- Update existing records to set clockInTime from timestamp
UPDATE "attendance" SET "clockInTime" = "timestamp", "status" = 'COMPLETED' WHERE "clockInTime" IS NULL;

