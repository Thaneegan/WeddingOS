CREATE UNIQUE INDEX "PublicRSVPToken_guestId_unused_key"
ON "PublicRSVPToken"("guestId")
WHERE "guestId" IS NOT NULL AND "usedAt" IS NULL;
