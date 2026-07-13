/*
  Warnings:

  - You are about to drop the column `capturedAt` on the `Telemetry` table. All the data in the column will be lost.
  - You are about to drop the column `clientEventId` on the `Telemetry` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Telemetry_clientEventId_key";

-- DropIndex
DROP INDEX "Telemetry_vehiculeId_capturedAt_idx";

-- AlterTable
ALTER TABLE "Telemetry" DROP COLUMN "capturedAt",
DROP COLUMN "clientEventId";
