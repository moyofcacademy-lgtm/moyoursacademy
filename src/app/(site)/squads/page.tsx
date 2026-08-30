import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CoachPortrait } from "@/components/coach-portrait";
import { MoyoursCrest } from "@/components/logo";
import { EmptyState } from "@/components/ui/empty-state";
import { AGE_GROUPS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Our squads",
  description:
    "Meet the Moyours Football Club Academy players four squads from U8 to U17.",
};

export const revalidate = 300;

function playerPhoto(url: string) {
  return url.includes("res.cloudinary.com")
    ? url.replace(
        "/upload/",
        "/upload/f_auto,q_auto,w_480,h_600,c_fill,g_face/",
      )
    : url;
}

export default async function SquadsPage() {
  const [players, coaches, profiles] = await Promise.all([
    // Only players whose guardians gave media consent appear publicly.
    prisma.player.findMany({
      where: { active: true, registration: { consentMedia: true } },
      orderBy: [{ squadNumber: "asc" }, { joinedAt: "asc" }],
      include: {
        team: { select: { ageGroup: true, name: true } },
        registration: {
          select: {
            firstName: true,
            lastName: true,
            ageGroup: true,
            preferredPosition: true,
            playerPhotoUrl: true,
          },
        },
      },
    }),
    prisma.coach.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.$queryRaw<{ id: string; preferredFoot: string | null; abilities: string | null }[]>`
      SELECT "id", "preferredFoot", "abilities" FROM "Player"
      WHERE "active" = true
    `,
  ]);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const squads = AGE_GROUPS.map((group) => ({
    ...group,
    coach: coaches.find((c) => c.ageGroup === group.key) ?? null,
    players: players.filter(
      (p) => (p.team?.ageGroup ?? p.registration.ageGroup) === group.key,
    ),
  }));

  const anyPlayers = players.length > 0;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-pitch text-chalk">
        <div aria-hidden className="turf absolute inset-0 -z-10" />
        <div aria-hidden className="pitch-lines absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-[var(--gutter)] py-14">
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold">
            The teamsheet
          </p>
          <h1 className="mt-2 font-display text-step-3">Our squads</h1>
          <p className="mt-3 max-w-2xl text-step-0 text-chalk-dim">
            Four squads, one family. Every player here trains twice a week and
            wears the black and yellow with pride.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-[var(--gutter)] py-12">
        {!anyPlayers ? (
          <EmptyState
            title="Squad profiles are coming soon our first players are being registered now."
            action={
              <Link
                href="/enroll"
                className="inline-flex h-11 items-center rounded-brand bg-gold px-5 text-step--1 font-semibold text-kit"
              >
                Be one of the first enroll
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-14">
            {squads
              .filter((squad) => squad.players.length > 0)
              .map((squad) => (
                <section key={squad.key} aria-labelledby={`squad-${squad.key}`}>
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-kit pb-3">
                    <div>
                      <h2
                        id={`squad-${squad.key}`}
                        className="font-display text-step-2"
                      >
                        <span className="font-mono text-pitch">
                          {squad.key}
                        </span>{" "}
                        <span className="text-step-1 text-kit-soft">
                          {squad.label}
                        </span>
                      </h2>
                    </div>
                    {squad.coach && (
                      <div className="flex items-center gap-2.5">
                        <CoachPortrait
                          name={squad.coach.name}
                          photoUrl={squad.coach.photoUrl}
                          size={36}
                        />
                        <div>
                          <p className="text-step--1 font-semibold">
                            {squad.coach.name}
                          </p>
                          <p className="text-[0.6875rem] uppercase tracking-wide text-kit-soft">
                            Squad coach
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {squad.players.map((player) => {
                      const name = `${player.registration.firstName} ${player.registration.lastName}`;
                      return (
                        <li
                          key={player.id}
                          className="foil-card sheen group transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0"
                        >
                          <div className="overflow-hidden rounded-[4px] bg-chalk">
                            <div className="turf relative aspect-[4/5] overflow-hidden bg-pitch-deep">
                              {player.registration.playerPhotoUrl ? (
                                <Image
                                  src={playerPhoto(
                                    player.registration.playerPhotoUrl,
                                  )}
                                  alt={`${name}, ${squad.key} squad`}
                                  fill
                                  sizes="(min-width: 1024px) 280px, 45vw"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center font-display text-step-4 text-pitch-mid">
                                  {player.registration.firstName[0]}
                                  {player.registration.lastName[0]}
                                </div>
                              )}
                              {/* photo vignette so the numeral always reads */}
                              <div
                                aria-hidden
                                className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-kit/70 to-transparent"
                              />
                              <MoyoursCrest
                                size={24}
                                className="absolute left-2 top-2 opacity-90 drop-shadow"
                              />
                              {player.squadNumber != null && (
                                <span
                                  aria-hidden
                                  className="kit-number absolute bottom-0.5 right-2 text-step-4 leading-none"
                                >
                                  {player.squadNumber}
                                </span>
                              )}
                            </div>
                            <div className="shield-stripes border-t-2 border-gold p-3">
                              <p className="truncate font-display text-step-0">
                                {player.squadNumber != null && (
                                  <span className="sr-only">
                                    Number {player.squadNumber},{" "}
                                  </span>
                                )}
                                {name}
                              </p>
                              <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-kit-soft">
                                {player.registration.preferredPosition ??
                                  "Moyours"}{" "}
                                · {squad.key}
                              </p>
                              {(profileById.get(player.id)?.preferredFoot || profileById.get(player.id)?.abilities) && (
                                <p className="mt-1 line-clamp-2 text-[0.6875rem] text-kit-soft">
                                  {profileById.get(player.id)?.preferredFoot && `${profileById.get(player.id)?.preferredFoot} foot`}
                                  {profileById.get(player.id)?.preferredFoot && profileById.get(player.id)?.abilities && " · "}
                                  {profileById.get(player.id)?.abilities}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
