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

try {
  const activeTokens = await prisma.publicRSVPToken.findMany({
    where: {
      guestId: { not: null },
      usedAt: null,
    },
    orderBy: [{ guestId: "asc" }, { createdAt: "desc" }],
  });

  const byGuest = new Map();
  for (const token of activeTokens) {
    const rows = byGuest.get(token.guestId) ?? [];
    rows.push(token);
    byGuest.set(token.guestId, rows);
  }

  const duplicateIds = [];
  for (const tokens of byGuest.values()) {
    duplicateIds.push(...tokens.slice(1).map((token) => token.id));
  }

  let deleted = 0;
  if (duplicateIds.length) {
    const result = await prisma.publicRSVPToken.deleteMany({
      where: { id: { in: duplicateIds } },
    });
    deleted = result.count;
  }

  console.log(
    JSON.stringify(
      {
        checkedGuests: byGuest.size,
        activeTokens: activeTokens.length,
        duplicateActiveTokensRemoved: deleted,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
