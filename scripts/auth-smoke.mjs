import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const coupleUser = await prisma.user.findUniqueOrThrow({
    where: { email: "maya@weddingos.local" },
    include: {
      weddingMemberships: { include: { wedding: true } },
    },
  });
  const vendorUser = await prisma.user.findUniqueOrThrow({
    where: { email: "golden@weddingos.local" },
    include: {
      memberships: {
        include: {
          organization: { include: { vendorBusinesses: true } },
        },
      },
    },
  });

  assert(coupleUser.accountType === "COUPLE", "Seeded local couple user has wrong account type.");
  assert(vendorUser.accountType === "VENDOR", "Seeded local vendor user has wrong account type.");
  assert(coupleUser.passwordHash, "Seeded local couple user is missing passwordHash.");
  assert(vendorUser.passwordHash, "Seeded local vendor user is missing passwordHash.");
  assert(await bcrypt.compare("weddingos-local", coupleUser.passwordHash), "Seeded local couple password does not validate.");
  assert(await bcrypt.compare("weddingos-local", vendorUser.passwordHash), "Seeded local vendor password does not validate.");
  assert(!(await bcrypt.compare("wrong-password", coupleUser.passwordHash)), "Invalid password unexpectedly validates.");
  assert(coupleUser.weddingMemberships.some((membership) => membership.wedding.slug === "arjun-maya"), "Seeded user lacks Arjun & Maya wedding membership.");
  assert(
    vendorUser.memberships.some((membership) =>
      membership.organization.vendorBusinesses.some((vendor) => vendor.slug === "golden-lens-photography"),
    ),
    "Seeded vendor user lacks Golden Lens vendor membership.",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        coupleUser: coupleUser.email,
        vendorUser: vendorUser.email,
        weddingMemberships: coupleUser.weddingMemberships.length,
        vendorMemberships: vendorUser.memberships.length,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
