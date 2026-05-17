import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const bookingPlans = [
  {
    serviceSlug: "photography",
    fallbackVendorNames: ["The Wedding Stories", "Golden Lens Photography", "Gulati Photography"],
    amountCents: 680000,
    label: "Photo coverage confirmed booking",
  },
  {
    serviceSlug: "videography",
    fallbackVendorNames: ["Impact Vision Memories", "Parallel Weddings", "Velvet Veedu Films"],
    amountCents: 620000,
    label: "Video coverage confirmed booking",
  },
  {
    serviceSlug: "catering",
    fallbackVendorNames: ["Kumaran Kalyana Catering", "Saffron & Sage Catering"],
    amountCents: 1480000,
    label: "Reception catering confirmed booking",
  },
];

async function pickWedding() {
  return (
    (await prisma.wedding.findFirst({
      where: { coupleNames: { contains: "Nila", mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    })) ??
    (await prisma.wedding.findFirst({
      orderBy: { createdAt: "desc" },
    }))
  );
}

async function findService(plan) {
  const service =
    (await prisma.vendorService.findFirst({
      where: {
        category: { slug: plan.serviceSlug },
        vendorBusiness: { name: { in: plan.fallbackVendorNames } },
      },
      include: { vendorBusiness: true, category: true },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.vendorService.findFirst({
      where: { category: { slug: plan.serviceSlug } },
      include: { vendorBusiness: true, category: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!service) throw new Error(`No vendor service found for ${plan.serviceSlug}.`);
  return service;
}

async function findBudgetCategory(weddingId, serviceCategoryName) {
  return (
    (await prisma.category.findFirst({
      where: {
        type: "BUDGET",
        archivedAt: null,
        OR: [
          { scope: "WEDDING", ownerWeddingId: weddingId, name: { equals: serviceCategoryName, mode: "insensitive" } },
          { scope: "GLOBAL", name: { equals: serviceCategoryName, mode: "insensitive" } },
        ],
      },
    })) ??
    (await prisma.category.findFirst({
      where: { type: "BUDGET", archivedAt: null, slug: "budget-miscellaneous" },
    })) ??
    (await prisma.category.create({
      data: {
        name: "Miscellaneous",
        slug: `miscellaneous-${weddingId}`,
        type: "BUDGET",
        scope: "WEDDING",
        ownerWeddingId: weddingId,
        color: "#c8a97e",
        icon: "Wallet",
      },
    }))
  );
}

async function ensureBooking(wedding, plan) {
  const service = await findService(plan);
  const existing = await prisma.booking.findFirst({
    where: {
      weddingId: wedding.id,
      vendorBusinessId: service.vendorBusinessId,
      serviceId: service.id,
    },
    include: { vendorBusiness: true },
  });

  if (existing) {
    return { vendor: existing.vendorBusiness.name, created: false };
  }

  const existingVendorBooking = await prisma.booking.findFirst({
    where: {
      weddingId: wedding.id,
      vendorBusinessId: service.vendorBusinessId,
    },
    include: { vendorBusiness: true },
  });

  if (existingVendorBooking) {
    return { vendor: existingVendorBooking.vendorBusiness.name, created: false };
  }

  const depositCents = Math.round(plan.amountCents * 0.35);
  const budgetCategory = await findBudgetCategory(wedding.id, service.category.name);

  const result = await prisma.$transaction(async (tx) => {
    const inquiryMessage = `Confirming ${service.category.name.toLowerCase()} coverage for ${wedding.coupleNames}.`;
    const existingInquiry = await tx.inquiry.findFirst({
      where: {
        weddingId: wedding.id,
        vendorBusinessId: service.vendorBusinessId,
      },
      include: { lead: { include: { booking: true } } },
    });

    const inquiry = existingInquiry
      ? await tx.inquiry.update({
          where: { id: existingInquiry.id },
          data: {
            serviceId: service.id,
            message: inquiryMessage,
          },
        })
      : await tx.inquiry.create({
          data: {
            weddingId: wedding.id,
            vendorBusinessId: service.vendorBusinessId,
            serviceId: service.id,
            message: inquiryMessage,
          },
        });

    if (existingInquiry?.lead?.booking) {
      return existingInquiry.lead.booking;
    }

    const lead = existingInquiry?.lead
      ? await tx.lead.update({
          where: { id: existingInquiry.lead.id },
          data: {
            stage: "BOOKED",
            estimatedValueCents: plan.amountCents,
            lastMessage: "Booking confirmed in Wedding OS.",
          },
        })
      : await tx.lead.create({
          data: {
            inquiryId: inquiry.id,
            stage: "BOOKED",
            estimatedValueCents: plan.amountCents,
            lastMessage: "Booking confirmed in Wedding OS.",
          },
        });

    const conversation = await tx.conversation.upsert({
      where: { inquiryId: inquiry.id },
      update: {},
      create: {
        inquiryId: inquiry.id,
        weddingId: wedding.id,
        vendorBusinessId: service.vendorBusinessId,
      },
    });

    const booking = await tx.booking.create({
      data: {
        leadId: lead.id,
        weddingId: wedding.id,
        vendorBusinessId: service.vendorBusinessId,
        serviceId: service.id,
        amountCents: plan.amountCents,
        status: "CONFIRMED",
        notes: "Seeded confirmed booking for local product testing.",
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
            title: `${service.vendorBusiness.name} service agreement`,
            status: "DRAFT",
          },
        },
      },
    });

    await tx.budgetItem.create({
      data: {
        weddingId: wedding.id,
        categoryId: budgetCategory.id,
        label: `${service.vendorBusiness.name} - ${plan.label}`,
        vendorBusinessId: service.vendorBusinessId,
        amountCents: plan.amountCents,
        paidCents: depositCents,
        dueDate: new Date(),
        status: "DEPOSIT_PAID",
      },
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderRole: "VENDOR",
        senderName: service.vendorBusiness.name,
        body: `Confirmed: ${service.name} is booked for ${wedding.coupleNames}. Deposit and contract tracking have been added to Wedding OS.`,
      },
    });

    return booking;
  });

  return { vendor: service.vendorBusiness.name, bookingId: result.id, created: true };
}

async function main() {
  const wedding = await pickWedding();
  if (!wedding) throw new Error("No wedding found.");

  const results = [];
  for (const plan of bookingPlans) {
    results.push(await ensureBooking(wedding, plan));
  }

  console.log(
    JSON.stringify(
      {
        wedding: wedding.coupleNames,
        created: results.filter((result) => result.created).length,
        bookings: results,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
