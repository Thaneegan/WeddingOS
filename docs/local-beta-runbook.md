# Wedding OS Local Beta Runbook

## Start Local Beta

1. Set `.env` values:
   - `BETA_MODE="true"`
   - `LOCAL_AUTH_FALLBACK="false"`
   - `AUTH_SECRET` to a real long random value
   - `APP_PUBLIC_URL` to the Cloudflare Tunnel URL once available
   - `CLOUDFLARE_TUNNEL_URL` to the same tunnel URL
   - `EMAIL_PROVIDER_MODE="dry_run"` until Resend is configured
   - `STORAGE_PROVIDER_MODE="database"` until R2 is configured

2. Prepare the database:
   ```bash
   npm run db:ensure
   npm run prisma:migrate -- --name local_beta
   npm run prisma:seed
   npm run beta:seed-invites
   npm run smoke:all
   npm run beta:doctor
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

4. Start the tunnel in a second terminal:
   ```bash
   npm run beta:tunnel
   ```

## Seeded Access

- Local admin/couple/vendor account: `maya@weddingos.local`
- Local password: `weddingos-local`
- Seeded couple owner invite: `COUPLE-BETA-ARJUN`
- Seeded vendor owner invite: `VENDOR-BETA-GOLDEN`
- Seeded admin invite: `ADMIN-BETA-LOCAL`

## Beta Gates

Run these before inviting testers:

```bash
npm run env:check
npm run lint
npm run build
npm run smoke:all
npm run beta:doctor
```

`beta:doctor` should report `ok: true` before opening the tunnel to external testers.
