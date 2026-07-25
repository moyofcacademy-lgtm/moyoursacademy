"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fixtureSchema, watLocalToUtc, type FixtureInput } from "@/lib/validations/fixture";

export type FixtureActionResult = { ok: true; id: string } | { ok: false; error: string };

function revalidateFixturePages(id?: string) {
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/results");
  if (id) revalidatePath(`/fixtures/${id}`);
}

export async function createFixture(input: FixtureInput): Promise<FixtureActionResult> {
  const actor = await requireAdmin();
  const parsed = fixtureSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const fixture = await prisma.fixture.create({
    data: {
      competition: data.competition,
      ageGroup: data.ageGroup,
      teamId: data.teamId,
      opponentId: data.opponentId,
      isHome: data.isHome,
      kickoffAt: watLocalToUtc(data.kickoffAtLocal),
      venue: data.venue,
      venueMapUrl: data.venueMapUrl || null,
      status: data.status,
      ticketNote: data.ticketNote || null,
    },
  });
  await audit({
    actor,
    action: "fixture.created",
    entityType: "Fixture",
    entityId: fixture.id,
    metadata: { competition: data.competition, ageGroup: data.ageGroup },
  });
  revalidateFixturePages(fixture.id);
  return { ok: true, id: fixture.id };
}

export async function updateFixture(id: string, input: FixtureInput): Promise<FixtureActionResult> {
  const actor = await requireAdmin();
  const parsed = fixtureSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    await prisma.fixture.update({
      where: { id },
      data: {
        competition: data.competition,
        ageGroup: data.ageGroup,
        teamId: data.teamId,
        opponentId: data.opponentId,
        isHome: data.isHome,
        kickoffAt: watLocalToUtc(data.kickoffAtLocal),
        venue: data.venue,
        venueMapUrl: data.venueMapUrl || null,
        status: data.status,
        ticketNote: data.ticketNote || null,
      },
    });
  } catch {
    return { ok: false, error: "This fixture no longer exists — it may have been deleted." };
  }
  await audit({ actor, action: "fixture.updated", entityType: "Fixture", entityId: id });
  revalidateFixturePages(id);
  return { ok: true, id };
}

export async function deleteFixture(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  const fixture = await prisma.fixture.findUnique({ where: { id }, include: { result: true } });
  if (!fixture) return { ok: true };
  if (fixture.result) {
    return { ok: false, error: "This fixture has a published result. Delete the result first." };
  }
  await prisma.fixture.delete({ where: { id } });
  await audit({ actor, action: "fixture.deleted", entityType: "Fixture", entityId: id });
  revalidateFixturePages();
  return { ok: true };
}
