"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ProofUpload, type UploadedProof } from "@/app/(site)/enroll/proof-upload";
import { cn } from "@/lib/utils";
import { submitCampRegistration } from "./actions";

type FormState = {
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  religion: string;
  nationality: string;
  state: string;
  paymentMethod: string;
  consentDeclaration: boolean;
};

const empty: FormState = {
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  fullName: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  religion: "",
  nationality: "Nigerian",
  state: "",
  paymentMethod: "TRANSFER",
  consentDeclaration: false,
};

export function CampForm({
  ageMin,
  ageMax,
  whatsappUrl,
  venue,
}: {
  ageMin: number;
  ageMax: number;
  whatsappUrl: string;
  venue: string;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const [proof, setProof] = useState<UploadedProof | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; participantName: string; paymentMethod: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  if (done) {
    return (
      <div aria-live="polite">
        <p className="font-display text-step-1">You&apos;re on the teamsheet! ⚽</p>
        <p className="mt-2 text-step-0">
          <strong>{done.participantName}</strong> is registered. Your reference:
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-brand bg-pitch-deep px-4 py-3">
          <p className="font-mono text-step-1 font-bold tracking-widest text-gold">{done.reference}</p>
          <CopyButton value={done.reference} label="camp reference" className="border-pitch-mid text-chalk" />
        </div>
        <p className="mt-4 text-step--1 leading-relaxed text-kit-soft">
          We&apos;ve emailed your confirmation with the schedule and what to bring.
          {done.paymentMethod === "CASH" && " Please pay at the venue before the first session."}{" "}
          First session: {venue.split(",")[0]}, Wuse Zone 2 — arrive 15 minutes early.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 items-center rounded-brand bg-gold px-5 text-step--1 font-semibold text-kit"
        >
          Chat with us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await submitCampRegistration({
            ...form,
            gender: form.gender as never,
            paymentMethod: form.paymentMethod as never,
            consentDeclaration: form.consentDeclaration as never,
            proof:
              form.paymentMethod === "TRANSFER" && proof
                ? {
                    proofPublicId: proof.publicId,
                    proofUrl: proof.url,
                    proofFormat: proof.format,
                    proofBytes: proof.bytes,
                  }
                : null,
          });
          if (result.ok) {
            setDone(result);
          } else {
            setError(result.error);
          }
        });
      }}
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
          Parent / guardian
        </legend>
        <Field label="Full name" required>
          {(a11y) => (
            <Input {...a11y} autoComplete="name" value={form.guardianName} onChange={(e) => set({ guardianName: e.target.value })} />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" required hint="e.g. 0913 958 3669">
            {(a11y) => (
              <Input {...a11y} type="tel" autoComplete="tel" value={form.guardianPhone} onChange={(e) => set({ guardianPhone: e.target.value })} />
            )}
          </Field>
          <Field label="Email" required>
            {(a11y) => (
              <Input {...a11y} type="email" autoComplete="email" value={form.guardianEmail} onChange={(e) => set({ guardianEmail: e.target.value })} />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
          Participant
        </legend>
        <Field label="Full name" required>
          {(a11y) => <Input {...a11y} value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gender" required>
            {(a11y) => (
              <Select {...a11y} value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="MALE">Boy</option>
                <option value="FEMALE">Girl</option>
              </Select>
            )}
          </Field>
          <Field label="Date of birth" required hint={`Ages ${ageMin}–${ageMax}`}>
            {(a11y) => (
              <Input {...a11y} type="date" value={form.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
            )}
          </Field>
        </div>
        <Field label="Home address" required>
          {(a11y) => (
            <Textarea {...a11y} rows={2} autoComplete="street-address" value={form.address} onChange={(e) => set({ address: e.target.value })} />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Religion">
            {(a11y) => <Input {...a11y} value={form.religion} onChange={(e) => set({ religion: e.target.value })} />}
          </Field>
          <Field label="Nationality">
            {(a11y) => <Input {...a11y} value={form.nationality} onChange={(e) => set({ nationality: e.target.value })} />}
          </Field>
          <Field label="State">
            {(a11y) => <Input {...a11y} value={form.state} onChange={(e) => set({ state: e.target.value })} />}
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
          Payment
        </legend>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
          {[
            { value: "TRANSFER", label: "Bank transfer" },
            { value: "CASH", label: "Cash at venue" },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-brand border px-3 py-2.5 text-step--1 font-semibold",
                form.paymentMethod === option.value
                  ? "border-pitch bg-pitch text-chalk"
                  : "border-line hover:border-kit",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={form.paymentMethod === option.value}
                onChange={() => set({ paymentMethod: option.value })}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {form.paymentMethod === "TRANSFER" && (
          <div>
            <p className="mb-1.5 text-step--1 font-semibold">
              Transfer receipt <span className="font-normal text-kit-soft">(optional — you can also send it on WhatsApp)</span>
            </p>
            <ProofUpload proof={proof} onChange={setProof} />
          </div>
        )}
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={form.consentDeclaration}
          onChange={(e) => set({ consentDeclaration: e.target.checked })}
          className="mt-1 size-5 shrink-0 accent-[#0B3D2C]"
          aria-describedby="declaration-text"
        />
        <span id="declaration-text" className="text-step--1 leading-relaxed">
          I hereby declare that all information provided is true and accurate. I
          confirm that the participant is medically fit to take part in the
          academy&apos;s activities and agree to abide by all rules, regulations,
          and terms of the organization. I acknowledge that participation may
          involve risks of injury and consent to the use of photographs and
          videos for promotional purposes.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-brand border border-red-200 bg-red-50 px-4 py-3 text-step--1 font-medium text-red-800">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={pending} disabled={!form.consentDeclaration}>
        Complete registration
      </Button>
    </form>
  );
}
