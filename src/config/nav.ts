export const siteNav = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/squads", label: "Squads" },
  { href: "/coaches", label: "Coaches" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/gallery", label: "Gallery" },
  { href: "/news", label: "News" },
  { href: "/support", label: "Support us" },
  { href: "/contact", label: "Contact" },
] as const;

export const adminNavGroups = [
  {
    label: null,
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "People",
    items: [
      { href: "/admin/registrations", label: "Registrations" },
      { href: "/admin/players", label: "Players" },
      { href: "/admin/teams", label: "Teams" },
      { href: "/admin/coaches", label: "Coaches" },
    ],
  },
  {
    label: "Matchday",
    items: [
      { href: "/admin/fixtures", label: "Fixtures" },
      { href: "/admin/results", label: "Results" },
      { href: "/admin/clubs", label: "Clubs" },
    ],
  },
  {
    label: "Club",
    items: [
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/gallery", label: "Gallery" },
      { href: "/admin/news", label: "News" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/audit", label: "Audit log" },
    ],
  },
] as const;

export const adminNav: readonly { href: string; label: string }[] =
  adminNavGroups.flatMap((group) => [...group.items]);
