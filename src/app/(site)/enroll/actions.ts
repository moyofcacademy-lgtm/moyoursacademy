"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/codes";
import { cloudinaryConfigured, verifyProofAsset } from "@/lib/cloudinary";
import { ageAt, ageGroupForDob } from "@/lib/constants";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { getFees, getSetting } from "@/lib/settings";
import { formatNaira, formatDateWAT } from "@/lib/utils";
import { enrollSubmitSchema, type EnrollSubmitInput } from "@/lib/validations/registration";
import { sendEmail } from "@/lib/notify";
import { site } from "@/config/site";
import {
  GuardianReceivedEmail,
  guardianReceivedText,
} from "@/emails/guardian-received";
import {
  AdminNewRegistrationEmail,
  adminNewRegistrationText,
} from "@/emails/admin-new-registration";
import { Prisma } from "@/generated/prisma/client";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Issued when the guardian reaches the payment step so the transfer
 * narration can carry the real reference. Uniqueness is re-checked (and the
 * reference regenerated if ever needed) inside the submit transaction.
 */
export async function reserveReference(): Promise<{ reference: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference();
    const exists = await prisma.registration.findUnique({ where: { reference } });
    if (!exists) return { reference };
  }
  return { reference: generateReference() };
}

export type EnrollResult =
  | { ok: true; reference: string; playerName: string }
  | { ok: false; error: string };

export async function submitEnrollment(
  input: EnrollSubmitInput & { reference?: string },
): Promise<EnrollResult> {
  const ip = await clientIp();
  const limiter = rateLimit(`enroll:${ip}`, LIMITS.enrollSubmit);
  if (!limiter.ok) {
    return {
      ok: false,
      error: `Too many submissions from this connection. Try again in ${Math.ceil(limiter.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const parsed = enrollSubmitSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `${first.message} Check the form and try again.` };
  }
  const { form, proof } = parsed.data;

  // Never trust the client's description of the uploaded file.
  const isDevMockProof =
    !cloudinaryConfigured() && process.env.NODE_ENV !== "production";
  let verifiedProof = {
    url: proof.proofUrl,
    bytes: proof.proofBytes,
    format: proof.proofFormat.toLowerCase(),
  };
  if (!isDevMockProof) {
    const verification = await verifyProofAsset(proof.proofPublicId);
    if (!verification.ok) {
      return { ok: false, error: verification.error };
    }
    verifiedProof = verification;
  }

  const dateOfBirth = new Date(`${form.dateOfBirth}T00:00:00Z`);
  const ageGroup = ageGroupForDob(dateOfBirth);
  const fees = await getFees();
  const issueCodeOnSubmit = await getSetting("issueCodeOnSubmit");

  let registrationId = "";
  let reference = input.reference?.match(/^MOY-REF-[2-9A-HJ-NP-Z]{6}$/)
    ? input.reference
    : generateReference();

  // Single transaction: registration + payment row + reference issue.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const registration = await prisma.$transaction(async (tx) => {
        return tx.registration.create({
          data: {
            reference,
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth,
            gender: form.gender,
            preferredPosition: form.preferredPosition || null,
            medicalNotes: form.medicalNotes || null,
            schoolName: form.schoolName || null,
            guardianName: form.guardianName,
            guardianPhone: form.guardianPhone,
            guardianAltPhone: form.guardianAltPhone ?? null,
            guardianEmail: form.guardianEmail,
            guardianRelationship: form.guardianRelationship || null,
            address: form.address,
            emergencyContactName: form.emergencyContactName || null,
            emergencyContactPhone: form.emergencyContactPhone ?? null,
            consentMedical: form.consentMedical,
            consentMedia: form.consentMedia,
            consentTerms: form.consentTerms,
            status: "SUBMITTED",
            paymentStatus: "PROOF_SUBMITTED",
            ageGroup,
            payments: {
              create: {
                type: "INITIAL",
                amountKobo: fees.initialTotalKobo,
                status: "PROOF_SUBMITTED",
                proofUrl: verifiedProof.url,
                proofPublicId: proof.proofPublicId,
                proofFormat: verifiedProof.format,
                proofBytes: verifiedProof.bytes,
                depositorName: proof.depositorName || null,
                paidAt: proof.paidAt ? new Date(proof.paidAt) : null,
              },
            },
          },
        });
      });
      registrationId = registration.id;
      break;
    } catch (error) {
      // Reference collision — regenerate and retry.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 2
      ) {
        reference = generateReference();
        continue;
      }
      console.error("Enrollment submit failed:", error);
      return {
        ok: false,
        error: "We couldn't save your registration. Check your connection and try again.",
      };
    }
  }

  if (issueCodeOnSubmit) {
    // Original-spec behaviour, off by default: mint the member code now.
    const { nextMemberCode } = await import("@/lib/codes");
    await prisma.$transaction(async (tx) => {
      const memberCode = await nextMemberCode(tx);
      await tx.registration.update({
        where: { id: registrationId },
        data: { memberCode },
      });
    });
  }

  const playerName = `${form.firstName} ${form.lastName}`;

  // Notifications happen after the transaction — a provider outage must
  // never lose a registration. Failures land in NotificationLog.
  const age = ageAt(dateOfBirth);
  const genderLabel = form.gender === "MALE" ? "Boy" : "Girl";
  // Served from our own domain (admin session required) — no expiring
  // third-party links in the inbox.
  const proofLink = `${site.url}/admin/registrations/${registrationId}/proof`;

  await Promise.all([
    sendEmail({
      to: form.guardianEmail,
      subject: "Application received – Moyours Football Academy",
      react: GuardianReceivedEmail({ guardianName: form.guardianName, playerName, reference }),
      text: guardianReceivedText({ guardianName: form.guardianName, playerName, reference }),
      template: "guardian-received",
      registrationId,
    }),
    sendEmail({
      to: process.env.ADMIN_EMAIL ?? site.email,
      subject: `New Player Registration – ${playerName}`,
      react: AdminNewRegistrationEmail({
        playerName,
        ageLine: `${age} years (${formatDateWAT(dateOfBirth)}) · ${ageGroup ?? "—"} · ${genderLabel}`,
        position: form.preferredPosition || undefined,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        guardianEmail: form.guardianEmail,
        address: form.address,
        reference,
        amountLine: `${formatNaira(fees.initialTotalKobo)} (initial payment)`,
        proofUrl: proofLink,
        reviewUrl: `${site.url}/admin/registrations/${registrationId}`,
      }),
      text: adminNewRegistrationText({
        playerName,
        ageLine: `${age} years (${formatDateWAT(dateOfBirth)}) · ${ageGroup ?? "—"} · ${genderLabel}`,
        position: form.preferredPosition || undefined,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        guardianEmail: form.guardianEmail,
        address: form.address,
        reference,
        amountLine: `${formatNaira(fees.initialTotalKobo)} (initial payment)`,
        proofUrl: proofLink,
        reviewUrl: `${site.url}/admin/registrations/${registrationId}`,
      }),
      template: "admin-new-registration",
      registrationId,
    }),
  ]);

  return { ok: true, reference, playerName };
}
