"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateCampReference } from "@/lib/codes";
import { cloudinaryConfigured, verifyProofAsset } from "@/lib/cloudinary";
import { ageAt } from "@/lib/constants";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";
import { formatNaira, formatDateWAT } from "@/lib/utils";
import { campFormSchema, type CampFormInput } from "@/lib/validations/camp";
import { sendEmail } from "@/lib/notify";
import { site } from "@/config/site";
import {
  CampReceivedEmail,
  campReceivedText,
  CampAdminAlertEmail,
  campAdminAlertText,
} from "@/emails/camp-received";
import { Prisma } from "@/generated/prisma/client";

export type CampSubmitResult =
  | { ok: true; reference: string; participantName: string; paymentMethod: string }
  | { ok: false; error: string };

export async function submitCampRegistration(input: CampFormInput): Promise<CampSubmitResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limiter = rateLimit(`camp:${ip}`, LIMITS.enrollSubmit);
  if (!limiter.ok) {
    return {
      ok: false,
      error: `Too many registrations from this connection. Try again in ${Math.ceil(limiter.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const camp = await getSetting("camp");
  if (!camp.active) {
    return { ok: false, error: "Camp registration is closed. Call us for late entries." };
  }

  const parsed = campFormSchema(camp.ageMin, camp.ageMax).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `${parsed.error.issues[0].message}. Check the form and try again.` };
  }
  const data = parsed.data;

  // Verify any uploaded transfer proof server-side — never trust the client.
  let verifiedProof: { url: string; bytes: number; format: string } | null = null;
  if (data.paymentMethod === "TRANSFER" && data.proof) {
    const isDevMock = !cloudinaryConfigured() && process.env.NODE_ENV !== "production";
    if (isDevMock) {
      verifiedProof = {
        url: data.proof.proofUrl,
        bytes: data.proof.proofBytes,
        format: data.proof.proofFormat.toLowerCase(),
      };
    } else {
      const verification = await verifyProofAsset(data.proof.proofPublicId);
      if (!verification.ok) return { ok: false, error: verification.error };
      verifiedProof = verification;
    }
  }

  const dateOfBirth = new Date(`${data.dateOfBirth}T00:00:00Z`);
  let reference = generateCampReference();
  let registrationId = "";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const registration = await prisma.campRegistration.create({
        data: {
          reference,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth,
          religion: data.religion || null,
          nationality: data.nationality || null,
          state: data.state || null,
          address: data.address,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone,
          guardianEmail: data.guardianEmail,
          paymentMethod: data.paymentMethod,
          amountKobo: verifiedProof ? camp.feeKobo : null,
          proofUrl: verifiedProof?.url ?? null,
          proofPublicId: data.proof?.proofPublicId ?? null,
          proofFormat: verifiedProof?.format ?? null,
          proofBytes: verifiedProof?.bytes ?? null,
          paymentStatus: verifiedProof ? "PROOF_SUBMITTED" : "AWAITING_PROOF",
          consentDeclaration: data.consentDeclaration,
        },
      });
      registrationId = registration.id;
      break;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 2
      ) {
        reference = generateCampReference();
        continue;
      }
      console.error("Camp registration failed:", error);
      return { ok: false, error: "We couldn't save the registration. Check your connection and try again." };
    }
  }

  const startDate = new Date(`${camp.startDate}T00:00:00+01:00`);
  const startLine = new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(startDate);
  const scheduleLines = camp.schedule.map((s) => `${s.day}s: ${s.start} – ${s.end}`);
  const bankLine = `${camp.bank.bankName} · ${camp.bank.accountNumber} · ${camp.bank.accountName}`;
  const feeLine = `${formatNaira(camp.feeKobo)} (${camp.durationLabel})`;
  const age = ageAt(dateOfBirth);

  await Promise.all([
    sendEmail({
      to: data.guardianEmail,
      subject: "Summer Camp Registration – Moyours Sports Academy",
      react: CampReceivedEmail({
        guardianName: data.guardianName,
        participantName: data.fullName,
        reference,
        paymentMethod: data.paymentMethod,
        feeLine,
        venue: camp.venue,
        startLine,
        scheduleLines,
        bankLine,
        whatsappPhone: camp.whatsappPhone,
      }),
      text: campReceivedText({
        guardianName: data.guardianName,
        participantName: data.fullName,
        reference,
        paymentMethod: data.paymentMethod,
        feeLine,
        venue: camp.venue,
        startLine,
        scheduleLines,
        bankLine,
        whatsappPhone: camp.whatsappPhone,
      }),
      template: "camp-received",
    }),
    sendEmail({
      to: process.env.ADMIN_EMAIL ?? site.email,
      subject: `Summer Camp Registration – ${data.fullName}`,
      react: CampAdminAlertEmail({
        participantName: data.fullName,
        ageLine: `${age} years (${formatDateWAT(dateOfBirth)}) · ${data.gender === "MALE" ? "Boy" : "Girl"}`,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        reference,
        paymentLine:
          data.paymentMethod === "TRANSFER"
            ? verifiedProof
              ? `Transfer — proof uploaded (${feeLine})`
              : "Transfer — proof to follow"
            : "Cash at venue",
        reviewUrl: `${site.url}/admin/camp`,
      }),
      text: campAdminAlertText({
        participantName: data.fullName,
        ageLine: `${age} years (${formatDateWAT(dateOfBirth)}) · ${data.gender === "MALE" ? "Boy" : "Girl"}`,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        reference,
        paymentLine:
          data.paymentMethod === "TRANSFER"
            ? verifiedProof
              ? `Transfer — proof uploaded (${feeLine})`
              : "Transfer — proof to follow"
            : "Cash at venue",
        reviewUrl: `${site.url}/admin/camp`,
      }),
      template: "camp-admin-alert",
    }),
  ]);

  // registrationId reserved for future camp-status lookups
  void registrationId;

  return { ok: true, reference, participantName: data.fullName, paymentMethod: data.paymentMethod };
}
