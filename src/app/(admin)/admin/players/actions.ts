"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type PlayerActionResult = { ok: true } | { ok: false; error: string };

export async function updatePlayer(
  playerId: string,
  data: { teamId?: string | null; squadNumber?: number | null; active?: boolean },
): Promise<PlayerActionResult> {
  const actor = await requireAdmin();

  if (
    data.squadNumber != null &&
    (!Number.isInteger(data.squadNumber) || data.squadNumber < 1 || data.squadNumber > 99)
  ) {
    return { ok: false, error: "Squad numbers run from 1 to 99." };
  }

  try {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        ...(data.teamId !== undefined ? { teamId: data.teamId || null } : {}),
        ...(data.squadNumber !== undefined ? { squadNumber: data.squadNumber } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
  } catch {
    return { ok: false, error: "This player no longer exists." };
  }

  await audit({
    actor,
    action: "player.updated",
    entityType: "Player",
    entityId: playerId,
    metadata: data as never,
  });
  revalidatePath("/admin/players");
  revalidatePath("/admin/teams");
  return { ok: true };
}

/** Photo and position live on the linked registration record. */
export async function updatePlayerProfile(
  playerId: string,
  data: {
    photo?: { url: string; publicId: string } | null;
    preferredPosition?: string;
  },
): Promise<PlayerActionResult> {
  const actor = await requireAdmin();
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { registration: { select: { id: true, playerPhotoPublicId: true } } },
  });
  if (!player) return { ok: false, error: "This player no longer exists." };

  await prisma.registration.update({
    where: { id: player.registration.id },
    data: {
      ...(data.photo !== undefined
        ? {
            playerPhotoUrl: data.photo?.url ?? null,
            playerPhotoPublicId: data.photo?.publicId ?? null,
          }
        : {}),
      ...(data.preferredPosition !== undefined
        ? { preferredPosition: data.preferredPosition || null }
        : {}),
    },
  });

  // Replacing or removing a photo cleans up the old Cloudinary asset.
  if (
    data.photo !== undefined &&
    player.registration.playerPhotoPublicId &&
    player.registration.playerPhotoPublicId !== data.photo?.publicId
  ) {
    const { destroyAsset } = await import("@/lib/cloudinary");
    await destroyAsset(player.registration.playerPhotoPublicId);
  }

  await audit({
    actor,
    action: "player.profile_updated",
    entityType: "Player",
    entityId: playerId,
    metadata: { photo: data.photo ? "updated" : data.photo === null ? "removed" : undefined, position: data.preferredPosition },
  });
  revalidatePath("/admin/players");
  revalidatePath("/squads");
  revalidatePath("/");
  return { ok: true };
}

export async function updateTeam(
  teamId: string,
  data: { name?: string; coachName?: string },
): Promise<PlayerActionResult> {
  const actor = await requireAdmin();
  if (data.name !== undefined && data.name.trim().length < 2) {
    return { ok: false, error: "Enter the team name." };
  }
  try {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.coachName !== undefined ? { coachName: data.coachName.trim() || null } : {}),
      },
    });
  } catch {
    return { ok: false, error: "This team no longer exists." };
  }
  await audit({ actor, action: "team.updated", entityType: "Team", entityId: teamId });
  revalidatePath("/admin/teams");
  return { ok: true };
}
