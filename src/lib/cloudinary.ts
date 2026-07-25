import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_FOLDERS, PROOF_FORMATS, PROOF_MAX_BYTES } from "@/lib/constants";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export type UploadIntent = keyof typeof CLOUDINARY_FOLDERS;

/**
 * Sign a direct-to-Cloudinary upload. The folder and delivery type are fixed
 * server-side per intent — the client can never choose where a file lands.
 * Payment proofs are `type: authenticated`: financial documents must never
 * be publicly addressable.
 */
export function signUpload(intent: UploadIntent) {
  const folder = CLOUDINARY_FOLDERS[intent];
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { folder, timestamp };
  if (intent === "proofs") {
    params.type = "authenticated";
  }
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!,
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
    ...(intent === "proofs" ? { type: "authenticated" as const } : {}),
  };
}

/**
 * Short-lived signed delivery URL for an authenticated proof asset.
 * Admins view proofs only through these — never a public link.
 */
export function signedProofUrl(
  publicId: string,
  format: string,
  { expiresInSeconds = 10 * 60 }: { expiresInSeconds?: number } = {},
): string {
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: format === "pdf" ? "image" : "image",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

/** Inline (non-attachment) signed URL for rendering a proof in the viewer. */
export function signedProofViewUrl(publicId: string, format: string): string {
  return cloudinary.url(`${publicId}.${format}`, {
    type: "authenticated",
    resource_type: "image",
    sign_url: true,
    secure: true,
  });
}

export type VerifiedAsset = {
  ok: true;
  url: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
};

/**
 * Server-side verification after a direct upload: the asset must exist in
 * the expected folder with an allowed format and size. Anything else is
 * destroyed and rejected — never trust the client's word for what it sent.
 */
export async function verifyProofAsset(
  publicId: string,
): Promise<VerifiedAsset | { ok: false; error: string }> {
  if (!publicId.startsWith(`${CLOUDINARY_FOLDERS.proofs}/`)) {
    return { ok: false, error: "Upload is outside the proofs folder." };
  }
  try {
    const resource = await cloudinary.api.resource(publicId, {
      type: "authenticated",
      resource_type: "image",
    });
    const format = String(resource.format ?? "").toLowerCase();
    const bytes = Number(resource.bytes ?? 0);
    if (!PROOF_FORMATS.includes(format as (typeof PROOF_FORMATS)[number])) {
      await destroyAsset(publicId, "authenticated");
      return { ok: false, error: "Proof must be a JPG, PNG, or PDF." };
    }
    if (bytes > PROOF_MAX_BYTES) {
      await destroyAsset(publicId, "authenticated");
      return { ok: false, error: "Proof is larger than 10MB." };
    }
    return {
      ok: true,
      url: resource.secure_url as string,
      bytes,
      format,
      width: resource.width as number | undefined,
      height: resource.height as number | undefined,
    };
  } catch {
    return { ok: false, error: "Uploaded file could not be found. Upload it again." };
  }
}

export async function destroyAsset(
  publicId: string,
  type: "upload" | "authenticated" = "upload",
): Promise<void> {
  if (!cloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { type, resource_type: "image" });
  } catch (error) {
    console.error(`Failed to destroy Cloudinary asset ${publicId}:`, error);
  }
}
