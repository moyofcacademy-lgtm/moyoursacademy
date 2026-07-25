import { prisma } from "@/lib/prisma";
import { GalleryManager } from "./gallery-manager";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: { assets: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-step-2">Gallery</h1>
      <GalleryManager
        albums={albums.map((album) => ({
          id: album.id,
          title: album.title,
          slug: album.slug,
          published: album.published,
          coverUrl: album.coverUrl,
          assets: album.assets.map((a) => ({ id: a.id, url: a.url, caption: a.caption })),
        }))}
      />
    </div>
  );
}
