"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { nextMemberCode } from "@/lib/codes";
import { sendEmail } from "@/lib/notify";
import { getSetting } from "@/lib/settings";
import { site } from "@/config/site";
import { REJECTION_REASONS } from "@/lib/constants";
import {
  GuardianConfirmationEmail,
  guardianConfirmationText,
} from "@/emails/guardian-confirmation";
import {
  GuardianRejectedEmail,
  guardianRejectedText,
} from "@/emails/guardian-rejected";
import {
  GuardianReuploadEmail,
  guardianReuploadText,
} from "@/emails/guardian-reupload";

export type ActionResult =
  | { ok: true; memberCode?: string; alreadyAccepted?: boolean }
  | { ok: false; error: string };

/**
 * Accept a registration. One atomic transaction mints the member code,
 * flips statuses, and creates the Player. Idempotent: accepting an
 * already-accepted registration is a no-op — no second code, no second SMS.
 */
export async function acceptRegistration(registrationId: string): Promise<ActionResult> {
  const actor = await requireAdmin();

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      // Status-guarded claim: only one concurrent accept can win this row.
      const claimed = await tx.registration.updateMany({
        where: {
          id: registrationId,
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        },
        data: {
          status: "ACCEPTED",
          paymentStatus: "VERIFIED",
          reviewedById: actor.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });
      if (claimed.count === 0) {
        return { alreadyAccepted: true as const };
      }

      const registration = await tx.registration.findUniqueOrThrow({
        where: { id: registrationId },
      });

      const memberCode = registration.memberCode ?? (await nextMemberCode(tx));
      if (!registration.memberCode) {
        await tx.registration.update({
          where: { id: registrationId },
          data: { memberCode },
        });
      }

      await tx.payment.updateMany({
        where: { registrationId, type: "INITIAL", status: "PROOF_SUBMITTED" },
        data: { status: "VERIFIED", verifiedById: actor.id, verifiedAt: new Date() },
      });

      // Auto-assign to the squad matching the age group; admin can reassign.
      const team = registration.ageGroup
        ? await tx.team.findFirst({ where: { ageGroup: registration.ageGroup } })
        : null;
      await tx.player.create({
        data: {
          memberCode,
          registrationId,
          teamId: team?.id ?? null,
        },
      });

      await audit({
        tx,
        actor,
        action: "registration.accepted",
        entityType: "Registration",
        entityId: registrationId,
        metadata: { memberCode, team: team?.name ?? null },
      });

      return { alreadyAccepted: false as const, registration, memberCode };
    });

    if (outcome.alreadyAccepted) {
      return { ok: true, alreadyAccepted: true };
    }

    const { registration, memberCode } = outcome;
    const playerName = `${registration.firstName} ${registration.lastName}`;
    const whatsapp = (await getSetting("contact")).whatsappGroupUrl || undefined;

    // Notification failures must not roll back the acceptance — they land
    // in NotificationLog with a Resend button.
    await sendEmail({
      to: registration.guardianEmail,
      subject: "Registration Confirmation – Moyours Football Academy",
      react: GuardianConfirmationEmail({
        guardianName: registration.guardianName,
        playerName,
        memberCode,
        whatsappGroupUrl: whatsapp,
      }),
      text: guardianConfirmationText({
        guardianName: registration.guardianName,
        playerName,
        memberCode,
        whatsappGroupUrl: whatsapp,
      }),
      template: "guardian-confirmation",
      registrationId,
    });

    revalidatePath("/admin/registrations");
    revalidatePath(`/admin/registrations/${registrationId}`);
    return { ok: true, memberCode };
  } catch (error) {
    console.error("acceptRegistration failed:", error);
    return { ok: false, error: "Acceptance didn't go through. The registration is unchanged — try again." };
  }
}

export async function bulkAcceptRegistrations(
  registrationIds: string[],
): Promise<{ accepted: number; skipped: number; failed: number }> {
  await requireAdmin();
  let accepted = 0;
  let skipped = 0;
  let failed = 0;
  for (const id of registrationIds) {
    const result = await acceptRegistration(id);
    if (!result.ok) failed++;
    else if (result.alreadyAccepted) skipped++;
    else accepted++;
  }
  revalidatePath("/admin/registrations");
  return { accepted, skipped, failed };
}

