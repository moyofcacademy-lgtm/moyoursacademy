import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FixtureStrip } from "@/components/fixture-strip";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";

export default async function AdminDashboard() {
  const now = new Date();
  const [awaitingReview, acceptedPlayers, upcomingCount, recentRegistrations, nextFixtures] =
    await Promise.all([
      prisma.registration.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.player.count({ where: { active: true } }),
      prisma.fixture.count({ where: { status: "SCHEDULED", kickoffAt: { gte: now } } }),
      prisma.registration.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          ageGroup: true,
          status: true,
          createdAt: true,
          reference: true,
        },
      }),
      prisma.fixture.findMany({
        where: { status: { in: ["SCHEDULED", "LIVE"] }, kickoffAt: { gte: now } },
        orderBy: { kickoffAt: "asc" },
        take: 3,
        include: { team: true, opponent: true, result: true },
      }),
    ]);

  const stats = [
    { label: "Awaiting review", value: awaitingReview, href: "/admin/registrations", accent: awaitingReview > 0 },
    { label: "Active players", value: acceptedPlayers, href: "/admin/players", accent: false },
    { label: "Upcoming fixtures", value: upcomingCount, href: "/admin/fixtures", accent: false },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <h1 className="font-display text-step-2">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rule-gold rounded-b-brand p-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0 ${
              stat.accent
                ? "goal-net bg-kit text-chalk"
                : "surface-pitch text-chalk"
            }`}
          >
            <p className="tabular font-mono text-step-3 font-bold text-gold">{stat.value}</p>
            <p className="mt-1 text-step--1 font-semibold text-chalk-dim">{stat.label}</p>
            {stat.accent && stat.value > 0 && (
              <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-widest text-gold">
                Needs your whistle →
              </p>
            )}
          </Link>
        ))}
      </div>

      <section aria-labelledby="recent-heading">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="recent-heading" className="font-display text-step-1">
            Latest registrations
          </h2>
          <Link href="/admin/registrations" className="text-step--1 font-semibold underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        {recentRegistrations.length === 0 ? (
          <EmptyState title="No registrations yet. They'll appear here the moment a guardian enrolls." />
        ) : (
          <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
            {recentRegistrations.map((reg) => (
              <li key={reg.id}>
                <Link
                  href={`/admin/registrations/${reg.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-kit/5"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">
                      {reg.firstName} {reg.lastName}
                      {reg.ageGroup && <span className="ml-2 font-mono text-step--1 font-normal text-kit-soft">{reg.ageGroup}</span>}
                    </span>
                    <span className="font-mono text-[0.75rem] text-kit-soft">{reg.reference}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={reg.status} />
                    <span className="text-[0.75rem] text-kit-soft">{timeAgo(reg.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="fixtures-heading">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="fixtures-heading" className="font-display text-step-1">
            Next fixtures
          </h2>
          <Link href="/admin/fixtures" className="text-step--1 font-semibold underline-offset-4 hover:underline">
            Manage fixtures
          </Link>
        </div>
        {nextFixtures.length === 0 ? (
          <EmptyState
            title="No fixtures yet. Add the first one."
            action={
              <Link href="/admin/fixtures" className="inline-flex h-10 items-center rounded-brand bg-gold px-4 text-step--1 font-semibold text-kit">
                Add fixture
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {nextFixtures.map((fixture) => (
              <FixtureStrip key={fixture.id} fixture={fixture} compact href={`/admin/fixtures?id=${fixture.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
