# Kevilton Tester Feedback

A minimal web app for collecting feedback from testers of the Kevilton Smart
Switch Android app. One Next.js project (UI + API), one Neon PostgreSQL table.

- `/` — public tester form (name, type, area, comment)
- `/admin` — password-protected team page (table, filters, status, CSV export)

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · Neon PostgreSQL
· zod · jose (signed admin cookie) · Vitest.

Writes nothing to local disk (no uploads); deploy target is Vercel.

## 1. Create a Neon project

1. Go to [neon.tech](https://neon.tech) and create a free account + project
   (region closest to your users; Postgres 16+ default is fine).
2. Open the project dashboard → **Connect** → choose **Prisma**.
3. Copy the two connection strings:
   - **Pooled** (host contains `-pooler`, has `pgbouncer=true`) → `DATABASE_URL`
   - **Direct** (no pooler, no pgbouncer param) → `DIRECT_URL`
4. They look like this:
   ```text
   DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/dbname?sslmode=require"
   ```

## 2. Run locally

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL, DIRECT_URL, ADMIN_PASSWORD, SESSION_SECRET
npx prisma migrate dev  # creates the Feedback + RateLimitHit tables
npm run db:seed -- --demo  # optional: inserts 10 demo comments
npm run dev
```

Open:

- Tester page: <http://localhost:3000/>
- Team page: <http://localhost:3000/admin>

Generate a session secret with:

```bash
openssl rand -base64 48
```

## 3. Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo.
3. Add environment variables (`Settings → Environment Variables`):
   `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
4. Deploy. On first deploy, apply the migration from your machine:
   ```bash
   npx prisma migrate deploy
   ```
   (with the same `DATABASE_URL`/`DIRECT_URL` in your local `.env`).
5. Prisma Client is generated automatically during `npm run build`.

## 4. Change the admin password

1. Pick a new long random password.
2. Update `ADMIN_PASSWORD` in Vercel (`Settings → Environment Variables →
   Production`) and in your local `.env`.
3. Redeploy (Vercel) — existing sessions stay valid for up to 7 days; click
   **Logout** on `/admin` to force re-login.

## Project structure

```text
prisma/
  schema.prisma     # Feedback + RateLimitHit models
  seed.ts           # optional demo data (--demo)
middleware.ts       # 401 guard for /api/admin/* (page renders login form)
src/
  app/
    page.tsx        # tester form
    admin/page.tsx  # login + table (server gate, client table)
    api/
      feedback/route.ts
      admin/login/route.ts  admin/logout/route.ts
      admin/feedback/route.ts  admin/feedback/[id]/route.ts
      admin/export/route.ts
  components/       # FeedbackForm, FeedbackTable, Filters, Badge, AdminLoginForm
  lib/              # schemas, constants, auth, db, rate-limit, csv, env, admin-guard
tests/              # vitest: schemas, csv escaping, admin 401s
```

## Security notes

- Server-side zod validation on every write; Prisma only (no raw SQL).
- Comments render as plain text (no `dangerouslySetInnerHTML`).
- CSV cells escaped (commas/quotes/newlines) and formula-injection prefixed
  (`=`, `+`, `-`, `@`); export ships with a UTF-8 BOM.
- Admin password compared with `crypto.timingSafeEqual` (SHA-256 pre-hash);
  login limited to 5 attempts / 15 min / IP; feedback to 20 / hour / IP —
  counters live in the database, not memory.
- Session cookie: HttpOnly, `Secure` in production, `SameSite=Strict`, 7 days.
- The app throws on startup in production if `ADMIN_PASSWORD`/`SESSION_SECRET`
  are missing, placeholders, or the secret is shorter than 32 chars.

## Scripts

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `npm run dev`    | Start dev server                          |
| `npm run build`  | `prisma generate && next build`           |
| `npm run lint`   | ESLint                                    |
| `npm test`       | Vitest (`tests/`)                         |
| `npm run db:seed -- --demo` | Insert 10 demo comments        |
