"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { destroyAsset } from "@/lib/cloudinary";
import { clubSchema, type ClubInput } from "@/lib/validations/club";
import { Prisma } from "@/generated/prisma/client";

export type ClubActionResult =
  | { ok: true; club: { id: string; name: string; shortName: string | null; logoUrl: string | null } }
  | { ok: false; error: string };

function revalidateFixturePages() {
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/results");
}

export async function createClub(input: ClubInput): Promise<ClubActionResult> {
  const actor = await requireAdmin();
  const parsed = clubSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const club = await prisma.club.create({
    data: {
      name: data.name,
      shortName: data.shortName || null,
      city: data.city || null,
      logoUrl: data.logoUrl || null,
      logoPublicId: data.logoPublicId || null,
    },
  });
  await audit({ actor, action: "club.created", entityType: "Club", entityId: club.id, metadata: { name: club.name } });
  revalidateFixturePages();
  return { ok: true, club: { id: club.id, name: club.name, shortName: club.shortName, logoUrl: club.logoUrl } };
}

export async function updateClub(id: string, input: ClubInput): Promise<ClubActionResult> {
  const actor = await requireAdmin();
  const parsed = clubSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const existing = await prisma.club.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "This club no longer exists." };

  const club = await prisma.club.update({
    where: { id },
    data: {
      name: data.name,
      shortName: data.shortName || null,
      city: data.city || null,
      logoUrl: data.logoUrl || existing.logoUrl,
      logoPublicId: data.logoPublicId || existing.logoPublicId,
    },
  });

  // A replaced crest leaves no orphan behind in Cloudinary.
  if (data.logoPublicId && existing.logoPublicId && data.logoPublicId !== existing.logoPublicId) {
    await destroyAsset(existing.logoPublicId);
  }

  await audit({ actor, action: "club.updated", entityType: "Club", entityId: id, metadata: { name: club.name } });
  revalidateFixturePages();
  return { ok: true, club: { id: club.id, name: club.name, shortName: club.shortName, logoUrl: club.logoUrl } };
}

export async function deleteClub(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  const club = await prisma.club.findUnique({
    where: { id },
    include: { _count: { select: { fixtures: true } } },
  });
  if (!club) return { ok: true };
  if (club._count.fixtures > 0) {
    return {
      ok: false,
      error: `${club.name} has ${club._count.fixtures} fixture${club._count.fixtures === 1 ? "" : "s"} on record. Delete or re-assign those first.`,
    };
  }
  try {
    await prisma.club.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "This club is still referenced by a fixture." };
    }
    throw error;
  }
  if (club.logoPublicId) {
    await destroyAsset(club.logoPublicId);
  }
  await audit({ actor, action: "club.deleted", entityType: "Club", entityId: id, metadata: { name: club.name } });
  revalidateFixturePages();
  return { ok: true };
}
