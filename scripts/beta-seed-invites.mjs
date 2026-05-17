import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 1500, idleTimeoutMillis: 1000, max: 5 }),
});

try {
  const admin = await prisma.user.findFirst({ where: { memberships: { some: { organization: { type: "ADMIN" } } } } });
  if (!admin) throw new Error("No admin user found. Run npm run prisma:seed first.");
  const adminOrg = await prisma.organization.findFirstOrThrow({ where: { type: "ADMIN" } });
  const invites = [
    { code: "COUPLE-BETA-ARJUN", role: "COUPLE_OWNER" },
    { code: "VENDOR-BETA-GOLDEN", role: "VENDOR_OWNER" },
    { code: "ADMIN-BETA-LOCAL", role: "ADMIN", organizationId: adminOrg.id },
  ];

  for (const invite of invites) {
    await prisma.invite.upsert({
      where: { code: invite.code },
      update: { status: "ACTIVE", role: invite.role, organizationId: invite.organizationId, createdByUserId: admin.id },
      create: { ...invite, createdByUserId: admin.id },
    });
  }

  console.log(JSON.stringify({ ok: true, invites: invites.map((invite) => invite.code) }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
