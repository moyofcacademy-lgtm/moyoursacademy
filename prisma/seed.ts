import "./load-env";
import bcrypt from "bcryptjs";
import { REAL_COACHES } from "./real-coaches";
import { prisma } from "../src/lib/prisma";
import { SETTING_DEFAULTS } from "../src/lib/settings";

async function main() {
  // --- Admin -----------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@moyoursacademy.ng";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "moyours-admin-2026";
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Moyours Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "SUPER_ADMIN",
    },
  });
  console.log(`admin  ${adminEmail} (password: ${adminPassword})`);

  // --- Settings ---------------------------------------------------------
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }
  console.log("settings seeded");

  // --- Teams ------------------------------------------------------------
  const teamDefs = [
    { name: "Moyours U8", ageGroup: "U8", coachName: "Coach Abi Peter" },
    { name: "Moyours U11", ageGroup: "U11", coachName: "Coach Chukwuemeka Paul" },
    { name: "Moyours U14", ageGroup: "U14", coachName: "Coach Akinsanya David" },
    { name: "Moyours U17", ageGroup: "U17", coachName: "Coach Ani Patrick" },
  ];
  const teams: Record<string, string> = {};
  for (const def of teamDefs) {
    const existing = await prisma.team.findFirst({ where: { ageGroup: def.ageGroup } });
    const team = existing ?? (await prisma.team.create({ data: def }));
    teams[def.ageGroup] = team.id;
  }
  console.log("teams seeded");

  // --- Coaches --------------------------------------------------------------
  if ((await prisma.coach.count()) === 0) {
    const coachDefs = REAL_COACHES;
    let sortOrder = 0;
    for (const def of coachDefs) {
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
    }
    console.log("coaches seeded");
  }

  // --- Homepage hero album (pinned — its photos rotate in the hero) --------
  await prisma.album.upsert({
    where: { slug: "homepage-hero" },
    update: {},
    create: {
      slug: "homepage-hero",
      title: "Homepage hero",
      published: false, // never listed in the public gallery; hero reads it directly
    },
  });
  console.log("homepage-hero album ready");

  // --- Clubs (opponents) --------------------------------------------------
  const clubDefs = [
    { name: "Garki United FC", shortName: "GAR", city: "Abuja" },
    { name: "Wuse Warriors Academy", shortName: "WUS", city: "Abuja" },
    { name: "Kubwa Rangers", shortName: "KUB", city: "Abuja" },
    { name: "Lugbe City Colts", shortName: "LUG", city: "Abuja" },
    { name: "Nyanya Stars", shortName: "NYA", city: "Abuja" },
    { name: "Gwagwalada Giants", shortName: "GWA", city: "Gwagwalada" },
  ];
  const clubs: string[] = [];
  for (const def of clubDefs) {
    const existing = await prisma.club.findFirst({ where: { name: def.name } });
    const club = existing ?? (await prisma.club.create({ data: def }));
    clubs.push(club.id);
  }
  console.log("clubs seeded");

  // --- Fixtures + results -------------------------------------------------
  if ((await prisma.fixture.count()) === 0) {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    // 15:00 UTC = 4:00 PM WAT
    const at = (offsetDays: number, hourUtc: number) => {
      const d = new Date(now + offsetDays * day);
      d.setUTCHours(hourUtc, 0, 0, 0);
      return d;
    };

    const upcoming = [
      { team: "U14", opp: 0, comp: "Abuja Youth League", kickoff: at(3, 15), home: true, venue: "Moyours Training Ground, CBD" },
      { team: "U11", opp: 1, comp: "Friendly", kickoff: at(8, 10), home: false, venue: "Wuse Zone 4 Pitch" },
      { team: "U17", opp: 2, comp: "Abuja Youth League", kickoff: at(10, 15), home: true, venue: "Moyours Training Ground, CBD" },
    ];
    for (const f of upcoming) {
      await prisma.fixture.create({
        data: {
          competition: f.comp,
          ageGroup: f.team,
          teamId: teams[f.team],
          opponentId: clubs[f.opp],
          isHome: f.home,
          kickoffAt: f.kickoff,
          venue: f.venue,
          status: "SCHEDULED",
        },
      });
    }

    const past1 = await prisma.fixture.create({
      data: {
        competition: "Abuja Youth League",
        ageGroup: "U14",
        teamId: teams.U14,
        opponentId: clubs[3],
        isHome: true,
        kickoffAt: at(-6, 15),
        venue: "Moyours Training Ground, CBD",
        status: "COMPLETED",
      },
    });
    await prisma.result.create({
      data: {
        fixtureId: past1.id,
        goalsFor: 3,
        goalsAgainst: 1,
        halfTimeFor: 1,
        halfTimeAgainst: 1,
        matchReport:
          "A patient first half turned into a statement second. Two quick goals after the restart settled it, and the U14s saw the game out with real composure.",
        events: {
          create: [
            { minute: 21, type: "GOAL", playerNameFallback: "A. Yusuf" },
            { minute: 38, type: "GOAL", playerNameFallback: "Lugbe City Colts" },
            { minute: 52, type: "GOAL", playerNameFallback: "D. Okafor" },
            { minute: 57, type: "GOAL", playerNameFallback: "A. Yusuf" },
          ],
        },
      },
    });

    const past2 = await prisma.fixture.create({
      data: {
        competition: "Friendly",
        ageGroup: "U11",
        teamId: teams.U11,
        opponentId: clubs[4],
        isHome: false,
        kickoffAt: at(-13, 10),
        venue: "Nyanya Community Field",
        status: "COMPLETED",
      },
    });
    await prisma.result.create({
      data: {
        fixtureId: past2.id,
        goalsFor: 2,
        goalsAgainst: 2,
        halfTimeFor: 0,
        halfTimeAgainst: 1,
        matchReport:
          "Behind twice, level twice. A gutsy comeback on the road with both goals coming in the final quarter of the game.",
        events: {
          create: [
            { minute: 18, type: "GOAL", playerNameFallback: "Nyanya Stars" },
            { minute: 41, type: "GOAL", playerNameFallback: "S. Bello" },
            { minute: 49, type: "GOAL", playerNameFallback: "Nyanya Stars" },
            { minute: 58, type: "GOAL", playerNameFallback: "K. Adeleke" },
          ],
        },
      },
    });
    console.log("fixtures and results seeded");
  } else {
    console.log("fixtures already present — skipped");
  }

  // --- Demo registrations (dev only, skipped if any exist) -----------------
  if (process.env.NODE_ENV !== "production" && (await prisma.registration.count()) === 0) {
    const demo = [
      {
        reference: "MOY-REF-DEMO2A",
        firstName: "Amara",
        lastName: "Okonkwo",
        dateOfBirth: new Date("2016-03-14T00:00:00Z"),
        gender: "FEMALE" as const,
        preferredPosition: "Midfielder",
        guardianName: "Ngozi Okonkwo",
        guardianPhone: "+2348031112233",
        guardianEmail: "ngozi@example.com",
        address: "12 Ahmadu Bello Way, Garki, Abuja",
        ageGroup: "U11",
      },
      {
        reference: "MOY-REF-DEMO3B",
        firstName: "Ibrahim",
        lastName: "Sule",
        dateOfBirth: new Date("2012-08-02T00:00:00Z"),
        gender: "MALE" as const,
        preferredPosition: "Striker",
        guardianName: "Fatima Sule",
        guardianPhone: "+2348092223344",
        guardianEmail: "fatima@example.com",
        address: "4 Kwame Nkrumah Crescent, Asokoro, Abuja",
        ageGroup: "U14",
      },
      {
        reference: "MOY-REF-DEMO4C",
        firstName: "Daniel",
        lastName: "Eze",
        dateOfBirth: new Date("2020-01-20T00:00:00Z"),
        gender: "MALE" as const,
        guardianName: "Chidi Eze",
        guardianPhone: "+2347051234567",
        guardianEmail: "chidi@example.com",
        address: "22 Gana Street, Maitama, Abuja",
        ageGroup: "U8",
      },
    ];
    for (const d of demo) {
      await prisma.registration.create({
        data: {
          ...d,
          consentMedical: true,
          consentMedia: true,
          consentTerms: true,
          status: "SUBMITTED",
          paymentStatus: "PROOF_SUBMITTED",
          payments: {
            create: {
              type: "INITIAL",
              amountKobo: 180_000_00,
              status: "PROOF_SUBMITTED",
              proofUrl: "https://res.cloudinary.com/dev-mock/moyours/proofs/demo.jpg",
              proofPublicId: `moyours/proofs/dev-demo-${d.reference}`,
              proofFormat: "jpg",
              proofBytes: 240_000,
              depositorName: d.guardianName,
              paidAt: new Date(),
            },
          },
        },
      });
    }
    console.log("demo registrations seeded");
  }

  // --- Dev-only demo showcase: accepted players with photos + hero slides --
  // Uses Cloudinary's public demo cloud so the carousel and squad cards have
  // real images locally. Never runs in production or when data already exists.
  if (process.env.NODE_ENV !== "production") {
    const demoCloud = "https://res.cloudinary.com/demo/image/upload";
    const acceptable = await prisma.registration.findMany({
      where: { status: "SUBMITTED", reference: { in: ["MOY-REF-DEMO2A", "MOY-REF-DEMO3B"] } },
    });
    const demoPhotos = [`${demoCloud}/samples/people/boy-snow-hoodie.jpg`, `${demoCloud}/samples/people/smiling-man.jpg`];
    let photoIndex = 0;
    for (const reg of acceptable) {
      const year = new Date().getFullYear();
      await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ value: number }[]>`
          INSERT INTO "MemberCodeCounter" ("year", "value") VALUES (${year}, 1)
          ON CONFLICT ("year") DO UPDATE SET "value" = "MemberCodeCounter"."value" + 1
          RETURNING "value"`;
        const memberCode = `MOY-${year}-${String(rows[0].value).padStart(4, "0")}`;
        const team = reg.ageGroup ? await tx.team.findFirst({ where: { ageGroup: reg.ageGroup } }) : null;
        await tx.registration.update({
          where: { id: reg.id },
          data: {
            status: "ACCEPTED",
            paymentStatus: "VERIFIED",
            memberCode,
            playerPhotoUrl: demoPhotos[photoIndex % demoPhotos.length],
            playerPhotoPublicId: `demo-seed-${photoIndex}`,
          },
        });
        await tx.player.create({
          data: { memberCode, registrationId: reg.id, teamId: team?.id ?? null, squadNumber: 7 + photoIndex * 3 },
        });
      });
      photoIndex++;
      console.log(`demo player accepted: ${reg.firstName} ${reg.lastName}`);
    }

    const heroAlbum = await prisma.album.findUnique({
      where: { slug: "homepage-hero" },
      include: { _count: { select: { assets: true } } },
    });
    if (heroAlbum && heroAlbum._count.assets === 0) {
      const slides = [
        { publicId: "cld-sample", caption: "Matchday at the CBD ground" },
        { publicId: "samples/people/boy-snow-hoodie", caption: "Amara · U11" },
        { publicId: "cld-sample-3", caption: "Training, every Friday and Saturday" },
      ];
      await prisma.mediaAsset.createMany({
        data: slides.map((s, i) => ({
          url: `${demoCloud}/${s.publicId}.jpg`,
          publicId: `demo-seed-hero-${i}`,
          caption: s.caption,
          albumId: heroAlbum.id,
          sortOrder: i,
        })),
      });
      console.log("demo hero slides seeded");
    }
  }

  // --- News ---------------------------------------------------------------
  if ((await prisma.post.count()) === 0) {
    await prisma.post.create({
      data: {
        title: "Registration is open for the new season",
        slug: "registration-open-new-season",
        excerpt:
          "Enrollment is now open for boys and girls aged 4–18. Training holds Fridays and Saturdays at our CBD ground.",
        body: "Enrollment is now open for boys and girls aged 4–18 across all four age groups. Training holds on Fridays from 4:00–6:00 PM and Saturdays from 11:30 AM–2:30 PM at our Central Business District ground.\n\nRegistration covers structured weekly sessions, two sets of jerseys, friendly matches, and seasonal programmes including summer camps. Start your child's enrollment from the Enroll page — the whole process takes about ten minutes.",
        published: true,
        publishedAt: new Date(),
      },
    });
    console.log("news seeded");
  }

  console.log("Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    // PGlite keeps the event loop alive after disconnect; exit explicitly.
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
