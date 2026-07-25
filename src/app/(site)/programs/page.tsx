import type { Metadata } from "next";
import Link from "next/link";
import { AGE_GROUPS, PROGRAM_PHASES } from "@/lib/constants";
import { site } from "@/config/site";
import { getFees, getSetting } from "@/lib/settings";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Foundations, Development, and Performance — Moyours Football Club Academy training programs for boys and girls aged 4–18, with schedule and fees.",
};

export const revalidate = 300;

const PHASE_DETAIL: Record<string, string[]> = {
  foundations: [
    "Fun, structured play that builds a lasting love for football",
    "Balance, coordination, and confident first touches",
    "Listening, sharing, and being part of a team",
  ],
  development: [
    "Skill-building sessions: control, passing, dribbling, finishing",
    "Tactical awareness introduced through small-sided games",
    "Teamwork, discipline, and match experience",
  ],
  performance: [
    "Advanced training with individual development plans",
    "High-level competition across Abuja and beyond",
    "Exposure to scouts, trials, and international pathways",
  ],
};

export default async function ProgramsPage() {
  const [fees, schedule] = await Promise.all([getFees(), getSetting("schedule")]);

  return (
    <div className="mx-auto max-w-5xl px-[var(--gutter)] py-12">
      <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
        Academy programs
      </p>
      <h1 className="mt-2 font-display text-step-3">One pathway, three phases</h1>
      <p className="mt-3 max-w-2xl text-step-0 text-kit-soft">
        Every Moyours player — boys and girls aged 4–18 — moves through a
        structured pathway: from falling in love with the ball to competing in
        front of scouts.
      </p>

      {/* The three phases */}
      <div className="reveal mt-10 grid gap-5 md:grid-cols-3">
        {PROGRAM_PHASES.map((phase, index) => (
          <section
            key={phase.key}
            aria-labelledby={`phase-${phase.key}`}
            className="rule-gold flex flex-col rounded-b-brand border border-line bg-white/60 p-6"
          >
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-kit-soft">
              Phase {index + 1} · {phase.ages}
            </p>
            <h2 id={`phase-${phase.key}`} className="mt-2 font-display text-step-1">
              {phase.name}
            </h2>
            <p className="mt-1 text-step--1 text-kit-soft">{phase.summary}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {PHASE_DETAIL[phase.key].map((item) => (
                <li key={item} className="flex gap-2.5 text-step--1 leading-relaxed">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Squads */}
      <section aria-labelledby="squads-h" className="reveal mt-12">
        <h2 id="squads-h" className="font-display text-step-2">
          Our squads
        </h2>
        <p className="mt-2 max-w-2xl text-step--1 text-kit-soft">
          Within the pathway, players compete in four age-group squads.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {AGE_GROUPS.map((group) => (
            <Link
              key={group.key}
              href="/squads"
              className="rounded-brand border border-line bg-white/50 p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
            >
              <p className="font-mono text-step-2 font-bold text-pitch">{group.key}</p>
              <p className="mt-1 text-step--1 text-kit-soft">{group.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <div className="rule-gold mt-12 rounded-b-brand bg-pitch p-5 text-chalk sm:p-6">
        <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
          Training schedule — all age groups
        </p>
        <div className="mt-3 flex flex-wrap gap-x-10 gap-y-2">
          {schedule.map((session) => (
            <p key={session.day} className="text-step-1 font-semibold">
              {session.day}s{" "}
              <span className="font-mono text-step-0 font-normal text-chalk-dim">
                {session.start} – {session.end} WAT
              </span>
            </p>
          ))}
        </div>
        <p className="mt-3 text-step--1 text-chalk-dim">
          {site.address} · plus a second training location to meet growing demand.
        </p>
      </div>

      {/* What's included + fees */}
      <div className="reveal mt-12 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="included-h">
          <h2 id="included-h" className="font-display text-step-2">
            What&apos;s included
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {[
              "Two structured training sessions every week",
              "Two full sets of the Moyours jersey",
              "Friendly matches and league fixtures",
              "Summer camps combining rigorous training with fun activities",
              "Mentorship pairing young athletes with experienced mentors",
              "First-aid cover and safeguarding-trained coaches",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-step-0 leading-relaxed">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="fees-h">
          <h2 id="fees-h" className="font-display text-step-2">
            Fees
          </h2>
          <table className="mt-4 w-full border-collapse text-step-0">
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 text-left font-normal">Registration fee</th>
                <td className="py-3 text-right font-mono">{formatNaira(fees.registrationKobo)}</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 text-left font-normal">Jersey (2 sets)</th>
                <td className="py-3 text-right font-mono">{formatNaira(fees.jerseyKobo)}</td>
              </tr>
              <tr className="border-b-2 border-kit">
                <th scope="row" className="py-3 text-left font-bold">Total to start</th>
                <td className="py-3 text-right font-mono text-step-1 font-bold">{formatNaira(fees.initialTotalKobo)}</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 text-left font-normal text-kit-soft">Monthly subscription</th>
                <td className="py-3 text-right font-mono text-kit-soft">{formatNaira(fees.monthlyKobo)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-step--1 text-kit-soft">
            No family should be priced out of the game — 35 of our players train
            on full scholarships.{" "}
            <Link href="/support" className="font-semibold underline underline-offset-2">
              Sponsor a player
            </Link>
            .
          </p>
          <Link
            href="/enroll"
            className="mt-5 inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
          >
            Start enrollment
          </Link>
        </section>
      </div>
    </div>
  );
}
