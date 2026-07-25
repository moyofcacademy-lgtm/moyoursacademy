"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTeam } from "../players/actions";

export type TeamCard = {
  id: string;
  name: string;
  ageGroup: string;
  coachName: string;
  players: { id: string; name: string; squadNumber: number | null; memberCode: string }[];
};

export function TeamsManager({ teams }: { teams: TeamCard[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, { name: string; coachName: string }>>(
    Object.fromEntries(teams.map((t) => [t.id, { name: t.name, coachName: t.coachName }])),
  );
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {teams.map((team) => {
        const draft = drafts[team.id];
        const dirty = draft.name !== team.name || draft.coachName !== team.coachName;
        return (
          <section
            key={team.id}
            aria-labelledby={`team-${team.id}`}
            className="rule-gold flex flex-col gap-4 rounded-b-brand border border-line bg-white/60 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`team-${team.id}`} className="font-display text-step-1">
                {team.ageGroup}
              </h2>
              <span className="font-mono text-step--1 text-kit-soft">
                {team.players.length} player{team.players.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-step--1 font-semibold">
                Team name
                <Input
                  value={draft.name}
                  onChange={(e) => setDrafts({ ...drafts, [team.id]: { ...draft, name: e.target.value } })}
                />
              </label>
              <label className="flex flex-col gap-1 text-step--1 font-semibold">
                Coach
                <Input
                  value={draft.coachName}
                  placeholder="Coach name"
                  onChange={(e) => setDrafts({ ...drafts, [team.id]: { ...draft, coachName: e.target.value } })}
                />
              </label>
              {dirty && (
                <Button
                  size="sm"
                  className="self-start"
                  loading={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await updateTeam(team.id, draft);
                      if (result.ok) {
                        toast.success(`${draft.name} saved.`);
                        router.refresh();
                      } else {
                        toast.error(result.error);
                      }
                    })
                  }
                >
                  Save team
                </Button>
              )}
            </div>

            {team.players.length === 0 ? (
              <p className="text-step--1 text-kit-soft">
                No players yet — accepted registrations in this age group land here.
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-brand border border-line">
                {team.players.map((player) => (
                  <li key={player.id} className="flex items-center gap-3 px-3 py-2 text-step--1">
                    <span className="w-8 font-mono font-bold text-pitch">
                      {player.squadNumber != null ? `#${player.squadNumber}` : "—"}
                    </span>
                    <span className="flex-1 truncate">{player.name}</span>
                    <span className="font-mono text-[0.6875rem] text-kit-soft">{player.memberCode}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
