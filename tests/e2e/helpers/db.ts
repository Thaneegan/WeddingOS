import { PrismaClient, type InviteRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 1500,
    idleTimeoutMillis: 1000,
    max: 5,
  }),
});

export async function createInvite(code: string, role: InviteRole) {
  return prisma.invite.upsert({
    where: { code },
    update: {
      role,
      status: "ACTIVE",
      email: null,
      organizationId: null,
      weddingId: null,
      vendorBusinessId: null,
      acceptedByUserId: null,
      acceptedAt: null,
      expiresAt: null,
    },
    create: {
      code,
      role,
      status: "ACTIVE",
    },
  });
}

export async function deleteUserByEmail(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}
