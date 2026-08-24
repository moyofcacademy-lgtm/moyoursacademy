import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env — load it here for CLI commands.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

// Migrations run against DIRECT_URL when set (Supabase session pooler,
// port 5432 — the transaction pooler on 6543 can't hold migration locks),
// falling back to DATABASE_URL. Local development without either uses the
// embedded PGlite database — apply migrations with `npm run db:setup`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      "postgresql://unset:unset@localhost:5432/unset",
  },
});