export async function rejectRegistration(
  registrationId: string,
  reasonKey: string,
  customReason?: string,
): Promise<ActionResult> {
  const actor = await requireAdmin();

  const preset = REJECTION_REASONS.find((r) => r.key === reasonKey);
  if (!preset) {
    return { ok: false, error: "Pick a rejection reason." };
  }
  const reason =
    preset.key === "OTHER"
      ? customReason?.trim() || "The application could not be confirmed."
      : preset.label;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const claimed = await tx.registration.updateMany({
        where: { id: registrationId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        data: {
          status: "REJECTED",
          paymentStatus: "REJECTED",
          reviewedById: actor.id,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });
      if (claimed.count === 0) return null;

      const registration = await tx.registration.findUniqueOrThrow({
        where: { id: registrationId },
      });

      await audit({
        tx,
        actor,
        action: "registration.rejected",
        entityType: "Registration",
        entityId: registrationId,
        metadata: { reason },
      });

      return registration;
    });

    if (!outcome) {
      return { ok: false, error: "This application was already reviewed — refresh to see its current state." };
    }

    const playerName = `${outcome.firstName} ${outcome.lastName}`;
    await sendEmail({
      to: outcome.guardianEmail,
      subject: `About ${playerName}'s registration – Moyours Football Academy`,
      react: GuardianRejectedEmail({
        guardianName: outcome.guardianName,
        playerName,
        reference: outcome.reference,
        reason,
        resubmitUrl: `${site.url}/enroll`,
      }),
      text: guardianRejectedText({
        guardianName: outcome.guardianName,
        playerName,
        reference: outcome.reference,
        reason,
        resubmitUrl: `${site.url}/enroll`,
      }),
      template: "guardian-rejected",
      registrationId,
    });

    revalidatePath("/admin/registrations");
    revalidatePath(`/admin/registrations/${registrationId}`);
    return { ok: true };
  } catch (error) {
    console.error("rejectRegistration failed:", error);
    return { ok: false, error: "Rejection didn't go through. Try again." };
  }
}

export async function requestBetterProof(registrationId: string): Promise<ActionResult> {
  const actor = await requireAdmin();

  try {
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: "UNDER_REVIEW", paymentStatus: "AWAITING_PROOF" },
    });

    await audit({
      actor,
      action: "registration.proof_requested",
      entityType: "Registration",
      entityId: registrationId,
    });

    const playerName = `${registration.firstName} ${registration.lastName}`;
    const reuploadUrl = `${site.url}/status?ref=${registration.reference}`;
    await sendEmail({
      to: registration.guardianEmail,
      subject: `We need a clearer payment proof – Moyours Football Academy`,
      react: GuardianReuploadEmail({
        guardianName: registration.guardianName,
        playerName,
        reference: registration.reference,
        reuploadUrl,
      }),
      text: guardianReuploadText({
        guardianName: registration.guardianName,
        playerName,
        reference: registration.reference,
        reuploadUrl,
      }),
      template: "guardian-reupload",
      registrationId,
    });

    revalidatePath("/admin/registrations");
    revalidatePath(`/admin/registrations/${registrationId}`);
    return { ok: true };
  } catch (error) {
    console.error("requestBetterProof failed:", error);
    return { ok: false, error: "Couldn't send the request. Try again." };
  }
}

