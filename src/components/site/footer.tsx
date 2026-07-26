import Link from "next/link";
import { MoyoursCrest } from "@/components/logo";
import { site } from "@/config/site";
import { siteNav } from "@/config/nav";

export function SiteFooter() {
  return (
    <footer className="touchline relative isolate overflow-hidden bg-pitch-deep text-chalk">
      <div aria-hidden className="turf absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-6xl gap-10 px-[var(--gutter)] py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <MoyoursCrest size={40} />
            <p className="font-display text-step-0">{site.name}</p>
          </div>
          <p className="font-display text-step-0 text-gold">{site.tagline}.</p>
          <p className="text-step--1 leading-relaxed text-chalk-dim">
            {site.heroTagline}
          </p>
          <dl className="mt-1 flex flex-col gap-1">
            {site.credentials.map((credential) => (
              <div key={credential.label} className="flex items-baseline gap-2">
                <dt className="text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
                  {credential.label}
                </dt>
                <dd className="font-mono text-[0.75rem] font-bold">{credential.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2">
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold">Academy</p>
          {siteNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-step--1 text-chalk-dim hover:text-chalk">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold">Visit us</p>
          <p className="text-step--1 leading-relaxed text-chalk-dim">{site.address}</p>
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold mt-3">Training</p>
          <p className="text-step--1 text-chalk-dim">Fridays 4:00–6:00 PM WAT</p>
          <p className="text-step--1 text-chalk-dim">Saturdays 11:30 AM–2:30 PM WAT</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold">Call us</p>
          {site.phones.map((phone) => (
            <a key={phone} href={`tel:+234${phone.slice(1)}`} className="font-mono text-step--1 text-chalk-dim hover:text-chalk">
              {phone}
            </a>
          ))}
          <a href={`mailto:${site.email}`} className="text-step--1 text-chalk-dim hover:text-chalk">
            {site.email}
          </a>
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-gold mt-3">
            Sponsorships
          </p>
          <a href={`mailto:${site.supportEmail}`} className="text-step--1 text-chalk-dim hover:text-chalk">
            {site.supportEmail}
          </a>
        </div>
      </div>
      <div className="border-t border-pitch-mid/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-[var(--gutter)] py-4">
          <p className="text-[0.75rem] text-chalk-dim">
            © {new Date().getFullYear()} Moyours Academy. All Rights Reserved. Built by{" "}
            <a
              href="https://techboxlimited.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gold underline-offset-2 hover:underline"
            >
              TechBox
            </a>
          </p>
          <Link href="/status" className="text-[0.75rem] text-chalk-dim underline-offset-2 hover:underline">
            Check application status
          </Link>
        </div>
      </div>
    </footer>
  );
}
