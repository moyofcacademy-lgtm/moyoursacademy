import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { PROGRAM_PHASES } from "@/lib/constants";
import { getFees } from "@/lib/settings";
import { formatDateWAT, formatNaira, hoursAgo } from "@/lib/utils";
import { MoyoursCrest } from "@/components/logo";
import { CredentialBadges } from "@/components/credential-badges";
import { SponsorStrip } from "@/components/sponsor-strip";
import { FixtureStrip } from "@/components/fixture-strip";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
import { CoachPortrait } from "@/components/coach-portrait";
import { BallIcon, Minute } from "@/components/football";

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

const SERVICE_ICONS = [
  // home training
  "M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5",
  // mentorship
  "M8 21v-2a4 4 0 0 1 4-4 4 4 0 0 1 4 4v2M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
  // summer camps
  "M12 3v3m6.4-.4-2.1 2.1M21 12h-3M4 21h16M6 21c0-5 2.5-9 6-9s6 4 6 9",
  // international transfers
  "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z",
  // events management
  "M7 3v3m10-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 9 2 2 4-4",
];

export default async function HomePage() {
  const [nextFixture, recentResults, fees, slides, coaches, posts] = await Promise.all([
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
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true },
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: site.name,
    slogan: site.tagline,
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
      <section className="relative isolate overflow-hidden bg-pitch text-chalk">
        <div aria-hidden className="turf absolute inset-0 -z-10" />
        <div aria-hidden className="pitch-lines absolute inset-0 -z-10" />
        <div aria-hidden className="glow-gold absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl gap-10 px-[var(--gutter)] pb-14 pt-16 sm:pt-20 lg:grid-cols-[1fr_400px] lg:items-start">
          <div className="stagger flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <MoyoursCrest size={72} />
              <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold">
                FIFA &amp; NFF registered · Abuja · 9+ years
              </p>
            </div>
            <div className="max-w-2xl">
              <h1 className="font-display text-step-3 sm:text-step-4">
                Welcome to Moyours Football Club Academy.
              </h1>
              <p className="mt-5 max-w-xl text-step-0 text-chalk-dim sm:text-step-1">
                {site.heroTagline} For over 9 years we&apos;ve trained and mentored
                young athletes in Abuja — bridging grassroots football with
                international career opportunities.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/enroll"
                className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
              >
                Enroll now
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center rounded-brand border border-chalk-dim/40 px-6 text-step-0 text-chalk hover:border-chalk"
              >
                About us
              </Link>
            </div>
            <CredentialBadges />
            {nextFixture && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
                  <BallIcon size={13} className="text-gold" /> Next match
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
              <div className="overflow-hidden rounded-brand shadow-2xl ring-1 ring-chalk/15">
                <HeroCarousel slides={slides} />
              </div>
              <p className="mt-2 text-right font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
                <Link href="/squads" className="underline-offset-4 hover:underline">
                  Meet the squads →
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats band */}
      <section aria-label="Academy in numbers" className="reveal bg-pitch-deep text-chalk">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-[var(--gutter)] py-12 lg:grid-cols-4">
          {site.stats.map((stat) => (
            <div key={stat.label} className="rule-gold pt-4">
              <dd className="tabular font-mono text-step-3 font-bold text-gold">{stat.value}</dd>
              <dt className="mt-1 max-w-52 text-step--1 leading-relaxed text-chalk-dim">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Programs — the three phases */}
      <section aria-labelledby="programs-heading" className="reveal mx-auto max-w-6xl px-[var(--gutter)] py-16 sm:py-20">
        <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
          <Minute value="15" /> Academy programs
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h2 id="programs-heading" className="font-display text-step-2">
            One pathway, three phases
          </h2>
          <Link href="/programs" className="text-step--1 font-semibold underline-offset-4 hover:underline">
            All programs
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PROGRAM_PHASES.map((phase, index) => (
            <Link
              key={phase.key}
              href="/programs"
              className="group rounded-brand border border-line bg-white/50 p-6 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
            >
              <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-kit-soft">
                Phase {index + 1} · {phase.ages}
              </p>
              <p className="mt-2 font-display text-step-1 group-hover:underline">{phase.name}</p>
              <p className="mt-2 text-step--1 leading-relaxed text-kit-soft">{phase.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services-heading" className="reveal border-y border-line bg-white/40">
        <div className="mx-auto max-w-6xl px-[var(--gutter)] py-16 sm:py-20">
          <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
            <Minute value="30" /> What we offer
          </p>
          <h2 id="services-heading" className="mt-2 max-w-xl font-display text-step-2">
            Beyond the training ground
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {site.services.map((service, index) => (
              <div key={service.name} className="rounded-brand border border-line bg-white/60 p-6">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  aria-hidden
                  fill="none"
                  stroke="var(--color-pitch)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={SERVICE_ICONS[index]} />
                </svg>
                <h3 className="mt-4 font-display text-step-0">{service.name}</h3>
                <p className="mt-2 text-step--1 leading-relaxed text-kit-soft">
                  {service.description}
                </p>
              </div>
            ))}
            <div className="flex flex-col justify-between rounded-brand bg-pitch p-6 text-chalk">
              <p className="font-display text-step-0">
                Every programme is open to boys and girls aged 4–18.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex h-10 w-fit items-center rounded-brand bg-gold px-4 text-step--1 font-semibold text-kit"
              >
                Ask us anything
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured story — Danladi */}
      <section aria-labelledby="story-heading" className="reveal relative isolate overflow-hidden bg-pitch text-chalk">
        <div aria-hidden className="goal-net absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl gap-10 px-[var(--gutter)] py-16 sm:py-20 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div>
            <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-widest text-gold">
              <Minute value="45" light /> A Moyours story
            </p>
            <h2 id="story-heading" className="mt-2 font-display text-step-2">
              From the streets of Nigeria to trials at AC Milan.
            </h2>
            <p className="rule-gold mt-6 pt-4 font-display text-step-1 leading-snug text-chalk-dim">
              &ldquo;With opportunity, mentorship, and perseverance, even the
              biggest dreams can come true.&rdquo;
            </p>
          </div>
          <div className="max-w-2xl space-y-4 text-step-0 leading-relaxed text-chalk-dim">
            <p>
              Danladi&apos;s story reflects the heart of Moyours Academy. Discovered
              in 2016 by Coach Moyiwa, his raw talent and passion stood out — but
              financial challenges threatened his dream. Moyours stepped in,
              offering a scholarship that covered his training, kits, and meals.
            </p>
            <p>
              With dedication and support, Danladi rose quickly — excelling in
              Lagos trials, earning a place among the top five players, and later
              traveling to Manchester for international training. His journey
              reached its peak with trials at AC Milan.
            </p>
            <Link
              href="/support"
              className="inline-flex h-11 items-center rounded-brand bg-gold px-5 text-step--1 font-semibold text-kit transition-[filter] hover:brightness-105"
            >
              Sponsor the next Danladi
            </Link>
          </div>
        </div>
      </section>

      {/* Recent results */}
      {recentResults.length > 0 && (
        <section aria-labelledby="results-heading" className="reveal mx-auto max-w-6xl px-[var(--gutter)] py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 id="results-heading" className="font-display text-step-2">
              Recent results
            </h2>
            <Link href="/results" className="text-step--1 font-semibold underline-offset-4 hover:underline">
              All results
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {recentResults.map((fixture) => (
              <FixtureStrip
                key={fixture.id}
                fixture={fixture}
                href={`/results/${fixture.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Coaches */}
      <section aria-labelledby="coaches-heading" className="reveal mx-auto max-w-6xl px-[var(--gutter)] pb-16">
        <div className="flex items-end justify-between gap-4">
          <h2 id="coaches-heading" className="font-display text-step-2">
            Let&apos;s help coach you to greatness
          </h2>
          <Link href="/coaches" className="text-step--1 font-semibold underline-offset-4 hover:underline">
            Full coaching staff
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

      {/* Latest news */}
      {posts.length > 0 && (
        <section aria-labelledby="news-heading" className="reveal border-t border-line bg-white/40">
          <div className="mx-auto max-w-6xl px-[var(--gutter)] py-16">
            <div className="flex items-end justify-between gap-4">
              <h2 id="news-heading" className="font-display text-step-2">
                Latest from the academy
              </h2>
              <Link href="/news" className="text-step--1 font-semibold underline-offset-4 hover:underline">
                All news
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id}>
                  <Link
                    href={`/news/${post.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-brand border border-line bg-white/60 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
                  >
                    {post.coverUrl ? (
                      <Image
                        src={
                          post.coverUrl.includes("res.cloudinary.com")
                            ? post.coverUrl.replace("/upload/", "/upload/f_auto,q_auto,w_600/")
                            : post.coverUrl
                        }
                        alt=""
                        width={600}
                        height={340}
                        className="aspect-[16/9] w-full bg-pitch-deep/5 object-contain"
                      />
                    ) : (
                      <div aria-hidden className="rule-gold surface-pitch flex aspect-[16/9] w-full items-center justify-center">
                        <MoyoursCrest size={56} />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      {post.publishedAt && (
                        <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-kit-soft">
                          {formatDateWAT(post.publishedAt)}
                        </p>
                      )}
                      <h3 className="mt-1.5 font-display text-step-0 group-hover:underline">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 line-clamp-3 text-step--1 leading-relaxed text-kit-soft">
                          {post.excerpt}
                        </p>
                      )}
                      <span className="mt-auto pt-3 text-step--1 font-semibold text-pitch">
                        Read more →
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <SponsorStrip />

      {/* Enroll + support CTA */}
      <section className="reveal touchline relative isolate overflow-hidden bg-pitch text-chalk">
        <div aria-hidden className="turf absolute inset-0 -z-10" />
        <div aria-hidden className="glow-gold absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl gap-8 px-[var(--gutter)] py-16 sm:grid-cols-2">
          <div className="flex flex-col items-start gap-4">
            <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-widest text-gold"><Minute value="90+" light /> Full time</p>
            <h2 className="font-display text-step-2">Ready to join the family?</h2>
            <p className="max-w-md text-step-0 text-chalk-dim">
              Registration is {formatNaira(fees.initialTotalKobo)} including two
              sets of jerseys. Training holds Fridays and Saturdays at{" "}
              {site.address.split(",")[0]}.
            </p>
            <Link
              href="/enroll"
              className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
            >
              Start enrollment
            </Link>
          </div>
          <div className="flex flex-col items-start gap-4 border-t border-pitch-mid pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <h2 className="font-display text-step-2">Give a child the chance to play.</h2>
            <p className="max-w-md text-step-0 text-chalk-dim">
              35 of our players train on full scholarships. Your sponsorship
              covers kits, coaching, matches, and mentorship.
            </p>
            <Link
              href="/support"
              className="inline-flex h-12 items-center rounded-brand border border-chalk-dim/40 px-6 text-step-0 text-chalk hover:border-chalk"
            >
              Support the academy
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
