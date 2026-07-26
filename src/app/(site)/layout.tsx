import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getSetting } from "@/lib/settings";
import { formatNaira } from "@/lib/utils";

/** Gold announcement bar while the summer camp is active. */
async function CampBanner() {
  const camp = await getSetting("camp");
  if (!camp.active) return null;
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  if (now > new Date(`${camp.endDate}T23:59:59`)) return null;

  const start = new Date(`${camp.startDate}T00:00:00`);
  const days = Math.ceil((start.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const when =
    days > 1 ? `starts in ${days} days` : days === 1 ? "starts tomorrow" : days === 0 ? "starts today" : "now running";

  return (
    <Link
      href="/summer-camp"
      className="block bg-gold px-[var(--gutter)] py-2 text-center text-step--1 font-semibold text-kit transition-[filter] hover:brightness-105"
    >
      ⚽ {camp.name} {when} — ages {camp.ageMin}–{camp.ageMax}, {formatNaira(camp.feeKobo)} for{" "}
      {camp.durationLabel}. <span className="underline underline-offset-2">Register now →</span>
    </Link>
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-brand focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-kit"
      >
        Skip to content
      </a>
      <CampBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
