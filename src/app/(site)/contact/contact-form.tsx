"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { sendContactMessage } from "./actions";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div className="rule-gold rounded-b-brand border border-line bg-white/70 p-6">
        <p className="font-display text-step-1">Message sent</p>
        <p className="mt-2 text-step--1 text-kit-soft">
          Thank you — we&apos;ll get back to you within a working day. For anything
          urgent, call one of the numbers on this page.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await sendContactMessage(form);
          if (result.ok) setSent(true);
          else setError(result.error);
        });
      }}
    >
      <Field label="Your name" required>
        {(a11y) => (
          <Input {...a11y} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" required>
          {(a11y) => (
            <Input {...a11y} type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          )}
        </Field>
        <Field label="Email">
          {(a11y) => (
            <Input {...a11y} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          )}
        </Field>
      </div>
      <Field label="Message" required>
        {(a11y) => (
          <Textarea {...a11y} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        )}
      </Field>
      {error && (
        <p role="alert" className="text-step--1 font-medium text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} className="self-start">
        Send message
      </Button>
    </form>
  );
}
