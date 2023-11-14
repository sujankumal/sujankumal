-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "header_image" TEXT NOT NULL DEFAULT 'header.jpg',
ADD COLUMN     "header_image_credit" TEXT;
