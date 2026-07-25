import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { AGE_GROUPS } from "@/lib/constants";
import { getFees } from "@/lib/settings";
import { formatNaira, hoursAgo } from "@/lib/utils";
import { MoyoursCrest } from "@/components/logo";
import { FixtureStrip } from "@/components/fixture-strip";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
import { CoachPortrait } from "@/components/coach-portrait";

export const revalidate = 300;

async function heroSlides(): Promise<HeroSlide[]> {
  // Curated hero photos first (the pinned "Homepage hero" album in admin) …
  const album = await prisma.album.findUnique({
    where: { slug: "homepage-hero" },
    include: { assets: { orderBy: { sortOrder: "asc" }, take: 8 } },
  });
  if (album && album.assets.length > 0) {
    return album.assets.map((asset) => ({ url: asset.url, caption: asset.caption }));
  }
  // … otherwise fall back to accepted players with photos and media consent.
  const players = await prisma.player.findMany({
    where: {
      active: true,
      registration: { consentMedia: true, playerPhotoUrl: { not: null } },
    },
    take: 8,
    orderBy: { joinedAt: "desc" },
    include: { registration: { select: { firstName: true, playerPhotoUrl: true, ageGroup: true } } },
  });
  return players
    .filter((p) => p.registration.playerPhotoUrl)
    .map((p) => ({
      url: p.registration.playerPhotoUrl!,
      caption: `${p.registration.firstName} · ${p.registration.ageGroup ?? "Moyours"}`,
    }));
}

export default async function HomePage() {
  const [nextFixture, recentResults, fees, slides, coaches] = await Promise.all([
    prisma.fixture.findFirst({
      where: { status: { in: ["SCHEDULED", "LIVE"] }, kickoffAt: { gte: hoursAgo(3) } },
      orderBy: { kickoffAt: "asc" },
      include: { team: true, opponent: true, result: true },
    }),
    prisma.fixture.findMany({
      where: { status: "COMPLETED", result: { isNot: null } },
      orderBy: { kickoffAt: "desc" },
      take: 2,
      include: { team: true, opponent: true, result: true },
    }),
    getFees(),
    heroSlides(),
    prisma.coach.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: site.name,
    sport: "Football",
    url: site.url,
    email: site.email,
    telephone: `+234${site.phones[0].slice(1)}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Suite A05, Tsukunda House",
      addressLocality: "Central Business District, Abuja",
      addressCountry: "NG",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero — the one orchestrated moment */}
      <section className="bg-pitch text-chalk">
        <div className="mx-auto grid max-w-6xl gap-10 px-[var(--gutter)] pb-14 pt-16 sm:pt-20 lg:grid-cols-[1fr_400px] lg:items-start">
          <div className="stagger flex flex-col gap-8">
            <MoyoursCrest size={72} />
            <div className="max-w-2xl">
              <h1 className="font-display text-step-3 sm:text-step-4">
                Where Abuja&apos;s young footballers grow.
              </h1>
              <p className="mt-5 max-w-xl text-step-0 text-chalk-dim sm:text-step-1">
                Structured training for boys and girls aged 4–18 — skill, teamwork,
                character, and a pathway to opportunity. More than an academy, a family.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/enroll"
                className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
              >
                Enroll your child
              </Link>
              <Link
                href="/programs"
                className="inline-flex h-12 items-center rounded-brand border border-chalk-dim/40 px-6 text-step-0 text-chalk hover:border-chalk"
              >
                See our programs
              </Link>
            </div>
            {nextFixture && (
              <div>
                <p className="mb-2 font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
                  Next match
                </p>
                <FixtureStrip
                  fixture={nextFixture}
                  href={`/fixtures/${nextFixture.id}`}
                  className="border border-pitch-mid bg-pitch-deep"
                />
              </div>
            )}
          </div>
          {slides.length > 0 && (
            <div className="animate-rise lg:sticky lg:top-24">
              <HeroCarousel slides={slides} />
              <p className="mt-2 text-right font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
                <Link href="/squads" className="underline-offset-4 hover:underline">
                  Meet the squads →
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Programs */}
      <section aria-labelledby="programs-heading" className="mx-auto max-w-6xl px-[var(--gutter)] py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 id="programs-heading" className="font-display text-step-2">
            Four age groups, one pathway
          </h2>
          <Link href="/programs" className="text-step--1 font-semibold underline-offset-4 hover:underline">
            All programs
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AGE_GROUPS.map((group) => (
            <Link
              key={group.key}
              href="/programs"
              className="group rounded-brand border border-line bg-white/50 p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
            >
              <p className="font-mono text-step-2 font-bold text-pitch">{group.key}</p>
              <p className="mt-1 font-display text-step-0">{group.label}</p>
              <p className="mt-2 text-step--1 text-kit-soft">
                {group.key === "U7" && "First touches, big smiles — football through play."}
                {group.key === "U11" && "Core technique: control, passing, and confidence."}
                {group.key === "U15" && "Tactical understanding and competitive matches."}
                {group.key === "U18" && "Performance training and exposure to opportunity."}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent results */}
      {recentResults.length > 0 && (
        <section aria-labelledby="results-heading" className="bg-pitch-deep py-16 text-chalk">
          <div className="mx-auto max-w-6xl px-[var(--gutter)]">
            <div className="flex items-end justify-between gap-4">
              <h2 id="results-heading" className="font-display text-step-2">
                Recent results
              </h2>
              <Link href="/results" className="text-step--1 font-semibold text-chalk-dim underline-offset-4 hover:text-chalk hover:underline">
                All results
              </Link>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {recentResults.map((fixture) => (
                <FixtureStrip
                  key={fixture.id}
                  fixture={fixture}
                  href={`/results/${fixture.id}`}
                  className="border border-pitch-mid"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Coaches */}
      <section aria-labelledby="coaches-heading" className="mx-auto max-w-6xl px-[var(--gutter)] py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 id="coaches-heading" className="font-display text-step-2">
            Coaches who care
          </h2>
          <Link href="/coaches" className="text-step--1 font-semibold underline-offset-4 hover:underline">
            Meet the team
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coaches.map((coach) => (
            <div key={coach.id} className="flex items-center gap-3 rounded-brand border border-line bg-white/50 p-5">
              <CoachPortrait name={coach.name} photoUrl={coach.photoUrl} size={52} />
              <div className="min-w-0">
                <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
                  {coach.ageGroup}
                </p>
                <p className="mt-0.5 truncate font-display text-step-0">{coach.name}</p>
                <p className="truncate text-step--1 text-kit-soft">{coach.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enroll CTA */}
      <section className="bg-pitch text-chalk">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-[var(--gutter)] py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-step-2">Ready to join the family?</h2>
            <p className="mt-2 max-w-lg text-step-0 text-chalk-dim">
              Registration is {formatNaira(fees.initialTotalKobo)} including two sets of
              jerseys. Training holds Fridays and Saturdays at {site.address.split(",")[0]}.
            </p>
          </div>
          <Link
            href="/enroll"
            className="inline-flex h-12 shrink-0 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
          >
            Start enrollment
          </Link>
        </div>
      </section>
    </>
  );
}
