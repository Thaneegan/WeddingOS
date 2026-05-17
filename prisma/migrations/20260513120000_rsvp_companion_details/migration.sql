ALTER TABLE "Guest" ADD COLUMN "additionalGuestCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Guest" ADD COLUMN "companionDetails" TEXT;

UPDATE "Guest"
SET "additionalGuestCount" = CASE WHEN "plusOne" = true THEN 1 ELSE 0 END
WHERE "additionalGuestCount" = 0;
