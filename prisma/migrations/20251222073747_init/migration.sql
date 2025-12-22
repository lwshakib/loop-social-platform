-- AlterTable
ALTER TABLE "user" ADD COLUMN     "displayUsername" TEXT,
ALTER COLUMN "username" DROP NOT NULL;
