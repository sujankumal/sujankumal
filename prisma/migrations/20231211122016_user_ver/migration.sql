-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
