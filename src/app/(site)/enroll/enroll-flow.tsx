"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { cn, formatNaira } from "@/lib/utils";
import type { RegistrationFormInput } from "@/lib/validations/registration";
import { reserveReference, submitEnrollment } from "./actions";
import { RegistrationForm } from "./registration-form";
import { ProofUpload, type UploadedProof } from "./proof-upload";

const STORAGE_KEY = "moyours-enroll-v1";

type Fees = {
  registrationKobo: number;
  jerseyKobo: number;
  monthlyKobo: number;
  initialTotalKobo: number;
};

type Bank = { bankName: string; accountNumber: string; accountName: string };

type FlowState = {
  step: number; // 1 welcome accepted → 2 details → 3 payment → 4 proof
  welcomed: boolean;
  form: RegistrationFormInput | null;
  reference: string | null;
  proof: UploadedProof | null;
  depositorName: string;
  paidAt: string;
};

const initialState: FlowState = {
  step: 1,
  welcomed: false,
  form: null,
  reference: null,
  proof: null,
  depositorName: "",
  paidAt: "",
};

const STEPS = ["Welcome", "Player details", "Payment", "Proof of payment"];

export function EnrollFlow({ fees, bank }: { fees: Fees; bank: Bank }) {
  const [state, setState] = useState<FlowState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; playerName: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Persist partial progress — a dropped connection must not lose the form.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      // Restoring from sessionStorage is a one-time external-system read; it
      // can only run after mount, so the setState here is unavoidable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      // corrupted state — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const update = useCallback((patch: Partial<FlowState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = useCallback(
    (step: number) => {
      update({ step });
      requestAnimationFrame(() => headingRef.current?.focus());
    },
    [update],
  );

  async function handleProceedToPayment(form: RegistrationFormInput) {
    update({ form });
    if (!state.reference) {
      const { reference } = await reserveReference();
      update({ form, reference, step: 3 });
    } else {
      update({ form, step: 3 });
    }
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function handleSubmit() {
    if (!state.form || !state.proof) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitEnrollment({
      form: state.form,
      proof: {
        proofPublicId: state.proof.publicId,
        proofUrl: state.proof.url,
        proofFormat: state.proof.format,
        proofBytes: state.proof.bytes,
        depositorName: state.depositorName || undefined,
        paidAt: state.paidAt || undefined,
      },
      reference: state.reference ?? undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      sessionStorage.removeItem(STORAGE_KEY);
      setDone({ reference: result.reference, playerName: result.playerName });
      requestAnimationFrame(() => headingRef.current?.focus());
    } else {
      setSubmitError(result.error);
    }
  }

  if (!hydrated) {
    return <div aria-hidden className="h-96 animate-pulse rounded-brand bg-kit/10" />;
  }

  if (done) {
    return (
      <div className="rule-gold rounded-b-brand border border-line bg-white/70 p-6 sm:p-10">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-step-2 outline-none">
          Registration received
        </h1>
        <p className="mt-3 text-step-0">
          Thank you — <strong>{done.playerName}</strong>&apos;s application is with us.
          Your reference:
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-brand bg-pitch-deep px-5 py-4">
          <p className="font-mono text-step-1 font-bold tracking-widest text-gold">{done.reference}</p>
          <CopyButton value={done.reference} label="reference" className="border-pitch-mid text-chalk" />
        </div>
        <p className="mt-5 text-step-0 leading-relaxed text-kit-soft">
          We&apos;ve emailed you a confirmation. Our team will verify your payment and
          send your member code once your place is confirmed.
        </p>
        <p className="mt-3 text-step--1 text-kit-soft">
          You can check progress anytime on the{" "}
          <a href="/status" className="font-semibold underline underline-offset-2">
            application status page
          </a>{" "}
          with this reference or your phone number.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome modal — step 1 */}
      <Dialog
        open={!state.welcomed}
        onClose={() => update({ welcomed: true, step: Math.max(state.step, 2) })}
        title="Welcome to Moyours Football Academy"
      >
        <div className="flex flex-col gap-3 text-step-0 leading-relaxed">
          <p>
            At Moyours Football Academy, we believe football is more than just a
            game—it&apos;s a pathway to growth, discipline, and opportunity.
          </p>
          <p>
            Our academy provides structured training for boys and girls aged 4–18,
            focusing on skill development, teamwork, character building, and
            exposure to opportunities.
          </p>
          <p>
            With experienced coaches and a strong commitment to youth development,
            Moyours is more than an academy—it&apos;s a family.
          </p>
          <p>
            We&apos;re excited to be part of your child&apos;s football journey.
            Welcome to the Moyours family.
          </p>
        </div>
        <DialogActions>
          <Button size="lg" onClick={() => update({ welcomed: true, step: 2 })}>
            Proceed to registration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stepper */}
      <nav aria-label="Enrollment progress" className="mb-8">
        <ol className="flex items-center gap-1.5 sm:gap-2">
          {STEPS.map((label, index) => {
            const stepNo = index + 1;
            const isCurrent = state.step === stepNo;
            const isDone = state.step > stepNo;
            return (
              <li key={label} className="flex flex-1 flex-col gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    isDone ? "bg-pitch" : isCurrent ? "bg-gold" : "bg-line",
                  )}
                />
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "hidden text-[0.6875rem] font-semibold uppercase tracking-wide sm:block",
                    isCurrent ? "text-kit" : "text-kit-soft",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-1 text-step--1 text-kit-soft sm:hidden">
          Step {Math.min(state.step, 4)} of 4 · {STEPS[Math.min(state.step, 4) - 1]}
        </p>
      </nav>

      {/* Step 2 — registration form */}
      {state.step <= 2 && (
        <section aria-labelledby="enroll-step-heading">
          <h1
            id="enroll-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-step-2 outline-none"
          >
            Player registration
          </h1>
          <p className="mt-2 mb-8 text-step-0 text-kit-soft">
            Tell us about your child and how to reach you. Fields marked * are
            required.
          </p>
          <RegistrationForm
            defaultValues={state.form ?? undefined}
            onBack={() => update({ welcomed: false })}
            onNext={handleProceedToPayment}
          />
        </section>
      )}

      {/* Step 3 — payment information */}
      {state.step === 3 && (
        <section aria-labelledby="enroll-step-heading">
          <h1
            id="enroll-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-step-2 outline-none"
          >
            Payment
          </h1>
          <p className="mt-2 mb-6 text-step-0 text-kit-soft">
            Make a bank transfer for the total initial payment, then continue to
            upload your receipt.
          </p>

          <table className="w-full border-collapse text-step-0">
            <caption className="sr-only">Fee breakdown</caption>
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 text-left font-normal">Registration fee</th>
                <td className="py-3 text-right font-mono">{formatNaira(fees.registrationKobo)}</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 text-left font-normal">Jersey (2 sets)</th>
                <td className="py-3 text-right font-mono">{formatNaira(fees.jerseyKobo)}</td>
              </tr>
              <tr className="border-b-2 border-kit">
                <th scope="row" className="py-3 text-left font-bold">Total initial payment</th>
                <td className="py-3 text-right font-mono text-step-1 font-bold">
                  {formatNaira(fees.initialTotalKobo)}
                </td>
              </tr>
              <tr>
                <th scope="row" className="py-3 text-left font-normal text-kit-soft">
                  Monthly subscription{" "}
                  <span className="block text-step--1">recurring — not part of today&apos;s payment</span>
                </th>
                <td className="py-3 text-right font-mono text-kit-soft">{formatNaira(fees.monthlyKobo)}</td>
              </tr>
            </tbody>
          </table>

          <div className="rule-gold mt-6 rounded-b-brand bg-pitch p-5 text-chalk">
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
              Transfer to
            </p>
            <dl className="mt-3 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-step--1 text-chalk-dim">Bank</dt>
                <dd className="flex items-center gap-2 font-semibold">
                  {bank.bankName}
                  <CopyButton value={bank.bankName} label="bank name" className="border-pitch-mid text-chalk" />
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-step--1 text-chalk-dim">Account number</dt>
                <dd className="flex items-center gap-2 font-mono text-step-1 font-bold tracking-widest">
                  {bank.accountNumber}
                  <CopyButton value={bank.accountNumber} label="account number" className="border-pitch-mid text-chalk" />
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-step--1 text-chalk-dim">Account name</dt>
                <dd className="font-semibold">{bank.accountName}</dd>
              </div>
            </dl>
          </div>

          {state.reference && (
            <div className="mt-5 rounded-brand border border-line bg-white/70 p-4">
              <p className="text-step--1 text-kit-soft">
                Use this reference as the transfer narration/description so we can
                match your payment quickly:
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="font-mono text-step-1 font-bold tracking-widest">{state.reference}</p>
                <CopyButton value={state.reference} label="reference" />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button variant="secondary" size="lg" onClick={() => goTo(2)}>
              Back to details
            </Button>
            <Button size="lg" onClick={() => goTo(4)}>
              I&apos;ve made payment
            </Button>
          </div>
        </section>
      )}

      {/* Step 4 — proof upload + submit */}
      {state.step >= 4 && (
        <section aria-labelledby="enroll-step-heading">
          <h1
            id="enroll-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-step-2 outline-none"
          >
            Upload proof of payment
          </h1>
          <p className="mt-2 mb-6 text-step-0 text-kit-soft">
            A photo or PDF of your transfer receipt — JPG, PNG, or PDF, up to 10MB.
          </p>

          <ProofUpload
            proof={state.proof}
            onChange={(proof) => update({ proof })}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="depositorName" className="text-step--1 font-semibold">
                Depositor name <span className="font-normal text-kit-soft">(optional)</span>
              </label>
              <input
                id="depositorName"
                value={state.depositorName}
                onChange={(e) => update({ depositorName: e.target.value })}
                className="h-11 w-full rounded-brand border border-line bg-white/70 px-3 text-step-0 focus:border-pitch focus:outline-none focus:ring-2 focus:ring-gold/60"
                placeholder="Name on the transfer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="paidAt" className="text-step--1 font-semibold">
                Date paid <span className="font-normal text-kit-soft">(optional)</span>
              </label>
              <input
                id="paidAt"
                type="date"
                value={state.paidAt}
                onChange={(e) => update({ paidAt: e.target.value })}
                className="h-11 w-full rounded-brand border border-line bg-white/70 px-3 text-step-0 focus:border-pitch focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </div>
          </div>

          {submitError && (
            <p role="alert" className="mt-5 rounded-brand border border-red-200 bg-red-50 px-4 py-3 text-step--1 font-medium text-red-800">
              {submitError}
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button variant="secondary" size="lg" onClick={() => goTo(3)} disabled={submitting}>
              Back to payment
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!state.proof}
            >
              Submit registration
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
