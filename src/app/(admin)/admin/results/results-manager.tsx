"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AdminUpload,
  type UploadedAsset,
} from "@/components/admin/admin-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { MATCH_EVENT_TYPES } from "@/lib/constants";
import { formatKickoffWAT } from "@/lib/utils";
import { deleteResult, publishResult } from "./actions";

export type ResultFixture = {
  id: string;
  label: string;
  competition: string;
  ageGroup: string;
  teamId: string;
  kickoffAtIso: string;
  status: string;
  result: {
    goalsFor: number;
    goalsAgainst: number;
    halfTimeFor: number | null;
    halfTimeAgainst: number | null;
    matchReport: string;
    motmPlayerId: string;
    events: EventDraft[];
    photoCount: number;
  } | null;
};

export type PlayerOption = {
  id: string;
  teamId: string | null;
  name: string;
  squadNumber: number | null;
};

type EventDraft = {
  minute: number;
  type: string;
  playerId: string;
  playerNameFallback: string;
};

type Draft = {
  fixtureId: string;
  teamId: string;
  goalsFor: string;
  goalsAgainst: string;
  halfTimeFor: string;
  halfTimeAgainst: string;
  matchReport: string;
  motmPlayerId: string;
  events: EventDraft[];
  photos: UploadedAsset[];
};

