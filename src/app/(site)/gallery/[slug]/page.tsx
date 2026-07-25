import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Lightbox } from "./lightbox";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = await prisma.album.findUnique({ where: { slug } });
  return { title: album ? album.title : "Album" };
}

export const revalidate = 300;

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await prisma.album.findUnique({
    where: { slug },
    include: { assets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!album || !album.published) notFound();

  return (
    <div className="mx-auto max-w-5xl px-[var(--gutter)] py-12">
      <Link href="/gallery" className="text-step--1 font-semibold text-kit-soft underline-offset-4 hover:underline">
        ← All albums
      </Link>
      <h1 className="mt-3 font-display text-step-3">{album.title}</h1>
      <p className="mt-1 text-step--1 text-kit-soft">{album.assets.length} photos</p>

      <Lightbox
        photos={album.assets.map((asset) => ({
          id: asset.id,
          url: asset.url,
          width: asset.width,
          height: asset.height,
          caption: asset.caption,
        }))}
      />
    </div>
  );
}
