# Wedding OS

Wedding OS is a server-backed wedding management platform for couples, vendors, and platform admins. It is built as a real SaaS foundation, not a frontend-only prototype. The product centralizes wedding planning, vendor discovery, quote requests, messaging, CRM, budgeting, RSVP management, multi-event planning, run sheets, files, and operational tracking in one workspace.

The current build is optimized for local product testing with PostgreSQL, Prisma, Auth.js credentials auth, seeded data, smoke tests, and a low-cost deployment path.

## Product Scope

Wedding OS supports three primary user groups:

- Couples: plan events, manage guests, RSVP links, seating, budgets, payments, invoices, timelines, documents, vendor searches, quote comparisons, messages, and run sheets.
- Vendors: manage business profiles, services, availability, incoming leads, messages, clients, bookings, payment schedules, invoices, files, and analytics.
- Admins: inspect platform metrics, manage invite access, global categories, vendor visibility, and beta readiness.

Core workflows currently implemented:

- Invite-based sign-up and login.
- Couple and vendor onboarding.
- Workspace switching.
- Marketplace search, filters, shortlist, quote requests, and vendor profiles.
- Shared couple/vendor messaging.
- Vendor CRM lead pipeline.
- Quote-to-booking flow.
- Budget tracker with visualizations, vendor payment rollups, payment schedule, invoices, files, and custom categories.
- RSVP/guest management with guest groups, companions, event RSVP status, CSV import/export, RSVP link tracking, and seating as a subfeature.
- Timeline task management with action-oriented priorities and feature evidence checks.
- Tamil/South Asian multi-event wedding planning foundation.
- Run sheet for event execution.
- Document center and file metadata tracking.
- AI planner snapshot flow using structured local logic.
- Smoke and Playwright test scaffolding.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL
- Auth.js / NextAuth beta with Prisma adapter
- Zod
- Lucide React
- Recharts
- Framer Motion
- Playwright

## Repository Structure

```text
app/                    Next.js App Router routes and server actions
components/             Reusable UI and feature components
components/couple/      Couple-facing workflows
components/vendor/      Vendor-facing workflows
components/shared/      Shared UI, files, heatmaps, category tools, messages
lib/                    Data loaders, auth helpers, Prisma client, providers
prisma/                 Prisma schema, migrations, and seed data
scripts/                Environment, smoke, seed, and local operations scripts
tests/e2e/              Playwright E2E tests
docs/                   Roadmap and local testing runbook
types/                  Product-facing TypeScript types
```

## Requirements

