CREATE TYPE "WaitlistStatus" AS ENUM ('PENDING', 'INVITED', 'ENABLED', 'DECLINED');

CREATE TABLE "WaitlistSignup" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnerName" TEXT,
    "accountType" TEXT NOT NULL,
    "attemptedInviteCode" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistSignup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistSignup_userId_key" ON "WaitlistSignup"("userId");
CREATE UNIQUE INDEX "WaitlistSignup_email_key" ON "WaitlistSignup"("email");
CREATE INDEX "WaitlistSignup_status_idx" ON "WaitlistSignup"("status");
CREATE INDEX "WaitlistSignup_email_idx" ON "WaitlistSignup"("email");

ALTER TABLE "WaitlistSignup" ADD CONSTRAINT "WaitlistSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
