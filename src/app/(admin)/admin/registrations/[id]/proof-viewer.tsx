"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Inline payment-proof viewer. Images zoom and rotate; PDFs render in-page.
 * Everything loads through /admin/registrations/[id]/proof, which requires
 * an admin session and redirects to a signed, expiring Cloudinary URL.
 */
export function ProofViewer({
  registrationId,
  format,
  devMock,
}: {
  registrationId: string;
  format: string;
  devMock: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const src = `/admin/registrations/${registrationId}/proof`;

  if (devMock) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-brand border border-dashed border-line bg-white/50 p-6 text-center">
        <p className="font-mono text-step--1 font-bold uppercase">
          {format} proof
        </p>
        <p className="text-step--1 text-kit-soft">
          Development placeholder connect Cloudinary to view real proofs here.
        </p>
      </div>
    );
  }

  if (format === "pdf") {
    return (
      <div className="flex flex-col gap-3">
        <iframe
          src={src}
          title="Payment proof (PDF)"
          className="h-[32rem] w-full rounded-brand border border-line bg-white"
        />
        <a
          href={`${src}?download=1`}
          className="inline-flex h-10 w-fit items-center rounded-brand border border-line px-4 text-step--1 font-semibold hover:border-kit"
        >
          Download PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="overflow-auto rounded-brand border border-line bg-kit/5"
        style={{ maxHeight: "32rem" }}
      >
        {/* Signed, session-gated proof image — next/image can't proxy it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Payment proof"
          className="mx-auto transition-transform"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center",
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
        >
          Zoom in
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
        >
          Zoom out
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRotation((r) => (r + 90) % 360)}
        >
          Rotate
        </Button>
        <a
          href={`${src}?download=1`}
          className="ml-auto inline-flex h-8 items-center rounded-brand border border-line px-3 text-[0.75rem] font-semibold hover:border-kit"
        >
          Download
        </a>
      </div>
    </div>
  );
}
