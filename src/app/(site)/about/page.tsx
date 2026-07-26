import type { Metadata } from "next";
import Link from "next/link";
import { MoyoursCrest } from "@/components/logo";
import { CredentialBadges } from "@/components/credential-badges";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Raising Champions — the story, mission, and impact of Moyours Football Club Academy, a FIFA- and NFF-registered youth academy in Abuja.",
};

export default function AboutPage() {
  return (
    <>
      {/* Mission / vision hero */}
      <section className="relative isolate overflow-hidden bg-pitch text-chalk">
        <div aria-hidden className="pitch-lines absolute inset-0 -z-10" />
        <div aria-hidden className="glow-gold absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-[var(--gutter)] py-16 sm:py-20">
          <MoyoursCrest size={64} />
          <p className="mt-8 font-mono text-[0.6875rem] uppercase tracking-widest text-gold">
            Our mission
          </p>
          <h1 className="mt-2 font-display text-step-3 sm:text-step-4">Raising Champions.</h1>
          <p className="rule-gold mt-6 max-w-xl pt-4 text-step-1 text-chalk-dim">
            Our vision: <span className="text-chalk">a society healed by sports.</span>
          </p>
          <CredentialBadges className="mt-10" />
        </div>
      </section>

      {/* Our story */}
      <section aria-labelledby="story-h" className="reveal mx-auto max-w-4xl px-[var(--gutter)] py-16">
        <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">Our story</p>
        <h2 id="story-h" className="mt-2 font-display text-step-2">
          It started with one student who just wanted to make the team.
        </h2>
        <div className="mt-6 max-w-2xl space-y-4 text-step-0 leading-relaxed">
          <p>
            Moyours began when Coach Moyiwa helped a student who was struggling to
            join his school&apos;s football team. That single gesture grew into what
            is now a FIFA- and NFF-registered academy in Abuja.
          </p>
          <p>
            The road hasn&apos;t been easy — financial difficulties and facility
            challenges tested us — but with the backing of our community, the
            academy has persevered and today develops athletes competing at local
            and global levels.
          </p>
        </div>
      </section>

      {/* Why we exist */}
      <section aria-labelledby="why-h" className="reveal border-y border-line bg-white/40">
        <div className="mx-auto grid max-w-4xl gap-8 px-[var(--gutter)] py-16 md:grid-cols-2">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
              Why Moyours exists
            </p>
            <h2 id="why-h" className="mt-2 font-display text-step-2">
              Talent is everywhere. Opportunity isn&apos;t.
            </h2>
          </div>
          <div className="space-y-4 text-step-0 leading-relaxed">
            <p>
              Young footballers throughout Abuja and Nigeria face insufficient
              training and limited exposure opportunities. Moyours closes that gap
              with expert instruction, organized development programs, and
              worldwide partnerships that enable emerging talents to achieve their
              aspirations.
            </p>
            <p className="font-display text-step-1 text-pitch">
              We are a family, a pathway, and a beacon of hope for young Nigerians
              pursuing professional football.
            </p>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section aria-labelledby="impact-h" className="reveal mx-auto max-w-4xl px-[var(--gutter)] py-16">
        <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">Our impact</p>
        <h2 id="impact-h" className="mt-2 font-display text-step-2">
          Nine years in, and counting.
        </h2>
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8">
          {site.stats.map((stat) => (
            <div key={stat.label} className="rule-gold pt-4">
              <dd className="tabular font-mono text-step-3 font-bold text-pitch">{stat.value}</dd>
              <dt className="mt-1 text-step--1 leading-relaxed text-kit-soft">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {[
            "Scholarships supporting 35+ disadvantaged players",
            "Community outreach programs across the FCT",
            "Professional coaching staff with global experience",
            "Youth mentorship that goes beyond athletics",
            "An elite training initiative preparing players for international competition",
          ].map((item) => (
            <li key={item} className="flex gap-2.5 text-step-0 leading-relaxed">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/enroll"
            className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
          >
            Enroll your child
          </Link>
          <Link
            href="/support"
            className="inline-flex h-12 items-center rounded-brand border border-line px-6 text-step-0 font-semibold hover:border-kit"
          >
            Support the academy
          </Link>
        </div>
      </section>
    </>
  );
}
