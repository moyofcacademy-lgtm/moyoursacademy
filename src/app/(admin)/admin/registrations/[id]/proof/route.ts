import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloudinaryConfigured, signedProofUrl } from "@/lib/cloudinary";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

/**
 * Serves the payment proof from our own domain. The server fetches the
 * authenticated Cloudinary asset with a signed URL and streams the bytes
 * through — the admin's browser never sees a Cloudinary link, and downloads
 * arrive with a clean filename (payment-proof-<reference>.<format>).
 * Requires an active admin session; proofs stay privately stored.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/admin/registrations/[id]/proof">,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const paymentId = request.nextUrl.searchParams.get("payment");

  const payment = await prisma.payment.findFirst({
    where: paymentId ? { id: paymentId, registrationId: id } : { registrationId: id, type: "INITIAL" },
    orderBy: { createdAt: "desc" },
    include: { registration: { select: { reference: true } } },
  });
  if (!payment) {
    return NextResponse.json({ error: "No payment proof on this registration." }, { status: 404 });
  }

  if (!cloudinaryConfigured() || payment.proofPublicId.includes("dev-")) {
    // Dev-mock proofs have no real asset behind them.
    return new NextResponse(
      "Cloudinary is not configured — this is a development placeholder for the payment proof.",
      { status: 200, headers: { "Content-Type": "text/plain" } },
    );
  }

  // The API download endpoint works for every format (Cloudinary's delivery
  // URLs 401 on PDFs for accounts with PDF delivery disabled).
  const upstream = await fetch(
    signedProofUrl(payment.proofPublicId, payment.proofFormat, { expiresInSeconds: 10 * 60 }),
  );
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "The proof file couldn't be retrieved from storage. Try again." },
      { status: 502 },
    );
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const format = payment.proofFormat.toLowerCase();
  const filename = `payment-proof-${payment.registration.reference}.${format}`;

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? CONTENT_TYPES[format] ?? "application/octet-stream",
      "Content-Disposition": download ? `attachment; filename="${filename}"` : "inline",
      // financial documents — never cache in shared caches
      "Cache-Control": "private, no-store",
    },
  });
}
