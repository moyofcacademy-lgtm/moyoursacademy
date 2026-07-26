import type { Metadata } from "next";
import { getSetting } from "@/lib/settings";
import { formatNaira } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { BallIcon } from "@/components/football";
import { CampForm } from "./camp-form";

export const metadata: Metadata = {
  title: "Football Summer Camp 2026 — Register now",
  description:
    "Moyours Football Summer Camp: 27 July – 28 August at DMAK Indaptil, Wuse Zone 2, Abuja. Ages 2–17, five weeks of training, ₦120,000. Register online in two minutes.",
};

export const dynamic = "force-dynamic";

/** "Starts tomorrow!" / "Starts today!" / "Week 2 — join mid-camp" */
function urgencyLabel(startIso: string, endIso: string): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T23:59:59`);
  const days = Math.ceil((start.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days > 1) return `Kicks off in ${days} days`;
  if (days === 1) return "Starts tomorrow — secure a place today";
  if (days === 0) return "Starts today — last chance to register";
  if (now <= end) {
    const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return `Week ${week} of 5 — late registration open`;
  }
  return "Camp completed";
}

export default async function SummerCampPage() {
  const camp = await getSetting("camp");
  const urgency = urgencyLabel(camp.startDate, camp.endDate);
  const wa = `https://wa.me/234${camp.whatsappPhone.slice(1)}?text=${encodeURIComponent(
    "Hello Moyours! I want to register for the Football Summer Camp.",
  )}`;

  const dateRange = `${new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(`${camp.startDate}T12:00:00+01:00`))} – ${new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(`${camp.endDate}T12:00:00+01:00`))}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `Moyours ${camp.name}`,
    startDate: camp.startDate,
    endDate: camp.endDate,
    location: { "@type": "Place", name: camp.venue, address: "Wuse Zone 2, Abuja" },
    organizer: { "@type": "SportsOrganization", name: "Moyours Sports Academy" },
    offers: {
      "@type": "Offer",
      price: camp.feeKobo / 100,
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-pitch text-chalk">
        <div aria-hidden className="pitch-lines absolute inset-0 -z-10" />
        <div aria-hidden className="turf absolute inset-0 -z-10" />
        <div aria-hidden className="glow-gold absolute inset-0 -z-10" />
        <div className="stagger mx-auto max-w-5xl px-[var(--gutter)] py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-brand bg-gold px-3 py-1.5 font-mono text-[0.75rem] font-bold uppercase tracking-widest text-kit">
            <BallIcon size={14} /> {urgency}
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-step-3 sm:text-step-4">
            Football Summer Camp.
          </h1>
          <p className="mt-4 max-w-xl text-step-0 text-chalk-dim sm:text-step-1">
            Five weeks of rigorous training and serious fun for boys and girls
            aged {camp.ageMin}–{camp.ageMax} — coached by the Moyours team at{" "}
            {camp.venue.split(",")[0]}, Wuse Zone 2.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#register"
              className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
            >
              Register now
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-brand border border-chalk-dim/40 px-6 text-step-0 text-chalk hover:border-chalk"
            >
              WhatsApp us
            </a>
          </div>

          {/* Key facts strip */}
          <dl className="rule-gold mt-10 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 bg-pitch-deep/60 p-5 sm:grid-cols-4">
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-widest text-chalk-dim">Dates</dt>
              <dd className="mt-1 font-mono text-step--1 font-bold">{dateRange}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-widest text-chalk-dim">Ages</dt>
              <dd className="mt-1 font-mono text-step--1 font-bold">
                {camp.ageMin}–{camp.ageMax} years
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-widest text-chalk-dim">Fee</dt>
              <dd className="mt-1 font-mono text-step--1 font-bold text-gold">
                {formatNaira(camp.feeKobo)} · {camp.durationLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-widest text-chalk-dim">Venue</dt>
              <dd className="mt-1 text-step--1 font-semibold">{camp.venue.split(",")[0]}, Wuse Zone 2</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-12 px-[var(--gutter)] py-14 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-10">
          {/* Schedule */}
          <section aria-labelledby="camp-schedule-h">
            <h2 id="camp-schedule-h" className="font-display text-step-2">
              Training days
            </h2>
            <ul className="mt-4 divide-y divide-line rounded-brand border border-line bg-white/60">
              {camp.schedule.map((session) => (
                <li key={session.day} className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">{session.day}</span>
                  <span className="font-mono text-step--1 text-kit-soft">
                    {session.start} – {session.end}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-step--1 text-kit-soft">
              Come with water, trainers or boots, and shin guards if you have
              them. Arrive 15 minutes before your session.
            </p>
          </section>

          {/* What campers get */}
          <section aria-labelledby="camp-what-h">
            <h2 id="camp-what-h" className="font-display text-step-2">
              What campers get
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                "Five weeks of structured coaching by the Moyours team",
                "Rigorous training combined with fun activities",
                "Small groups by age — from first touches to match play",
                "Mentorship, discipline, and new friendships",
                "A pathway into the academy for standout campers",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-step-0 leading-relaxed">
                  <BallIcon size={16} className="mt-1.5 shrink-0 text-pitch" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Payment details */}
          <section aria-labelledby="camp-pay-h">
            <h2 id="camp-pay-h" className="font-display text-step-2">
              Camp fee
            </h2>
            <div className="rule-gold mt-4 rounded-b-brand bg-pitch p-5 text-chalk">
              <p className="font-mono text-step-2 font-bold text-gold">
                {formatNaira(camp.feeKobo)}
                <span className="ml-2 text-step--1 font-normal text-chalk-dim">
                  for the full {camp.durationLabel}
                </span>
              </p>
              <dl className="mt-4 flex flex-col gap-3 border-t border-pitch-mid pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-step--1 text-chalk-dim">Bank</dt>
                  <dd className="font-semibold">{camp.bank.bankName}</dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-step--1 text-chalk-dim">Account number</dt>
                  <dd className="flex items-center gap-2 font-mono text-step-1 font-bold tracking-widest">
                    {camp.bank.accountNumber}
                    <CopyButton value={camp.bank.accountNumber} label="camp account number" className="border-pitch-mid text-chalk" />
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-step--1 text-chalk-dim">Account name</dt>
                  <dd className="font-semibold">{camp.bank.accountName}</dd>
                </div>
              </dl>
              <p className="mt-4 text-step--1 text-chalk-dim">
                Transfer before camp or pay cash at the venue. Questions — call{" "}
                <a href={`tel:+234${camp.callPhone.slice(1)}`} className="font-mono font-semibold text-chalk underline-offset-2 hover:underline">
                  {camp.callPhone}
                </a>{" "}
                or WhatsApp{" "}
                <a href={wa} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-chalk underline-offset-2 hover:underline">
                  {camp.whatsappPhone}
                </a>
                .
              </p>
            </div>
          </section>
        </div>

        {/* Registration form */}
        <section id="register" aria-labelledby="camp-register-h" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rule-gold rounded-b-brand border border-line bg-white/70 p-6 shadow-xl">
            <h2 id="camp-register-h" className="font-display text-step-2">
              Register for camp
            </h2>
            <p className="mt-1 mb-6 text-step--1 text-kit-soft">
              Two minutes, and your child is on the teamsheet.
            </p>
            <CampForm ageMin={camp.ageMin} ageMax={camp.ageMax} whatsappUrl={wa} venue={camp.venue} />
          </div>
        </section>
      </div>
    </>
  );
}
