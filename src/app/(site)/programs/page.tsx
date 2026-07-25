import type { Metadata } from "next";
import Link from "next/link";
import { AGE_GROUPS } from "@/lib/constants";
import { getFees, getSetting } from "@/lib/settings";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Training programs at Moyours Sports Academy for ages 4–18: schedule, what's included, and fees.",
};

export const revalidate = 300;

const PROGRAM_DETAIL: Record<string, { headline: string; focus: string[] }> = {
  U7: {
    headline: "Football through play",
    focus: [
      "Fun, game-based sessions that build love for the ball",
      "Balance, coordination, and first touches",
      "Listening, sharing, and taking turns",
    ],
  },
  U11: {
    headline: "The technical years",
    focus: [
      "Core technique: control, passing, dribbling, shooting",
      "Small-sided games every session",
      "Confidence on the ball under gentle pressure",
    ],
  },
  U15: {
    headline: "Learning the game",
    focus: [
      "Positional play and tactical understanding",
      "Competitive fixtures in Abuja youth football",
      "Physical development, done safely",
    ],
  },
  U18: {
    headline: "Performance and pathways",
    focus: [
      "Individual development plans for every player",
      "Preparation for trials, scholarships, and senior football",
      "Leadership and mentorship responsibilities",
    ],
  },
};

export default async function ProgramsPage() {
  const [fees, schedule] = await Promise.all([getFees(), getSetting("schedule")]);

  return (
    <div className="mx-auto max-w-5xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">Programs</h1>
      <p className="mt-3 max-w-2xl text-step-0 text-kit-soft">
        One pathway, four age groups. Every player trains twice a week and
        plays regular matches, with coaching pitched to their stage of
        development.
      </p>

      {/* Schedule */}
      <div className="rule-gold mt-8 rounded-b-brand bg-pitch p-5 text-chalk sm:p-6">
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
      </div>

      {/* Age groups */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {AGE_GROUPS.map((group) => {
          const detail = PROGRAM_DETAIL[group.key];
          return (
            <section
              key={group.key}
              aria-labelledby={`program-${group.key}`}
              className="flex flex-col rounded-brand border border-line bg-white/60 p-6"
            >
              <p className="font-mono text-step-2 font-bold text-pitch">{group.key}</p>
              <h2 id={`program-${group.key}`} className="mt-1 font-display text-step-1">
                {detail.headline}
              </h2>
              <p className="text-step--1 text-kit-soft">{group.label}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {detail.focus.map((item) => (
                  <li key={item} className="flex gap-2.5 text-step--1 leading-relaxed">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* What's included + fees */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="included-h">
          <h2 id="included-h" className="font-display text-step-2">
            What&apos;s included
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {[
              "Two structured training sessions every week",
              "Two full sets of the Moyours jersey",
              "Friendly matches and league fixtures",
              "Seasonal programs including summer camps",
              "Continuous development feedback and mentorship",
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
