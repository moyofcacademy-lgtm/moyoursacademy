import { existsSync } from "node:fs";

// tsx doesn't auto-load .env. This module is imported FIRST (before anything
// that reads DATABASE_URL) — ESM executes imports in declaration order.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}
