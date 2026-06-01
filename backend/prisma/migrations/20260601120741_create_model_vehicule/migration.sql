-- CreateEnum
CREATE TYPE "VehiculeStatus" AS ENUM ('AVAILABLE', 'DISPATCHED', 'BUSY', 'OFFLINE', 'EN_ROUTE', 'AT_INCIDENT');

-- CreateEnum
CREATE TYPE "VehiculeType" AS ENUM ('AMBULANCE', 'FIRE_TRUCK', 'POLICE_CAR', 'TOW_TRUCK');

-- CreateTable
CREATE TABLE "Vehicule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "type" "VehiculeType" NOT NULL,
    "status" "VehiculeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicule_plate_key" ON "Vehicule"("plate");
