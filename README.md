## Thikr App

Next.js App Router app with `next-intl`, Supabase Auth (SSR), and PostgreSQL (Drizzle ORM).

## Prerequisites

- Node.js + npm
- PostgreSQL database (commonly Supabase Postgres)
- Supabase project (for Auth)

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure env

Copy `.env.local.example` to `.env.local` and fill values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY` for older setups)
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL` (recommended in production)

3. Run DB migrations

```bash
npm run db:migrate
```

4. Optional: seed initial azkar courses + badges

```bash
npm run migrate:azkars
```

If you intentionally want to re-run that migration, set `FORCE_MIGRATE_AZKARS=1` (it is otherwise guarded to avoid duplicating data).

## Development

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production

```bash
npm run build
npm run start
```

## Notes

- Locale routing is configured with `localePrefix: "always"` (`i18n/routing.ts`). Paths are served under `/en/...` and `/ky/...`.
- The app uses direct Postgres access via `DATABASE_URL`. In production, use a least-privileged DB role and keep secrets out of `NEXT_PUBLIC_*` env vars.
