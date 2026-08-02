"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getSetting } from "@/lib/settings";

export type CampActionResult = { ok: true } | { ok: false; error: string };

/** Mark a camp registration's fee as received (cash or confirmed transfer). */
export async function markCampPaid(registrationId: string): Promise<CampActionResult> {
  const actor = await requireAdmin();
  const camp = await getSetting("camp");

  const claimed = await prisma.campRegistration.updateMany({
    where: { id: registrationId, paymentStatus: { not: "VERIFIED" } },
    data: {
      paymentStatus: "VERIFIED",
      amountKobo: camp.feeKobo,
      verifiedById: actor.id,
      verifiedAt: new Date(),
    },
  });
  if (claimed.count === 0) {
    return { ok: false, error: "Already marked paid — refresh to see the current state." };
  }

  await audit({
    actor,
    action: "camp.payment_verified",
    entityType: "CampRegistration",
    entityId: registrationId,
  });
  revalidatePath("/admin/camp");
  return { ok: true };
}

export async function unmarkCampPaid(registrationId: string): Promise<CampActionResult> {
  const actor = await requireAdmin();
  try {
    await prisma.campRegistration.update({
      where: { id: registrationId },
      data: { paymentStatus: "AWAITING_PROOF", verifiedById: null, verifiedAt: null },
    });
  } catch {
    return { ok: false, error: "This registration no longer exists." };
  }
  await audit({
    actor,
    action: "camp.payment_unverified",
    entityType: "CampRegistration",
    entityId: registrationId,
  });
  revalidatePath("/admin/camp");
  return { ok: true };
}

export async function saveCampNotes(registrationId: string, notes: string): Promise<CampActionResult> {
  await requireAdmin();
  try {
    await prisma.campRegistration.update({
      where: { id: registrationId },
      data: { internalNotes: notes.trim().slice(0, 1000) || null },
    });
  } catch {
    return { ok: false, error: "This registration no longer exists." };
  }
  revalidatePath("/admin/camp");
  return { ok: true };
}

export async function deleteCampRegistration(registrationId: string): Promise<CampActionResult> {
  const actor = await requireAdmin();
  const registration = await prisma.campRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) return { ok: true };

  await prisma.campRegistration.delete({ where: { id: registrationId } });
  if (registration.proofPublicId) {
    const { destroyAsset } = await import("@/lib/cloudinary");
    await destroyAsset(registration.proofPublicId);
  }

  await audit({
    actor,
    action: "camp.registration_deleted",
    entityType: "CampRegistration",
    entityId: registrationId,
    metadata: { reference: registration.reference, fullName: registration.fullName },
  });
  revalidatePath("/admin/camp");
  return { ok: true };
}
