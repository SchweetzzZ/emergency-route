/*
  Warnings:

  - You are about to drop the column `avaliable` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `plate` on the `Incident` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Incident_plate_key";

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "avaliable",
DROP COLUMN "plate";

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
