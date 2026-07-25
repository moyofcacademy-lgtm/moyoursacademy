"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { destroyAsset } from "@/lib/cloudinary";
import { slugify } from "@/lib/utils";

export type GalleryActionResult = { ok: true; albumId?: string } | { ok: false; error: string };

function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
}

export async function createAlbum(title: string): Promise<GalleryActionResult> {
  const actor = await requireAdmin();
  const trimmed = title.trim();
  if (trimmed.length < 2) return { ok: false, error: "Give the album a title." };

  let slug = slugify(trimmed);
  const clash = await prisma.album.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const album = await prisma.album.create({ data: { title: trimmed, slug } });
  await audit({ actor, action: "album.created", entityType: "Album", entityId: album.id, metadata: { title: trimmed } });
  revalidateGallery();
  return { ok: true, albumId: album.id };
}

export async function updateAlbum(
  albumId: string,
  data: { title?: string; published?: boolean; coverUrl?: string },
): Promise<GalleryActionResult> {
  const actor = await requireAdmin();
  try {
    await prisma.album.update({
      where: { id: albumId },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.published !== undefined ? { published: data.published } : {}),
        ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl || null } : {}),
      },
    });
  } catch {
    return { ok: false, error: "This album no longer exists." };
  }
  await audit({ actor, action: "album.updated", entityType: "Album", entityId: albumId, metadata: data as never });
  revalidateGallery();
  return { ok: true };
}

export async function deleteAlbum(albumId: string): Promise<GalleryActionResult> {
  const actor = await requireAdmin();
  const album = await prisma.album.findUnique({ where: { id: albumId }, include: { assets: true } });
  if (!album) return { ok: true };
  if (album.slug === "homepage-hero") {
    return { ok: false, error: "The homepage hero album can't be deleted — remove its photos instead." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.deleteMany({ where: { albumId } });
    await tx.album.delete({ where: { id: albumId } });
    await audit({ tx, actor, action: "album.deleted", entityType: "Album", entityId: albumId, metadata: { title: album.title } });
  });

  for (const asset of album.assets) {
    await destroyAsset(asset.publicId);
  }
  revalidateGallery();
  return { ok: true };
}

export async function addAssetsToAlbum(
  albumId: string,
  assets: { url: string; publicId: string; width?: number; height?: number }[],
): Promise<GalleryActionResult> {
  const actor = await requireAdmin();
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: { _count: { select: { assets: true } } },
  });
  if (!album) return { ok: false, error: "This album no longer exists." };

  await prisma.mediaAsset.createMany({
    data: assets.map((asset, index) => ({
      url: asset.url,
      publicId: asset.publicId,
      width: asset.width,
      height: asset.height,
      albumId,
      sortOrder: album._count.assets + index,
    })),
  });
  if (!album.coverUrl && assets[0]) {
    await prisma.album.update({ where: { id: albumId }, data: { coverUrl: assets[0].url } });
  }
  await audit({ actor, action: "album.assets_added", entityType: "Album", entityId: albumId, metadata: { count: assets.length } });
  revalidateGallery();
  return { ok: true };
}

export async function updateAssetCaption(assetId: string, caption: string): Promise<GalleryActionResult> {
  await requireAdmin();
  try {
    await prisma.mediaAsset.update({
      where: { id: assetId },
      data: { caption: caption.trim().slice(0, 120) || null },
    });
  } catch {
    return { ok: false, error: "This photo no longer exists." };
  }
  revalidateGallery();
  revalidatePath("/");
  return { ok: true };
}

export async function deleteAsset(assetId: string): Promise<GalleryActionResult> {
  const actor = await requireAdmin();
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) return { ok: true };
  await prisma.mediaAsset.delete({ where: { id: assetId } });
  await destroyAsset(asset.publicId);
  await audit({ actor, action: "asset.deleted", entityType: "MediaAsset", entityId: assetId });
  revalidateGallery();
  return { ok: true };
}
