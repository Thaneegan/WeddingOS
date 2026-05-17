import { z } from "zod";

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default(fallbackDatabaseUrl),
  AUTH_SECRET: z.string().min(24).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_PUBLIC_URL: z.string().url().optional(),
  BETA_MODE: z.enum(["true", "false"]).default("false"),
  LOCAL_AUTH_FALLBACK: z.enum(["true", "false"]).default("false"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  EMAIL_PROVIDER_MODE: z.enum(["dry_run", "resend"]).default("dry_run"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  STORAGE_PROVIDER_MODE: z.enum(["database", "r2"]).default("database"),
  CLOUDFLARE_TUNNEL_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL,
  BETA_MODE: process.env.BETA_MODE,
  LOCAL_AUTH_FALLBACK: process.env.LOCAL_AUTH_FALLBACK,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_PROVIDER_MODE: process.env.EMAIL_PROVIDER_MODE,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  STORAGE_PROVIDER_MODE: process.env.STORAGE_PROVIDER_MODE,
  CLOUDFLARE_TUNNEL_URL: process.env.CLOUDFLARE_TUNNEL_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

if (!process.env.DATABASE_URL && parsed.data.NODE_ENV !== "production") {
  console.warn("DATABASE_URL is not configured. Falling back to local Postgres on localhost:5433.");
}

export const env = parsed.data;
export const appPublicUrl = env.APP_PUBLIC_URL ?? env.NEXT_PUBLIC_APP_URL;
export { fallbackDatabaseUrl };
