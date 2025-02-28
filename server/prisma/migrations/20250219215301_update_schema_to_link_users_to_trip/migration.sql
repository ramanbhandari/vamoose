-- AlterTable
ALTER TABLE "TripInvitee" ADD COLUMN     "invitedUserId" TEXT;

-- AddForeignKey
ALTER TABLE "TripInvitee" ADD CONSTRAINT "TripInvitee_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
