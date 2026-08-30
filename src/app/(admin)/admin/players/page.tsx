import { prisma } from "@/lib/prisma";
import { PlayersManager } from "./players-manager";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const [players, teams, profiles] = await Promise.all([
    prisma.player.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        registration: {
          select: {
            firstName: true,
            lastName: true,
            ageGroup: true,
            guardianPhone: true,
            playerPhotoUrl: true,
            preferredPosition: true,
            consentMedia: true,
          },
        },
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.team.findMany({ orderBy: { ageGroup: "asc" } }),
    prisma.$queryRaw<{ id: string; preferredFoot: string | null; abilities: string | null }[]>`
      SELECT "id", "preferredFoot", "abilities" FROM "Player"
    `,
  ]);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-step-2">Players</h1>
      <PlayersManager
        players={players.map((p) => ({
          id: p.id,
          memberCode: p.memberCode,
          name: `${p.registration.firstName} ${p.registration.lastName}`,
          ageGroup: p.registration.ageGroup,
          guardianPhone: p.registration.guardianPhone,
          teamId: p.team?.id ?? "",
          teamName: p.team?.name ?? null,
          squadNumber: p.squadNumber,
          preferredFoot: profileById.get(p.id)?.preferredFoot ?? "",
          abilities: profileById.get(p.id)?.abilities ?? "",
          active: p.active,
          registrationId: p.registrationId,
          photoUrl: p.registration.playerPhotoUrl,
          position: p.registration.preferredPosition ?? "",
          consentMedia: p.registration.consentMedia,
        }))}
        teams={teams.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}
