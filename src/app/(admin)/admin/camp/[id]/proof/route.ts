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
 * Streams a camp registration's transfer proof from our own domain — same
 * treatment as academy proofs: admin session required, fetched with a
 * server-side signed URL (the API download endpoint, which works for PDFs
 * too), never a Cloudinary link in the browser.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/admin/camp/[id]/proof">,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const registration = await prisma.campRegistration.findUnique({
    where: { id },
    select: { reference: true, proofPublicId: true, proofFormat: true },
  });
  if (!registration?.proofPublicId || !registration.proofFormat) {
    return NextResponse.json({ error: "No proof on this camp registration." }, { status: 404 });
  }

  if (!cloudinaryConfigured() || registration.proofPublicId.includes("dev-")) {
    return new NextResponse(
      "Cloudinary is not configured — this is a development placeholder for the payment proof.",
      { status: 200, headers: { "Content-Type": "text/plain" } },
    );
  }

  const upstream = await fetch(
    signedProofUrl(registration.proofPublicId, registration.proofFormat, {
      expiresInSeconds: 10 * 60,
    }),
  );
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "The proof file couldn't be retrieved from storage. Try again." },
      { status: 502 },
    );
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const format = registration.proofFormat.toLowerCase();
  const filename = `camp-proof-${registration.reference}.${format}`;

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? CONTENT_TYPES[format] ?? "application/octet-stream",
      "Content-Disposition": download ? `attachment; filename="${filename}"` : "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
