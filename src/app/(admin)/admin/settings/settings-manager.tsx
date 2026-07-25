"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import type { BankSettings, ContactSettings, FeeSettings, ScheduleSession } from "@/lib/settings";
import {
  saveBank,
  saveContact,
  saveFees,
  saveIssueCodeOnSubmit,
  saveOverdueDay,
  saveSchedule,
  type SettingsActionResult,
} from "./actions";

function Section({
  title,
  children,
  onSave,
  pending,
}: {
  title: string;
  children: ReactNode;
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <section aria-label={title} className="rule-gold flex flex-col gap-4 rounded-b-brand border border-line bg-white/60 p-5">
      <h2 className="font-display text-step-1">{title}</h2>
      {children}
      <Button size="sm" className="self-start" loading={pending} onClick={onSave}>
        Save {title.toLowerCase()}
      </Button>
    </section>
  );
}

export function SettingsManager({
  fees: initialFees,
  bank: initialBank,
  schedule: initialSchedule,
  contact: initialContact,
  overdueDay: initialOverdueDay,
  issueCodeOnSubmit: initialIssueOnSubmit,
}: {
  fees: FeeSettings;
  bank: BankSettings;
  schedule: ScheduleSession[];
  contact: ContactSettings;
  overdueDay: number;
  issueCodeOnSubmit: boolean;
}) {
  const router = useRouter();
  const [fees, setFees] = useState({
    registration: String(initialFees.registrationKobo / 100),
    jersey: String(initialFees.jerseyKobo / 100),
    monthly: String(initialFees.monthlyKobo / 100),
  });
  const [bank, setBank] = useState(initialBank);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [contact, setContact] = useState({ ...initialContact, phonesText: initialContact.phones.join("\n") });
  const [overdueDay, setOverdueDay] = useState(String(initialOverdueDay));
  const [issueOnSubmit, setIssueOnSubmit] = useState(initialIssueOnSubmit);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<SettingsActionResult>, okMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(okMessage);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Fees"
        pending={pending}
        onSave={() =>
          run(
            () =>
              saveFees({
                registrationKobo: Math.round(Number(fees.registration) * 100),
                jerseyKobo: Math.round(Number(fees.jersey) * 100),
                monthlyKobo: Math.round(Number(fees.monthly) * 100),
              }),
            "Fees saved — the enrollment page shows the new amounts.",
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Registration fee (₦)">
            {(a11y) => (
              <Input {...a11y} type="number" min={0} value={fees.registration} onChange={(e) => setFees({ ...fees, registration: e.target.value })} />
            )}
          </Field>
          <Field label="Jersey, 2 sets (₦)">
            {(a11y) => (
              <Input {...a11y} type="number" min={0} value={fees.jersey} onChange={(e) => setFees({ ...fees, jersey: e.target.value })} />
            )}
          </Field>
          <Field label="Monthly subscription (₦)">
            {(a11y) => (
              <Input {...a11y} type="number" min={0} value={fees.monthly} onChange={(e) => setFees({ ...fees, monthly: e.target.value })} />
            )}
          </Field>
        </div>
      </Section>

      <Section
        title="Bank details"
        pending={pending}
        onSave={() => run(() => saveBank(bank), "Bank details saved.")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bank">
            {(a11y) => <Input {...a11y} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />}
          </Field>
          <Field label="Account number">
            {(a11y) => (
              <Input {...a11y} inputMode="numeric" maxLength={10} value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "") })} />
            )}
          </Field>
          <Field label="Account name">
            {(a11y) => <Input {...a11y} value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} />}
          </Field>
        </div>
      </Section>

      <Section
        title="Training schedule"
        pending={pending}
        onSave={() => run(() => saveSchedule(schedule), "Schedule saved.")}
      >
        {schedule.map((session, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3">
            <Field label={index === 0 ? "Day" : ""}>
              {(a11y) => (
                <Input {...a11y} value={session.day} onChange={(e) => setSchedule(schedule.map((s, i) => (i === index ? { ...s, day: e.target.value } : s)))} />
              )}
            </Field>
            <Field label={index === 0 ? "Starts" : ""}>
              {(a11y) => (
                <Input {...a11y} value={session.start} onChange={(e) => setSchedule(schedule.map((s, i) => (i === index ? { ...s, start: e.target.value } : s)))} />
              )}
            </Field>
            <Field label={index === 0 ? "Ends" : ""}>
              {(a11y) => (
                <Input {...a11y} value={session.end} onChange={(e) => setSchedule(schedule.map((s, i) => (i === index ? { ...s, end: e.target.value } : s)))} />
              )}
            </Field>
            <Button variant="ghost" size="sm" aria-label={`Remove ${session.day} session`} onClick={() => setSchedule(schedule.filter((_, i) => i !== index))}>
              ✕
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" className="self-start" onClick={() => setSchedule([...schedule, { day: "Sunday", start: "9:00 AM", end: "11:00 AM" }])}>
          Add session
        </Button>
      </Section>

      <Section
        title="Contact"
        pending={pending}
        onSave={() =>
          run(
            () =>
              saveContact({
                phones: contact.phonesText.split("\n").map((p) => p.trim()).filter(Boolean),
                email: contact.email,
                address: contact.address,
                whatsappGroupUrl: contact.whatsappGroupUrl,
              }),
            "Contact details saved.",
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone numbers" hint="One per line">
            {(a11y) => (
              <Textarea {...a11y} rows={3} value={contact.phonesText} onChange={(e) => setContact({ ...contact, phonesText: e.target.value })} />
            )}
          </Field>
          <div className="flex flex-col gap-4">
            <Field label="Email">
              {(a11y) => <Input {...a11y} type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />}
            </Field>
            <Field label="WhatsApp group link" hint="Included in acceptance emails when set">
              {(a11y) => (
                <Input {...a11y} type="url" value={contact.whatsappGroupUrl} onChange={(e) => setContact({ ...contact, whatsappGroupUrl: e.target.value })} />
              )}
            </Field>
          </div>
        </div>
        <Field label="Address">
          {(a11y) => <Textarea {...a11y} rows={2} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />}
        </Field>
      </Section>

      <Section
        title="Subscriptions"
        pending={pending}
        onSave={() => run(() => saveOverdueDay(Number(overdueDay)), "Overdue day saved.")}
      >
        <Field label="Flag unpaid subscriptions overdue after day" hint="Day of the month, 1–28">
          {(a11y) => (
            <Input {...a11y} type="number" min={1} max={28} className="w-28" value={overdueDay} onChange={(e) => setOverdueDay(e.target.value)} />
          )}
        </Field>
      </Section>

      <Section
        title="Member codes"
        pending={pending}
        onSave={() =>
          run(
            () => saveIssueCodeOnSubmit(issueOnSubmit),
            issueOnSubmit
              ? "Member codes now issue at submission (original-spec behaviour)."
              : "Member codes now issue on acceptance.",
          )
        }
      >
        <label className="flex items-start gap-3 text-step--1">
          <input
            type="checkbox"
            className="mt-1 size-5 accent-[#0B3D2C]"
            checked={issueOnSubmit}
            onChange={(e) => setIssueOnSubmit(e.target.checked)}
          />
          <span>
            Issue the member code the moment a guardian submits, before payment
            verification. <strong>Off by default</strong>: since payment is
            verified manually, issuing on submit hands a permanent member code
            to anyone who uploads any image.
          </span>
        </label>
      </Section>
    </div>
  );
}
