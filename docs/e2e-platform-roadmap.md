# Wedding OS E2E Platform Roadmap

## Near-Term Product Slice

The next build phase should turn the current product foundation into a reliable beta workflow for real couples and vendors. Prioritize depth over breadth: every core record should be editable, permissioned, persisted, and visible in the right workspace.

1. Finish account and workspace flows.
   - Add sign-up, sign-out, password update, and active workspace switching.
   - Add couple onboarding for wedding details, budget, guest estimate, style, and collaborators.
   - Add vendor onboarding for business profile, service categories, portfolio, socials, and operating location.

2. Harden CRUD depth.
   - RSVP: guest groups, full guest editing, CSV import/export, reminder queue records.
   - Budget: budget items, payment schedule rows, category mapping, contract links, and due-date views.
   - Timeline: templates, custom task categories, vendor-linked tasks, day-of schedule groups.
   - Vendor profile: service editing, custom service categories, portfolio media records, past weddings, and socials.
   - Clients: booking amount, contract status, deposit schedule, notes, and client timeline.

3. Replace local fallback behavior in production paths.
   - Keep seed data for local development only.
   - Require authenticated sessions for product routes in production.
   - Add route-level permission checks for couple, vendor, and platform-admin workspaces.

4. Make customization first-class.
   - Add category management to budget, timeline, guest groups, vendor services, and event planning.
   - Allow create, rename, color, icon, sort, and archive.
   - Keep global categories platform controlled.
   - Preserve archived categories on historical records while hiding them from new-entry forms.

5. Add operational provider interfaces.
   - Store file metadata for contracts, invoices, galleries, and inspiration assets.
   - Queue notification records for RSVP reminders, message alerts, and booking events.
   - Wire low-cost providers later behind the existing file and notification contracts.

## Reliability And Cost Posture

- PostgreSQL remains the right default for reliability, relational integrity, and future marketplace reporting.
- Use a low-cost managed Postgres tier during beta, then scale only when traffic and storage justify it.
- Keep payments tracking-only until vendor payout, refund, tax, and compliance requirements are well defined.
- Avoid background infrastructure until needed; use database-backed queues and scheduled jobs first.
- Add automated smoke tests for every product flow before expanding integrations.

## Beta Readiness Gates

- A couple can sign up, create a wedding workspace, invite collaborators, manage guests, manage budget, manage timeline, request quotes, message vendors, and confirm bookings.
- A vendor can sign up, create a business profile, publish services, receive leads, message couples, manage clients, and maintain booking records.
- Custom categories work across budget, timeline, RSVP groups, and vendor services.
- Permission tests prove users cannot access unrelated wedding or vendor workspaces.
- Production routes require auth and do not depend on local seeded fallback data.
- Build, lint, and full smoke tests pass before every deploy.
