import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";
const backupDir = join(process.cwd(), "backups");
mkdirSync(backupDir, { recursive: true });
const file = join(backupDir, `wedding-os-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`);
const result = spawnSync("pg_dump", [databaseUrl, "--file", file], { stdio: "inherit", shell: true });

if (result.status !== 0) {
  console.error("pg_dump failed. Install PostgreSQL client tools or run a manual backup.");
  process.exit(result.status ?? 1);
}

console.log(JSON.stringify({ ok: true, file }, null, 2));
