"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "inline-flex h-8 items-center rounded-brand border border-line px-2.5 text-[0.75rem] font-semibold transition-colors hover:border-current",
        copied && "border-pitch bg-pitch text-chalk",
        className,
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
