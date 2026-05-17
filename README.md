# Wedding OS

Real v1 SaaS product foundation for an end-to-end wedding management platform.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- Recharts
- Lucide React
- Prisma
- PostgreSQL

## Local Development

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

Open `http://localhost:3000`.

If `docker compose up -d postgres` cannot connect to Docker, start Docker Desktop first and rerun the command.
The bundled Postgres maps to host port `5433` to avoid conflicts with any existing local Postgres on `5432`.

## Database

```bash
docker compose up -d postgres
npm run db:ensure
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run smoke:all
```

The seed creates the Arjun & Maya local wedding workspace, marketplace vendors, global categories, custom categories, inquiries, messages, budget records, guests, tasks, and planner snapshots.
The smoke tests validate auth readiness, quote-to-booking, CRUD, payment schedule, contract, provider stubs, onboarding records, messaging, membership, and category-privacy paths inside rolled-back transactions so seeded data stays clean.

## Environment

```bash
npm run env:check
```

Local development defaults to Postgres on `localhost:5433` if `DATABASE_URL` is missing. Production must set `DATABASE_URL` and a real `AUTH_SECRET`.

## Production Build

```bash
npm run build
```

This app now assumes a server-capable deployment target, such as Vercel plus managed PostgreSQL. It is no longer configured as a Netlify static export.

## Product Flow

1. Open `/`.
2. Start planning from the landing page.
3. Visit `/marketplace`.
4. Open `/marketplace/golden-lens-photography`.
5. Request a quote.
6. Open `/messages` to see the shared conversation.
7. Open `/vendor/leads` to move the inquiry through the CRM.
8. Book the vendor.
9. Return to `/dashboard` and confirm budget/vendor updates.
10. Open `/planner` and generate the AI wedding plan.

## Real Product Foundation

- `prisma/schema.prisma` contains the v1 relational model for users, organizations, weddings, vendors, categories, inquiries, leads, bookings, conversations, budget, RSVP, tasks, reviews, portfolio, and planner snapshots.
- `app/actions.ts` contains the first server action contracts for inquiry, messaging, lead stage changes, booking confirmation, budget items, categories, guests, tasks, and planner snapshots.
- Custom categories are first-class: global defaults are platform controlled, while wedding and vendor workspaces can create and archive their own private categories.
- `docs/e2e-platform-roadmap.md` defines the next product slice, reliability posture, and beta-readiness gates.
- `docs/local-beta-runbook.md` defines the local beta startup flow, seeded invite codes, and readiness checks.
