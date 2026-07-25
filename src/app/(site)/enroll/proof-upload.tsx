"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PROOF_MAX_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type UploadedProof = {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  /** local preview only — object URL or data URL */
  previewUrl?: string;
  fileName: string;
};

const ACCEPTED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export function ProofUpload({
  proof,
  onChange,
}: {
  proof: UploadedProof | null;
  onChange: (proof: UploadedProof | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    const format = ACCEPTED_TYPES[file.type];
    if (!format) {
      setError("That file type won't work — upload a JPG, PNG, or PDF.");
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      setError("That file is over 10MB. Take a smaller photo or export a compressed PDF.");
      return;
    }

    setProgress(0);
    try {
      const signatureResponse = await fetch("/api/uploads/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "proofs" }),
      });
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) {
        setError(signature.error ?? "Upload isn't available right now. Try again shortly.");
        setProgress(null);
        return;
      }

      const previewUrl = format === "pdf" ? undefined : URL.createObjectURL(file);

      if (signature.devMock) {
        // Local development without Cloudinary — simulate the upload so the
        // flow stays testable end-to-end.
        await new Promise((resolve) => setTimeout(resolve, 400));
        onChange({
          publicId: `moyours/proofs/dev-${crypto.randomUUID()}`,
          url: `https://res.cloudinary.com/dev-mock/moyours/proofs/${file.name}`,
          format,
          bytes: file.size,
          previewUrl,
          fileName: file.name,
        });
        setProgress(null);
        return;
      }

      // Direct-to-Cloudinary: the file never passes through our server.
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signature.apiKey);
      form.append("timestamp", String(signature.timestamp));
      form.append("signature", signature.signature);
      form.append("folder", signature.folder);
      if (signature.type) form.append("type", signature.type);

      const result = await new Promise<{ public_id: string; secure_url: string; format?: string; bytes: number }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
          xhr.send(form);
        },
      );

      onChange({
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format ?? format,
        bytes: result.bytes,
        previewUrl,
        fileName: file.name,
      });
    } catch {
      setError("The upload didn't finish. Check your connection and try again.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        className="sr-only"
        aria-label="Choose proof of payment file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {proof ? (
        <div className="flex flex-wrap items-center gap-4 rounded-brand border border-line bg-white/70 p-4">
          {proof.previewUrl ? (
            // Local object URL preview — next/image can't optimize blob URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proof.previewUrl}
              alt="Preview of your payment proof"
              className="h-24 w-24 rounded-brand border border-line object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-brand border border-line bg-kit/5 font-mono text-step--1 font-bold uppercase">
              {proof.format}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{proof.fileName}</p>
            <p className="text-step--1 text-kit-soft">
              {(proof.bytes / 1024 / 1024).toFixed(1)}MB · uploaded
            </p>
          </div>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Replace file
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-brand border-2 border-dashed border-line bg-white/40 px-6 py-12 text-center transition-colors hover:border-pitch hover:bg-white/70",
            progress !== null && "pointer-events-none",
          )}
        >
          {progress !== null ? (
            <>
              <span className="font-mono text-step-1 font-bold text-pitch">{progress}%</span>
              <span
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
                className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-line"
              >
                <span
                  className="block h-full bg-gold transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </>
          ) : (
            <>
              <span className="text-step-0 font-semibold">Tap to choose your receipt</span>
              <span className="text-step--1 text-kit-soft">JPG, PNG, or PDF · up to 10MB</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-step--1 font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
