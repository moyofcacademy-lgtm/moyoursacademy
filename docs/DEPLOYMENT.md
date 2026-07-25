# Deployment (Vercel + Neon/Supabase)

## 1. Database

Create a Postgres database (Neon or Supabase). Copy the connection string.

```bash
DATABASE_URL="postgresql://…"
npx prisma migrate deploy      # applies prisma/migrations
npx tsx prisma/seed.ts         # admin user, teams, clubs, settings
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding production —
never ship the default password. Change it immediately after first login if
you must seed with a temporary one.

## 2. Cloudinary

Create a Cloudinary account and note cloud name, API key, API secret. No
preset configuration is needed — uploads are signed server-side. Folders
(`moyours/proofs`, `moyours/crests`, …) are created automatically on first
upload. Payment proofs are stored `type: authenticated` — do not change the
folder to public delivery.

## 3. Resend + Termii

- Resend: verify the `moyoursacademy.ng` sending domain, create an API key.
- Termii: register the `Moyours` sender ID (takes a few days in Nigeria),
  create an API key. Until both are configured, sends log as `QUEUED` in the
  admin notification log and can be re-sent later.

## 4. Vercel

Import the repo. Build command `next build`, install `npm install`
(`postinstall` runs `prisma generate`). Environment variables:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | pooled connection string (Supabase transaction pooler, port 6543) |
| `DIRECT_URL` | Supabase session pooler (port 5432) — used only by `prisma migrate` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://moyoursacademy.ng` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | server-side only |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | same cloud name, exposed for delivery URLs |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | notification email |
| `TERMII_API_KEY`, `TERMII_SENDER_ID` | SMS |

## 5. After deploy

1. Log in at `/admin/login`, change the seeded password (create a fresh
   admin, then remove the seed one).
2. Fill Settings: fees, bank account, schedule, WhatsApp group link.
3. Upload club crests, create the season's fixtures.
4. Submit a test enrollment end-to-end and accept it — confirm the guardian
   email, admin email, and SMS all arrive and the proof link works.

## Notes

- Rate limiting is in-memory per instance. On Vercel this is per-lambda —
  acceptable for launch traffic; swap to Upstash Redis for stricter limits.
- Public content pages use 5-minute ISR; admin mutations revalidate them
  immediately.
