# Project Notes

This is a Next.js App Router project for a server-backed Wedding OS product.

- Use Prisma/PostgreSQL for real product data.
- Keep the existing product flow working while replacing legacy Zustand state route by route.
- Global categories are platform controlled. Wedding and vendor custom categories are workspace scoped and archive-only.
- Real payments are deferred; track invoices, deposits, contracts, and budget obligations only.
