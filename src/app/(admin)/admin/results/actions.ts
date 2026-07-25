"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { destroyAsset } from "@/lib/cloudinary";
import { resultSchema, type ResultInput } from "@/lib/validations/fixture";

export type ResultActionResult = { ok: true } | { ok: false; error: string };

function revalidateResultPages(fixtureId: string) {
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/results");
  revalidatePath(`/fixtures/${fixtureId}`);
  revalidatePath(`/results/${fixtureId}`);
}

/**
 * Publish (or update) a result. Publishing flips the fixture to COMPLETED
 * and surfaces it on /results immediately.
 */
export async function publishResult(
  input: ResultInput & { photos?: { url: string; publicId: string; width?: number; height?: number }[] },
): Promise<ResultActionResult> {
  const actor = await requireAdmin();
  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const fixture = await prisma.fixture.findUnique({ where: { id: data.fixtureId } });
  if (!fixture) return { ok: false, error: "That fixture no longer exists." };

  await prisma.$transaction(async (tx) => {
    const result = await tx.result.upsert({
      where: { fixtureId: data.fixtureId },
      create: {
        fixtureId: data.fixtureId,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        halfTimeFor: data.halfTimeFor ?? null,
        halfTimeAgainst: data.halfTimeAgainst ?? null,
        matchReport: data.matchReport || null,
        motmPlayerId: data.motmPlayerId || null,
      },
      update: {
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        halfTimeFor: data.halfTimeFor ?? null,
        halfTimeAgainst: data.halfTimeAgainst ?? null,
        matchReport: data.matchReport || null,
        motmPlayerId: data.motmPlayerId || null,
      },
    });

    // Events are replaced wholesale — the form is the source of truth.
    await tx.matchEvent.deleteMany({ where: { resultId: result.id } });
    if (data.events.length > 0) {
      await tx.matchEvent.createMany({
        data: data.events.map((event) => ({
          resultId: result.id,
          minute: event.minute,
          type: event.type,
          playerId: event.playerId || null,
          playerNameFallback: event.playerNameFallback || null,
        })),
      });
    }

    if (input.photos && input.photos.length > 0) {
      await tx.mediaAsset.createMany({
        data: input.photos.map((photo, index) => ({
          url: photo.url,
          publicId: photo.publicId,
          width: photo.width,
          height: photo.height,
          resultId: result.id,
          sortOrder: index,
        })),
      });
    }

    await tx.fixture.update({
      where: { id: data.fixtureId },
      data: { status: "COMPLETED" },
    });

    await audit({
      tx,
      actor,
      action: "result.published",
      entityType: "Result",
      entityId: result.id,
      metadata: { fixtureId: data.fixtureId, score: `${data.goalsFor}-${data.goalsAgainst}` },
    });
  });

  revalidateResultPages(data.fixtureId);
  return { ok: true };
}

export async function deleteResult(fixtureId: string): Promise<ResultActionResult> {
  const actor = await requireAdmin();
  const result = await prisma.result.findUnique({
    where: { fixtureId },
    include: { media: true },
  });
  if (!result) return { ok: true };

  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.deleteMany({ where: { resultId: result.id } });
    await tx.result.delete({ where: { id: result.id } });
    await tx.fixture.update({ where: { id: fixtureId }, data: { status: "SCHEDULED" } });
    await audit({ tx, actor, action: "result.deleted", entityType: "Result", entityId: result.id });
  });

  // Match photos belong to the result — remove their Cloudinary assets too.
  for (const asset of result.media) {
    await destroyAsset(asset.publicId);
  }

  revalidateResultPages(fixtureId);
  return { ok: true };
}
