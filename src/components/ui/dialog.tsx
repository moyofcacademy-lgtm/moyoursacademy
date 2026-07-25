"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Accessible modal built on the native <dialog> element — focus trapping,
 * Escape-to-close, and backdrop dismissal come from the platform.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // click on the backdrop (the dialog element itself) closes
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[min(92vw,32rem)] rounded-brand border border-line bg-chalk p-0 text-kit shadow-2xl backdrop:bg-kit/60 backdrop:backdrop-blur-sm open:animate-rise",
        className,
      )}
    >
      <div className="p-6">
        <h2 id="dialog-title" className="font-display text-step-1 mb-3">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-end gap-3">{children}</div>;
}
