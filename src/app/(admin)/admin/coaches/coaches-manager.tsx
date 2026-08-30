"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminUpload } from "@/components/admin/admin-upload";
import { CoachPortrait } from "@/components/coach-portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { AGE_GROUPS } from "@/lib/constants";
import { createCoach, deleteCoach, moveCoach, updateCoach } from "./actions";

export type CoachRow = {
  id: string;
  name: string;
  role: string;
  ageGroup: string;
  bio: string;
  badges: string[];
  photoUrl: string | null;
  active: boolean;
};

type Draft = Omit<CoachRow, "id" | "photoUrl"> & {
  id?: string;
  photoUrl: string;
  photoPublicId: string;
  badgesText: string;
};

const emptyDraft: Draft = {
  name: "",
  role: "",
  ageGroup: "",
  bio: "",
  badges: [],
  badgesText: "",
  photoUrl: "",
  photoPublicId: "",
  active: true,
};

export function CoachesManager({ coaches }: { coaches: CoachRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<CoachRow | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!draft) return;
    startTransition(async () => {
      const input = {
        name: draft.name,
        role: draft.role,
        ageGroup: draft.ageGroup,
        bio: draft.bio,
        badges: draft.badgesText.split(",").map((b) => b.trim()).filter(Boolean),
        photoUrl: draft.photoUrl,
        photoPublicId: draft.photoPublicId,
        active: draft.active,
      };
      const result = draft.id ? await updateCoach(draft.id, input) : await createCoach(input);
      if (result.ok) {
        toast.success(draft.id ? "Coach profile saved." : `${draft.name} added to the team.`);
        setDraft(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => setDraft(emptyDraft)}>Add coach</Button>
      </div>

      {coaches.length === 0 ? (
        <EmptyState title="No coach profiles yet. Add the first one." />
      ) : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
          {coaches.map((coach, index) => (
            <li key={coach.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <CoachPortrait name={coach.name} photoUrl={coach.photoUrl} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {coach.name}
                  {coach.ageGroup && (
                    <span className="ml-2 font-mono text-[0.6875rem] text-pitch">{coach.ageGroup}</span>
                  )}
                </p>
                <p className="truncate text-step--1 text-kit-soft">{coach.role}</p>
              </div>
              {!coach.active && <Badge tone="outline">Hidden</Badge>}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move ${coach.name} up`}
                  disabled={index === 0 || pending}
                  onClick={() =>
                    startTransition(async () => {
                      await moveCoach(coach.id, "up");
                      router.refresh();
                    })
                  }
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move ${coach.name} down`}
                  disabled={index === coaches.length - 1 || pending}
                  onClick={() =>
                    startTransition(async () => {
                      await moveCoach(coach.id, "down");
                      router.refresh();
                    })
                  }
                >
                  ↓
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      id: coach.id,
                      name: coach.name,
                      role: coach.role,
                      ageGroup: coach.ageGroup,
                      bio: coach.bio,
                      badges: coach.badges,
                      badgesText: coach.badges.join(", "),
                      photoUrl: coach.photoUrl ?? "",
                      photoPublicId: "",
                      active: coach.active,
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setRemoving(coach)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create/edit dialog */}
      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit coach" : "Add coach"}
        className="w-[min(94vw,38rem)]"
      >
        {draft && (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <CoachPortrait name={draft.name || "Coach"} photoUrl={draft.photoUrl || null} size={72} />
              <AdminUpload
                intent="players"
                label={draft.photoUrl ? "Replace photo" : "Upload photo"}
                onUploaded={([asset]) =>
                  asset && setDraft({ ...draft, photoUrl: asset.url, photoPublicId: asset.publicId })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                {(a11y) => <Input {...a11y} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}
              </Field>
              <Field label="Squad" hint="Optional the age group they lead">
                {(a11y) => (
                  <Select {...a11y} value={draft.ageGroup} onChange={(e) => setDraft({ ...draft, ageGroup: e.target.value })}>
                    <option value="">No squad</option>
                    {AGE_GROUPS.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.key} ({g.label})
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Field label="Role" required hint='e.g. "Youth Development Coach"'>
              {(a11y) => <Input {...a11y} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />}
            </Field>
            <Field label="Bio" required hint="Two or three warm sentences guardians read this">
              {(a11y) => <Textarea {...a11y} rows={4} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />}
            </Field>
            <Field label="Licences & certifications" hint='Comma-separated, e.g. "CAF C Licence, First aid certified"'>
              {(a11y) => (
                <Input {...a11y} value={draft.badgesText} onChange={(e) => setDraft({ ...draft, badgesText: e.target.value })} />
              )}
            </Field>
            <label className="flex items-center gap-3 text-step--1">
              <input
                type="checkbox"
                className="size-5 accent-[#0B3D2C]"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Show on the public site
            </label>
          </div>
        )}
        <DialogActions>
          <Button variant="secondary" onClick={() => setDraft(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            loading={pending}
            disabled={!draft || draft.name.trim().length < 2 || draft.role.trim().length < 2 || draft.bio.trim().length < 10}
            onClick={save}
          >
            {draft?.id ? "Save profile" : "Add coach"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={removing !== null} onClose={() => setRemoving(null)} title={`Remove ${removing?.name}?`}>
        <p className="text-step--1 text-kit-soft">
          Their profile and photo are removed from the site permanently. To hide
          them temporarily, edit the profile and untick &quot;Show on the public
          site&quot; instead.
        </p>
        <DialogActions>
          <Button variant="secondary" onClick={() => setRemoving(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                if (!removing) return;
                const result = await deleteCoach(removing.id);
                setRemoving(null);
                if (result.ok) {
                  toast.success("Coach removed.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Remove coach
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
