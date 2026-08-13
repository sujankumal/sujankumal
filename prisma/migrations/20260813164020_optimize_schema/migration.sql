/*
  Warnings:

  - You are about to drop the column `id` on the `categoriesonposts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `posts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "categoriesonposts" DROP CONSTRAINT "categoriesonposts_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "categoriesonposts" DROP CONSTRAINT "categoriesonposts_postId_fkey";

-- DropForeignKey
ALTER TABLE "content" DROP CONSTRAINT "content_postId_fkey";

-- DropIndex
DROP INDEX "content_postId_idx";

-- DropIndex
DROP INDEX "posts_authorId_idx";

-- DropIndex
DROP INDEX "posts_date_idx";

-- DropIndex
DROP INDEX "posts_published_idx";

-- DropIndex
DROP INDEX "posts_url_idx";

-- AlterTable
ALTER TABLE "categoriesonposts" DROP COLUMN "id";

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categoriesonposts_categoryId_idx" ON "categoriesonposts"("categoryId");

-- CreateIndex
CREATE INDEX "content_postId_sequence_idx" ON "content"("postId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "posts_url_key" ON "posts"("url");

-- CreateIndex
CREATE INDEX "posts_published_date_idx" ON "posts"("published", "date");

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoriesonposts" ADD CONSTRAINT "categoriesonposts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoriesonposts" ADD CONSTRAINT "categoriesonposts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