export async function saveInternalNotes(
  registrationId: string,
  notes: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { internalNotes: notes.slice(0, 2000) },
    });
    revalidatePath(`/admin/registrations/${registrationId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save notes. Try again." };
  }
}

export async function deleteRegistration(registrationId: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      payments: { select: { proofPublicId: true } },
      player: { select: { id: true } },
    },
  });
  if (!registration) return { ok: true };

  await prisma.$transaction(async (tx) => {
    if (registration.player) {
      await tx.player.delete({ where: { id: registration.player.id } });
    }
    await tx.notificationLog.deleteMany({ where: { registrationId } });
    await tx.payment.deleteMany({ where: { registrationId } });
    await tx.registration.delete({ where: { id: registrationId } });
    await audit({
      tx,
      actor,
      action: "registration.deleted",
      entityType: "Registration",
      entityId: registrationId,
      metadata: {
        reference: registration.reference,
        playerName: `${registration.firstName} ${registration.lastName}`,
        memberCode: registration.memberCode,
      },
    });
  });

  const publicIds = [
    registration.playerPhotoPublicId,
    ...registration.payments.map((payment) => payment.proofPublicId),
  ].filter(Boolean);
  if (publicIds.length > 0) {
    const { destroyAsset } = await import("@/lib/cloudinary");
    await Promise.all(publicIds.map((publicId) => destroyAsset(publicId!)));
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/players");
  revalidatePath("/admin/payments");
  revalidatePath("/squads");
  revalidatePath("/");
  return { ok: true };
}

/** Re-send a failed or queued notification from its log entry. */
export async function resendNotification(logId: string): Promise<ActionResult> {
  const actor = await requireAdmin();

  const log = await prisma.notificationLog.findUnique({
    where: { id: logId },
    include: { registration: true },
  });
  if (!log || !log.registration) {
    return { ok: false, error: "This notification can't be rebuilt — the registration is gone." };
  }
  const reg = log.registration;
  const playerName = `${reg.firstName} ${reg.lastName}`;

  switch (log.template) {
    case "guardian-confirmation": {
      if (!reg.memberCode) return { ok: false, error: "No member code on this registration yet." };
      const whatsapp = (await getSetting("contact")).whatsappGroupUrl || undefined;
      await sendEmail({
        to: reg.guardianEmail,
        subject: "Registration Confirmation – Moyours Football Academy",
        react: GuardianConfirmationEmail({
          guardianName: reg.guardianName,
          playerName,
          memberCode: reg.memberCode,
          whatsappGroupUrl: whatsapp,
        }),
        text: guardianConfirmationText({
          guardianName: reg.guardianName,
          playerName,
          memberCode: reg.memberCode,
          whatsappGroupUrl: whatsapp,
        }),
        template: log.template,
        registrationId: reg.id,
      });
      break;
    }
    case "guardian-rejected": {
      await sendEmail({
        to: reg.guardianEmail,
        subject: `About ${playerName}'s registration – Moyours Football Academy`,
        react: GuardianRejectedEmail({
          guardianName: reg.guardianName,
          playerName,
          reference: reg.reference,
          reason: reg.rejectionReason ?? "The application could not be confirmed.",
          resubmitUrl: `${site.url}/enroll`,
        }),
        text: guardianRejectedText({
          guardianName: reg.guardianName,
          playerName,
          reference: reg.reference,
          reason: reg.rejectionReason ?? "The application could not be confirmed.",
          resubmitUrl: `${site.url}/enroll`,
        }),
        template: log.template,
        registrationId: reg.id,
      });
      break;
    }
    case "guardian-reupload": {
      await sendEmail({
        to: reg.guardianEmail,
        subject: `We need a clearer payment proof – Moyours Football Academy`,
        react: GuardianReuploadEmail({
          guardianName: reg.guardianName,
          playerName,
          reference: reg.reference,
          reuploadUrl: `${site.url}/status?ref=${reg.reference}`,
        }),
        text: guardianReuploadText({
          guardianName: reg.guardianName,
          playerName,
          reference: reg.reference,
          reuploadUrl: `${site.url}/status?ref=${reg.reference}`,
        }),
        template: log.template,
        registrationId: reg.id,
      });
      break;
    }
    default:
      return { ok: false, error: `Resending "${log.template}" isn't supported.` };
  }

  await audit({
    actor,
    action: "notification.resent",
    entityType: "NotificationLog",
    entityId: logId,
    metadata: { template: log.template, recipient: log.recipient },
  });

  revalidatePath(`/admin/registrations/${reg.id}`);
  return { ok: true };
}
