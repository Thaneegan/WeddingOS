import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match || match[1].startsWith("#") || process.env[match[1]]) continue;
    process.env[match[1]] = (match[2] ?? "").replace(/^['"]|['"]$/g, "");
  }
}

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";
const schema = z.object({
  DATABASE_URL: z.string().url().default(fallbackDatabaseUrl),
  AUTH_SECRET: z.string().min(24).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_PUBLIC_URL: z.string().url().optional(),
  BETA_MODE: z.enum(["true", "false"]).default("false"),
  LOCAL_AUTH_FALLBACK: z.enum(["true", "false"]).default("false"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  EMAIL_PROVIDER_MODE: z.enum(["dry_run", "resend"]).default("dry_run"),
  STORAGE_PROVIDER_MODE: z.enum(["database", "r2"]).default("database"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  CLOUDFLARE_TUNNEL_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const result = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL,
  BETA_MODE: process.env.BETA_MODE,
  LOCAL_AUTH_FALLBACK: process.env.LOCAL_AUTH_FALLBACK,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_PROVIDER_MODE: process.env.EMAIL_PROVIDER_MODE,
  STORAGE_PROVIDER_MODE: process.env.STORAGE_PROVIDER_MODE,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  CLOUDFLARE_TUNNEL_URL: process.env.CLOUDFLARE_TUNNEL_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!result.success) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.data.NODE_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required in production.");
    process.exit(1);
  }

  if (!result.data.AUTH_SECRET || result.data.AUTH_SECRET === "replace-with-a-long-random-secret-before-production") {
    console.error("AUTH_SECRET must be configured with a real secret in production.");
    process.exit(1);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      appUrl: result.data.APP_PUBLIC_URL ?? result.data.NEXT_PUBLIC_APP_URL,
      betaMode: result.data.BETA_MODE === "true",
      localAuthFallback: result.data.LOCAL_AUTH_FALLBACK === "true",
      emailProvider: result.data.EMAIL_PROVIDER_MODE,
      storageProvider: result.data.STORAGE_PROVIDER_MODE,
      tunnelConfigured: Boolean(result.data.CLOUDFLARE_TUNNEL_URL),
      productionReadySecret: result.data.AUTH_SECRET !== "replace-with-a-long-random-secret-before-production",
    },
    null,
    2,
  ),
);
