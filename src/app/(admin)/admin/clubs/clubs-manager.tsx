"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Crest } from "@/components/crest";
import { AdminUpload } from "@/components/admin/admin-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClub, deleteClub, updateClub } from "./actions";

export type ClubRow = {
  id: string;
  name: string;
  shortName: string | null;
  city: string | null;
  logoUrl: string | null;
  logoPublicId: string | null;
  fixtureCount: number;
};

type Draft = {
  id?: string;
  name: string;
  shortName: string;
  city: string;
  logoUrl: string;
  logoPublicId: string;
};

const emptyDraft: Draft = { name: "", shortName: "", city: "", logoUrl: "", logoPublicId: "" };

export function ClubsManager({ clubs }: { clubs: ClubRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<ClubRow | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!draft) return;
    startTransition(async () => {
      const input = {
        name: draft.name,
        shortName: draft.shortName,
        city: draft.city,
        logoUrl: draft.logoUrl,
        logoPublicId: draft.logoPublicId,
      };
      const result = draft.id ? await updateClub(draft.id, input) : await createClub(input);
      if (result.ok) {
        toast.success(draft.id ? "Club updated." : `${result.club.name} added.`);
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
        <Button onClick={() => setDraft(emptyDraft)}>Add club</Button>
      </div>

      {clubs.length === 0 ? (
        <EmptyState title="No clubs yet. Add the first opponent." />
      ) : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
          {clubs.map((club) => (
            <li key={club.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <Crest name={club.name} shortName={club.shortName} logoUrl={club.logoUrl} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {club.name}
                  {club.shortName && (
                    <span className="ml-2 font-mono text-[0.6875rem] text-kit-soft">{club.shortName}</span>
                  )}
                </p>
                <p className="text-step--1 text-kit-soft">
                  {club.city ?? "—"} · {club.fixtureCount} fixture{club.fixtureCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      id: club.id,
                      name: club.name,
                      shortName: club.shortName ?? "",
                      city: club.city ?? "",
                      logoUrl: club.logoUrl ?? "",
                      logoPublicId: club.logoPublicId ?? "",
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleting(club)}>
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
        title={draft?.id ? "Edit club" : "Add club"}
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <Field label="Club name" required>
              {(a11y) => (
                <Input
                  {...a11y}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Short name" hint="2–4 letters, e.g. GAR">
                {(a11y) => (
                  <Input
                    {...a11y}
                    maxLength={4}
                    value={draft.shortName}
                    onChange={(e) => setDraft({ ...draft, shortName: e.target.value.toUpperCase() })}
                  />
                )}
              </Field>
              <Field label="City">
                {(a11y) => (
                  <Input
                    {...a11y}
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <div className="flex items-center gap-4">
              <Crest name={draft.name || "Club"} shortName={draft.shortName} logoUrl={draft.logoUrl || null} size={48} />
              <AdminUpload
                intent="crests"
                label={draft.logoUrl ? "Replace crest" : "Upload crest"}
                onUploaded={([asset]) =>
                  asset && setDraft({ ...draft, logoUrl: asset.url, logoPublicId: asset.publicId })
                }
              />
            </div>
          </div>
        )}
        <DialogActions>
          <Button variant="secondary" onClick={() => setDraft(null)} disabled={pending}>
            Cancel
          </Button>
          <Button loading={pending} disabled={!draft?.name.trim()} onClick={save}>
            {draft?.id ? "Save changes" : "Add club"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
      >
        <p className="text-step--1 text-kit-soft">
          {deleting?.fixtureCount
            ? `This club has ${deleting.fixtureCount} fixture(s) on record and can't be deleted until they're removed.`
            : "The club and its crest are removed permanently."}
        </p>
        <DialogActions>
          <Button variant="secondary" onClick={() => setDeleting(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            disabled={Boolean(deleting?.fixtureCount)}
            onClick={() =>
              startTransition(async () => {
                if (!deleting) return;
                const result = await deleteClub(deleting.id);
                setDeleting(null);
                if (result.ok) {
                  toast.success("Club deleted.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete club
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
