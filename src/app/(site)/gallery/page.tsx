import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Moyours Football Club Academy training, matches, and camps.",
};

export const revalidate = 300;

export default async function GalleryPage() {
  const albums = await prisma.album.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assets: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">Gallery</h1>
      <p className="mt-3 max-w-2xl text-step-0 text-kit-soft">
        Training days, matchdays, and everything in between.
      </p>

      {albums.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Albums are on the way — follow us on social media in the meantime." />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/gallery/${album.slug}`}
              className="group overflow-hidden rounded-brand border border-line bg-white/60 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
            >
              {album.coverUrl ? (
                <Image
                  src={
                    album.coverUrl.includes("res.cloudinary.com")
                      ? album.coverUrl.replace("/upload/", "/upload/f_auto,q_auto,w_600,h_400,c_fill/")
                      : album.coverUrl
                  }
                  alt=""
                  width={600}
                  height={400}
                  className="aspect-[3/2] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[3/2] items-center justify-center bg-pitch font-mono text-step-2 font-bold text-gold">
                  {album._count.assets}
                </div>
              )}
              <div className="p-4">
                <h2 className="font-display text-step-0 group-hover:underline">{album.title}</h2>
                <p className="text-step--1 text-kit-soft">{album._count.assets} photos</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
