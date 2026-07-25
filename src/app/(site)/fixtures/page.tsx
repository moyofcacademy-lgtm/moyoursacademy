import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FixtureStrip } from "@/components/fixture-strip";
import { EmptyState } from "@/components/ui/empty-state";
import { AGE_GROUPS } from "@/lib/constants";
import { cn, hoursAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fixtures",
  description: "Upcoming Moyours Sports Academy matches across all age groups.",
};

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ ageGroup?: string; competition?: string }>;
}) {
  const params = await searchParams;

  const [fixtures, competitions] = await Promise.all([
    prisma.fixture.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE", "POSTPONED"] },
        kickoffAt: { gte: hoursAgo(3) },
        ...(params.ageGroup ? { ageGroup: params.ageGroup } : {}),
        ...(params.competition ? { competition: params.competition } : {}),
      },
      orderBy: { kickoffAt: "asc" },
      include: { team: true, opponent: true, result: true },
    }),
    prisma.fixture.findMany({
      where: { kickoffAt: { gte: hoursAgo(90 * 24) } },
      select: { competition: true },
      distinct: ["competition"],
    }),
  ]);

  function filterHref(patch: { ageGroup?: string; competition?: string }) {
    const next = new URLSearchParams();
    const ageGroup = patch.ageGroup !== undefined ? patch.ageGroup : params.ageGroup;
    const competition = patch.competition !== undefined ? patch.competition : params.competition;
    if (ageGroup) next.set("ageGroup", ageGroup);
    if (competition) next.set("competition", competition);
    const qs = next.toString();
    return qs ? `/fixtures?${qs}` : "/fixtures";
  }

  return (
    <div className="mx-auto max-w-4xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">Fixtures</h1>
      <p className="mt-2 max-w-xl text-step-0 text-kit-soft">
        Come and support the squads — kickoff times are West Africa Time.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by age group">
        <FilterChip href={filterHref({ ageGroup: "" })} active={!params.ageGroup}>
          All ages
        </FilterChip>
        {AGE_GROUPS.map((g) => (
          <FilterChip key={g.key} href={filterHref({ ageGroup: g.key })} active={params.ageGroup === g.key}>
            {g.key}
          </FilterChip>
        ))}
      </div>
      {competitions.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by competition">
          <FilterChip href={filterHref({ competition: "" })} active={!params.competition}>
            All competitions
          </FilterChip>
          {competitions.map((c) => (
            <FilterChip
              key={c.competition}
              href={filterHref({ competition: c.competition })}
              active={params.competition === c.competition}
            >
              {c.competition}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {fixtures.length === 0 ? (
          <EmptyState title="No upcoming fixtures in this view — check back soon or follow us on social media." />
        ) : (
          fixtures.map((fixture) => (
            <FixtureStrip key={fixture.id} fixture={fixture} href={`/fixtures/${fixture.id}`} />
          ))
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-brand border px-3 py-1.5 text-step--1 font-semibold transition-colors",
        active ? "border-pitch bg-pitch text-chalk" : "border-line text-kit-soft hover:border-kit hover:text-kit",
      )}
    >
      {children}
    </Link>
  );
}
