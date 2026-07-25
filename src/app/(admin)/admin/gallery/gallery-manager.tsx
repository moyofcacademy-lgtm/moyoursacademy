"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminUpload } from "@/components/admin/admin-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { addAssetsToAlbum, createAlbum, deleteAlbum, deleteAsset, updateAlbum, updateAssetCaption } from "./actions";

export type AlbumRow = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  coverUrl: string | null;
  assets: { id: string; url: string; caption: string | null }[];
};

function thumb(url: string) {
  return url.includes("res.cloudinary.com")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,w_300,h_200,c_fill/")
    : url;
}

export function GalleryManager({ albums }: { albums: AlbumRow[] }) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [removing, setRemoving] = useState<AlbumRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await createAlbum(newTitle);
            if (result.ok) {
              toast.success("Album created — add photos below.");
              setNewTitle("");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          });
        }}
      >
        <Input
          aria-label="New album title"
          placeholder="New album title, e.g. Summer Camp 2026"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" loading={pending} disabled={newTitle.trim().length < 2}>
          Create album
        </Button>
      </form>

      {albums.length === 0 ? (
        <EmptyState title="No albums yet. Create the first one and add match or training photos." />
      ) : (
        albums.map((album) => (
          <section
            key={album.id}
            aria-labelledby={`album-${album.id}`}
            className="flex flex-col gap-4 rounded-brand border border-line bg-white/60 p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={`album-${album.id}`} className="font-display text-step-1">
                {album.title}
              </h2>
              {album.slug === "homepage-hero" ? (
                <Badge tone="gold">Homepage hero</Badge>
              ) : (
                <Badge tone={album.published ? "green" : "outline"}>
                  {album.published ? "Published" : "Draft"}
                </Badge>
              )}
              <span className="text-step--1 text-kit-soft">{album.assets.length} photos</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <AdminUpload
                  intent="gallery"
                  label="Add photos"
                  multiple
                  onUploaded={(assets) =>
                    startTransition(async () => {
                      const result = await addAssetsToAlbum(album.id, assets);
                      if (result.ok) {
                        toast.success(`${assets.length} photo${assets.length === 1 ? "" : "s"} added.`);
                        router.refresh();
                      } else {
                        toast.error(result.error);
                      }
                    })
                  }
                />
                {album.slug !== "homepage-hero" && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await updateAlbum(album.id, { published: !album.published });
                          if (result.ok) {
                            toast.success(album.published ? "Album unpublished." : "Album published.");
                            router.refresh();
                          } else {
                            toast.error(result.error);
                          }
                        })
                      }
                    >
                      {album.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setRemoving(album)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
            {album.slug === "homepage-hero" && (
              <p className="text-step--1 text-kit-soft">
                Photos in this album rotate in the homepage hero carousel — action
                shots of the players look best. It never appears in the public
                gallery. With no photos here, the hero falls back to player
                profile photos (media-consented players only).
              </p>
            )}

            {album.assets.length > 0 && (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {album.assets.map((asset) => (
                  <li key={asset.id} className="group relative">
                    <Image
                      src={thumb(asset.url)}
                      alt={asset.caption ?? ""}
                      width={300}
                      height={200}
                      className="aspect-[3/2] w-full rounded-brand border border-line object-cover"
                    />
                    {album.slug === "homepage-hero" && (
                      <input
                        aria-label="Photo caption shown in the hero"
                        placeholder="Caption…"
                        defaultValue={asset.caption ?? ""}
                        onBlur={(e) => {
                          if (e.target.value !== (asset.caption ?? "")) {
                            startTransition(async () => {
                              const result = await updateAssetCaption(asset.id, e.target.value);
                              if (result.ok) toast.success("Caption saved.");
                              else toast.error(result.error);
                              router.refresh();
                            });
                          }
                        }}
                        className="mt-1 w-full rounded-brand border border-line bg-white/70 px-2 py-1 text-[0.75rem] focus:border-pitch focus:outline-none"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Delete photo"
                      className="absolute right-1 top-1 hidden size-7 items-center justify-center rounded-brand bg-kit/80 text-chalk group-hover:flex group-focus-within:flex"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteAsset(asset.id);
                          if (result.ok) {
                            toast.success("Photo removed.");
                            router.refresh();
                          } else {
                            toast.error(result.error);
                          }
                        })
                      }
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} title={`Delete "${removing?.title}"?`}>
        <p className="text-step--1 text-kit-soft">
          The album and all {removing?.assets.length} photo(s) are removed permanently,
          including from Cloudinary.
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
                const result = await deleteAlbum(removing.id);
                setRemoving(null);
                if (result.ok) {
                  toast.success("Album deleted.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete album
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
