/**
 * One-off data migration for the real-club rebrand (July 2026):
 * - Squads renamed to the club's real structure: U7→U8, U15→U14, U18→U17
 *   (U11 unchanged), applied to teams, fixtures, and registrations.
 * - Fictional seeded coaches replaced with the academy's real coaching staff.
 *
 * Idempotent — safe to run more than once. Run: npx tsx scripts/apply-rebrand.ts
 */
import "../prisma/load-env";
import { prisma } from "../src/lib/prisma";
import { REAL_COACHES } from "../prisma/real-coaches";

const RENAMES: { from: string; to: string; teamName: string; coachName: string }[] = [
  { from: "U7", to: "U8", teamName: "Moyours U8", coachName: "Coach Abi Peter" },
  { from: "U15", to: "U14", teamName: "Moyours U14", coachName: "Coach Akinsanya David" },
  { from: "U18", to: "U17", teamName: "Moyours U17", coachName: "Coach Ani Patrick" },
];

const OLD_COACH_NAMES = [
  "Coach Emeka Obi",
  "Coach Blessing Adamu",
  "Coach Musa Ibrahim",
  "Coach Tunde Bakare",
];

async function main() {
  for (const rename of RENAMES) {
    const teams = await prisma.team.updateMany({
      where: { ageGroup: rename.from },
      data: { ageGroup: rename.to, name: rename.teamName, coachName: rename.coachName },
    });
    const fixtures = await prisma.fixture.updateMany({
      where: { ageGroup: rename.from },
      data: { ageGroup: rename.to },
    });
    const registrations = await prisma.registration.updateMany({
      where: { ageGroup: rename.from },
      data: { ageGroup: rename.to },
    });
    console.log(
      `${rename.from} → ${rename.to}: ${teams.count} team, ${fixtures.count} fixtures, ${registrations.count} registrations`,
    );
  }
  await prisma.team.updateMany({
    where: { ageGroup: "U11" },
    data: { coachName: "Coach Chukwuemeka Paul" },
  });

  // Replace fictional seeded coaches (keeps any coach added by hand in admin).
  const removed = await prisma.coach.deleteMany({ where: { name: { in: OLD_COACH_NAMES } } });
  console.log(`removed ${removed.count} placeholder coaches`);

  let sortOrder = 0;
  for (const def of REAL_COACHES) {
    const existing = await prisma.coach.findFirst({ where: { name: def.name } });
    if (existing) {
      sortOrder++;
      continue;
    }
    await prisma.coach.create({
      data: {
        name: def.name,
        role: def.role,
        ageGroup: def.ageGroup,
        bio: def.bio,
        badges: [...def.badges],
        sortOrder: sortOrder++,
      },
    });
    console.log(`added ${def.name} — ${def.role}`);
  }

  console.log("Rebrand applied.");
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
