import { prisma } from "@/lib/prisma";
import { ClubsManager } from "./clubs-manager";

export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { fixtures: true } } },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="font-display text-step-2">Clubs</h1>
      <p className="max-w-xl text-step--1 text-kit-soft">
        Opposition clubs and their crests. Crests are padded to a square when
        displayed, so any logo shape works on the fixture board.
      </p>
      <ClubsManager
        clubs={clubs.map((club) => ({
          id: club.id,
          name: club.name,
          shortName: club.shortName,
          city: club.city,
          logoUrl: club.logoUrl,
          logoPublicId: club.logoPublicId,
          fixtureCount: club._count.fixtures,
        }))}
      />
    </div>
  );
}
