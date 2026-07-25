"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Crest } from "@/components/crest";
import { AdminUpload } from "@/components/admin/admin-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { AGE_GROUPS } from "@/lib/constants";
import { cn, formatKickoffWAT } from "@/lib/utils";
import { utcToWatLocal } from "@/lib/validations/fixture";
import { createClub } from "../clubs/actions";
import { createFixture, deleteFixture, updateFixture } from "./actions";

export type FixtureRow = {
  id: string;
  competition: string;
  ageGroup: string;
  teamId: string;
  teamName: string;
  opponentId: string;
  opponentName: string;
  opponentShortName: string | null;
  opponentLogoUrl: string | null;
  isHome: boolean;
  kickoffAtIso: string;
  venue: string;
  venueMapUrl: string | null;
  status: string;
  ticketNote: string | null;
  hasResult: boolean;
  score: string | null;
};

type TeamOption = { id: string; name: string; ageGroup: string };
type ClubOption = { id: string; name: string; shortName: string | null; logoUrl: string | null };

type Draft = {
  id?: string;
  competition: string;
  ageGroup: string;
  teamId: string;
  opponentId: string;
  isHome: boolean;
  kickoffAtLocal: string;
  venue: string;
  venueMapUrl: string;
  status: string;
  ticketNote: string;
};

