-- CreateEnum
CREATE TYPE "InviteRole" AS ENUM ('COUPLE_OWNER', 'VENDOR_OWNER', 'WEDDING_MEMBER', 'VENDOR_MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('WEDDING', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'PUBLIC_LINK');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'VOID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'PITCHED', 'BOOKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PitchStatus" AS ENUM ('SENT', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "FileAsset" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'database',
ADD COLUMN     "uploadedByUserId" TEXT,
ADD COLUMN     "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "error" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'resend',
ADD COLUMN     "providerMessageId" TEXT;

-- AlterTable
ALTER TABLE "PaymentScheduleItem" ADD COLUMN     "budgetItemId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VendorBusiness" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "hiddenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "role" "InviteRole" NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT,
    "weddingId" TEXT,
    "vendorBusinessId" TEXT,
    "createdByUserId" TEXT,
    "acceptedByUserId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspacePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeType" "WorkspaceType" NOT NULL,
    "activeOrganizationId" TEXT,
    "activeWeddingId" TEXT,
    "activeVendorBusinessId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspacePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationReadState" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationReadState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorOpportunity" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budgetCents" INTEGER,
    "location" TEXT,
    "date" TIMESTAMP(3),
    "guestCount" INTEGER,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPitch" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "vendorBusinessId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "message" TEXT NOT NULL,
    "status" "PitchStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceRecord" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "vendorBusinessId" TEXT,
    "bookingId" TEXT,
    "budgetItemId" TEXT,
    "fileAssetId" TEXT,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledCall" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "weddingId" TEXT NOT NULL,
    "vendorBusinessId" TEXT,
    "bookingId" TEXT,
    "title" TEXT NOT NULL,
    "callUrl" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicRSVPToken" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicRSVPToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileViewEvent" (
    "id" TEXT NOT NULL,
    "vendorBusinessId" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "weddingId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "Invite_role_status_idx" ON "Invite"("role", "status");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE INDEX "Invite_organizationId_idx" ON "Invite"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspacePreference_userId_key" ON "WorkspacePreference"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ConversationReadState_userId_idx" ON "ConversationReadState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationReadState_conversationId_userId_key" ON "ConversationReadState"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "VendorOpportunity_weddingId_idx" ON "VendorOpportunity"("weddingId");

-- CreateIndex
CREATE INDEX "VendorOpportunity_categoryId_idx" ON "VendorOpportunity"("categoryId");

-- CreateIndex
CREATE INDEX "VendorOpportunity_status_idx" ON "VendorOpportunity"("status");

-- CreateIndex
CREATE INDEX "VendorPitch_vendorBusinessId_idx" ON "VendorPitch"("vendorBusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPitch_opportunityId_vendorBusinessId_key" ON "VendorPitch"("opportunityId", "vendorBusinessId");

-- CreateIndex
CREATE INDEX "InvoiceRecord_weddingId_idx" ON "InvoiceRecord"("weddingId");

-- CreateIndex
CREATE INDEX "InvoiceRecord_bookingId_idx" ON "InvoiceRecord"("bookingId");

-- CreateIndex
CREATE INDEX "InvoiceRecord_budgetItemId_idx" ON "InvoiceRecord"("budgetItemId");

-- CreateIndex
CREATE INDEX "ScheduledCall_weddingId_idx" ON "ScheduledCall"("weddingId");

-- CreateIndex
CREATE INDEX "ScheduledCall_vendorBusinessId_idx" ON "ScheduledCall"("vendorBusinessId");

-- CreateIndex
CREATE INDEX "ScheduledCall_startsAt_idx" ON "ScheduledCall"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicRSVPToken_token_key" ON "PublicRSVPToken"("token");

-- CreateIndex
CREATE INDEX "PublicRSVPToken_weddingId_idx" ON "PublicRSVPToken"("weddingId");

-- CreateIndex
CREATE INDEX "PublicRSVPToken_guestId_idx" ON "PublicRSVPToken"("guestId");

-- CreateIndex
CREATE INDEX "ProfileViewEvent_vendorBusinessId_idx" ON "ProfileViewEvent"("vendorBusinessId");

-- CreateIndex
CREATE INDEX "ProfileViewEvent_weddingId_idx" ON "ProfileViewEvent"("weddingId");

-- CreateIndex
CREATE INDEX "ProfileViewEvent_createdAt_idx" ON "ProfileViewEvent"("createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_uploadedByUserId_idx" ON "FileAsset"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "GuestGroup_weddingId_idx" ON "GuestGroup"("weddingId");

-- CreateIndex
CREATE INDEX "PaymentScheduleItem_bookingId_idx" ON "PaymentScheduleItem"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentScheduleItem_budgetItemId_idx" ON "PaymentScheduleItem"("budgetItemId");

-- CreateIndex
CREATE INDEX "VendorBusiness_approvedAt_hiddenAt_idx" ON "VendorBusiness"("approvedAt", "hiddenAt");

-- AddForeignKey
ALTER TABLE "PaymentScheduleItem" ADD CONSTRAINT "PaymentScheduleItem_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestGroup" ADD CONSTRAINT "GuestGroup_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePreference" ADD CONSTRAINT "WorkspacePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePreference" ADD CONSTRAINT "WorkspacePreference_activeOrganizationId_fkey" FOREIGN KEY ("activeOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePreference" ADD CONSTRAINT "WorkspacePreference_activeWeddingId_fkey" FOREIGN KEY ("activeWeddingId") REFERENCES "Wedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePreference" ADD CONSTRAINT "WorkspacePreference_activeVendorBusinessId_fkey" FOREIGN KEY ("activeVendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOpportunity" ADD CONSTRAINT "VendorOpportunity_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOpportunity" ADD CONSTRAINT "VendorOpportunity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPitch" ADD CONSTRAINT "VendorPitch_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VendorOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPitch" ADD CONSTRAINT "VendorPitch_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPitch" ADD CONSTRAINT "VendorPitch_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicRSVPToken" ADD CONSTRAINT "PublicRSVPToken_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicRSVPToken" ADD CONSTRAINT "PublicRSVPToken_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileViewEvent" ADD CONSTRAINT "ProfileViewEvent_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileViewEvent" ADD CONSTRAINT "ProfileViewEvent_viewerUserId_fkey" FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileViewEvent" ADD CONSTRAINT "ProfileViewEvent_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
