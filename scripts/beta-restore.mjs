import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("Usage: npm run beta:restore -- <backup.sql>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";
const result = spawnSync("psql", [databaseUrl, "--file", file], { stdio: "inherit", shell: true });

if (result.status !== 0) {
  console.error("psql restore failed. Install PostgreSQL client tools or restore manually.");
  process.exit(result.status ?? 1);
}

console.log(JSON.stringify({ ok: true, file }, null, 2));
