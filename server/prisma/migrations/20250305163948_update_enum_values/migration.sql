/*
  Warnings:

  - The values [EXPIRED] on the enum `PollStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PollStatus_new" AS ENUM ('ACTIVE', 'COMPLETED');
ALTER TABLE "Poll" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Poll" ALTER COLUMN "status" TYPE "PollStatus_new" USING ("status"::text::"PollStatus_new");
ALTER TYPE "PollStatus" RENAME TO "PollStatus_old";
ALTER TYPE "PollStatus_new" RENAME TO "PollStatus";
DROP TYPE "PollStatus_old";
ALTER TABLE "Poll" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;
