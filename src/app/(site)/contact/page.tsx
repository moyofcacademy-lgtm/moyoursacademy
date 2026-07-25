import type { Metadata } from "next";
import { getSetting } from "@/lib/settings";
import { site } from "@/config/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Reach Moyours Football Club Academy — ${site.address}.`,
};

export const revalidate = 300;

export default async function ContactPage() {
  const contact = await getSetting("contact");

  return (
    <div className="mx-auto max-w-5xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">Talk to us</h1>
      <p className="mt-3 max-w-2xl text-step-0 text-kit-soft">
        Questions about enrollment, training, or fixtures — call, write, or
        visit. We&apos;re a family; you&apos;ll always get a person.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="call-h">
            <h2 id="call-h" className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
              Call us
            </h2>
            <ul className="mt-2 flex flex-col gap-1">
              {contact.phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.startsWith("0") ? `+234${phone.slice(1)}` : phone}`}
                    className="font-mono text-step-1 font-semibold underline-offset-4 hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="write-h">
            <h2 id="write-h" className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
              Email
            </h2>
            <a href={`mailto:${contact.email}`} className="mt-2 inline-block text-step-0 font-semibold underline-offset-4 hover:underline">
              {contact.email}
            </a>
          </section>

          <section aria-labelledby="visit-h">
            <h2 id="visit-h" className="font-mono text-[0.6875rem] uppercase tracking-widest text-pitch">
              Visit
            </h2>
            <p className="mt-2 max-w-sm text-step-0 leading-relaxed">{contact.address}</p>
            <iframe
              title="Map to Moyours Football Club Academy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(site.mapsQuery)}&output=embed`}
              className="mt-4 h-64 w-full rounded-brand border border-line"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>
        </div>

        <section aria-labelledby="form-h">
          <h2 id="form-h" className="font-display text-step-1">
            Send a message
          </h2>
          <div className="mt-4">
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}
