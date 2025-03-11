/*
  Warnings:

  - You are about to drop the `Itinerary` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('GENERAL', 'TRAVEL', 'ACTIVITY', 'MEAL', 'MEETING', 'FREE_TIME', 'OTHER');

-- DropForeignKey
ALTER TABLE "Itinerary" DROP CONSTRAINT "Itinerary_tripId_fkey";

-- DropTable
DROP TABLE "Itinerary";

-- CreateTable
CREATE TABLE "ItineraryEvent" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "category" "EventCategory" NOT NULL DEFAULT 'GENERAL',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryEventAssignment" (
    "eventId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ItineraryEventAssignment_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "EventNote" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItineraryEvent" ADD CONSTRAINT "ItineraryEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryEvent" ADD CONSTRAINT "ItineraryEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryEventAssignment" ADD CONSTRAINT "ItineraryEventAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ItineraryEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryEventAssignment" ADD CONSTRAINT "ItineraryEventAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNote" ADD CONSTRAINT "EventNote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ItineraryEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNote" ADD CONSTRAINT "EventNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
