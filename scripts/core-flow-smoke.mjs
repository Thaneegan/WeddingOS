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

const rollbackToken = "ROLLBACK_CORE_FLOW_SMOKE";
let summary = null;

try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { email: "maya@weddingos.local" },
    });
    const wedding = await tx.wedding.findUniqueOrThrow({
      where: { slug: "arjun-maya" },
    });
    const vendor = await tx.vendorBusiness.findUniqueOrThrow({
      where: { slug: "golden-lens-photography" },
      include: { services: { include: { category: true }, take: 1 } },
    });

    const service = vendor.services[0];
    const amountCents = service?.startingPriceCents ?? vendor.startingPriceCents;
    const depositCents = Math.round(amountCents * 0.35);

    const inquiry = await tx.inquiry.create({
      data: {
        weddingId: wedding.id,
        vendorBusinessId: vendor.id,
        serviceId: service?.id,
        message: "[Smoke] Quote request for the DB-backed booking flow.",
      },
    });

    const lead = await tx.lead.create({
      data: {
        inquiryId: inquiry.id,
        stage: "NEW_INQUIRY",
        estimatedValueCents: amountCents,
        lastMessage: inquiry.message,
      },
    });

    const conversation = await tx.conversation.create({
      data: {
        inquiryId: inquiry.id,
        weddingId: wedding.id,
        vendorBusinessId: vendor.id,
        messages: {
          create: {
            senderUserId: user.id,
            senderRole: "COUPLE",
            senderName: user.name,
            body: inquiry.message,
          },
        },
      },
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderRole: "VENDOR",
        senderName: vendor.name,
        body: "[Smoke] Proposal sent from vendor CRM.",
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        stage: "PROPOSAL_SENT",
        lastMessage: "[Smoke] Proposal sent from vendor CRM.",
      },
    });

    const budgetCategory = await tx.category.findFirstOrThrow({
      where: {
        type: "BUDGET",
        archivedAt: null,
        OR: [
          { scope: "GLOBAL", name: { equals: service?.category.name ?? "Photography", mode: "insensitive" } },
          { scope: "GLOBAL", slug: "budget-miscellaneous" },
        ],
      },
      orderBy: { slug: "asc" },
    });

    const booking = await tx.booking.create({
      data: {
        leadId: lead.id,
        weddingId: wedding.id,
        vendorBusinessId: vendor.id,
        serviceId: service?.id,
        amountCents,
        status: "CONFIRMED",
        paymentSchedule: {
          create: {
            label: "Deposit",
            amountCents: depositCents,
            dueDate: new Date(),
            status: "DEPOSIT_PAID",
          },
        },
        contracts: {
          create: {
            title: `${vendor.name} service agreement`,
            status: "DRAFT",
          },
        },
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: { stage: "BOOKED" },
    });

    const budgetItem = await tx.budgetItem.create({
      data: {
        weddingId: wedding.id,
        categoryId: budgetCategory.id,
        label: "[Smoke] Golden Lens confirmed booking",
        vendorBusinessId: vendor.id,
        amountCents,
        paidCents: depositCents,
        dueDate: new Date(),
        status: "DEPOSIT_PAID",
      },
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderRole: "VENDOR",
        senderName: vendor.name,
        body: "[Smoke] Booking confirmed with deposit and contract tracking.",
      },
    });

    const [messageCount, paymentCount, contractCount] = await Promise.all([
      tx.message.count({ where: { conversationId: conversation.id } }),
      tx.paymentScheduleItem.count({ where: { bookingId: booking.id } }),
      tx.contractRecord.count({ where: { bookingId: booking.id } }),
    ]);

    summary = {
      wedding: wedding.coupleNames,
      vendor: vendor.name,
      inquiryId: inquiry.id,
      leadId: lead.id,
      bookingId: booking.id,
      budgetItemId: budgetItem.id,
      messagesCreated: messageCount,
      paymentScheduleItems: paymentCount,
      contractRecords: contractCount,
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
