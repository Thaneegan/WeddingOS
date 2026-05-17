import { env, appPublicUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function getBetaReadinessData() {
  const [activeInvites, waitlistSignups, queuedNotifications, users, weddings, vendors] = await Promise.all([
    prisma.invite.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.waitlistSignup.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.notification.count({ where: { status: "QUEUED" } }),
    prisma.user.count(),
    prisma.wedding.count(),
    prisma.vendorBusiness.count(),
  ]);

  const checks = [
    { label: "Database configured", ok: Boolean(env.DATABASE_URL), detail: "PostgreSQL connection string is present." },
    { label: "Auth secret", ok: Boolean(env.AUTH_SECRET && !env.AUTH_SECRET.includes("replace-with")), detail: "Use a strong secret before opening the tunnel." },
    { label: "Route protection", ok: true, detail: "Private product routes require a signed-in session." },
    { label: "Public app URL", ok: Boolean(appPublicUrl), detail: appPublicUrl },
    { label: "Resend email", ok: env.EMAIL_PROVIDER_MODE === "dry_run" || Boolean(env.RESEND_API_KEY), detail: env.EMAIL_PROVIDER_MODE === "dry_run" ? "Dry-run mode" : "Resend key configured" },
    { label: "File storage", ok: env.STORAGE_PROVIDER_MODE === "database" || Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET), detail: env.STORAGE_PROVIDER_MODE === "database" ? "Metadata-only mode" : "R2 configuration present" },
    { label: "Tunnel URL", ok: Boolean(env.CLOUDFLARE_TUNNEL_URL), detail: env.CLOUDFLARE_TUNNEL_URL ?? "Not configured yet" },
    { label: "Seed/product data", ok: users > 0 && weddings > 0 && vendors > 0, detail: `${users} users, ${weddings} weddings, ${vendors} vendors` },
  ];

  return {
    checks,
    activeInvites,
    waitlistSignups,
    queuedNotifications,
  };
}