export function ResultsManager({
  fixtures,
  players,
}: {
  fixtures: ResultFixture[];
  players: PlayerOption[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<ResultFixture | null>(null);
  const [pending, startTransition] = useTransition();

  function openFor(fixture: ResultFixture) {
    setDraft({
      fixtureId: fixture.id,
      teamId: fixture.teamId,
      goalsFor: String(fixture.result?.goalsFor ?? ""),
      goalsAgainst: String(fixture.result?.goalsAgainst ?? ""),
      halfTimeFor:
        fixture.result?.halfTimeFor != null
          ? String(fixture.result.halfTimeFor)
          : "",
      halfTimeAgainst:
        fixture.result?.halfTimeAgainst != null
          ? String(fixture.result.halfTimeAgainst)
          : "",
      matchReport: fixture.result?.matchReport ?? "",
      motmPlayerId: fixture.result?.motmPlayerId ?? "",
      events: fixture.result?.events ?? [],
      photos: [],
    });
  }

  const squad = (teamId: string) => players.filter((p) => p.teamId === teamId);

  function publish() {
    if (!draft) return;
    startTransition(async () => {
      const result = await publishResult({
        fixtureId: draft.fixtureId,
        goalsFor: Number(draft.goalsFor),
        goalsAgainst: Number(draft.goalsAgainst),
        halfTimeFor:
          draft.halfTimeFor === "" ? null : Number(draft.halfTimeFor),
        halfTimeAgainst:
          draft.halfTimeAgainst === "" ? null : Number(draft.halfTimeAgainst),
        matchReport: draft.matchReport,
        motmPlayerId: draft.motmPlayerId,
        events: draft.events.map((e) => ({
          minute: e.minute,
          type: e.type as (typeof MATCH_EVENT_TYPES)[number],
          playerId: e.playerId,
          playerNameFallback: e.playerNameFallback,
        })),
        photos: draft.photos.map((p) => ({
          url: p.url,
          publicId: p.publicId,
          width: p.width,
          height: p.height,
        })),
      });
      if (result.ok) {
        toast.success("Result published it's live on the site.");
        setDraft(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {fixtures.length === 0 ? (
        <EmptyState title="No played fixtures yet. Once a match kicks off, attach its result here." />
      ) : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
          {fixtures.map((fixture) => (
            <li
              key={fixture.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {fixture.label}
                  {fixture.result && (
                    <span className="ml-2 font-mono font-bold text-pitch">
                      {fixture.result.goalsFor}–{fixture.result.goalsAgainst}
                    </span>
                  )}
                </p>
                <p className="text-step--1 text-kit-soft">
                  {fixture.competition} · {fixture.ageGroup} ·{" "}
                  <span className="font-mono">
                    {formatKickoffWAT(new Date(fixture.kickoffAtIso))}
                  </span>
                  {fixture.result &&
                    fixture.result.photoCount > 0 &&
                    ` · ${fixture.result.photoCount} photos`}
                </p>
              </div>
              <StatusBadge status={fixture.status} />
              <div className="flex gap-2">
                <Button
                  variant={fixture.result ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => openFor(fixture)}
                >
                  {fixture.result ? "Edit result" : "Add result"}
                </Button>
                {fixture.result && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRemoving(fixture)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Result editor */}
      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title="Match result"
        className="w-[min(94vw,42rem)]"
      >
        {draft && (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Goals for (Moyours)" required>
                {(a11y) => (
                  <Input
                    {...a11y}
                    type="number"
                    min={0}
                    max={99}
                    value={draft.goalsFor}
                    onChange={(e) =>
                      setDraft({ ...draft, goalsFor: e.target.value })
                    }
                  />
                )}
              </Field>
              <Field label="Goals against" required>
                {(a11y) => (
                  <Input
                    {...a11y}
                    type="number"
                    min={0}
                    max={99}
                    value={draft.goalsAgainst}
                    onChange={(e) =>
                      setDraft({ ...draft, goalsAgainst: e.target.value })
                    }
                  />
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Half-time for">
                {(a11y) => (
                  <Input
                    {...a11y}
                    type="number"
                    min={0}
                    max={99}
                    value={draft.halfTimeFor}
                    onChange={(e) =>
                      setDraft({ ...draft, halfTimeFor: e.target.value })
                    }
                  />
                )}
              </Field>
              <Field label="Half-time against">
                {(a11y) => (
                  <Input
                    {...a11y}
                    type="number"
                    min={0}
                    max={99}
                    value={draft.halfTimeAgainst}
                    onChange={(e) =>
                      setDraft({ ...draft, halfTimeAgainst: e.target.value })
                    }
                  />
                )}
              </Field>
            </div>

            {/* Events */}
            <div className="flex flex-col gap-2">
              <p className="text-step--1 font-semibold">Match events</p>
              {draft.events.map((event, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[4.5rem_7rem_1fr_auto] items-center gap-2"
                >
                  <Input
                    aria-label={`Event ${index + 1} minute`}
                    type="number"
                    min={0}
                    max={130}
                    className="h-9"
                    value={event.minute}
                    onChange={(e) => {
                      const events = [...draft.events];
                      events[index] = {
                        ...event,
                        minute: Number(e.target.value),
                      };
                      setDraft({ ...draft, events });
                    }}
                  />
                  <Select
                    aria-label={`Event ${index + 1} type`}
                    className="h-9"
                    value={event.type}
                    onChange={(e) => {
                      const events = [...draft.events];
                      events[index] = { ...event, type: e.target.value };
                      setDraft({ ...draft, events });
                    }}
                  >
                    {MATCH_EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Select
                      aria-label={`Event ${index + 1} player`}
                      className="h-9 flex-1"
                      value={event.playerId}
                      onChange={(e) => {
                        const events = [...draft.events];
                        events[index] = {
                          ...event,
                          playerId: e.target.value,
                          playerNameFallback: "",
                        };
                        setDraft({ ...draft, events });
                      }}
                    >
                      <option value="">Other / opponent…</option>
                      {squad(draft.teamId).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.squadNumber != null ? `#${p.squadNumber} ` : ""}
                          {p.name}
                        </option>
                      ))}
                    </Select>
                    {!event.playerId && (
                      <Input
                        aria-label={`Event ${index + 1} name`}
                        className="h-9 flex-1"
                        placeholder="Name"
                        value={event.playerNameFallback}
                        onChange={(e) => {
                          const events = [...draft.events];
                          events[index] = {
                            ...event,
                            playerNameFallback: e.target.value,
                          };
                          setDraft({ ...draft, events });
                        }}
                      />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove event ${index + 1}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        events: draft.events.filter((_, i) => i !== index),
                      })
                    }
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() =>
                  setDraft({
                    ...draft,
                    events: [
                      ...draft.events,
                      {
                        minute: 0,
                        type: "GOAL",
                        playerId: "",
                        playerNameFallback: "",
                      },
                    ],
                  })
                }
              >
                Add event
              </Button>
            </div>

            <Field label="Player of the match">
              {(a11y) => (
                <Select
                  {...a11y}
                  value={draft.motmPlayerId}
                  onChange={(e) =>
                    setDraft({ ...draft, motmPlayerId: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {squad(draft.teamId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Match report">
              {(a11y) => (
                <Textarea
                  {...a11y}
                  rows={5}
                  value={draft.matchReport}
                  onChange={(e) =>
                    setDraft({ ...draft, matchReport: e.target.value })
                  }
                />
              )}
            </Field>

            <div className="flex items-center gap-3">
              <AdminUpload
                intent="matches"
                label="Add match photos"
                multiple
                onUploaded={(assets) =>
                  setDraft({ ...draft, photos: [...draft.photos, ...assets] })
                }
              />
              {draft.photos.length > 0 && (
                <span className="text-step--1 text-kit-soft">
                  {draft.photos.length} new photo
                  {draft.photos.length === 1 ? "" : "s"} attached
                </span>
              )}
            </div>
          </div>
        )}
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setDraft(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            loading={pending}
            disabled={
              !draft || draft.goalsFor === "" || draft.goalsAgainst === ""
            }
            onClick={publish}
          >
            Publish result
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete result */}
      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Delete this result?"
      >
        <p className="text-step--1 text-kit-soft">
          The scoreline, events, report, and match photos are removed, and the
          fixture returns to Scheduled.
        </p>
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setRemoving(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                if (!removing) return;
                const result = await deleteResult(removing.id);
                setRemoving(null);
                if (result.ok) {
                  toast.success("Result deleted.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete result
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
