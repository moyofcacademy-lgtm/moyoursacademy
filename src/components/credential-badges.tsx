import Image from "next/image";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The academy's registration credentials — FIFA, NFF, and club IDs — each
 * carrying its organisation's badge. Rendered on dark pitch surfaces.
 */
export function CredentialBadges({ className }: { className?: string }) {
  return (
    <dl className={cn("flex flex-wrap gap-x-8 gap-y-4", className)}>
      {site.credentials.map((credential) => (
        <div key={credential.label} className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-md ring-1 ring-chalk/20">
            <Image
              src={credential.logo}
              alt={`${credential.label} badge`}
              width={40}
              height={40}
              className="size-full rounded-full object-contain"
            />
          </span>
          <span>
            <dt className="text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
              {credential.label}
            </dt>
            <dd className="font-mono text-step--1 font-bold text-chalk">{credential.value}</dd>
          </span>
        </div>
      ))}
    </dl>
  );
}
