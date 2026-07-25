import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloudinaryConfigured, signedProofUrl, signedProofViewUrl } from "@/lib/cloudinary";

/**
 * Redirects to a short-lived signed Cloudinary URL for the payment proof.
 * Proofs are `type: authenticated` — this is the only way they're viewable,
 * and only with an active admin session.
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
  });
  if (!payment) {
    return NextResponse.json({ error: "No payment proof on this registration." }, { status: 404 });
  }

  if (!cloudinaryConfigured()) {
    // Dev-mock proofs have no real asset behind them.
    return new NextResponse(
      "Cloudinary is not configured — this is a development placeholder for the payment proof.",
      { status: 200, headers: { "Content-Type": "text/plain" } },
    );
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const url = download
    ? signedProofUrl(payment.proofPublicId, payment.proofFormat, { expiresInSeconds: 10 * 60 })
    : signedProofViewUrl(payment.proofPublicId, payment.proofFormat);
  return NextResponse.redirect(url);
}
