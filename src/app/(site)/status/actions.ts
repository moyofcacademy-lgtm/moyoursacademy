"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cloudinaryConfigured, verifyProofAsset } from "@/lib/cloudinary";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/notify";
import { site } from "@/config/site";
import { ContactMessageEmail, contactMessageText } from "@/emails/contact-message";
import { normalizeNgPhone } from "@/lib/utils";

export type StatusEntry = {
  reference: string;
  playerFirstName: string;
  status: string;
  paymentStatus: string;
  memberCode: string | null;
  rejectionReason: string | null;
  submittedAtIso: string;
  canReupload: boolean;
};

export type StatusResult =
  | { ok: true; entries: StatusEntry[] }
  | { ok: false; error: string };

async function limited(kind: string): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limiter = rateLimit(`${kind}:${ip}`, LIMITS.statusCheck);
  if (!limiter.ok) {
    return `Too many checks — try again in ${Math.ceil(limiter.retryAfterSeconds / 60)} minutes.`;
  }
  return null;
}

/**
 * Guardian-facing status lookup by reference or phone. Deliberately returns
 * the minimum needed — first name and progress — never address or contact
 * details, and only to someone holding the reference or the guardian phone.
 */
export async function checkStatus(query: string): Promise<StatusResult> {
  const rateError = await limited("status");
  if (rateError) return { ok: false, error: rateError };

  const input = query.trim();
  if (input.length < 4) {
    return { ok: false, error: "Enter your application reference (MOY-REF-…) or the guardian phone number." };
  }

  const asReference = input.toUpperCase().startsWith("MOY");
  const phone = normalizeNgPhone(input);

  const registrations = await prisma.registration.findMany({
    where: asReference
      ? { reference: input.toUpperCase() }
      : phone
        ? { guardianPhone: phone }
        : { reference: input.toUpperCase() },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      reference: true,
      firstName: true,
      status: true,
      paymentStatus: true,
      memberCode: true,
      rejectionReason: true,
      createdAt: true,
    },
  });

  if (registrations.length === 0) {
    return {
      ok: false,
      error: asReference || phone
        ? "We couldn't find an application with that. Check the reference from your confirmation email, or use the phone number you registered with."
        : "That doesn't look like a reference or a Nigerian phone number. References look like MOY-REF-8KQ2P1.",
    };
  }

  return {
    ok: true,
    entries: registrations.map((reg) => ({
      reference: reg.reference,
      playerFirstName: reg.firstName,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      memberCode: reg.status === "ACCEPTED" ? reg.memberCode : null,
      rejectionReason: reg.status === "REJECTED" ? reg.rejectionReason : null,
      submittedAtIso: reg.createdAt.toISOString(),
      canReupload: reg.paymentStatus === "AWAITING_PROOF" && reg.status === "UNDER_REVIEW",
    })),
  };
}

const reuploadSchema = z.object({
  reference: z.string().regex(/^MOY-REF-[2-9A-HJ-NP-Z]{6}$/, "Invalid reference"),
  proof: z.object({
    proofPublicId: z.string().min(1),
    proofUrl: z.string().min(1),
    proofFormat: z.string().min(1),
    proofBytes: z.number().int().positive(),
  }),
});

export async function reuploadProof(input: {
  reference: string;
  proof: { proofPublicId: string; proofUrl: string; proofFormat: string; proofBytes: number };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rateError = await limited("reupload");
  if (rateError) return { ok: false, error: rateError };

  const parsed = reuploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Upload your new proof and try again." };
  const { reference, proof } = parsed.data;

  const registration = await prisma.registration.findUnique({
    where: { reference },
    include: { payments: { where: { type: "INITIAL" }, take: 1 } },
  });
  if (!registration || registration.paymentStatus !== "AWAITING_PROOF") {
    return { ok: false, error: "This application isn't waiting for a new proof. Check its status above." };
  }

  const isDevMock = !cloudinaryConfigured() && process.env.NODE_ENV !== "production";
  let verified = { url: proof.proofUrl, bytes: proof.proofBytes, format: proof.proofFormat.toLowerCase() };
  if (!isDevMock) {
    const verification = await verifyProofAsset(proof.proofPublicId);
    if (!verification.ok) return { ok: false, error: verification.error };
    verified = verification;
  }

  await prisma.$transaction(async (tx) => {
    const payment = registration.payments[0];
    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          proofUrl: verified.url,
          proofPublicId: proof.proofPublicId,
          proofFormat: verified.format,
          proofBytes: verified.bytes,
          status: "PROOF_SUBMITTED",
        },
      });
    }
    await tx.registration.update({
      where: { id: registration.id },
      data: { paymentStatus: "PROOF_SUBMITTED" },
    });
  });

  await sendEmail({
    to: process.env.ADMIN_EMAIL ?? site.email,
    subject: `New payment proof – ${registration.firstName} ${registration.lastName}`,
    react: ContactMessageEmail({
      name: `${registration.firstName} ${registration.lastName}`,
      phone: registration.guardianPhone,
      message: `The guardian uploaded a new payment proof for ${reference}. Review it: ${site.url}/admin/registrations/${registration.id}`,
    }),
    text: contactMessageText({
      name: `${registration.firstName} ${registration.lastName}`,
      phone: registration.guardianPhone,
      message: `The guardian uploaded a new payment proof for ${reference}. Review it: ${site.url}/admin/registrations/${registration.id}`,
    }),
    template: "admin-proof-reuploaded",
    registrationId: registration.id,
  });

  return { ok: true };
}
