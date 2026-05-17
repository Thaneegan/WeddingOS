import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match || match[1].startsWith("#") || process.env[match[1]]) continue;
    process.env[match[1]] = (match[2] ?? "").replace(/^['"]|['"]$/g, "");
  }
}

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 1500, idleTimeoutMillis: 1000, max: 5 }),
});

const checks = [];
const add = (label, ok, detail) => checks.push({ label, ok, detail });

try {
  await prisma.$queryRaw`select 1`;
  const [users, weddings, vendors, activeInvites, queuedNotifications] = await Promise.all([
    prisma.user.count(),
    prisma.wedding.count(),
    prisma.vendorBusiness.count(),
    prisma.invite.count({ where: { status: "ACTIVE" } }),
    prisma.notification.count({ where: { status: "QUEUED" } }),
  ]);

  add("Database", true, connectionString.replace(/:[^:@/]+@/, ":***@"));
  add("Auth secret", Boolean(process.env.AUTH_SECRET && !process.env.AUTH_SECRET.includes("replace-with")), "AUTH_SECRET should be strong before opening a tunnel.");
  add("Beta mode", process.env.BETA_MODE === "true", "Set BETA_MODE=true for external local testers.");
  add("Public URL", Boolean(process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL), process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || "missing");
  add("Resend", !process.env.EMAIL_PROVIDER_MODE || process.env.EMAIL_PROVIDER_MODE === "dry_run" || Boolean(process.env.RESEND_API_KEY), process.env.EMAIL_PROVIDER_MODE ?? "dry_run");
  add("Storage", process.env.STORAGE_PROVIDER_MODE !== "r2" || Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET), process.env.STORAGE_PROVIDER_MODE ?? "database");
  add("Tunnel", Boolean(process.env.CLOUDFLARE_TUNNEL_URL), process.env.CLOUDFLARE_TUNNEL_URL ?? "not configured");
  add("Seed data", users > 0 && weddings > 0 && vendors > 0, `${users} users, ${weddings} weddings, ${vendors} vendors`);
  add("Invites", activeInvites > 0, `${activeInvites} active invites`);

  console.log(JSON.stringify({ ok: checks.every((check) => check.ok), checks, queuedNotifications }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
