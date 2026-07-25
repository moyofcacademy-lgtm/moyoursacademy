"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/notify";
import { site } from "@/config/site";
import { ContactMessageEmail, contactMessageText } from "@/emails/contact-message";
import { normalizeNgPhone } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().min(7, "Enter your phone number").max(20),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a little more — at least a sentence").max(2000),
});

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(input: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}): Promise<ContactResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limiter = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limiter.ok) {
    return { ok: false, error: "Too many messages from this connection — try again later or call us." };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const phone = normalizeNgPhone(data.phone) ?? data.phone;

  await sendEmail({
    to: process.env.ADMIN_EMAIL ?? site.email,
    subject: `Website message from ${data.name}`,
    react: ContactMessageEmail({ name: data.name, phone, email: data.email || undefined, message: data.message }),
    text: contactMessageText({ name: data.name, phone, email: data.email || undefined, message: data.message }),
    template: "contact-message",
  });

  return { ok: true };
}
