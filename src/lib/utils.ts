import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const nairaFormat = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Format an amount stored in kobo for display, e.g. 22000000 → "₦220,000". */
export function formatNaira(amountKobo: number): string {
  return nairaFormat.format(amountKobo / 100);
}

export const WAT_TIME_ZONE = "Africa/Lagos";

/** Request-time "now" helpers, kept out of component bodies for the compiler. */
export function requestNow(): Date {
  return new Date();
}

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function formatDateWAT(date: Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: WAT_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(date);
}

/** "Sat 26 Jul · 4:00 PM WAT" */
export function formatKickoffWAT(date: Date): string {
  const day = new Intl.DateTimeFormat("en-NG", {
    timeZone: WAT_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  return `${day} · ${formatTimeWAT(date)}`;
}

export function formatTimeWAT(date: Date): string {
  const time = new Intl.DateTimeFormat("en-NG", {
    timeZone: WAT_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${time.toUpperCase()} WAT`;
}

export function formatDateTimeWAT(date: Date): string {
  return `${formatDateWAT(date)}, ${formatTimeWAT(date)}`;
}

/** Relative time like "2 hours ago"; falls back to date past 7 days. */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateWAT(date);
}

/**
 * Normalize a Nigerian mobile number to E.164 (+234…).
 * Accepts 0801…, 234801…, +234801…. Returns null if not a valid NG mobile.
 */
export function normalizeNgPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  let rest: string;
  if (/^\+234\d{10}$/.test(digits)) rest = digits.slice(4);
  else if (/^234\d{10}$/.test(digits)) rest = digits.slice(3);
  else if (/^0\d{10}$/.test(digits)) rest = digits.slice(1);
  else return null;
  // NG mobile prefixes: 70x, 80x, 81x, 90x, 91x
  if (!/^(70|80|81|90|91)\d{8}$/.test(rest)) return null;
  return `+234${rest}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "2026-07" for the current month in WAT — used for subscription periods. */
export function currentPeriodMonth(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WAT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}
