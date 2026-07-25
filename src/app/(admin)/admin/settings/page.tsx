import { getSetting } from "@/lib/settings";
import { SettingsManager } from "./settings-manager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [fees, bank, schedule, contact, overdueDay, issueCodeOnSubmit] = await Promise.all([
    getSetting("fees"),
    getSetting("bank"),
    getSetting("schedule"),
    getSetting("contact"),
    getSetting("subscriptionOverdueDay"),
    getSetting("issueCodeOnSubmit"),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display text-step-2">Settings</h1>
      <p className="max-w-xl text-step--1 text-kit-soft">
        Everything the guardian-facing pages read from — fees, bank details,
        training schedule, contacts. Changes apply everywhere immediately, no
        deploy needed.
      </p>
      <SettingsManager
        fees={fees}
        bank={bank}
        schedule={[...schedule]}
        contact={{ ...contact, phones: [...contact.phones] }}
        overdueDay={overdueDay}
        issueCodeOnSubmit={issueCodeOnSubmit}
      />
    </div>
  );
}
