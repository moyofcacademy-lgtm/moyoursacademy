import { prisma } from "@/lib/prisma";
import { TeamsManager } from "./teams-manager";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { ageGroup: "asc" },
    include: {
      players: {
        where: { active: true },
        orderBy: { squadNumber: "asc" },
        include: { registration: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-step-2">Teams</h1>
      <p className="max-w-xl text-step--1 text-kit-soft">
        Squads by age group. Move players between squads or edit squad numbers
        from the Players page.
      </p>
      <TeamsManager
        teams={teams.map((team) => ({
          id: team.id,
          name: team.name,
          ageGroup: team.ageGroup,
          coachName: team.coachName ?? "",
          players: team.players.map((p) => ({
            id: p.id,
            name: `${p.registration.firstName} ${p.registration.lastName}`,
            squadNumber: p.squadNumber,
            memberCode: p.memberCode,
          })),
        }))}
      />
    </div>
  );
}
