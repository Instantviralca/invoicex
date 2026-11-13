# InvoiceX

Professional invoice and quotation software for UK freelancers, contractors, consultants, agencies, sole traders, and small businesses.

Operated by **THE HOUSE OF VEYNOR LTD** (company number **17561169**), registered in England, United Kingdom.

Registered office: Office 2236, 85 Dunstall Hill, Wolverhampton, England, WV6 0SR  
Contact: [sales@invoicex.store](mailto:sales@invoicex.store)  
Production domain: [invoicex.store](https://invoicex.store)

InvoiceX provides document and business administration software. It is **not** a bank, accounting firm, tax adviser, financial adviser, payment processor, or regulated financial service. Users remain responsible for their invoices, quotations, VAT, tax treatment, and accounting records.

> **Legal review:** Have a qualified UK solicitor review Terms, Privacy, Refund, Cancellation, Acceptable Use, and Cookie policies before public launch.

---

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS + accessible UI components
- PostgreSQL + Drizzle ORM
- Auth.js (NextAuth v5) credentials authentication
- Mollie (@mollie/api-client) for **InvoiceX subscription billing only** (not end-customer invoice payments)
- Resend + React Email for transactional email
- pdfkit for server-side PDF generation
- S3-compatible object storage for logos and exports
- Vitest + Playwright
- Pino logging; optional Sentry via `SENTRY_DSN`

---

## Quick start

```bash
cp .env.example .env.local
# Edit DATABASE_URL, AUTH_SECRET, and other values

npm install
npm run db:push          # or db:generate && db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end smoke tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema (dev) |
| `npm run db:seed` | Seed safe local/admin data |
| `npm run format` | Prettier |

---

## Environment variables

See `.env.example` for the full commented list. Required for a working local app:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

For billing: `MOLLIE_API_KEY`, `MOLLIE_WEBHOOK_URL`  
For email: `RESEND_API_KEY`, `EMAIL_FROM`, `SUPPORT_INBOX`  
For uploads on Vercel: **Storage → Blob** (sets `BLOB_READ_WRITE_TOKEN`), or optional `S3_*`  
For cron jobs: `CRON_SECRET`  
For admin bootstrap: `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`

Never commit real secrets.

---

## Central configuration

Update brand, company, pricing, and plan limits in one place:

**`src/config/brand.ts`**

Design tokens and visual system live in:

**`src/app/globals.css`**

Brand logo / favicon:

**`src/components/brand/logo.tsx`**, **`public/brand/`**

Asset licensing notes: **`docs/ASSETS.md`**

---

## Mollie setup

InvoiceX uses Mollie only to collect **SaaS subscription fees** from registered account holders. **invoicex.store does not** process, hold, or route card or bank payments from your users’ clients to you.

An optional WooCommerce “remote payment server” exists for separate self-hosted integrations. It is **disabled in production by default** (`MOLLIE_REMOTE_ENABLED` must be set explicitly) and is **not** part of the public InvoiceX product on invoicex.store.

### Test mode

1. Create a Mollie account and copy the **test** API key.
2. Set `MOLLIE_API_KEY=test_…`.
3. Expose localhost with ngrok/cloudflared and set `MOLLIE_WEBHOOK_URL` to `https://…/api/billing/webhook`.
4. Complete a Starter/Pro/Business checkout from `/app/subscription`.
5. Confirm webhook updates local subscription status (never trust the return URL alone).

### Live mode

1. Complete Mollie merchant onboarding.
2. Switch to the **live** API key only on the production environment.
3. Configure the live webhook URL.
4. Verify GBP payment methods are enabled.
5. Test upgrade, downgrade (next period), cancellation, and failed payment handling.

### Recurring flow implemented

1. Create/reuse Mollie customer  
2. First payment (`sequenceType: first`) → mandate  
3. Create subscription after valid mandate  
4. Idempotent webhook processing via `subscription_events`  
5. Cancel online from Subscription page  

Mollie approval is **not** guaranteed.

---

## Email (SPF / DKIM / DMARC)

1. Add your sending domain in Resend.
2. Publish SPF, DKIM, and DMARC DNS records as instructed by Resend.
3. Set `EMAIL_FROM` to a verified address (e.g. `InvoiceX <noreply@invoicex.store>`).
4. Test verification, password reset, invoice/quote send, and billing emails.

Without `RESEND_API_KEY`, development logs emails and does **not** claim delivery.

---

## Scheduled jobs

Protect cron endpoints with `Authorization: Bearer $CRON_SECRET`.

| Job | Route |
|-----|-------|
| Recurring invoices | `POST /api/cron/recurring-invoices` |
| Payment reminders | `POST /api/cron/payment-reminders` |
| Subscription reconciliation | `POST /api/cron/subscription-reconciliation` |
| Email retries | `POST /api/cron/email-retries` |
| Data exports | `POST /api/cron/data-exports` |
| Account deletion | `POST /api/cron/account-deletion` |
| Cleanup tokens | `POST /api/cron/cleanup-tokens` |
| Cleanup temp uploads | `POST /api/cron/cleanup-temp-uploads` |

Configure your host’s scheduler (e.g. Vercel Cron, systemd timer, GitHub Actions) to call these hourly/daily as appropriate.

---

## Deployment

1. Provision PostgreSQL and run migrations.
2. Configure S3-compatible storage.
3. Set production env vars (live Mollie keys only in production).
4. Deploy the Next.js app with HTTPS on your real domain.
5. Point DNS, configure email authentication, and register Mollie webhooks.
6. Create a strong admin account; remove test accounts.
7. Enable backups and optional Sentry (`SENTRY_DSN`).
8. Run the launch checklist below.

### Rollback

1. Redeploy the previous known-good release.
2. If a migration is incompatible, restore the database from the latest backup before re-running the old app version.
3. Confirm Mollie webhook URL still points at a healthy endpoint.

### Backups

- Nightly automated PostgreSQL backups with point-in-time recovery where available.
- Periodic restore tests.
- Object storage versioning for logos/exports where supported.

---

## Production launch checklist

- [ ] Real production domain + HTTPS
- [ ] Live company information verified on site and in `src/config/brand.ts`
- [ ] Support inbox tested (`sales@invoicex.store`)
- [ ] Legal pages reviewed by a UK solicitor
- [ ] Mollie live keys + webhook configured
- [ ] Live pricing verified (monthly/annual)
- [ ] Cancellation tested end-to-end
- [ ] Cookie consent behaviour verified
- [ ] Email SPF/DKIM/DMARC pass
- [ ] Database backups enabled and restore-tested
- [ ] Error monitoring configured
- [ ] Admin access secured; bootstrap password rotated
- [ ] Test accounts and test-mode labels removed from production
- [ ] No placeholder or “coming soon” content remains

---

## Security notes

- Workspace isolation on every tenant query
- Zod validation on mutations
- Rate limits on auth, contact, checkout, email, and public quotes
- Security headers via middleware (CSP, HSTS in production, Referrer-Policy, Permissions-Policy)
- Passwords hashed with bcrypt; reset tokens hashed at rest
- Logo uploads restricted to PNG/JPEG/WebP
- Mollie secrets server-only; card data never stored by InvoiceX

---

## Known limitations (honest)

- End-customer invoice **payment collection** is out of scope for v1 (manual payment records only).
- Reminder schedule UI is API-backed; refine workspace UI as needed.
- Resend delivery/bounce webhooks optional for richer email status.
- PDF logo embedding depends on stored logo assets being readable by the PDF generator.
- Full Playwright journey coverage beyond public smoke tests should be expanded before scale launch.

---

## Licence and contact

Proprietary software operated by THE HOUSE OF VEYNOR LTD (company number 17561169).  
Support: sales@invoicex.store
