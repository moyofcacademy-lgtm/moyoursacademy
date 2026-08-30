import { prisma } from "@/lib/prisma";
import { CoachesManager } from "./coaches-manager";

export const dynamic = "force-dynamic";

export default async function AdminCoachesPage() {
  const coaches = await prisma.coach.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="font-display text-step-2">Coaches</h1>
      <p className="max-w-xl text-step--1 text-kit-soft">
        The coaching team as guardians see it on the homepage and the Coaches
        page. Order here is display order.
      </p>
      <CoachesManager
        coaches={coaches.map((coach) => ({
          id: coach.id,
          name: coach.name,
          role: coach.role,
          ageGroup: coach.ageGroup ?? "",
          bio: coach.bio,
          badges: (coach.badges as string[]) ?? [],
          photoUrl: coach.photoUrl,
          active: coach.active,
        }))}
      />
    </div>
  );
}
