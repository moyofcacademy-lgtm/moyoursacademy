import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// With DATABASE_URL set (Neon/Supabase/any Postgres) we connect through the
// pg driver adapter. Without it — local development only — we fall back to an
// embedded PGlite database stored in .pglite/ so the app runs with zero setup.
// PGlite is single-process: stop `next dev` before running seed scripts.
function createAdapter() {
  const url = process.env.DATABASE_URL;
  if (url) {
    return new PrismaPg(url);
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is required in deployed environments.");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("DATABASE_URL not set — using embedded PGlite database (local builds only).");
  }
  // Lazy requires keep PGlite out of the production bundle entirely.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPGlite } = require("pglite-prisma-adapter") as typeof import("pglite-prisma-adapter");
  return new PrismaPGlite(new PGlite(pgliteDataDir()));
}

/**
 * PGlite supports exactly ONE process per data directory — concurrent access
 * corrupts it and every later open dies with "Aborted()". `next build`
 * collects page data with several parallel workers, so each worker gets its
 * own throwaway copy of the datadir instead of the live one. Workers only
 * read, so discarding the copies afterwards loses nothing.
 */
function pgliteDataDir(): string {
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    return ".pglite";
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("node:os") as typeof import("node:os");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path") as typeof import("node:path");
  const source = path.resolve(".pglite");
  if (!fs.existsSync(source)) {
    return ".pglite"; // nothing to copy — first run, let PGlite create it
  }
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "moyours-pglite-build-"));
  fs.cpSync(source, copy, { recursive: true });
  return copy;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
