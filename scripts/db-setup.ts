/**
 * Applies committed Prisma migrations, then seeds.
 *
 * - With DATABASE_URL: delegates to `prisma migrate deploy` (real Postgres).
 * - Without DATABASE_URL: applies migration SQL directly to the embedded
 *   PGlite database in .pglite/ (local development).
 *
 * Run: npm run db:setup
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// tsx doesn't auto-load .env; child processes inherit what we load here.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

async function applyToPGlite() {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(".pglite");
  await db.exec(
    `CREATE TABLE IF NOT EXISTS _applied_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  );
  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const dir of dirs) {
    const { rows } = await db.query<{ name: string }>(
      "SELECT name FROM _applied_migrations WHERE name = $1",
      [dir],
    );
    if (rows.length > 0) {
      console.log(`skip   ${dir} (already applied)`);
      continue;
    }
    const sql = readFileSync(path.join(MIGRATIONS_DIR, dir, "migration.sql"), "utf8");
    await db.exec(sql);
    await db.query("INSERT INTO _applied_migrations (name) VALUES ($1)", [dir]);
    console.log(`apply  ${dir}`);
  }
  await db.close();
}

async function main() {
  if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL set — running prisma migrate deploy");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } else {
    console.log("No DATABASE_URL — applying migrations to embedded PGlite (.pglite/)");
    await applyToPGlite();
  }
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
