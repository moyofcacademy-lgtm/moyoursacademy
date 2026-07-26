import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";

/** Unambiguous alphabet — no 0/O/1/I — for guardian-facing references. */
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateCampReference(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }
  return `MOY-CAMP-${out}`;
}

export function generateReference(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }
  return `MOY-REF-${out}`;
}

/**
 * Mint the next member code (MOY-YYYY-XXXX) inside a transaction.
 * A per-year counter row is incremented with an atomic UPSERT ... RETURNING,
 * so two admins accepting simultaneously always get distinct codes — no
 * count()+1 races, uniqueness is enforced at the database level.
 */
export async function nextMemberCode(
  tx: Prisma.TransactionClient,
  year: number = new Date().getFullYear(),
): Promise<string> {
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "MemberCodeCounter" ("year", "value")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "value" = "MemberCodeCounter"."value" + 1
    RETURNING "value"
  `;
  const value = rows[0].value;
  return `MOY-${year}-${String(value).padStart(4, "0")}`;
}
