-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ACCIDENT', 'FIRE', 'MEDICAL');

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "avaliable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Incident_plate_key" ON "Incident"("plate");
