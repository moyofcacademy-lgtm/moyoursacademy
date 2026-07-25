# Moyours Sports Academy

Public website and admin platform for Moyours Sports Academy — a youth
football academy in Abuja, Nigeria (boys and girls, ages 4–18).

- **Public site**: programs, fixtures, results, gallery, news, contact, and a
  five-step enrollment flow with bank-transfer proof upload.
- **Admin** (`/admin`): registration review with an accept/reject workflow,
  member code issuance, fixtures/results/clubs management, squads, monthly
  subscription tracking, gallery, news, settings, and a full audit log.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 ·
Prisma 7 + PostgreSQL · NextAuth v5 (credentials, admin-only) · Cloudinary ·
Resend + React Email · Zod · react-hook-form · TanStack Table.

## Getting started

```bash
npm install          # also runs `prisma generate`
npm run db:setup     # applies migrations + seeds (embedded PGlite when no DATABASE_URL)
npm run dev
```

With no `DATABASE_URL` set, the app runs on an **embedded PGlite database**
in `.pglite/` — zero setup, real Postgres semantics. Seeded admin login:
`admin@moyoursacademy.ng` / `moyours-admin-2026` (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

For a real database (Neon/Supabase), set `DATABASE_URL` in `.env` and run
`npm run db:setup` again. See `.env.example` for every variable (Cloudinary,
Resend). Without provider keys, uploads fall back to a simulated
dev-mode and notifications are logged as `QUEUED` instead of sent.

## Tests

```bash
NODE_OPTIONS=--conditions=react-server npx tsx tests/member-code.test.ts
```

Verifies member-code concurrency (distinct sequential codes under parallel
accepts) and accept idempotency. Stop `next dev` first — PGlite is
single-process.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit together
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Neon/Supabase deployment
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — day-to-day guide for academy staff
