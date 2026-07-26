import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";

/**
 * Club partners & sponsors — logo wall on white cards so every mark keeps
 * its own brand colours. Logos display in full (object-contain, no crops).
 */
export function SponsorStrip({ showCta = true }: { showCta?: boolean }) {
  return (
    <section aria-labelledby="sponsors-heading" className="reveal border-y border-line bg-white/40">
      <div className="mx-auto max-w-6xl px-[var(--gutter)] py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
              Backing the dream
            </p>
            <h2 id="sponsors-heading" className="mt-2 font-display text-step-2">
              Our partners &amp; sponsors
            </h2>
          </div>
          {showCta && (
            <Link
              href="/support"
              className="text-step--1 font-semibold underline-offset-4 hover:underline"
            >
              Become a sponsor
            </Link>
          )}
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {site.sponsors.map((sponsor) => (
            <li
              key={sponsor.name}
              className="flex flex-col items-center gap-3 rounded-brand border border-line bg-white p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
            >
              <Image
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
                width={200}
                height={200}
                className="size-24 object-contain sm:size-28"
              />
              <p className="text-center text-[0.75rem] font-semibold text-kit-soft">
                {sponsor.name}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
