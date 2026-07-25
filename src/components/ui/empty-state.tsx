import type { ReactNode } from "react";
import { BallIcon } from "@/components/football";

/** Empty states invite action — "No fixtures yet. Add the first one." */
export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-brand border border-dashed border-line px-6 py-14 text-center">
      <BallIcon size={28} className="text-line" />
      <p className="text-step-0 text-kit-soft">{title}</p>
      {action}
    </div>
  );
}
