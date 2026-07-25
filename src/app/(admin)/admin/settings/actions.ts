"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { setSetting } from "@/lib/settings";

export type SettingsActionResult = { ok: true } | { ok: false; error: string };

const feesSchema = z.object({
  registrationKobo: z.number().int().min(0),
  jerseyKobo: z.number().int().min(0),
  monthlyKobo: z.number().int().min(0),
});

const bankSchema = z.object({
  bankName: z.string().trim().min(2, "Enter the bank name"),
  accountNumber: z.string().trim().regex(/^\d{10}$/, "NUBAN account numbers are 10 digits"),
  accountName: z.string().trim().min(2, "Enter the account name"),
});

const scheduleSchema = z
  .array(
    z.object({
      day: z.string().trim().min(2),
      start: z.string().trim().min(1),
      end: z.string().trim().min(1),
    }),
  )
  .min(1, "Keep at least one training session");

const contactSchema = z.object({
  phones: z.array(z.string().trim().min(7)).min(1, "Keep at least one phone number"),
  email: z.string().trim().pipe(z.email("Enter a valid email")),
  address: z.string().trim().min(5),
  whatsappGroupUrl: z.string().trim().url("Paste the full WhatsApp invite link").or(z.literal("")),
});

async function save(
  key: "fees" | "bank" | "schedule" | "contact" | "subscriptionOverdueDay" | "issueCodeOnSubmit",
  value: unknown,
  schema: z.ZodType,
): Promise<SettingsActionResult> {
  const actor = await requireAdmin();
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await setSetting(key, parsed.data as never);
  await audit({ actor, action: "settings.updated", entityType: "Setting", entityId: key });

  // Settings feed the public pages — refresh them all.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveFees(value: z.input<typeof feesSchema>) {
  return save("fees", value, feesSchema);
}
export async function saveBank(value: z.input<typeof bankSchema>) {
  return save("bank", value, bankSchema);
}
export async function saveSchedule(value: z.input<typeof scheduleSchema>) {
  return save("schedule", value, scheduleSchema);
}
export async function saveContact(value: z.input<typeof contactSchema>) {
  return save("contact", value, contactSchema);
}
export async function saveOverdueDay(value: number) {
  return save("subscriptionOverdueDay", value, z.number().int().min(1).max(28));
}
export async function saveIssueCodeOnSubmit(value: boolean) {
  return save("issueCodeOnSubmit", value, z.boolean());
}
