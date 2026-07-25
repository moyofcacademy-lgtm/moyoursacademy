import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { getFees } from "@/lib/settings";
import { StatusBadge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ageAt, MAX_AGE, MIN_AGE } from "@/lib/constants";
import { cn, formatDateTimeWAT, formatDateWAT, formatNaira } from "@/lib/utils";
import { ProofViewer } from "./proof-viewer";
import { InternalNotes, ResendButton, ReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";

export default async function RegistrationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [registration, fees] = await Promise.all([
    prisma.registration.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { createdAt: "desc" } },
        player: { include: { team: true } },
        notifications: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    }),
    getFees(),
  ]);
  if (!registration) notFound();

  const initialPayment = registration.payments.find((p) => p.type === "INITIAL");
  const playerName = `${registration.firstName} ${registration.lastName}`;
  const age = ageAt(registration.dateOfBirth);
  const amountMatches =
    initialPayment != null && initialPayment.amountKobo === fees.initialTotalKobo;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <Link href="/admin/registrations" className="text-step--1 font-semibold text-kit-soft underline-offset-4 hover:underline">
          ← Registrations
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-step-2">{playerName}</h1>
          <StatusBadge status={registration.status} />
          <StatusBadge status={registration.paymentStatus} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-step--1 text-kit-soft">
          <span className="flex items-center gap-2">
            Reference <span className="font-mono font-bold text-kit">{registration.reference}</span>
            <CopyButton value={registration.reference} label="reference" />
          </span>
          {registration.memberCode && (
            <span className="flex items-center gap-2">
              Member code <span className="font-mono font-bold text-kit">{registration.memberCode}</span>
              <CopyButton value={registration.memberCode} label="member code" />
            </span>
          )}
          <span>Submitted {formatDateTimeWAT(registration.createdAt)}</span>
        </div>
      </div>

      <ReviewActions
        registrationId={registration.id}
        playerName={playerName}
        guardianName={registration.guardianName}
        amountKobo={initialPayment?.amountKobo ?? null}
        status={registration.status}
      />

      {registration.status === "REJECTED" && registration.rejectionReason && (
        <p className="rounded-brand border border-red-200 bg-red-50 px-4 py-3 text-step--1 text-red-900">
          Rejected: {registration.rejectionReason}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: payment proof */}
        <section aria-labelledby="proof-heading" className="flex flex-col gap-4">
          <h2 id="proof-heading" className="font-display text-step-1">
            Payment proof
          </h2>
          {initialPayment ? (
            <>
              <ProofViewer
                registrationId={registration.id}
                format={initialPayment.proofFormat}
                devMock={!cloudinaryConfigured()}
              />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-brand border border-line bg-white/60 p-4 text-step--1">
                <dt className="text-kit-soft">Expected amount</dt>
                <dd className="text-right font-mono font-bold">{formatNaira(fees.initialTotalKobo)}</dd>
                <dt className="text-kit-soft">Recorded amount</dt>
                <dd className={cn("text-right font-mono font-bold", !amountMatches && "text-red-700")}>
                  {formatNaira(initialPayment.amountKobo)}
                  {!amountMatches && " (differs)"}
                </dd>
                <dt className="text-kit-soft">Depositor</dt>
                <dd className="text-right">{initialPayment.depositorName ?? "Not stated"}</dd>
                <dt className="text-kit-soft">Date paid</dt>
                <dd className="text-right">
                  {initialPayment.paidAt ? formatDateWAT(initialPayment.paidAt) : "Not stated"}
                </dd>
                <dt className="text-kit-soft">File</dt>
                <dd className="text-right font-mono uppercase">
                  {initialPayment.proofFormat} · {(initialPayment.proofBytes / 1024 / 1024).toFixed(1)}MB
                </dd>
              </dl>
            </>
          ) : (
            <p className="rounded-brand border border-dashed border-line p-6 text-step--1 text-kit-soft">
              No proof uploaded yet — the guardian was asked to re-upload.
            </p>
          )}
        </section>

        {/* Right: submitted details */}
        <section aria-labelledby="details-heading" className="flex flex-col gap-6">
          <h2 id="details-heading" className="sr-only">
            Submitted details
          </h2>

          <DetailGroup title="Player">
            <Detail label="Full name" value={playerName} />
            <Detail
              label="Date of birth"
              value={`${formatDateWAT(registration.dateOfBirth)} (${age} years)`}
              flagged={age < MIN_AGE || age > MAX_AGE}
            />
            <Detail label="Gender" value={registration.gender === "MALE" ? "Boy" : "Girl"} />
            <Detail label="Age group" value={registration.ageGroup ?? "—"} />
            <Detail label="Preferred position" value={registration.preferredPosition ?? "—"} />
            <Detail label="School" value={registration.schoolName ?? "—"} />
            <Detail label="Medical notes" value={registration.medicalNotes ?? "None"} />
            {registration.player?.team && (
              <Detail label="Assigned squad" value={registration.player.team.name} />
            )}
          </DetailGroup>

          <DetailGroup title="Guardian">
            <Detail label="Name" value={registration.guardianName} />
            <Detail label="Relationship" value={registration.guardianRelationship ?? "—"} />
            <Detail label="Phone" value={registration.guardianPhone} mono />
            <Detail label="Alt phone" value={registration.guardianAltPhone ?? "—"} mono />
            <Detail label="Email" value={registration.guardianEmail} />
            <Detail label="Address" value={registration.address} />
          </DetailGroup>

          <DetailGroup title="Emergency contact">
            <Detail label="Name" value={registration.emergencyContactName ?? "—"} />
            <Detail label="Phone" value={registration.emergencyContactPhone ?? "—"} mono />
          </DetailGroup>

          <DetailGroup title="Consents">
            <Detail label="Medical attention" value={registration.consentMedical ? "Given" : "Not given"} flagged={!registration.consentMedical} />
            <Detail label="Photography" value={registration.consentMedia ? "Given" : "Not given"} flagged={!registration.consentMedia} />
            <Detail label="Terms" value={registration.consentTerms ? "Accepted" : "Not accepted"} flagged={!registration.consentTerms} />
          </DetailGroup>

          <InternalNotes registrationId={registration.id} initialNotes={registration.internalNotes ?? ""} />
        </section>
      </div>

      {/* Notifications */}
      <section aria-labelledby="notifications-heading" className="flex flex-col gap-3">
        <h2 id="notifications-heading" className="font-display text-step-1">
          Notifications
        </h2>
        {registration.notifications.length === 0 ? (
          <p className="text-step--1 text-kit-soft">Nothing sent yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-brand border border-line bg-white/60">
            {registration.notifications.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-step--1">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {log.channel} · {log.template}
                  </p>
                  <p className="text-kit-soft">
                    to {log.recipient} · {formatDateTimeWAT(log.createdAt)}
                    {log.error && <span className="text-red-700"> · {log.error}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={log.status} />
                  {(log.status === "FAILED" || log.status === "QUEUED" || log.status === "SKIPPED") && (
                    <ResendButton logId={log.id} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">{title}</h3>
      <dl className="divide-y divide-line rounded-brand border border-line bg-white/60">{children}</dl>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  flagged,
}: {
  label: string;
  value: string;
  mono?: boolean;
  flagged?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2 text-step--1">
      <dt className="shrink-0 text-kit-soft">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono", flagged && "font-bold text-red-700")}>{value}</dd>
    </div>
  );
}
