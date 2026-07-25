"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { destroyAsset } from "@/lib/cloudinary";

const coachSchema = z.object({
  name: z.string().trim().min(2, "Enter the coach's name").max(80),
  role: z.string().trim().min(2, "Enter their role, e.g. Youth Development Coach").max(120),
  ageGroup: z.string().trim().max(10).optional().or(z.literal("")),
  bio: z.string().trim().min(10, "Write a short bio — two or three sentences").max(1200),
  badges: z.array(z.string().trim().min(1).max(60)).max(8),
  photoUrl: z.string().optional().or(z.literal("")),
  photoPublicId: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

export type CoachInput = z.input<typeof coachSchema>;
export type CoachActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidateCoachPages() {
  revalidatePath("/");
  revalidatePath("/coaches");
  revalidatePath("/admin/coaches");
}

export async function createCoach(input: CoachInput): Promise<CoachActionResult> {
  const actor = await requireAdmin();
  const parsed = coachSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const last = await prisma.coach.findFirst({ orderBy: { sortOrder: "desc" } });
  const coach = await prisma.coach.create({
    data: {
      name: data.name,
      role: data.role,
      ageGroup: data.ageGroup || null,
      bio: data.bio,
      badges: data.badges,
      photoUrl: data.photoUrl || null,
      photoPublicId: data.photoPublicId || null,
      active: data.active,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  await audit({ actor, action: "coach.created", entityType: "Coach", entityId: coach.id, metadata: { name: data.name } });
  revalidateCoachPages();
  return { ok: true, id: coach.id };
}

export async function updateCoach(id: string, input: CoachInput): Promise<CoachActionResult> {
  const actor = await requireAdmin();
  const parsed = coachSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const existing = await prisma.coach.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "This coach profile no longer exists." };

  await prisma.coach.update({
    where: { id },
    data: {
      name: data.name,
      role: data.role,
      ageGroup: data.ageGroup || null,
      bio: data.bio,
      badges: data.badges,
      photoUrl: data.photoUrl || existing.photoUrl,
      photoPublicId: data.photoPublicId || existing.photoPublicId,
      active: data.active,
    },
  });

  if (data.photoPublicId && existing.photoPublicId && data.photoPublicId !== existing.photoPublicId) {
    await destroyAsset(existing.photoPublicId);
  }

  await audit({ actor, action: "coach.updated", entityType: "Coach", entityId: id, metadata: { name: data.name } });
  revalidateCoachPages();
  return { ok: true, id };
}

export async function deleteCoach(id: string): Promise<CoachActionResult> {
  const actor = await requireAdmin();
  const coach = await prisma.coach.findUnique({ where: { id } });
  if (!coach) return { ok: true };
  await prisma.coach.delete({ where: { id } });
  if (coach.photoPublicId) await destroyAsset(coach.photoPublicId);
  await audit({ actor, action: "coach.deleted", entityType: "Coach", entityId: id, metadata: { name: coach.name } });
  revalidateCoachPages();
  return { ok: true };
}

export async function moveCoach(id: string, direction: "up" | "down"): Promise<CoachActionResult> {
  const actor = await requireAdmin();
  const coaches = await prisma.coach.findMany({ orderBy: { sortOrder: "asc" } });
  const index = coaches.findIndex((c) => c.id === id);
  if (index === -1) return { ok: false, error: "This coach profile no longer exists." };
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= coaches.length) return { ok: true };

  await prisma.$transaction([
    prisma.coach.update({ where: { id: coaches[index].id }, data: { sortOrder: coaches[swapWith].sortOrder } }),
    prisma.coach.update({ where: { id: coaches[swapWith].id }, data: { sortOrder: coaches[index].sortOrder } }),
  ]);
  await audit({ actor, action: "coach.reordered", entityType: "Coach", entityId: id });
  revalidateCoachPages();
  return { ok: true };
}