export function FixturesManager({
  fixtures,
  teams,
  clubs: initialClubs,
}: {
  fixtures: FixtureRow[];
  teams: TeamOption[];
  clubs: ClubOption[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<FixtureRow | null>(null);
  const [clubs, setClubs] = useState(initialClubs);
  const [addingClub, setAddingClub] = useState(false);
  const [newClub, setNewClub] = useState({ name: "", shortName: "", logoUrl: "", logoPublicId: "" });
  const [pending, startTransition] = useTransition();

  const emptyDraft = (): Draft => ({
    competition: "",
    ageGroup: teams[0]?.ageGroup ?? "U11",
    teamId: teams[0]?.id ?? "",
    opponentId: clubs[0]?.id ?? "",
    isHome: true,
    kickoffAtLocal: "",
    venue: "Moyours Training Ground, CBD",
    venueMapUrl: "",
    status: "SCHEDULED",
    ticketNote: "",
  });

  // Stamped once per mount — list freshness comes from router.refresh().
  const [now] = useState(() => Date.now());

  const { upcoming, past } = useMemo(() => {
    return {
      upcoming: fixtures
        .filter((f) => new Date(f.kickoffAtIso).getTime() >= now || f.status === "LIVE")
        .sort((a, b) => a.kickoffAtIso.localeCompare(b.kickoffAtIso)),
      past: fixtures.filter((f) => new Date(f.kickoffAtIso).getTime() < now && f.status !== "LIVE"),
    };
  }, [fixtures, now]);

  function save() {
    if (!draft) return;
    startTransition(async () => {
      const input = {
        competition: draft.competition,
        ageGroup: draft.ageGroup,
        teamId: draft.teamId,
        opponentId: draft.opponentId,
        isHome: draft.isHome,
        kickoffAtLocal: draft.kickoffAtLocal,
        venue: draft.venue,
        venueMapUrl: draft.venueMapUrl,
        status: draft.status as never,
        ticketNote: draft.ticketNote,
      };
      const result = draft.id ? await updateFixture(draft.id, input) : await createFixture(input);
      if (result.ok) {
        toast.success(draft.id ? "Fixture updated." : "Fixture added.");
        setDraft(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function FixtureItem({ fixture }: { fixture: FixtureRow }) {
    return (
      <li className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Crest
          name={fixture.opponentName}
          shortName={fixture.opponentShortName}
          logoUrl={fixture.opponentLogoUrl}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {fixture.teamName} {fixture.isHome ? "vs" : "at"} {fixture.opponentName}
            {fixture.score && <span className="ml-2 font-mono text-pitch">{fixture.score}</span>}
          </p>
          <p className="text-step--1 text-kit-soft">
            {fixture.competition} · {fixture.ageGroup} ·{" "}
            <span className="font-mono">{formatKickoffWAT(new Date(fixture.kickoffAtIso))}</span> · {fixture.venue}
          </p>
        </div>
        <StatusBadge status={fixture.status} />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setDraft({
                id: fixture.id,
                competition: fixture.competition,
                ageGroup: fixture.ageGroup,
                teamId: fixture.teamId,
                opponentId: fixture.opponentId,
                isHome: fixture.isHome,
                kickoffAtLocal: utcToWatLocal(new Date(fixture.kickoffAtIso)),
                venue: fixture.venue,
                venueMapUrl: fixture.venueMapUrl ?? "",
                status: fixture.status,
                ticketNote: fixture.ticketNote ?? "",
              })
            }
          >
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleting(fixture)}>
            Delete
          </Button>
        </div>
      </li>
    );
  }

  // Simple month calendar of the next 5 weeks.
  const calendarDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday
    return Array.from({ length: 35 }, (_, i) => {
      const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dayFixtures = fixtures.filter((f) => {
        const k = new Date(f.kickoffAtIso);
        return (
          k.getFullYear() === day.getFullYear() &&
          k.getMonth() === day.getMonth() &&
          k.getDate() === day.getDate()
        );
      });
      return { day, dayFixtures };
    });
  }, [fixtures]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-brand border border-line p-0.5" role="group" aria-label="View">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-brand px-3 py-1.5 text-step--1 font-semibold capitalize",
                view === v ? "bg-pitch text-chalk" : "text-kit-soft hover:text-kit",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <Button onClick={() => setDraft(emptyDraft())}>Add fixture</Button>
      </div>

      {view === "calendar" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 gap-px rounded-brand border border-line bg-line">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="bg-chalk px-2 py-1.5 text-center font-mono text-[0.6875rem] uppercase tracking-widest text-kit-soft">
                {d}
              </div>
            ))}
            {calendarDays.map(({ day, dayFixtures }) => (
              <div key={day.toISOString()} className="min-h-20 bg-white/70 p-1.5">
                <p className="text-[0.6875rem] font-semibold text-kit-soft">{day.getDate()}</p>
                {dayFixtures.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: f.id,
                        competition: f.competition,
                        ageGroup: f.ageGroup,
                        teamId: f.teamId,
                        opponentId: f.opponentId,
                        isHome: f.isHome,
                        kickoffAtLocal: utcToWatLocal(new Date(f.kickoffAtIso)),
                        venue: f.venue,
                        venueMapUrl: f.venueMapUrl ?? "",
                        status: f.status,
                        ticketNote: f.ticketNote ?? "",
                      })
                    }
                    className="mt-1 block w-full truncate rounded-brand bg-pitch px-1.5 py-1 text-left text-[0.6875rem] text-chalk hover:bg-pitch-mid"
                  >
                    {f.ageGroup} vs {f.opponentShortName ?? f.opponentName}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <section aria-labelledby="upcoming-h">
            <h2 id="upcoming-h" className="mb-2 font-display text-step-1">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState
                title="No fixtures yet. Add the first one."
                action={<Button onClick={() => setDraft(emptyDraft())}>Add fixture</Button>}
              />
            ) : (
              <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
                {upcoming.map((f) => (
                  <FixtureItem key={f.id} fixture={f} />
                ))}
              </ul>
            )}
          </section>
          {past.length > 0 && (
            <section aria-labelledby="past-h">
              <h2 id="past-h" className="mb-2 font-display text-step-1">
                Past
              </h2>
              <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
                {past.map((f) => (
                  <FixtureItem key={f.id} fixture={f} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Create/edit dialog */}
      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit fixture" : "Add fixture"}
        className="w-[min(94vw,40rem)]"
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Our squad" required>
                {(a11y) => (
                  <Select
                    {...a11y}
                    value={draft.teamId}
                    onChange={(e) => {
                      const team = teams.find((t) => t.id === e.target.value);
                      setDraft({ ...draft, teamId: e.target.value, ageGroup: team?.ageGroup ?? draft.ageGroup });
                    }}
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Age group" required>
                {(a11y) => (
                  <Select
                    {...a11y}
                    value={draft.ageGroup}
                    onChange={(e) => setDraft({ ...draft, ageGroup: e.target.value })}
                  >
                    {AGE_GROUPS.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.key} ({g.label})
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Field label="Opponent" required>
              {(a11y) => (
                <div className="flex gap-2">
                  <Select
                    {...a11y}
                    className="flex-1"
                    value={draft.opponentId}
                    onChange={(e) => setDraft({ ...draft, opponentId: e.target.value })}
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="secondary" onClick={() => setAddingClub(true)}>
                    New club
                  </Button>
                </div>
              )}
            </Field>

            {addingClub && (
              <div className="flex flex-col gap-3 rounded-brand border border-line bg-white/70 p-4">
                <p className="font-display text-step-0">New club</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Club name" required>
                    {(a11y) => (
                      <Input {...a11y} value={newClub.name} onChange={(e) => setNewClub({ ...newClub, name: e.target.value })} />
                    )}
                  </Field>
                  <Field label="Short name">
                    {(a11y) => (
                      <Input
                        {...a11y}
                        maxLength={4}
                        value={newClub.shortName}
                        onChange={(e) => setNewClub({ ...newClub, shortName: e.target.value.toUpperCase() })}
                      />
                    )}
                  </Field>
                </div>
                <div className="flex items-center gap-3">
                  <AdminUpload
                    intent="crests"
                    label={newClub.logoUrl ? "Replace crest" : "Upload crest"}
                    onUploaded={([asset]) =>
                      asset && setNewClub({ ...newClub, logoUrl: asset.url, logoPublicId: asset.publicId })
                    }
                  />
                  {newClub.logoUrl && <span className="text-step--1 text-kit-soft">Crest attached</span>}
                  <Button
                    type="button"
                    size="sm"
                    className="ml-auto"
                    disabled={!newClub.name.trim() || pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await createClub({
                          name: newClub.name,
                          shortName: newClub.shortName,
                          city: "",
                          logoUrl: newClub.logoUrl,
                          logoPublicId: newClub.logoPublicId,
                        });
                        if (result.ok) {
                          setClubs((prev) => [...prev, result.club].sort((a, b) => a.name.localeCompare(b.name)));
                          setDraft((d) => (d ? { ...d, opponentId: result.club.id } : d));
                          setAddingClub(false);
                          setNewClub({ name: "", shortName: "", logoUrl: "", logoPublicId: "" });
                          toast.success(`${result.club.name} added.`);
                        } else {
                          toast.error(result.error);
                        }
                      })
                    }
                  >
                    Save club
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Competition" required hint='e.g. "Abuja Youth League" or "Friendly"'>
                {(a11y) => (
                  <Input {...a11y} value={draft.competition} onChange={(e) => setDraft({ ...draft, competition: e.target.value })} />
                )}
              </Field>
              <Field label="Kickoff (WAT)" required>
                {(a11y) => (
                  <Input
                    {...a11y}
                    type="datetime-local"
                    value={draft.kickoffAtLocal}
                    onChange={(e) => setDraft({ ...draft, kickoffAtLocal: e.target.value })}
                  />
                )}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Home or away" required>
                {(a11y) => (
                  <Select
                    {...a11y}
                    value={draft.isHome ? "home" : "away"}
                    onChange={(e) => setDraft({ ...draft, isHome: e.target.value === "home" })}
                  >
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                  </Select>
                )}
              </Field>
              <Field label="Status" required>
                {(a11y) => (
                  <Select {...a11y} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live</option>
                    <option value="POSTPONED">Postponed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </Select>
                )}
              </Field>
            </div>

            <Field label="Venue" required>
              {(a11y) => <Input {...a11y} value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Map link" hint="Google Maps URL, optional">
                {(a11y) => (
                  <Input {...a11y} type="url" value={draft.venueMapUrl} onChange={(e) => setDraft({ ...draft, venueMapUrl: e.target.value })} />
                )}
              </Field>
              <Field label="Ticket / entry note" hint='e.g. "Free entry — come early"'>
                {(a11y) => (
                  <Input {...a11y} value={draft.ticketNote} onChange={(e) => setDraft({ ...draft, ticketNote: e.target.value })} />
                )}
              </Field>
            </div>
          </div>
        )}
        <DialogActions>
          <Button variant="secondary" onClick={() => setDraft(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            loading={pending}
            disabled={!draft || !draft.competition.trim() || !draft.kickoffAtLocal || !draft.venue.trim()}
            onClick={save}
          >
            {draft?.id ? "Save fixture" : "Add fixture"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title="Delete this fixture?">
        <p className="text-step--1 text-kit-soft">
          {deleting?.hasResult
            ? "This fixture has a published result. Delete the result first from the Results page."
            : `${deleting?.teamName} ${deleting?.isHome ? "vs" : "at"} ${deleting?.opponentName} is removed from the site immediately.`}
        </p>
        <DialogActions>
          <Button variant="secondary" onClick={() => setDeleting(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            disabled={deleting?.hasResult}
            onClick={() =>
              startTransition(async () => {
                if (!deleting) return;
                const result = await deleteFixture(deleting.id);
                setDeleting(null);
                if (result.ok) {
                  toast.success("Fixture deleted.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete fixture
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
