import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FixtureStrip } from "@/components/fixture-strip";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Match results and reports from Moyours Football Club Academy squads.",
};

export const revalidate = 300;

export default async function ResultsPage() {
  const fixtures = await prisma.fixture.findMany({
    where: { status: "COMPLETED", result: { isNot: null } },
    orderBy: { kickoffAt: "desc" },
    take: 50,
    include: { team: true, opponent: true, result: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">Results</h1>
      <p className="mt-2 max-w-xl text-step-0 text-kit-soft">
        Every match tells us something. Tap a scoreline for the full report.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {fixtures.length === 0 ? (
          <EmptyState title="No results published yet the season is just getting started." />
        ) : (
          fixtures.map((fixture) => (
            <FixtureStrip
              key={fixture.id}
              fixture={fixture}
              href={`/results/${fixture.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
