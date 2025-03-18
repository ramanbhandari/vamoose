-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('ACCOMMODATION', 'RESTAURANT', 'CAFE', 'SHOPPING', 'GAS_STATION', 'OTHER');

-- CreateTable
CREATE TABLE "MarkedLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "coordinates" JSONB NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tripId" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "website" TEXT,
    "phoneNumber" TEXT,

    CONSTRAINT "MarkedLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarkedLocation_tripId_idx" ON "MarkedLocation"("tripId");

-- CreateIndex
CREATE INDEX "MarkedLocation_createdById_idx" ON "MarkedLocation"("createdById");

-- CreateIndex
CREATE INDEX "MarkedLocation_type_idx" ON "MarkedLocation"("type");

-- AddForeignKey
ALTER TABLE "MarkedLocation" ADD CONSTRAINT "MarkedLocation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkedLocation" ADD CONSTRAINT "MarkedLocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
