"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type PaymentActionResult = { ok: true } | { ok: false; error: string };

/** Record a monthly subscription payment for a player, verified on the spot. */
export async function markMonthlyPaid(input: {
  playerId: string;
  periodMonth: string; // "2026-07"
  amountKobo: number;
  depositorName?: string;
  paidAt?: string;
  note?: string;
  proof?: { publicId: string; url: string; format: string; bytes: number } | null;
}): Promise<PaymentActionResult> {
  const actor = await requireAdmin();

  if (!/^\d{4}-\d{2}$/.test(input.periodMonth)) {
    return { ok: false, error: "Pick a valid month." };
  }
  if (!Number.isInteger(input.amountKobo) || input.amountKobo <= 0) {
    return { ok: false, error: "Enter the amount paid." };
  }

  const player = await prisma.player.findUnique({ where: { id: input.playerId } });
  if (!player) return { ok: false, error: "This player no longer exists." };

  const existing = await prisma.payment.findFirst({
    where: {
      registrationId: player.registrationId,
      type: "MONTHLY_SUBSCRIPTION",
      periodMonth: input.periodMonth,
      status: "VERIFIED",
    },
  });
  if (existing) {
    return { ok: false, error: "This month is already marked paid for this player." };
  }

  const payment = await prisma.payment.create({
    data: {
      registrationId: player.registrationId,
      type: "MONTHLY_SUBSCRIPTION",
      amountKobo: input.amountKobo,
      status: "VERIFIED",
      periodMonth: input.periodMonth,
      proofUrl: input.proof?.url ?? "recorded-manually",
      proofPublicId: input.proof?.publicId ?? "recorded-manually",
      proofFormat: input.proof?.format ?? "none",
      proofBytes: input.proof?.bytes ?? 0,
      depositorName: input.depositorName || null,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      note: input.note || null,
      verifiedById: actor.id,
      verifiedAt: new Date(),
    },
  });

  await audit({
    actor,
    action: "payment.monthly_recorded",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { playerId: input.playerId, periodMonth: input.periodMonth, amountKobo: input.amountKobo },
  });

  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function removeMonthlyPayment(paymentId: string): Promise<PaymentActionResult> {
  const actor = await requireAdmin();
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: true };
  if (payment.type !== "MONTHLY_SUBSCRIPTION") {
    return { ok: false, error: "Only monthly subscription records can be removed here." };
  }
  await prisma.payment.delete({ where: { id: paymentId } });
  await audit({
    actor,
    action: "payment.monthly_removed",
    entityType: "Payment",
    entityId: paymentId,
    metadata: { periodMonth: payment.periodMonth },
  });
  revalidatePath("/admin/payments");
  return { ok: true };
}
