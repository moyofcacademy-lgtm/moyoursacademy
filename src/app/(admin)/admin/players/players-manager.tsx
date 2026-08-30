"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminUpload } from "@/components/admin/admin-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { POSITIONS } from "@/lib/constants";
import { deletePlayer, updatePlayer, updatePlayerProfile } from "./actions";

export type PlayerRow = {
  id: string;
  memberCode: string;
  name: string;
  ageGroup: string | null;
  guardianPhone: string;
  teamId: string;
  teamName: string | null;
  squadNumber: number | null;
  active: boolean;
  registrationId: string;
  photoUrl: string | null;
  position: string;
  consentMedia: boolean;
};

function thumb(url: string) {
  return url.includes("res.cloudinary.com")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,w_96,h_96,c_fill,g_face/")
    : url;
}

export function PlayersManager({
  players,
  teams,
}: {
  players: PlayerRow[];
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [removing, setRemoving] = useState<PlayerRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (teamFilter && p.teamId !== teamFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.memberCode.toLowerCase().includes(q) ||
        p.guardianPhone.includes(q)
      );
    });
  }, [players, query, teamFilter]);

  function patch(
    playerId: string,
    data: Parameters<typeof updatePlayer>[1],
    okMessage: string,
  ) {
    startTransition(async () => {
      const result = await updatePlayer(playerId, data);
      if (result.ok) {
        toast.success(okMessage);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl text-step--1 text-kit-soft">
        Photos and details here feed the public{" "}
        <Link
          href="/squads"
          className="font-semibold underline underline-offset-2"
        >
          Squads
        </Link>{" "}
        page and the homepage carousel. Players appear publicly only when their
        guardian gave media consent at enrollment.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          type="search"
          aria-label="Search players"
          placeholder="Search name, member code, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:col-span-2"
        />
        <Select
          aria-label="Filter by team"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No players in this view. Players appear here when registrations are accepted." />
      ) : (
        <div className="overflow-x-auto rounded-brand border border-line bg-white/60">
          <table className="w-full min-w-[900px] border-collapse text-step--1">
            <thead>
              <tr className="border-b-2 border-kit text-left">
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Player
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Photo
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Position
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Team
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Squad #
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-line align-middle last:border-0 hover:bg-kit/5"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {player.photoUrl ? (
                        <Image
                          src={thumb(player.photoUrl)}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-full border border-line object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pitch font-mono text-[0.75rem] font-bold text-chalk"
                        >
                          {player.name
                            .split(/\s+/)
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/registrations/${player.registrationId}`}
                          className="font-semibold underline-offset-2 hover:underline"
                        >
                          {player.name}
                        </Link>
                        <p className="font-mono text-[0.6875rem] text-kit-soft">
                          {player.memberCode}
                          {player.ageGroup && ` · ${player.ageGroup}`}
                          {!player.consentMedia && (
                            <span className="ml-1.5 rounded-brand bg-amber-100 px-1.5 py-0.5 font-sans font-semibold text-amber-900">
                              no media consent never shown publicly
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <AdminUpload
                        intent="players"
                        label={player.photoUrl ? "Replace" : "Add photo"}
                        onUploaded={([asset]) =>
                          asset &&
                          startTransition(async () => {
                            const result = await updatePlayerProfile(
                              player.id,
                              {
                                photo: {
                                  url: asset.url,
                                  publicId: asset.publicId,
                                },
                              },
                            );
                            if (result.ok) {
                              toast.success("Photo updated.");
                              router.refresh();
                            } else {
                              toast.error(result.error);
                            }
                          })
                        }
                      />
                      {player.photoUrl && (
                        <button
                          type="button"
                          aria-label={`Remove ${player.name}'s photo`}
                          className="text-[0.75rem] font-semibold text-kit-soft underline-offset-2 hover:underline"
                          onClick={() =>
                            startTransition(async () => {
                              const result = await updatePlayerProfile(
                                player.id,
                                { photo: null },
                              );
                              if (result.ok) {
                                toast.success("Photo removed.");
                                router.refresh();
                              } else {
                                toast.error(result.error);
                              }
                            })
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      aria-label={`Position for ${player.name}`}
                      className="h-9 w-36"
                      value={player.position}
                      onChange={(e) =>
                        startTransition(async () => {
                          const result = await updatePlayerProfile(player.id, {
                            preferredPosition: e.target.value,
                          });
                          if (result.ok) {
                            toast.success("Position updated.");
                            router.refresh();
                          } else {
                            toast.error(result.error);
                          }
                        })
                      }
                    >
                      <option value="">—</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      aria-label={`Team for ${player.name}`}
                      className="h-9 w-36"
                      value={player.teamId}
                      onChange={(e) =>
                        patch(
                          player.id,
                          { teamId: e.target.value || null },
                          "Team updated.",
                        )
                      }
                    >
                      <option value="">Unassigned</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      aria-label={`Squad number for ${player.name}`}
                      type="number"
                      min={1}
                      max={99}
                      className="h-9 w-20"
                      defaultValue={player.squadNumber ?? ""}
                      onBlur={(e) => {
                        const value =
                          e.target.value === "" ? null : Number(e.target.value);
                        if (value !== player.squadNumber) {
                          patch(
                            player.id,
                            { squadNumber: value },
                            "Squad number updated.",
                          );
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        patch(
                          player.id,
                          { active: !player.active },
                          player.active
                            ? "Player removed from active squads."
                            : "Player reactivated.",
                        )
                      }
                      className={
                        player.active
                          ? "rounded-brand bg-pitch px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-chalk"
                          : "rounded-brand bg-kit/10 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-kit-soft"
                      }
                    >
                      {player.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRemoving(player)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Delete ${removing?.name}?`}
      >
        <p className="text-step--1 text-kit-soft">
          This removes the player from squads, payments, and public pages
          permanently. Their original registration stays in the admin records.
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
                const result = await deletePlayer(removing.id);
                setRemoving(null);
                if (result.ok) {
                  toast.success("Player deleted.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete player
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
