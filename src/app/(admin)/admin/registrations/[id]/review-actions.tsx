"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Select, Textarea } from "@/components/ui/input";
import { REJECTION_REASONS } from "@/lib/constants";
import { formatNaira } from "@/lib/utils";
import {
  acceptRegistration,
  rejectRegistration,
  requestBetterProof,
  resendNotification,
  saveInternalNotes,
} from "../actions";

export function ReviewActions({
  registrationId,
  playerName,
  guardianName,
  amountKobo,
  status,
}: {
  registrationId: string;
  playerName: string;
  guardianName: string;
  amountKobo: number | null;
  status: string;
}) {
  const router = useRouter();
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [reasonKey, setReasonKey] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [pending, startTransition] = useTransition();

  const reviewable = status === "SUBMITTED" || status === "UNDER_REVIEW";
  if (!reviewable) return null;

  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" onClick={() => setConfirmAccept(true)}>
        Accept player
      </Button>
      <Button variant="secondary" size="lg" onClick={() => setConfirmReject(true)}>
        Reject
      </Button>
      <Button
        variant="ghost"
        size="lg"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await requestBetterProof(registrationId);
            if (result.ok) {
              toast.success("Guardian emailed — they can upload a new proof against the same reference.");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          })
        }
      >
        Request better proof
      </Button>

      {/* Accept confirmation */}
      <Dialog open={confirmAccept} onClose={() => setConfirmAccept(false)} title="Accept this player?">
        <dl className="flex flex-col gap-2 text-step--1">
          <div className="flex justify-between gap-4">
            <dt className="text-kit-soft">Player</dt>
            <dd className="font-semibold">{playerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-kit-soft">Guardian</dt>
            <dd className="font-semibold">{guardianName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-kit-soft">Payment</dt>
            <dd className="font-mono font-semibold">{amountKobo != null ? formatNaira(amountKobo) : "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-step--1 text-kit-soft">
          A member code is issued and the guardian receives the confirmation
          email immediately.
        </p>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmAccept(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await acceptRegistration(registrationId);
                setConfirmAccept(false);
                if (result.ok) {
                  toast.success(
                    result.alreadyAccepted
                      ? "This player was already accepted — nothing was re-sent."
                      : `Player accepted. Member code ${result.memberCode}.`,
                  );
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Accept player
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={confirmReject} onClose={() => setConfirmReject(false)} title={`Reject ${playerName}'s application?`}>
        <div className="flex flex-col gap-3">
          <label htmlFor="reject-reason" className="text-step--1 font-semibold">
            Reason (the guardian sees this)
          </label>
          <Select
            id="reject-reason"
            value={reasonKey}
            onChange={(e) => setReasonKey(e.target.value)}
          >
            <option value="" disabled>
              Select a reason…
            </option>
            {REJECTION_REASONS.map((reason) => (
              <option key={reason.key} value={reason.key}>
                {reason.label}
              </option>
            ))}
          </Select>
          {reasonKey === "OTHER" && (
            <Textarea
              aria-label="Custom rejection reason"
              placeholder="Explain what went wrong and how to fix it…"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          )}
        </div>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmReject(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            disabled={!reasonKey || (reasonKey === "OTHER" && !customReason.trim())}
            onClick={() =>
              startTransition(async () => {
                const result = await rejectRegistration(registrationId, reasonKey, customReason);
                setConfirmReject(false);
                if (result.ok) {
                  toast.success("Application rejected — the guardian has been emailed an explanation.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Reject application
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export function ResendButton({ logId }: { logId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await resendNotification(logId);
          if (result.ok) {
            toast.success("Notification re-sent.");
            router.refresh();
          } else {
            toast.error(result.error);
          }
        })
      }
    >
      Resend
    </Button>
  );
}

export function InternalNotes({
  registrationId,
  initialNotes,
}: {
  registrationId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="internal-notes" className="text-step--1 font-semibold">
        Internal notes <span className="font-normal text-kit-soft">(never shown to guardians)</span>
      </label>
      <Textarea
        id="internal-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        loading={pending}
        disabled={notes === initialNotes}
        onClick={() =>
          startTransition(async () => {
            const result = await saveInternalNotes(registrationId, notes);
            if (result.ok) toast.success("Notes saved.");
            else toast.error(result.error);
          })
        }
      >
        Save notes
      </Button>
    </div>
  );
}
