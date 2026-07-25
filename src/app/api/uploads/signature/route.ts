import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cloudinaryConfigured, signUpload, type UploadIntent } from "@/lib/cloudinary";
import { CLOUDINARY_FOLDERS } from "@/lib/constants";
import { rateLimit, LIMITS } from "@/lib/rate-limit";

const bodySchema = z.object({
  intent: z.enum(Object.keys(CLOUDINARY_FOLDERS) as [UploadIntent, ...UploadIntent[]]),
});

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown upload intent." }, { status: 400 });
  }
  const { intent } = parsed.data;

  if (intent === "proofs") {
    // Guardian proof uploads: no session exists yet — rate-limit per IP and
    // pin every upload parameter server-side.
    const limiter = rateLimit(`signature:${clientIp(request)}`, LIMITS.uploadSignature);
    if (!limiter.ok) {
      return NextResponse.json(
        { error: `Too many uploads. Try again in ${Math.ceil(limiter.retryAfterSeconds / 60)} minutes.` },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } },
      );
    }
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorized." }, { status: 401 });
    }
  }

  if (!cloudinaryConfigured()) {
    // Local development without Cloudinary credentials: the client falls
    // back to a simulated upload so the flow stays testable end-to-end.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ devMock: true });
    }
    return NextResponse.json(
      { error: "Uploads are not available right now. Contact the academy." },
      { status: 503 },
    );
  }

  return NextResponse.json(signUpload(intent));
}
