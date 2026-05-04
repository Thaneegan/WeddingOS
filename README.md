# Wedding OS

Frontend-only investor demo for an end-to-end wedding management platform.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- Recharts
- Lucide React

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Static Build

```bash
npm run build
```

The app is configured for static export with `output: "export"` and writes the deployable site to `out/`.

## Netlify

`netlify.toml` is configured with:

```toml
[build]
  command = "npm run build"
  publish = "out"
```

## Demo Flow

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
