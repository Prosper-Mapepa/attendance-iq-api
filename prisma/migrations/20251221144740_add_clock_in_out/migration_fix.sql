-- Safely add columns if they don't exist
DO $$ 
BEGIN
    -- Add clockInTime column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'clockInTime'
    ) THEN
        ALTER TABLE "attendance" ADD COLUMN "clockInTime" TIMESTAMP(3);
    END IF;

    -- Add clockOutTime column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'clockOutTime'
    ) THEN
        ALTER TABLE "attendance" ADD COLUMN "clockOutTime" TIMESTAMP(3);
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'status'
    ) THEN
        ALTER TABLE "attendance" ADD COLUMN "status" "AttendanceStatus" NOT NULL DEFAULT 'CLOCKED_IN';
    END IF;
END $$;

-- Update existing records to set clockInTime from timestamp
UPDATE "attendance" SET "clockInTime" = "timestamp", "status" = 'COMPLETED' WHERE "clockInTime" IS NULL;

