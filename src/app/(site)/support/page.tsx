import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Support us",
  description:
    "Sponsor a player or donate to Moyours Football Club Academy — every contribution, big or small, makes a lasting difference.",
};

const SPONSORSHIP_COVERS = [
  "Training kits and gear",
  "Coaching and mentorship",
  "Match participation and academy events",
  "Access to educational and career guidance sessions",
];

const DONATIONS_FUND = [
  "Upgrade training facilities",
  "Purchase new football equipment",
  "Fund tournaments, travel, and outreach programs",
];

export default function SupportPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-pitch text-chalk">
        <div aria-hidden className="pitch-lines absolute inset-0 -z-10" />
        <div aria-hidden className="glow-gold absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-[var(--gutter)] py-16 sm:py-20">
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold">
            Support the academy
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-step-3 sm:text-step-4">
            Give a young player the opportunity to train, learn, and grow.
          </h1>
          <p className="mt-5 max-w-xl text-step-0 text-chalk-dim sm:text-step-1">
            35 of our players already train on full scholarships. Every
            contribution — big or small — makes a lasting difference.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-[var(--gutter)] py-14">
        <div className="reveal grid gap-8 md:grid-cols-2">
          {/* Sponsorship */}
          <section aria-labelledby="sponsor-h" className="rule-gold flex flex-col rounded-b-brand border border-line bg-white/60 p-6">
            <h2 id="sponsor-h" className="font-display text-step-1">
              Sponsor a player
            </h2>
            <p className="mt-2 text-step--1 leading-relaxed text-kit-soft">
              Your sponsorship covers:
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {SPONSORSHIP_COVERS.map((item) => (
                <li key={item} className="flex gap-2.5 text-step-0 leading-relaxed">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-step--1 leading-relaxed text-kit-soft">
              Sponsors receive regular updates, performance reports, and
              recognition on our website and social platforms.
            </p>
          </section>

          {/* Donations */}
          <section aria-labelledby="donate-h" className="rule-gold flex flex-col rounded-b-brand border border-line bg-white/60 p-6">
            <h2 id="donate-h" className="font-display text-step-1">
              Make a donation
            </h2>
            <p className="mt-2 text-step--1 leading-relaxed text-kit-soft">
              A one-time or recurring donation helps us:
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {DONATIONS_FUND.map((item) => (
                <li key={item} className="flex gap-2.5 text-step-0 leading-relaxed">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-display text-step-0 text-pitch">
              Every contribution — big or small — makes a lasting difference.
            </p>
          </section>
        </div>

        {/* How to donate */}
        <section aria-labelledby="how-h" className="reveal mt-10">
          <h2 id="how-h" className="font-display text-step-2">
            How to donate or partner
          </h2>
          <div className="rule-gold mt-5 rounded-b-brand bg-pitch p-5 text-chalk sm:p-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
              Bank transfer
            </p>
            <dl className="mt-3 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-step--1 text-chalk-dim">Bank</dt>
                <dd className="font-semibold">Optimus Bank</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-step--1 text-chalk-dim">Account number</dt>
                <dd className="flex items-center gap-2 font-mono text-step-1 font-bold tracking-widest">
                  1000125263
                  <CopyButton value="1000125263" label="donations account number" className="border-pitch-mid text-chalk" />
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-step--1 text-chalk-dim">Account holder</dt>
                <dd className="font-semibold">MoYours FC Academy</dd>
              </div>
            </dl>
          </div>
          <p className="mt-5 max-w-2xl text-step-0 leading-relaxed">
            For sponsorships and partnerships, write to{" "}
            <a href={`mailto:${site.supportEmail}`} className="font-semibold underline underline-offset-2">
              {site.supportEmail}
            </a>{" "}
            or call{" "}
            <a href={`tel:+234${site.phones[0].slice(1)}`} className="font-mono font-semibold underline underline-offset-2">
              {site.phones[0]}
            </a>
            . We&apos;ll send you a partnership pack and set up reporting for your
            sponsorship.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${site.supportEmail}?subject=Sponsorship%20enquiry%20-%20Moyours%20Academy`}
              className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
            >
              Become a sponsor
            </a>
            <Link
              href="/about"
              className="inline-flex h-12 items-center rounded-brand border border-line px-6 text-step-0 font-semibold hover:border-kit"
            >
              See our impact
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
