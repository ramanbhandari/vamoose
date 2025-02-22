/*
  Warnings:

  - The primary key for the `TripInvitee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `TripInvitee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tripId,email]` on the table `TripInvitee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `TripInvitee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `TripInvitee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inviteToken` to the `TripInvitee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TripInvitee" DROP CONSTRAINT "TripInvitee_userId_fkey";

-- AlterTable
ALTER TABLE "TripInvitee" DROP CONSTRAINT "TripInvitee_pkey",
DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT NOT NULL,
ADD CONSTRAINT "TripInvitee_pkey" PRIMARY KEY ("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "TripInvitee_tripId_email_key" ON "TripInvitee"("tripId", "email");

-- AddForeignKey
ALTER TABLE "TripInvitee" ADD CONSTRAINT "TripInvitee_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
