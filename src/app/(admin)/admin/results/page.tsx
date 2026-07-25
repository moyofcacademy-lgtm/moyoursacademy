import { prisma } from "@/lib/prisma";
import { ResultsManager } from "./results-manager";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const [fixtures, players] = await Promise.all([
    prisma.fixture.findMany({
      where: { kickoffAt: { lte: new Date() } },
      orderBy: { kickoffAt: "desc" },
      take: 100,
      include: {
        team: true,
        opponent: true,
        result: { include: { events: true, media: true } },
      },
    }),
    prisma.player.findMany({
      where: { active: true },
      include: { registration: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-step-2">Results</h1>
      <p className="max-w-xl text-step--1 text-kit-soft">
        Attach a scoreline, scorers, and a match report to a played fixture.
        Publishing marks the fixture completed and shows it on the public site.
      </p>
      <ResultsManager
        fixtures={fixtures.map((f) => ({
          id: f.id,
          label: `${f.team.name} ${f.isHome ? "vs" : "at"} ${f.opponent.name}`,
          competition: f.competition,
          ageGroup: f.ageGroup,
          teamId: f.teamId,
          kickoffAtIso: f.kickoffAt.toISOString(),
          status: f.status,
          result: f.result
            ? {
                goalsFor: f.result.goalsFor,
                goalsAgainst: f.result.goalsAgainst,
                halfTimeFor: f.result.halfTimeFor,
                halfTimeAgainst: f.result.halfTimeAgainst,
                matchReport: f.result.matchReport ?? "",
                motmPlayerId: f.result.motmPlayerId ?? "",
                events: f.result.events.map((e) => ({
                  minute: e.minute,
                  type: e.type,
                  playerId: e.playerId ?? "",
                  playerNameFallback: e.playerNameFallback ?? "",
                })),
                photoCount: f.result.media.length,
              }
            : null,
        }))}
        players={players.map((p) => ({
          id: p.id,
          teamId: p.teamId,
          name: `${p.registration.firstName} ${p.registration.lastName}`,
          squadNumber: p.squadNumber,
        }))}
      />
    </div>
  );
}
