import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 1500,
    idleTimeoutMillis: 1000,
    max: 5,
  }),
});

const rollbackToken = "ROLLBACK_CRUD_SMOKE";
let summary = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { email: "maya@weddingos.local" } });
    const vendorUser = await tx.user.findUniqueOrThrow({ where: { email: "golden@weddingos.local" } });
    const wedding = await tx.wedding.findUniqueOrThrow({ where: { slug: "arjun-maya" } });
    const vendor = await tx.vendorBusiness.findUniqueOrThrow({
      where: { slug: "golden-lens-photography" },
      include: { services: { take: 1, include: { category: true } } },
    });
    const budgetCategory = await tx.category.findFirstOrThrow({
      where: { type: "BUDGET", archivedAt: null, OR: [{ scope: "GLOBAL" }, { ownerWeddingId: wedding.id }] },
    });
    const taskCategory = await tx.category.findFirstOrThrow({
      where: { type: "TASK", archivedAt: null, OR: [{ scope: "GLOBAL" }, { ownerWeddingId: wedding.id }] },
    });
    const vendorCategory = await tx.category.findFirstOrThrow({
      where: { type: "VENDOR_SERVICE", archivedAt: null, OR: [{ scope: "GLOBAL" }, { ownerVendorId: vendor.id }] },
    });

    const guestGroup = await tx.guestGroup.create({
      data: { weddingId: wedding.id, name: "Smoke Guests" },
    });
    const guest = await tx.guest.create({
      data: {
        weddingId: wedding.id,
        guestGroupId: guestGroup.id,
        name: "Smoke Guest",
        email: "smoke.guest@example.com",
        status: "PENDING",
      },
    });
    const updatedGuest = await tx.guest.update({
      where: { id: guest.id },
      data: { status: "ATTENDING", mealChoice: "Vegetarian", plusOne: true, tableNumber: 9 },
    });
    assert(updatedGuest.status === "ATTENDING", "Guest update failed.");
    await tx.guest.delete({ where: { id: guest.id } });
    await tx.guestGroup.delete({ where: { id: guestGroup.id } });

    const budgetItem = await tx.budgetItem.create({
      data: {
        weddingId: wedding.id,
        categoryId: budgetCategory.id,
        label: "Smoke Budget Item",
        amountCents: 123400,
        paidCents: 0,
        dueDate: new Date(),
      },
    });
    const updatedBudgetItem = await tx.budgetItem.update({
      where: { id: budgetItem.id },
      data: { paidCents: 50000, status: "DEPOSIT_PAID" },
    });
    assert(updatedBudgetItem.paidCents === 50000, "Budget update failed.");
    await tx.budgetItem.delete({ where: { id: budgetItem.id } });

    const task = await tx.timelineTask.create({
      data: {
        weddingId: wedding.id,
        categoryId: taskCategory.id,
        title: "Smoke Timeline Task",
        group: "Smoke",
        dueDate: new Date(),
      },
    });
    const updatedTask = await tx.timelineTask.update({
      where: { id: task.id },
      data: { completed: true, priority: "High" },
    });
    assert(updatedTask.completed, "Timeline task update failed.");
    await tx.timelineTask.delete({ where: { id: task.id } });

    const service = await tx.vendorService.create({
      data: {
        vendorBusinessId: vendor.id,
        categoryId: vendorCategory.id,
        name: "Smoke Service",
        description: "Smoke service description.",
        startingPriceCents: 222200,
        includes: ["Smoke include"],
      },
    });
    const updatedService = await tx.vendorService.update({
      where: { id: service.id },
      data: { startingPriceCents: 333300 },
    });
    assert(updatedService.startingPriceCents === 333300, "Vendor service update failed.");

    const inquiry = await tx.inquiry.create({
      data: {
        weddingId: wedding.id,
        vendorBusinessId: vendor.id,
        serviceId: vendor.services[0]?.id,
        message: "Smoke booking CRUD inquiry.",
      },
    });
    const lead = await tx.lead.create({
      data: {
        inquiryId: inquiry.id,
        stage: "NEW_INQUIRY",
        estimatedValueCents: 444400,
        lastMessage: inquiry.message,
      },
    });
    const booking = await tx.booking.create({
      data: {
        leadId: lead.id,
        weddingId: wedding.id,
        vendorBusinessId: vendor.id,
        serviceId: vendor.services[0]?.id,
        amountCents: 444400,
      },
    });
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { amountCents: 555500, status: "COMPLETED" },
    });
    assert(updatedBooking.status === "COMPLETED", "Booking update failed.");

    const payment = await tx.paymentScheduleItem.create({
      data: {
        bookingId: booking.id,
        label: "Smoke Payment",
        amountCents: 100000,
        dueDate: new Date(),
      },
    });
    const updatedPayment = await tx.paymentScheduleItem.update({
      where: { id: payment.id },
      data: { status: "PAID" },
    });
    assert(updatedPayment.status === "PAID", "Payment schedule update failed.");

    const contract = await tx.contractRecord.create({
      data: {
        bookingId: booking.id,
        title: "Smoke Contract",
      },
    });
    const updatedContract = await tx.contractRecord.update({
      where: { id: contract.id },
      data: { status: "SIGNED" },
    });
    assert(updatedContract.status === "SIGNED", "Contract update failed.");

    const fileAsset = await tx.fileAsset.create({
      data: {
        ownerType: "BOOKING",
        ownerId: booking.id,
        purpose: "CONTRACT",
        fileName: "smoke-contract.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      },
    });
    const notification = await tx.notification.create({
      data: {
        recipientUserId: user.id,
        type: "SYSTEM",
        payload: { smoke: true },
      },
    });

    const coupleOrg = await tx.organization.create({
      data: {
        name: "Smoke Couple Planning",
        slug: `smoke-couple-${Date.now()}`,
        type: "COUPLE",
        memberships: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    const smokeWedding = await tx.wedding.create({
      data: {
        organizationId: coupleOrg.id,
        coupleNames: "Smoke Couple",
        slug: `smoke-wedding-${Date.now()}`,
        date: new Date(),
        location: "Toronto",
        style: "Smoke",
        budgetCents: 1000000,
        guestCount: 25,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    const vendorOrg = await tx.organization.create({
      data: {
        name: "Smoke Vendor",
        slug: `smoke-vendor-org-${Date.now()}`,
        type: "VENDOR",
        memberships: { create: { userId: vendorUser.id, role: "OWNER" } },
      },
    });
    const smokeVendor = await tx.vendorBusiness.create({
      data: {
        organizationId: vendorOrg.id,
        name: "Smoke Vendor",
        slug: `smoke-vendor-${Date.now()}`,
        location: "Toronto",
        about: "Smoke vendor",
      },
    });

    summary = {
      guestCrud: true,
      budgetCrud: true,
      timelineCrud: true,
      vendorServiceCrud: true,
      bookingCrud: true,
      paymentCrud: true,
      contractCrud: true,
      fileAssetId: fileAsset.id,
      notificationId: notification.id,
      onboardingWeddingId: smokeWedding.id,
      onboardingVendorId: smokeVendor.id,
    };

    throw new Error(rollbackToken);
  });
} catch (error) {
  if (error instanceof Error && error.message === rollbackToken && summary) {
    console.log(JSON.stringify({ ok: true, rolledBack: true, summary }, null, 2));
    process.exitCode = 0;
  } else {
    console.error(error);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
