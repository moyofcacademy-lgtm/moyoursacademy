import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";

/**
 * Editable site settings stored in the Setting table (key → JSON value).
 * Defaults below are the launch values; the admin Settings page writes
 * overrides so fees, bank details, and schedule change without a deploy.
 */

export type FeeSettings = {
  registrationKobo: number;
  jerseyKobo: number;
  monthlyKobo: number;
};

export type BankSettings = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type ScheduleSession = { day: string; start: string; end: string };

export type ContactSettings = {
  phones: string[];
  email: string;
  address: string;
  whatsappGroupUrl: string;
};

export type CampSettings = {
  active: boolean;
  name: string;
  startDate: string; // ISO date, WAT
  endDate: string;
  ageMin: number;
  ageMax: number;
  feeKobo: number;
  durationLabel: string;
  venue: string;
  schedule: ScheduleSession[];
  bank: BankSettings;
  callPhone: string;
  whatsappPhone: string;
};

export const SETTING_DEFAULTS = {
  fees: {
    registrationKobo: 150_000_00,
    jerseyKobo: 30_000_00,
    monthlyKobo: 40_000_00,
  } satisfies FeeSettings,
  bank: {
    bankName: "Optimus Bank",
    accountNumber: "1000112942",
    accountName: "Moyours Sports Academy", // legal name on the Optimus account
  } satisfies BankSettings,
  schedule: [
    { day: "Friday", start: "4:00 PM", end: "6:00 PM" },
    { day: "Saturday", start: "11:30 AM", end: "2:30 PM" },
  ] satisfies ScheduleSession[],
  contact: {
    phones: [...site.phones],
    email: site.email,
    address: site.address,
    whatsappGroupUrl: "",
  } satisfies ContactSettings,
  camp: {
    active: true,
    name: "Football Summer Camp",
    startDate: "2026-07-27",
    endDate: "2026-08-28",
    ageMin: 2,
    ageMax: 17,
    feeKobo: 120_000_00,
    durationLabel: "5 weeks",
    venue: "DMAK Indaptil Limited, Wuse Zone 2, Abuja",
    schedule: [
      { day: "Monday", start: "7:00 AM", end: "11:00 AM" },
      { day: "Tuesday", start: "7:00 AM", end: "11:00 AM" },
      { day: "Thursday", start: "10:00 AM", end: "1:00 PM" },
      { day: "Friday", start: "7:00 AM", end: "11:00 AM" },
      { day: "Saturday", start: "10:00 AM", end: "1:00 PM" },
    ],
    bank: {
      bankName: "Lightway Microfinance Bank",
      accountNumber: "2020009050",
      accountName: "Moyours Sports Academy Limited",
    },
    callPhone: "09139583674",
    whatsappPhone: "09139583669",
  } satisfies CampSettings,
  /** Day of month after which an unpaid monthly subscription is flagged overdue. */
  subscriptionOverdueDay: 7,
  /**
   * Client-flaggable: original spec issued the member code on submit. This
   * build issues it on acceptance; flip to true to restore original behaviour.
   */
  issueCodeOnSubmit: false,
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<(typeof SETTING_DEFAULTS)[K]> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return SETTING_DEFAULTS[key];
  return row.value as unknown as (typeof SETTING_DEFAULTS)[K];
}

export async function setSetting<K extends SettingKey>(
  key: K,
  value: (typeof SETTING_DEFAULTS)[K],
): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  });
}

export async function getFees() {
  const fees = await getSetting("fees");
  return { ...fees, initialTotalKobo: fees.registrationKobo + fees.jerseyKobo };
}
