-- AlterEnum
ALTER TYPE "FileAssetOwnerType" ADD VALUE 'EVENT';

-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN     "eventId" TEXT;

-- AlterTable
ALTER TABLE "PaymentScheduleItem" ADD COLUMN     "reminderDaysBefore" INTEGER,
ADD COLUMN     "reminderDismissedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TimelineTask" ADD COLUMN     "eventId" TEXT;

-- CreateTable
CREATE TABLE "WeddingEvent" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "venueName" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVendorNeed" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Needed',
    "budgetCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventVendorNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBudgetAllocation" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTimelineBlock" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "ownerName" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTimelineBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
    "attendeeCount" INTEGER NOT NULL DEFAULT 1,
    "mealChoice" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestCompanion" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "mealChoice" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuestCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestEventInvite" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "invited" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestEventInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "assignedName" TEXT,
    "assignedEmail" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuote" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT,
    "vendorBusinessId" TEXT NOT NULL,
    "serviceId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "depositCents" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuoteLineItem" (
    "id" TEXT NOT NULL,
    "vendorQuoteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VendorQuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteComparisonNote" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "vendorBusinessId" TEXT NOT NULL,
    "categoryId" TEXT,
    "notes" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteComparisonNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingTable" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatingTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingAssignment" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "guestId" TEXT,
    "companionId" TEXT,
    "seatLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "vendorBusinessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBlackoutDate" (
    "id" TEXT NOT NULL,
    "vendorBusinessId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "VendorBlackoutDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeddingEvent_weddingId_idx" ON "WeddingEvent"("weddingId");

-- CreateIndex
CREATE INDEX "WeddingEvent_date_idx" ON "WeddingEvent"("date");

-- CreateIndex
CREATE INDEX "EventVendorNeed_weddingId_idx" ON "EventVendorNeed"("weddingId");

-- CreateIndex
CREATE INDEX "EventVendorNeed_eventId_idx" ON "EventVendorNeed"("eventId");

-- CreateIndex
CREATE INDEX "EventVendorNeed_categoryId_idx" ON "EventVendorNeed"("categoryId");

-- CreateIndex
CREATE INDEX "EventBudgetAllocation_weddingId_idx" ON "EventBudgetAllocation"("weddingId");

-- CreateIndex
CREATE INDEX "EventBudgetAllocation_categoryId_idx" ON "EventBudgetAllocation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "EventBudgetAllocation_eventId_categoryId_key" ON "EventBudgetAllocation"("eventId", "categoryId");

-- CreateIndex
CREATE INDEX "EventTimelineBlock_weddingId_idx" ON "EventTimelineBlock"("weddingId");

-- CreateIndex
CREATE INDEX "EventTimelineBlock_eventId_idx" ON "EventTimelineBlock"("eventId");

-- CreateIndex
CREATE INDEX "EventTimelineBlock_startsAt_idx" ON "EventTimelineBlock"("startsAt");

-- CreateIndex
CREATE INDEX "EventRsvp_eventId_idx" ON "EventRsvp"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_guestId_eventId_key" ON "EventRsvp"("guestId", "eventId");

-- CreateIndex
CREATE INDEX "GuestCompanion_guestId_idx" ON "GuestCompanion"("guestId");

-- CreateIndex
CREATE INDEX "GuestEventInvite_eventId_idx" ON "GuestEventInvite"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestEventInvite_guestId_eventId_key" ON "GuestEventInvite"("guestId", "eventId");

-- CreateIndex
CREATE INDEX "Responsibility_weddingId_idx" ON "Responsibility"("weddingId");

-- CreateIndex
CREATE INDEX "Responsibility_eventId_idx" ON "Responsibility"("eventId");

-- CreateIndex
CREATE INDEX "Responsibility_dueDate_idx" ON "Responsibility"("dueDate");

-- CreateIndex
CREATE INDEX "VendorQuote_inquiryId_idx" ON "VendorQuote"("inquiryId");

-- CreateIndex
CREATE INDEX "VendorQuote_vendorBusinessId_idx" ON "VendorQuote"("vendorBusinessId");

-- CreateIndex
CREATE INDEX "VendorQuote_serviceId_idx" ON "VendorQuote"("serviceId");

-- CreateIndex
CREATE INDEX "VendorQuoteLineItem_vendorQuoteId_idx" ON "VendorQuoteLineItem"("vendorQuoteId");

-- CreateIndex
CREATE INDEX "QuoteComparisonNote_vendorBusinessId_idx" ON "QuoteComparisonNote"("vendorBusinessId");

-- CreateIndex
CREATE INDEX "QuoteComparisonNote_categoryId_idx" ON "QuoteComparisonNote"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteComparisonNote_weddingId_vendorBusinessId_categoryId_key" ON "QuoteComparisonNote"("weddingId", "vendorBusinessId", "categoryId");

-- CreateIndex
CREATE INDEX "SeatingTable_weddingId_idx" ON "SeatingTable"("weddingId");

-- CreateIndex
CREATE INDEX "SeatingTable_eventId_idx" ON "SeatingTable"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatingTable_weddingId_eventId_name_key" ON "SeatingTable"("weddingId", "eventId", "name");

-- CreateIndex
CREATE INDEX "SeatingAssignment_tableId_idx" ON "SeatingAssignment"("tableId");

-- CreateIndex
CREATE INDEX "SeatingAssignment_guestId_idx" ON "SeatingAssignment"("guestId");

-- CreateIndex
CREATE INDEX "SeatingAssignment_companionId_idx" ON "SeatingAssignment"("companionId");

-- CreateIndex
CREATE INDEX "VendorAvailabilitySlot_date_idx" ON "VendorAvailabilitySlot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAvailabilitySlot_vendorBusinessId_date_key" ON "VendorAvailabilitySlot"("vendorBusinessId", "date");

-- CreateIndex
CREATE INDEX "VendorBlackoutDate_vendorBusinessId_idx" ON "VendorBlackoutDate"("vendorBusinessId");

-- CreateIndex
CREATE INDEX "VendorBlackoutDate_startsAt_endsAt_idx" ON "VendorBlackoutDate"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BudgetItem_eventId_idx" ON "BudgetItem"("eventId");

-- CreateIndex
CREATE INDEX "TimelineTask_eventId_idx" ON "TimelineTask"("eventId");

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingEvent" ADD CONSTRAINT "WeddingEvent_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVendorNeed" ADD CONSTRAINT "EventVendorNeed_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVendorNeed" ADD CONSTRAINT "EventVendorNeed_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVendorNeed" ADD CONSTRAINT "EventVendorNeed_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudgetAllocation" ADD CONSTRAINT "EventBudgetAllocation_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudgetAllocation" ADD CONSTRAINT "EventBudgetAllocation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudgetAllocation" ADD CONSTRAINT "EventBudgetAllocation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTimelineBlock" ADD CONSTRAINT "EventTimelineBlock_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTimelineBlock" ADD CONSTRAINT "EventTimelineBlock_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestCompanion" ADD CONSTRAINT "GuestCompanion_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestEventInvite" ADD CONSTRAINT "GuestEventInvite_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestEventInvite" ADD CONSTRAINT "GuestEventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineTask" ADD CONSTRAINT "TimelineTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "VendorService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuoteLineItem" ADD CONSTRAINT "VendorQuoteLineItem_vendorQuoteId_fkey" FOREIGN KEY ("vendorQuoteId") REFERENCES "VendorQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteComparisonNote" ADD CONSTRAINT "QuoteComparisonNote_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteComparisonNote" ADD CONSTRAINT "QuoteComparisonNote_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteComparisonNote" ADD CONSTRAINT "QuoteComparisonNote_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingTable" ADD CONSTRAINT "SeatingTable_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingTable" ADD CONSTRAINT "SeatingTable_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "SeatingTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "GuestCompanion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAvailabilitySlot" ADD CONSTRAINT "VendorAvailabilitySlot_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBlackoutDate" ADD CONSTRAINT "VendorBlackoutDate_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
