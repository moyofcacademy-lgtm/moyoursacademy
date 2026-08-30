"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateWAT } from "@/lib/utils";
import {
  ProofUpload,
  type UploadedProof,
} from "@/app/(site)/enroll/proof-upload";
import { checkStatus, reuploadProof, type StatusEntry } from "./actions";

const STATUS_EXPLANATION: Record<string, string> = {
  SUBMITTED:
    "We have your application and payment proof. Our team is verifying it usually within 2 working days.",
  UNDER_REVIEW: "Your application is being reviewed.",
  ACCEPTED: "Confirmed! Your member code is below it's also in your email.",
  REJECTED: "We couldn't confirm this application.",
};

export function StatusChecker({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [entries, setEntries] = useState<StatusEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function lookup(value: string) {
    startTransition(async () => {
      setError(null);
      const result = await checkStatus(value);
      if (result.ok) setEntries(result.entries);
      else {
        setEntries(null);
        setError(result.error);
      }
    });
  }

  // Deep links from emails: /status?ref=MOY-REF-XXXXXX
  useEffect(() => {
    if (initialQuery) lookup(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(query);
        }}
      >
        <Input
          aria-label="Reference or phone number"
          placeholder="MOY-REF-8KQ2P1 or 0801 234 5678"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm font-mono"
        />
        <Button
          type="submit"
          loading={pending}
          disabled={query.trim().length < 4}
        >
          Check status
        </Button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-brand border border-red-200 bg-red-50 px-4 py-3 text-step--1 font-medium text-red-800"
        >
          {error}
        </p>
      )}

      {entries?.map((entry) => (
        <StatusCard
          key={entry.reference}
          entry={entry}
          onChanged={() => lookup(query)}
        />
      ))}
    </div>
  );
}

function StatusCard({
  entry,
  onChanged,
}: {
  entry: StatusEntry;
  onChanged: () => void;
}) {
  const [proof, setProof] = useState<UploadedProof | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <article className="rule-gold rounded-b-brand border border-line bg-white/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-step-1">
          {entry.playerFirstName}&apos;s application
        </p>
        <StatusBadge status={entry.status} />
      </div>
      <p className="mt-1 font-mono text-step--1 text-kit-soft">
        {entry.reference} · submitted{" "}
        {formatDateWAT(new Date(entry.submittedAtIso))}
      </p>

      <p className="mt-4 text-step-0 leading-relaxed">
        {STATUS_EXPLANATION[entry.status] ?? "In progress."}
      </p>
      {entry.rejectionReason && (
        <p className="mt-2 text-step--1 text-kit-soft">
          Reason: {entry.rejectionReason}. You can submit a fresh application
          from the Enroll page, or call us if you believe this was a mistake.
        </p>
      )}

      {entry.memberCode && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-brand bg-pitch-deep px-4 py-3">
          <p className="font-mono text-step-1 font-bold tracking-widest text-gold">
            {entry.memberCode}
          </p>
          <CopyButton
            value={entry.memberCode}
            label="member code"
            className="border-pitch-mid text-chalk"
          />
        </div>
      )}

      {entry.canReupload && (
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
          <p className="text-step--1 font-semibold">
            We asked for a clearer payment proof. Upload it here your reference
            stays the same.
          </p>
          <ProofUpload proof={proof} onChange={setProof} />
          {submitError && (
            <p role="alert" className="text-step--1 font-medium text-red-700">
              {submitError}
            </p>
          )}
          <Button
            className="self-start"
            loading={pending}
            disabled={!proof}
            onClick={() =>
              startTransition(async () => {
                if (!proof) return;
                setSubmitError(null);
                const result = await reuploadProof({
                  reference: entry.reference,
                  proof: {
                    proofPublicId: proof.publicId,
                    proofUrl: proof.url,
                    proofFormat: proof.format,
                    proofBytes: proof.bytes,
                  },
                });
                if (result.ok) onChanged();
                else setSubmitError(result.error);
              })
            }
          >
            Submit new proof
          </Button>
        </div>
      )}
    </article>
  );
}
