import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CoachPortrait } from "@/components/coach-portrait";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Coaches",
  description: "Meet the Moyours Sports Academy coaching team.",
};

export const revalidate = 300;

export default async function CoachesPage() {
  const coaches = await prisma.coach.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">Coaches who care</h1>
      <p className="mt-3 max-w-2xl text-step-0 text-kit-soft">
        Qualified, safeguarding-trained, and — above all — invested in each
        child. These are the people on the touchline every Friday and Saturday.
      </p>

      {coaches.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Coach profiles are being updated — check back soon." />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {coaches.map((coach) => (
            <article
              key={coach.id}
              className="rule-gold flex flex-col gap-4 rounded-b-brand border border-line bg-white/60 p-6"
            >
              <div className="flex items-center gap-4">
                <CoachPortrait name={coach.name} photoUrl={coach.photoUrl} size={72} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-step-1">{coach.name}</h2>
                  <p className="text-step--1 text-kit-soft">{coach.role}</p>
                </div>
                {coach.ageGroup && (
                  <span className="font-mono text-step-2 font-bold text-pitch">{coach.ageGroup}</span>
                )}
              </div>
              <p className="text-step--1 leading-relaxed">{coach.bio}</p>
              {((coach.badges as string[]) ?? []).length > 0 && (
                <ul className="mt-auto flex flex-wrap gap-2">
                  {((coach.badges as string[]) ?? []).map((badge) => (
                    <li
                      key={badge}
                      className="rounded-brand border border-line px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-kit-soft"
                    >
                      {badge}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
