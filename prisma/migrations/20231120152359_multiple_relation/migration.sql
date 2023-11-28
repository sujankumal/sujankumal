/*
  Warnings:

  - You are about to drop the column `postId` on the `categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_postId_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "postId";

-- CreateTable
CREATE TABLE "categoriesonposts" (
    "postId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "categoriesonposts_pkey" PRIMARY KEY ("postId","categoryId")
);

-- AddForeignKey
ALTER TABLE "categoriesonposts" ADD CONSTRAINT "categoriesonposts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoriesonposts" ADD CONSTRAINT "categoriesonposts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
