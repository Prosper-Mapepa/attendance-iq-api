-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "clockInDeadline" TIMESTAMP(3),
ADD COLUMN "classDuration" INTEGER;

-- Update existing sessions to have default values
UPDATE "sessions" SET 
  "clockInDeadline" = "createdAt" + INTERVAL '10 minutes',
  "classDuration" = 90
WHERE "clockInDeadline" IS NULL;

-- Make fields NOT NULL after setting defaults
ALTER TABLE "sessions" ALTER COLUMN "clockInDeadline" SET NOT NULL;
ALTER TABLE "sessions" ALTER COLUMN "classDuration" SET NOT NULL;