- Node.js 20 or newer
- npm
- Docker Desktop, recommended for local PostgreSQL
- Git
- Optional: Cloudflare Tunnel CLI for external local testing

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:ensure
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run smoke:all
npm run dev
```

Open:

```text
http://localhost:3000
```

The local Postgres container maps to host port `5433` to avoid conflicts with a local Postgres instance on `5432`.

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed.

Important variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| `AUTH_SECRET` | Required Auth.js secret. Use a long random value outside local throwaway testing. |
| `NEXT_PUBLIC_APP_URL` | Public app URL used by the browser. |
| `APP_PUBLIC_URL` | Server-side public URL used for links and notifications. |
| `BETA_MODE` | Disables local fallback behavior when set to `true`. |
| `LOCAL_AUTH_FALLBACK` | Development-only fallback switch. Keep `false` for realistic testing. |
| `RESEND_API_KEY` | Resend API key for transactional email when enabled. |
| `EMAIL_FROM` | Sender identity for transactional email. |
| `EMAIL_PROVIDER_MODE` | `dry_run` for local queueing; real provider can be wired later. |
| `STORAGE_PROVIDER_MODE` | `database` for local metadata-only file records; R2 can be enabled later. |
| `R2_*` | Cloudflare R2 storage credentials and bucket settings. |
| `CLOUDFLARE_TUNNEL_URL` | Public tunnel URL for local external testing. |

Validate environment setup:

```bash
npm run env:check
```

## Database Workflow

Start or verify local Postgres:

```bash
docker compose up -d postgres
npm run db:ensure
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate -- --name init
```

Seed the database:

```bash
npm run prisma:seed
```

The seed creates:

- Seeded couple workspace.
- Seeded vendor workspace.
- Admin user.
- Global categories.
- Tamil/South Asian wedding event templates.
- Vendor marketplace data.
- RSVP guests and groups.
- Budget items, payment schedule rows, invoices, contracts, and file metadata.
- Inquiries, leads, conversations, messages, bookings, and quote records.
- Timeline tasks, responsibilities, planner snapshots, saved vendors, and comparison data.

## Seeded Local Access

Default seeded password:

```text
weddingos-local
```

Common seeded accounts:

| Account | Email |
| --- | --- |
| Couple workspace | `maya@weddingos.local` |
| Vendor workspace | `golden@weddingos.local` |
| Platform admin | check `prisma/seed.mjs` if changed |

Seeded invite codes:

| Purpose | Code |
| --- | --- |
| Couple owner | `COUPLE-BETA-ARJUN` |
| Vendor owner | `VENDOR-BETA-GOLDEN` |
| Admin | `ADMIN-BETA-LOCAL` |

Refresh invite codes:

```bash
npm run beta:seed-invites
```

## Main Product Routes

Public:

- `/`
- `/login`
- `/signup`
- `/password-reset`
- `/rsvp/public/[token]`

Couple workspace:

- `/dashboard`
- `/marketplace`
- `/marketplace/[id]`
- `/compare`
- `/messages`
- `/budget`
- `/rsvp`
- `/timeline`
- `/planner`
- `/templates`
- `/documents`
- `/run-sheet`
- `/notifications`
- `/account`
- `/workspaces`

Vendor workspace:

- `/vendor/dashboard`
- `/vendor/leads`
- `/vendor/clients`
- `/vendor/messages`
- `/vendor/analytics`
- `/vendor/opportunities`

Admin:

- `/admin`

## Key Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start local Next.js dev server. |
| `npm run build` | Production build. |
| `npm run start` | Start production server after build. |
| `npm run lint` | Run ESLint. |
| `npm run env:check` | Validate required env variables and local defaults. |
| `npm run db:ensure` | Check database availability. |
| `npm run prisma:generate` | Generate Prisma client. |
| `npm run prisma:migrate -- --name <name>` | Create/apply a migration. |
| `npm run prisma:seed` | Seed local data. |
| `npm run vendors:seed-gta` | Seed additional GTA vendor profiles. |
| `npm run rsvp:cleanup-links` | Clean duplicate RSVP tokens. |
| `npm run smoke:all` | Run all smoke tests. |
| `npm run e2e` | Build and run Playwright tests. |
| `npm run e2e:ui` | Open Playwright UI runner. |
| `npm run beta:doctor` | Check local testing readiness. |
| `npm run beta:backup` | Create local database backup. |
| `npm run beta:restore` | Restore local database backup. |
| `npm run beta:dev` | Prepare local database and start dev server. |
| `npm run beta:tunnel` | Start Cloudflare Tunnel to local app. |

## Testing

Run the standard local checks:

```bash
npm run env:check
npm run lint
npm run build
npm run smoke:all
```

Smoke tests cover:

- Auth readiness.
- Core marketplace quote-to-booking flow.
- Permission boundaries between workspaces.
- CRUD for core product records.
- Local testing readiness.

Run E2E tests:

```bash
npm run e2e
```

Open Playwright UI:

```bash
npm run e2e:ui
```

## Local External Testing

For invite-only external testing from your local machine:

1. Set `.env`:
   - `BETA_MODE="true"`
   - `LOCAL_AUTH_FALLBACK="false"`
   - `AUTH_SECRET` to a real long random value
   - `EMAIL_PROVIDER_MODE="dry_run"` unless Resend is configured
   - `STORAGE_PROVIDER_MODE="database"` unless R2 is configured

2. Prepare the app:

   ```bash
   npm run beta:dev
   ```

3. In a second terminal:

   ```bash
   npm run beta:tunnel
   ```

4. Put the generated Cloudflare Tunnel URL into:
   - `APP_PUBLIC_URL`
   - `CLOUDFLARE_TUNNEL_URL`

5. Run:

   ```bash
   npm run beta:doctor
   ```

See `docs/local-beta-runbook.md` for the detailed runbook.

## Architecture Notes

### Authentication and Workspaces

Auth.js handles credential sessions. Product data is scoped through organization, membership, wedding, and vendor context helpers in `lib/auth.ts`.

Important access helpers:

- `getCurrentUser()`
- `getCurrentWorkspace()`
- `getCurrentWeddingContext()`
- `getCurrentVendorContext()`
- `requireWeddingAccess()`
- `requireVendorAccess()`
- `requireAdmin()`

### Data Loading

`lib/coreData.ts` contains server-side data loaders that convert Prisma records into UI-friendly shapes. Most product pages load from the database and pass typed data into client components.

### Mutations

`app/actions.ts` contains server actions for:

- Inquiries, messages, lead stages, bookings, quotes.
- Budget items, payment schedules, invoices, contracts.
- Guests, guest groups, RSVP links, event RSVPs, seating.
- Timeline tasks, responsibilities, run sheets.
- Vendor profile, availability, opportunities, pitches.
- Documents, files, notifications.
- Categories and workspace onboarding.

### Categories

Categories support global, wedding-scoped, and vendor-scoped records.

- Global categories are platform controlled.
- Wedding custom categories are private to that wedding.
- Vendor custom categories are private to that vendor business.
- Categories are archived instead of deleted so historical records remain stable.

### Payments

Wedding OS does not move money. The current product tracks:

- Budget obligations.
- Vendor-linked expenses.
- Payment schedules.
- Deposits.
- Invoices.
- Contract status.
- Reminder metadata.

Real payments, payouts, refunds, tax handling, and legal e-signature integrations are intentionally out of scope for the current foundation.

### Files and Notifications

Provider interfaces exist for email and storage:

- `lib/providers/email.ts`
- `lib/providers/storage.ts`

Local development can run in dry-run/database-only modes. Resend and Cloudflare R2 can be wired through environment variables when ready.

## Deployment Posture

This app requires a server-capable host because it uses:

- Server actions.
- Auth sessions.
- Prisma/PostgreSQL.
- Dynamic routes.
- Middleware route protection.

Recommended low-cost path:

- Vercel or an equivalent Next.js server host.
- Managed PostgreSQL.
- Resend for transactional email.
- Cloudflare R2 for object storage.

The app is no longer configured as a Netlify static export.

## Documentation

- `docs/e2e-platform-roadmap.md`: product roadmap and readiness gates.
- `docs/local-beta-runbook.md`: local external testing process.

## Current Git Branch

The current default branch in this workspace is:

```text
master
```

Remote:

```text
https://github.com/Thaneegan/WeddingOS.git
```
