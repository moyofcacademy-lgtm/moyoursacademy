import { prisma } from "@/lib/prisma";
import { FixturesManager } from "./fixtures-manager";

export const dynamic = "force-dynamic";

export default async function AdminFixturesPage() {
  const [fixtures, teams, clubs] = await Promise.all([
    prisma.fixture.findMany({
      orderBy: { kickoffAt: "desc" },
      take: 200,
      include: { team: true, opponent: true, result: true },
    }),
    prisma.team.findMany({ orderBy: { ageGroup: "asc" } }),
    prisma.club.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-step-2">Fixtures</h1>
      <FixturesManager
        fixtures={fixtures.map((f) => ({
          id: f.id,
          competition: f.competition,
          ageGroup: f.ageGroup,
          teamId: f.teamId,
          teamName: f.team.name,
          opponentId: f.opponentId,
          opponentName: f.opponent.name,
          opponentShortName: f.opponent.shortName,
          opponentLogoUrl: f.opponent.logoUrl,
          isHome: f.isHome,
          kickoffAtIso: f.kickoffAt.toISOString(),
          venue: f.venue,
          venueMapUrl: f.venueMapUrl,
          status: f.status,
          ticketNote: f.ticketNote,
          hasResult: f.result != null,
          score: f.result ? `${f.result.goalsFor}–${f.result.goalsAgainst}` : null,
        }))}
        teams={teams.map((t) => ({ id: t.id, name: t.name, ageGroup: t.ageGroup }))}
        clubs={clubs.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, logoUrl: c.logoUrl }))}
      />
    </div>
  );
}
