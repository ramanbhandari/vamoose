/*
  Warnings:

  - You are about to drop the column `options` on the `Poll` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[winnerId]` on the table `Poll` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `Poll` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdById` on table `Poll` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateExtension
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_createdById_fkey";

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "options",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "PollStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "winnerId" INTEGER,
ALTER COLUMN "createdById" SET NOT NULL;

-- CreateTable
CREATE TABLE "PollOption" (
    "id" SERIAL NOT NULL,
    "pollId" INTEGER NOT NULL,
    "option" TEXT NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "pollOptionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pollId" INTEGER NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PollOption_pollId_option_key" ON "PollOption"("pollId", "option");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_userId_key" ON "Vote"("pollId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_winnerId_key" ON "Poll"("winnerId");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "PollOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
