"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminUpload } from "@/components/admin/admin-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { formatDateWAT } from "@/lib/utils";
import { createPost, deletePost, updatePost } from "./actions";

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  published: boolean;
  publishedAtIso: string | null;
};

type Draft = {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  coverPublicId: string;
  published: boolean;
};

const emptyDraft: Draft = { title: "", excerpt: "", body: "", coverUrl: "", coverPublicId: "", published: false };

export function NewsManager({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<PostRow | null>(null);
  const [pending, startTransition] = useTransition();

  function save(publish: boolean) {
    if (!draft) return;
    startTransition(async () => {
      const input = { ...draft, published: publish };
      const result = draft.id ? await updatePost(draft.id, input) : await createPost(input);
      if (result.ok) {
        toast.success(publish ? "Post published." : "Draft saved.");
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
        <Button onClick={() => setDraft(emptyDraft)}>Write a post</Button>
      </div>

      {posts.length === 0 ? (
        <EmptyState title="No posts yet. Announce the season, share match recaps, celebrate the players." />
      ) : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{post.title}</p>
                <p className="text-step--1 text-kit-soft">
                  {post.published && post.publishedAtIso
                    ? `Published ${formatDateWAT(new Date(post.publishedAtIso))}`
                    : "Draft"}
                </p>
              </div>
              <Badge tone={post.published ? "green" : "outline"}>{post.published ? "Published" : "Draft"}</Badge>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      id: post.id,
                      title: post.title,
                      excerpt: post.excerpt,
                      body: post.body,
                      coverUrl: post.coverUrl ?? "",
                      coverPublicId: "",
                      published: post.published,
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setRemoving(post)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit post" : "New post"}
        className="w-[min(94vw,42rem)]"
      >
        {draft && (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            <Field label="Title" required>
              {(a11y) => <Input {...a11y} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />}
            </Field>
            <Field label="Excerpt" hint="One or two sentences shown on the news list">
              {(a11y) => (
                <Textarea {...a11y} rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
              )}
            </Field>
            <Field label="Body" required hint="Blank line starts a new paragraph">
              {(a11y) => (
                <Textarea {...a11y} rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
              )}
            </Field>
            <div className="flex items-center gap-3">
              <AdminUpload
                intent="news"
                label={draft.coverUrl ? "Replace cover image" : "Add cover image"}
                onUploaded={([asset]) =>
                  asset && setDraft({ ...draft, coverUrl: asset.url, coverPublicId: asset.publicId })
                }
              />
              {draft.coverUrl && <span className="text-step--1 text-kit-soft">Cover attached</span>}
            </div>
          </div>
        )}
        <DialogActions>
          <Button variant="secondary" onClick={() => setDraft(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            loading={pending}
            disabled={!draft?.title.trim() || !draft?.body.trim()}
            onClick={() => save(false)}
          >
            Save draft
          </Button>
          <Button
            loading={pending}
            disabled={!draft?.title.trim() || !draft?.body.trim()}
            onClick={() => save(true)}
          >
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} title={`Delete "${removing?.title}"?`}>
        <p className="text-step--1 text-kit-soft">The post is removed from the site permanently.</p>
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
                const result = await deletePost(removing.id);
                setRemoving(null);
                if (result.ok) {
                  toast.success("Post deleted.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete post
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
