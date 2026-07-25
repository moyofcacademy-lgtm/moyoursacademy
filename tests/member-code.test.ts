/**
 * Verifies the two acceptance-critical properties of member code issuance:
 *
 * 1. Concurrency — N simultaneous accepts mint N distinct sequential codes
 *    (the per-year counter is an atomic UPSERT ... RETURNING; Postgres row
 *    locking serializes concurrent increments).
 * 2. Idempotency — the status-guarded claim (updateMany with a status filter)
 *    lets exactly one accept win per registration; a second accept is a no-op.
 *
 * Run: NODE_OPTIONS=--conditions=react-server npx tsx tests/member-code.test.ts
 * (stop `next dev` first — the embedded PGlite database is single-process)
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { nextMemberCode } from "../src/lib/codes";

async function makeRegistration(n: number) {
  return prisma.registration.create({
    data: {
      reference: `MOY-REF-TEST${String(n).padStart(2, "0")}`,
      firstName: `Test${n}`,
      lastName: "Player",
      dateOfBirth: new Date("2015-06-01T00:00:00Z"),
      gender: "MALE",
      guardianName: "Test Guardian",
      guardianPhone: "+2348012345678",
      guardianEmail: "guardian@example.com",
      address: "1 Test Street, Abuja",
      consentMedical: true,
      consentMedia: true,
      consentTerms: true,
      status: "SUBMITTED",
      paymentStatus: "PROOF_SUBMITTED",
      ageGroup: "U11",
    },
  });
}

async function main() {
  // clean slate for test rows
  await prisma.player.deleteMany({ where: { registration: { reference: { startsWith: "MOY-REF-TEST" } } } });
  await prisma.registration.deleteMany({ where: { reference: { startsWith: "MOY-REF-TEST" } } });

  // --- 1. concurrent code minting -------------------------------------
  const before = await prisma.memberCodeCounter.findUnique({
    where: { year: new Date().getFullYear() },
  });
  const startValue = before?.value ?? 0;

  const codes = await Promise.all(
    Array.from({ length: 8 }, () =>
      prisma.$transaction((tx) => nextMemberCode(tx)),
    ),
  );
  assert.equal(new Set(codes).size, 8, "concurrent accepts must mint distinct codes");
  const numbers = codes.map((c) => Number(c.slice(-4))).sort((a, b) => a - b);
  assert.deepEqual(
    numbers,
    Array.from({ length: 8 }, (_, i) => startValue + i + 1),
    "codes must be sequential with no gaps",
  );
  console.log(`PASS concurrency: 8 distinct sequential codes (${codes[0]}…)`);

  // --- 2. idempotent accept claim ---------------------------------------
  const reg = await makeRegistration(1);
  const claims = await Promise.all(
    Array.from({ length: 5 }, () =>
      prisma.registration.updateMany({
        where: { id: reg.id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        data: { status: "ACCEPTED", paymentStatus: "VERIFIED" },
      }),
    ),
  );
  const winners = claims.filter((c) => c.count === 1).length;
  assert.equal(winners, 1, "exactly one accept may win the claim");
  console.log("PASS idempotency: 5 simultaneous accepts → 1 winner, 4 no-ops");

  // cleanup
  await prisma.registration.deleteMany({ where: { reference: { startsWith: "MOY-REF-TEST" } } });

  console.log("All member-code tests passed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
