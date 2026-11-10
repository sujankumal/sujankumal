-- 1. Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing foreign key constraints
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_authorId_fkey";
ALTER TABLE "profile" DROP CONSTRAINT IF EXISTS "profile_authorId_fkey";
ALTER TABLE "two_factor_backup_codes" DROP CONSTRAINT IF EXISTS "two_factor_backup_codes_userId_fkey";
ALTER TABLE "security_logs" DROP CONSTRAINT IF EXISTS "security_logs_userId_fkey";
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- 3. Add temporary UUID columns and migrate existing IDs
ALTER TABLE "users" ADD COLUMN "new_id" TEXT DEFAULT gen_random_uuid()::text;
UPDATE "users" SET "new_id" = gen_random_uuid()::text WHERE "new_id" IS NULL;
ALTER TABLE "users" ALTER COLUMN "new_id" SET NOT NULL;

ALTER TABLE "posts" ADD COLUMN "new_authorId" TEXT;
UPDATE "posts" p SET "new_authorId" = u."new_id" FROM "users" u WHERE p."authorId" = u."id";

ALTER TABLE "profile" ADD COLUMN "new_authorId" TEXT;
UPDATE "profile" pr SET "new_authorId" = u."new_id" FROM "users" u WHERE pr."authorId" = u."id";

ALTER TABLE "two_factor_backup_codes" ADD COLUMN "new_userId" TEXT;
UPDATE "two_factor_backup_codes" b SET "new_userId" = u."new_id" FROM "users" u WHERE b."userId" = u."id";

ALTER TABLE "security_logs" ADD COLUMN "new_userId" TEXT;
UPDATE "security_logs" s SET "new_userId" = u."new_id" FROM "users" u WHERE s."userId" = u."id";

ALTER TABLE "Account" ADD COLUMN "new_userId" TEXT;
UPDATE "Account" a SET "new_userId" = u."new_id" FROM "users" u WHERE a."userId" = u."id";

ALTER TABLE "Session" ADD COLUMN "new_userId" TEXT;
UPDATE "Session" se SET "new_userId" = u."new_id" FROM "users" u WHERE se."userId" = u."id";

-- 4. Swap primary key column on users table
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- 5. Swap foreign key columns on dependent tables
ALTER TABLE "posts" DROP COLUMN "authorId";
ALTER TABLE "posts" RENAME COLUMN "new_authorId" TO "authorId";

ALTER TABLE "profile" DROP COLUMN "authorId";
ALTER TABLE "profile" RENAME COLUMN "new_authorId" TO "authorId";
CREATE UNIQUE INDEX IF NOT EXISTS "profile_authorId_key" ON "profile"("authorId");

ALTER TABLE "two_factor_backup_codes" DROP COLUMN "userId";
ALTER TABLE "two_factor_backup_codes" RENAME COLUMN "new_userId" TO "userId";
ALTER TABLE "two_factor_backup_codes" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "two_factor_backup_codes_userId_idx" ON "two_factor_backup_codes"("userId");

ALTER TABLE "security_logs" DROP COLUMN "userId";
ALTER TABLE "security_logs" RENAME COLUMN "new_userId" TO "userId";
CREATE INDEX IF NOT EXISTS "security_logs_userId_event_idx" ON "security_logs"("userId", "event");

ALTER TABLE "Account" DROP COLUMN "userId";
ALTER TABLE "Account" RENAME COLUMN "new_userId" TO "userId";
ALTER TABLE "Account" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Session" DROP COLUMN "userId";
ALTER TABLE "Session" RENAME COLUMN "new_userId" TO "userId";
ALTER TABLE "Session" ALTER COLUMN "userId" SET NOT NULL;

-- 6. Restore foreign key constraints
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "profile" ADD CONSTRAINT "profile_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "two_factor_backup_codes" ADD CONSTRAINT "two_factor_backup_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

