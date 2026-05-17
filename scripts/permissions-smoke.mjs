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

const rollbackToken = "ROLLBACK_PERMISSIONS_SMOKE";
let summary = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { email: "maya@weddingos.local" },
      include: {
        weddingMemberships: true,
      },
    });
    const vendorUser = await tx.user.findUniqueOrThrow({
      where: { email: "golden@weddingos.local" },
      include: {
        memberships: {
          include: {
            organization: {
              include: { vendorBusinesses: true },
            },
          },
        },
      },
    });
    const wedding = await tx.wedding.findUniqueOrThrow({ where: { slug: "arjun-maya" } });
    const vendor = await tx.vendorBusiness.findUniqueOrThrow({ where: { slug: "golden-lens-photography" } });

    assert(user.weddingMemberships.some((membership) => membership.weddingId === wedding.id), "Seeded user lacks wedding access.");
    assert(
      vendorUser.memberships.some((membership) =>
        membership.organization.vendorBusinesses.some((business) => business.id === vendor.id),
      ),
      "Seeded vendor user lacks Golden Lens vendor access.",
    );

    const otherUser = await tx.user.create({
      data: {
        email: `smoke-other-${Date.now()}@weddingos.local`,
        name: "Smoke Other User",
        accountType: "COUPLE",
      },
    });
    const otherOrg = await tx.organization.create({
      data: {
        name: "Smoke Other Wedding Org",
        slug: `smoke-other-org-${Date.now()}`,
        type: "COUPLE",
        memberships: { create: { userId: otherUser.id, role: "OWNER" } },
      },
    });
    const otherWedding = await tx.wedding.create({
      data: {
        organizationId: otherOrg.id,
        coupleNames: "Smoke Other Couple",
        slug: `smoke-other-wedding-${Date.now()}`,
        date: new Date("2026-09-01T16:00:00.000Z"),
        location: "Toronto, Ontario",
        style: "Smoke test",
        budgetCents: 1000000,
        guestCount: 50,
        members: { create: { userId: otherUser.id, role: "OWNER" } },
      },
    });

    const otherCategory = await tx.category.create({
      data: {
        name: "Smoke Private Budget",
        slug: `smoke-private-budget-${Date.now()}`,
        type: "BUDGET",
        scope: "WEDDING",
        ownerWeddingId: otherWedding.id,
        color: "#191714",
        icon: "Lock",
      },
    });
    const ownCategory = await tx.category.create({
      data: {
        name: "Smoke Own Budget",
        slug: `smoke-own-budget-${Date.now()}`,
        type: "BUDGET",
        scope: "WEDDING",
        ownerWeddingId: wedding.id,
        color: "#c8a97e",
        icon: "Sparkles",
      },
    });
    const archivedCategory = await tx.category.create({
      data: {
        name: "Smoke Archived Budget",
        slug: `smoke-archived-budget-${Date.now()}`,
        type: "BUDGET",
        scope: "WEDDING",
        ownerWeddingId: wedding.id,
        archivedAt: new Date(),
      },
    });

    const visibleBudgetCategories = await tx.category.findMany({
      where: {
        type: "BUDGET",
        archivedAt: null,
        OR: [{ scope: "GLOBAL" }, { scope: "WEDDING", ownerWeddingId: wedding.id }],
      },
    });
    const visibleIds = new Set(visibleBudgetCategories.map((category) => category.id));

    assert(visibleIds.has(ownCategory.id), "Wedding-scoped category for own wedding is not visible.");
    assert(!visibleIds.has(otherCategory.id), "Other wedding private category leaked into current wedding.");
    assert(!visibleIds.has(archivedCategory.id), "Archived category leaked into creation-visible categories.");

    const vendorCategory = await tx.category.create({
      data: {
        name: "Smoke Vendor Service",
        slug: `smoke-vendor-service-${Date.now()}`,
        type: "VENDOR_SERVICE",
        scope: "VENDOR_BUSINESS",
        ownerVendorId: vendor.id,
      },
    });
    const visibleVendorCategories = await tx.category.findMany({
      where: {
        type: "VENDOR_SERVICE",
        archivedAt: null,
        OR: [{ scope: "GLOBAL" }, { scope: "VENDOR_BUSINESS", ownerVendorId: vendor.id }],
      },
    });

    assert(
      visibleVendorCategories.some((category) => category.id === vendorCategory.id),
      "Vendor-scoped service category is not visible to owning vendor.",
    );

    summary = {
      user: user.email,
      vendorUser: vendorUser.email,
      wedding: wedding.slug,
      vendor: vendor.slug,
      visibleBudgetCategories: visibleBudgetCategories.length,
      visibleVendorCategories: visibleVendorCategories.length,
      assertions: 6,
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
