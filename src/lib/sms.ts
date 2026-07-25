import "server-only";

/**
 * SMS provider interface — Termii today (Nigerian sender ID support),
 * swappable for Africa's Talking by implementing SmsProvider.
 */
export type SmsResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

export interface SmsProvider {
  readonly name: string;
  configured(): boolean;
  send(to: string, body: string): Promise<SmsResult>;
}

class TermiiProvider implements SmsProvider {
  readonly name = "termii";

  configured(): boolean {
    return Boolean(process.env.TERMII_API_KEY);
  }

  async send(to: string, body: string): Promise<SmsResult> {
    try {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TERMII_API_KEY,
          to,
          from: process.env.TERMII_SENDER_ID ?? "Moyours",
          sms: body,
          type: "plain",
          channel: "generic",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message_id?: string;
        message?: string;
      };
      if (!response.ok || !data.message_id) {
        return { ok: false, error: data.message ?? `Termii responded ${response.status}` };
      }
      return { ok: true, providerId: data.message_id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Network error" };
    }
  }
}

export const smsProvider: SmsProvider = new TermiiProvider();
