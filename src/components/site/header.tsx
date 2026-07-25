"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoyoursCrest } from "@/components/logo";
import { siteNav } from "@/config/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation — state adjusted during render,
  // the pattern React recommends over a setState-in-effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-pitch-mid/70 bg-pitch text-chalk supports-[backdrop-filter]:bg-pitch/85 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-[var(--gutter)]">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-step-0"
          aria-label="Moyours Football Club Academy — home"
        >
          <MoyoursCrest size={36} />
          <span className="hidden sm:inline">Moyours</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {siteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              className={cn(
                "rounded-brand px-3 py-2 text-step--1 transition-colors hover:bg-pitch-mid",
                pathname.startsWith(item.href) && "bg-pitch-mid font-semibold",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/enroll"
            className="inline-flex h-10 items-center rounded-brand bg-gold px-4 text-step--1 font-semibold text-kit transition-[filter] hover:brightness-105"
          >
            Enroll
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-brand border border-pitch-mid lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-pitch-mid px-[var(--gutter)] pb-4 pt-2 lg:hidden"
        >
          {siteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              className={cn(
                "block rounded-brand px-3 py-3 text-step-0 hover:bg-pitch-mid",
                pathname.startsWith(item.href) && "bg-pitch-mid font-semibold",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
