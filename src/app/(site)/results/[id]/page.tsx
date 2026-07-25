import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FixtureStrip } from "@/components/fixture-strip";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: { team: true, opponent: true, result: true },
  });
  if (!fixture?.result) return { title: "Result" };
  return {
    title: `${fixture.team.name} ${fixture.result.goalsFor}–${fixture.result.goalsAgainst} ${fixture.opponent.name}`,
    description: fixture.result.matchReport?.slice(0, 160) ?? `${fixture.competition} result`,
  };
}

const EVENT_ICONS: Record<string, string> = {
  GOAL: "⚽",
  ASSIST: "🅰",
  YELLOW: "🟨",
  RED: "🟥",
  SUB: "🔁",
};

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      team: true,
      opponent: true,
      result: {
        include: {
          events: { orderBy: { minute: "asc" }, include: { player: { include: { registration: { select: { firstName: true, lastName: true } } } } } },
          media: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!fixture?.result) notFound();
  const result = fixture.result;

  const motm = result.motmPlayerId
    ? await prisma.player.findUnique({
        where: { id: result.motmPlayerId },
        include: { registration: { select: { firstName: true, lastName: true } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-[var(--gutter)] py-12">
      <Link href="/results" className="text-step--1 font-semibold text-kit-soft underline-offset-4 hover:underline">
        ← All results
      </Link>

      <div className="mt-4">
        <FixtureStrip fixture={fixture} />
      </div>

      {(result.halfTimeFor != null || motm) && (
        <div className="mt-4 flex flex-wrap gap-4 text-step--1 text-kit-soft">
          {result.halfTimeFor != null && (
            <p>
              Half-time:{" "}
              <span className="font-mono font-bold text-kit">
                {fixture.isHome
                  ? `${result.halfTimeFor}–${result.halfTimeAgainst}`
                  : `${result.halfTimeAgainst}–${result.halfTimeFor}`}
              </span>
            </p>
          )}
          {motm && (
            <p>
              Player of the match:{" "}
              <span className="font-semibold text-kit">
                {motm.registration.firstName} {motm.registration.lastName}
              </span>
            </p>
          )}
        </div>
      )}

      {result.events.length > 0 && (
        <section aria-labelledby="events-h" className="mt-8">
          <h2 id="events-h" className="font-display text-step-1">
            Key moments
          </h2>
          <ol className="mt-3 flex flex-col gap-1.5">
            {result.events.map((event) => (
              <li key={event.id} className="flex items-baseline gap-3 text-step--1">
                <span className="w-10 shrink-0 text-right font-mono font-bold text-pitch">
                  {event.minute}&rsquo;
                </span>
                <span aria-hidden>{EVENT_ICONS[event.type] ?? "•"}</span>
                <span>
                  {event.player
                    ? `${event.player.registration.firstName} ${event.player.registration.lastName}`
                    : event.playerNameFallback ?? "—"}
                  <span className="ml-2 text-kit-soft">
                    {event.type === "GOAL" && "Goal"}
                    {event.type === "ASSIST" && "Assist"}
                    {event.type === "YELLOW" && "Yellow card"}
                    {event.type === "RED" && "Red card"}
                    {event.type === "SUB" && "Substitution"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result.matchReport && (
        <section aria-labelledby="report-h" className="mt-8">
          <h2 id="report-h" className="font-display text-step-1">
            Match report
          </h2>
          <div className="rule-gold mt-3 max-w-2xl bg-white/60 p-5">
            {result.matchReport.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} className={cn("text-step-0 leading-relaxed", i > 0 && "mt-4")}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {result.media.length > 0 && (
        <section aria-labelledby="photos-h" className="mt-8">
          <h2 id="photos-h" className="font-display text-step-1">
            Match photos
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {result.media.map((asset) => (
              <Image
                key={asset.id}
                src={asset.url.includes("res.cloudinary.com") ? asset.url.replace("/upload/", "/upload/f_auto,q_auto,w_600/") : asset.url}
                alt={asset.caption ?? "Match photo"}
                width={asset.width ?? 600}
                height={asset.height ?? 400}
                className="aspect-[3/2] w-full rounded-brand border border-line object-cover"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
