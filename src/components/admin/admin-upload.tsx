"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type UploadedAsset = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

/**
 * Session-gated direct-to-Cloudinary uploader for admin assets (crests,
 * gallery, match photos, news covers). Falls back to a simulated upload in
 * local development without Cloudinary credentials.
 */
export function AdminUpload({
  intent,
  label,
  multiple = false,
  onUploaded,
}: {
  intent: "crests" | "gallery" | "matches" | "news" | "players";
  label: string;
  multiple?: boolean;
  onUploaded: (assets: UploadedAsset[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<UploadedAsset | null> {
    const signatureResponse = await fetch("/api/uploads/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent }),
    });
    const signature = await signatureResponse.json();
    if (!signatureResponse.ok) {
      throw new Error(signature.error ?? "Upload isn't available right now.");
    }

    if (signature.devMock) {
      return {
        url: `https://res.cloudinary.com/dev-mock/moyours/${intent}/${encodeURIComponent(file.name)}`,
        publicId: `moyours/${intent}/dev-${crypto.randomUUID()}`,
      };
    }

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("folder", signature.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      { method: "POST", body: form },
    );
    if (!response.ok) throw new Error(`Upload failed (${response.status})`);
    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        multiple={multiple}
        className="sr-only"
        aria-label={label}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length === 0) return;
          setBusy(true);
          setError(null);
          try {
            const assets: UploadedAsset[] = [];
            for (const file of files) {
              const asset = await uploadOne(file);
              if (asset) assets.push(asset);
            }
            onUploaded(assets);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={busy}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      {error && (
        <p role="alert" className="text-step--1 font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
