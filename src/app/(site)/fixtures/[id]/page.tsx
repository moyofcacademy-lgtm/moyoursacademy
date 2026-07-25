import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FixtureStrip } from "@/components/fixture-strip";
import { formatKickoffWAT } from "@/lib/utils";
import { site } from "@/config/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: { team: true, opponent: true },
  });
  if (!fixture) return { title: "Fixture" };
  const title = `${fixture.team.name} ${fixture.isHome ? "vs" : "at"} ${fixture.opponent.name}`;
  return {
    title,
    description: `${fixture.competition} · ${formatKickoffWAT(fixture.kickoffAt)} · ${fixture.venue}`,
  };
}

export default async function FixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      team: { include: { players: { where: { active: true }, include: { registration: { select: { firstName: true, lastName: true } } }, orderBy: { squadNumber: "asc" } } } },
      opponent: true,
      result: true,
    },
  });
  if (!fixture) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${fixture.team.name} ${fixture.isHome ? "vs" : "at"} ${fixture.opponent.name}`,
    startDate: fixture.kickoffAt.toISOString(),
    location: { "@type": "Place", name: fixture.venue, address: site.city },
    organizer: { "@type": "SportsOrganization", name: site.name, url: site.url },
    eventStatus:
      fixture.status === "CANCELLED"
        ? "https://schema.org/EventCancelled"
        : fixture.status === "POSTPONED"
          ? "https://schema.org/EventPostponed"
          : "https://schema.org/EventScheduled",
  };

  return (
    <div className="mx-auto max-w-4xl px-[var(--gutter)] py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/fixtures" className="text-step--1 font-semibold text-kit-soft underline-offset-4 hover:underline">
        ← All fixtures
      </Link>

      <div className="mt-4">
        <FixtureStrip fixture={fixture} />
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="venue-h">
          <h2 id="venue-h" className="font-display text-step-1">
            Venue
          </h2>
          <p className="mt-2 text-step-0">{fixture.venue}</p>
          <p className="mt-1 font-mono text-step--1 text-kit-soft">
            {formatKickoffWAT(fixture.kickoffAt)}
          </p>
          {fixture.ticketNote && <p className="mt-3 text-step--1">{fixture.ticketNote}</p>}
          <a
            href={
              fixture.venueMapUrl ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fixture.venue + ", Abuja")}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center rounded-brand border border-line px-4 text-step--1 font-semibold hover:border-kit"
          >
            Open in Maps
          </a>
        </section>

        {fixture.team.players.length > 0 && (
          <section aria-labelledby="squad-h">
            <h2 id="squad-h" className="font-display text-step-1">
              {fixture.team.name} squad
            </h2>
            <ul className="mt-3 divide-y divide-line rounded-brand border border-line bg-white/60">
              {fixture.team.players.map((player) => (
                <li key={player.id} className="flex items-center gap-3 px-4 py-2 text-step--1">
                  <span className="w-8 font-mono font-bold text-pitch">
                    {player.squadNumber != null ? `#${player.squadNumber}` : "—"}
                  </span>
                  <span>
                    {player.registration.firstName} {player.registration.lastName}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {fixture.result && (
        <p className="mt-8">
          <Link
            href={`/results/${fixture.id}`}
            className="inline-flex h-11 items-center rounded-brand bg-gold px-5 text-step--1 font-semibold text-kit"
          >
            Read the match report
          </Link>
        </p>
      )}
    </div>
  );
}
