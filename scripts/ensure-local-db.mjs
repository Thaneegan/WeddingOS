import { Client } from "pg";

const appUrl = new URL(
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public",
);
const databaseName = appUrl.pathname.replace(/^\//, "") || "wedding_os";
const maintenanceUrl = new URL(appUrl);
maintenanceUrl.pathname = "/postgres";
maintenanceUrl.search = "";

const client = new Client({ connectionString: maintenanceUrl.toString() });

try {
  await client.connect();
  const existing = await client.query("select 1 from pg_database where datname = $1", [databaseName]);

  if (existing.rowCount) {
    console.log(`Database ${databaseName} already exists.`);
  } else {
    await client.query(`create database ${JSON.stringify(databaseName)}`);
    console.log(`Created database ${databaseName}.`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
