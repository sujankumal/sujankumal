-- CreateIndex
CREATE INDEX "content_postId_idx" ON "content"("postId");

-- CreateIndex
CREATE INDEX "posts_url_idx" ON "posts"("url");

-- CreateIndex
CREATE INDEX "posts_published_idx" ON "posts"("published");

-- CreateIndex
CREATE INDEX "posts_date_idx" ON "posts"("date");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_year_month_idx" ON "posts"("year", "month");

-- CreateIndex
CREATE INDEX "socials_name_idx" ON "socials"("name");

-- CreateIndex
CREATE INDEX "updates_date_idx" ON "updates"("date");
