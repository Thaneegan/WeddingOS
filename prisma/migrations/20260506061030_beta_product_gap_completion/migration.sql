-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "VendorFaq" (
    "id" TEXT NOT NULL,
    "vendorBusinessId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VendorFaq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorFaq_vendorBusinessId_idx" ON "VendorFaq"("vendorBusinessId");

-- AddForeignKey
ALTER TABLE "VendorFaq" ADD CONSTRAINT "VendorFaq_vendorBusinessId_fkey" FOREIGN KEY ("vendorBusinessId") REFERENCES "VendorBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
