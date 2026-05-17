CREATE TYPE "UserAccountType" AS ENUM ('COUPLE', 'VENDOR', 'ADMIN');

ALTER TABLE "User" ADD COLUMN "accountType" "UserAccountType" NOT NULL DEFAULT 'COUPLE';

UPDATE "User"
SET "accountType" = 'ADMIN'
WHERE "id" IN (
  SELECT DISTINCT "userId"
  FROM "Membership"
  INNER JOIN "Organization" ON "Organization"."id" = "Membership"."organizationId"
  WHERE "Organization"."type" = 'ADMIN'
);

UPDATE "User"
SET "accountType" = 'VENDOR'
WHERE "accountType" <> 'ADMIN'
  AND "id" IN (
    SELECT DISTINCT "userId"
    FROM "Membership"
    INNER JOIN "Organization" ON "Organization"."id" = "Membership"."organizationId"
    WHERE "Organization"."type" = 'VENDOR'
  )
  AND "id" NOT IN (
    SELECT DISTINCT "userId"
    FROM "WeddingMember"
  );
