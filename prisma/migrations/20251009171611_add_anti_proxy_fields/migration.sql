-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "deviceFingerprint" TEXT,
ADD COLUMN     "isNewDevice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "riskScore" INTEGER,
ADD COLUMN     "screenResolution" TEXT,
ADD COLUMN     "userAgent" TEXT;
