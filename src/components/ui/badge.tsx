import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "gold" | "green" | "red" | "amber" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-kit/10 text-kit",
  gold: "bg-gold text-kit",
  green: "bg-pitch text-chalk",
  red: "bg-red-100 text-red-800 border border-red-200",
  amber: "bg-amber-100 text-amber-900 border border-amber-200",
  outline: "border border-line text-current",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-brand px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    SUBMITTED: { tone: "amber", label: "Awaiting review" },
    UNDER_REVIEW: { tone: "amber", label: "Under review" },
    ACCEPTED: { tone: "green", label: "Accepted" },
    REJECTED: { tone: "red", label: "Rejected" },
    AWAITING_PROOF: { tone: "neutral", label: "Awaiting proof" },
    PROOF_SUBMITTED: { tone: "amber", label: "Proof submitted" },
    VERIFIED: { tone: "green", label: "Verified" },
    SCHEDULED: { tone: "outline", label: "Scheduled" },
    LIVE: { tone: "gold", label: "Live" },
    COMPLETED: { tone: "neutral", label: "Full time" },
    POSTPONED: { tone: "amber", label: "Postponed" },
    CANCELLED: { tone: "red", label: "Cancelled" },
    SENT: { tone: "green", label: "Sent" },
    FAILED: { tone: "red", label: "Failed" },
    QUEUED: { tone: "amber", label: "Queued" },
    SKIPPED: { tone: "neutral", label: "Skipped" },
  };
  const entry = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
