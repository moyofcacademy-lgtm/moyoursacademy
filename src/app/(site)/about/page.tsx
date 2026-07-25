import type { Metadata } from "next";
import Link from "next/link";
import { MoyoursCrest } from "@/components/logo";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About us",
  description:
    "The story and philosophy of Moyours Sports Academy — structured youth football in Abuja built on skill, teamwork, and character.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-pitch text-chalk">
        <div className="mx-auto max-w-4xl px-[var(--gutter)] py-16">
          <MoyoursCrest size={64} />
          <h1 className="mt-6 font-display text-step-3">
            More than an academy — a family.
          </h1>
          <p className="mt-4 max-w-2xl text-step-1 text-chalk-dim">
            Moyours Sports Academy trains boys and girls aged 4–18 in the heart
            of Abuja. We believe football is more than a game: it&apos;s a pathway
            to growth, discipline, and opportunity.
          </p>
        </div>
      </section>

      <section aria-labelledby="story-h" className="mx-auto max-w-4xl px-[var(--gutter)] py-16">
        <h2 id="story-h" className="font-display text-step-2">
          Our story
        </h2>
        <div className="mt-4 max-w-2xl space-y-4 text-step-0 leading-relaxed">
          <p>
            Moyours began with a simple observation: Abuja is full of talented
            children who love the ball, and far too few places where that love
            is taken seriously. We set out to build one — a club where a
            four-year-old&apos;s first touch and a seventeen-year-old&apos;s trial
            preparation get the same care.
          </p>
          <p>
            Today our squads train twice a week at Tsukunda House in the Central
            Business District, play friendlies and league football across the
            FCT, and — most importantly — grow up together. Many of our
            families have been with us for years; younger siblings follow older
            ones through the age groups.
          </p>
        </div>
      </section>

      <section aria-labelledby="philosophy-h" className="bg-pitch-deep text-chalk">
        <div className="mx-auto max-w-4xl px-[var(--gutter)] py-16">
          <h2 id="philosophy-h" className="font-display text-step-2">
            What we coach
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Skill",
                body: "Technique first. Every session is built around touches on the ball — control, passing, dribbling, finishing — appropriate to each age.",
              },
              {
                title: "Teamwork",
                body: "Football is played with others. We coach communication, roles, and the joy of making a teammate better.",
              },
              {
                title: "Character",
                body: "Punctuality, respect, and effort are part of training. How our players behave matters as much as how they play.",
              },
            ].map((pillar) => (
              <div key={pillar.title} className="rule-gold bg-pitch p-5">
                <h3 className="font-display text-step-1">{pillar.title}</h3>
                <p className="mt-2 text-step--1 leading-relaxed text-chalk-dim">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="facilities-h" className="mx-auto max-w-4xl px-[var(--gutter)] py-16">
        <h2 id="facilities-h" className="font-display text-step-2">
          Where we train
        </h2>
        <p className="mt-4 max-w-2xl text-step-0 leading-relaxed">
          Our home is {site.address}. Sessions run on maintained pitches with
          age-appropriate goals and equipment, qualified coaches, and first-aid
          cover at every session. Guardians are welcome pitch-side.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/enroll"
            className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit transition-[filter] hover:brightness-105"
          >
            Enroll your child
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center rounded-brand border border-line px-6 text-step-0 font-semibold hover:border-kit"
          >
            Come visit us
          </Link>
        </div>
      </section>
    </>
  );
}
