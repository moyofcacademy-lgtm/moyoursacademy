import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { prisma } from "@/lib/prisma";

/**
 * All guardian/admin communication goes through here so every send —
 * success or failure — lands in NotificationLog. Notification failures
 * never throw: acceptance and submission transactions must not roll back
 * because a provider was down. Failed sends stay visible in the log with
 * a Resend button in the admin.
 */

function resendClient(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

export async function sendEmail({
  to,
  subject,
  react,
  text,
  template,
  registrationId,
}: {
  to: string;
  subject: string;
  react: ReactElement;
  text: string;
  template: string;
  registrationId?: string;
}): Promise<void> {
  const client = resendClient();
  if (!client) {
    await logNotification({
      channel: "EMAIL",
      template,
      recipient: to,
      status: "QUEUED",
      error: "RESEND_API_KEY not configured",
      registrationId,
    });
    return;
  }
  try {
    // Render the template to HTML ourselves: Resend's own `react` option
    // loads @react-email/render dynamically, which serverless bundlers
    // miss ("Failed to render React component" in production).
    const html = await render(react);
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM ?? "Moyours Academy <noreply@moyoursacademy.ng>",
      to,
      subject,
      html,
      text,
    });
    await logNotification({
      channel: "EMAIL",
      template,
      recipient: to,
      status: error ? "FAILED" : "SENT",
      providerId: data?.id,
      error: error?.message,
      registrationId,
    });
  } catch (error) {
    await logNotification({
      channel: "EMAIL",
      template,
      recipient: to,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
      registrationId,
    });
  }
}

async function logNotification(entry: {
  channel: string;
  template: string;
  recipient: string;
  status: string;
  providerId?: string;
  error?: string;
  registrationId?: string;
}): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        channel: entry.channel,
        template: entry.template,
        recipient: entry.recipient,
        status: entry.status,
        providerId: entry.providerId,
        error: entry.error,
        sentAt: entry.status === "SENT" ? new Date() : null,
        registrationId: entry.registrationId,
      },
    });
  } catch (error) {
    console.error("Failed to write NotificationLog:", error);
  }
}
