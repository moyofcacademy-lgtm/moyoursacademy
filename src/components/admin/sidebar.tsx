"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoyoursCrest } from "@/components/logo";
import { adminNavGroups } from "@/config/nav";
import { cn } from "@/lib/utils";

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation — adjusted during render rather
  // than in an effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-4 px-3 py-4">
      {adminNavGroups.map((group) => (
        <div key={group.label ?? "root"} className="flex flex-col gap-0.5">
          {group.label && (
            <p className="px-3 pb-1 font-mono text-[0.625rem] uppercase tracking-widest text-gold/80">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-brand px-3 py-2 text-step--1 text-chalk-dim transition-colors hover:bg-pitch-mid/70 hover:text-chalk",
                  active &&
                    "bg-pitch-mid font-semibold text-chalk before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-gold",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between border-b border-pitch-mid bg-pitch-deep px-4 text-chalk lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display text-step--1">
          <MoyoursCrest size={28} /> Admin
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-brand border border-pitch-mid"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </div>
      {open && (
        <div id="admin-nav" className="border-b border-pitch-mid bg-pitch-deep text-chalk lg:hidden">
          {nav}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="turf fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-pitch-mid bg-pitch-deep text-chalk lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 border-b border-pitch-mid px-5 py-4 font-display text-step-0">
          <MoyoursCrest size={32} />
          Moyours
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="touchline border-t border-pitch-mid px-5 py-3">
          <p className="truncate text-step--1 text-chalk-dim">{adminName}</p>
        </div>
      </aside>
    </>
  );
}
