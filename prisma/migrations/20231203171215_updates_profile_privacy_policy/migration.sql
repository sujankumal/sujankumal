-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "privacy_policy" TEXT;

-- CreateTable
CREATE TABLE "updates" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "update" TEXT NOT NULL,
    "date" TIMESTAMP(3),

    CONSTRAINT "updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER,
    "status" TEXT,
    "image" TEXT,
    "about" TEXT,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_authorId_key" ON "profile"("authorId");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
