# Mollie Remote Payment — Vercel / Next.js

This InvoiceRush app hosts the **server** side of Mollie Remote Payment on Vercel.
The WordPress PHP folder (`mollieremotepayment-server/`) is reference-only and does **not** run on Vercel.

## Client plugin settings

Point the WooCommerce **client** plugin at this site’s public URL (no path):

```
https://YOUR-VERCEL-DOMAIN
```

Use the same Shared Secret as `MOLLIE_REMOTE_SHARED_SECRET`.

Compatible endpoints (same as the WP plugin):

| Endpoint | Purpose |
|----------|---------|
| `POST /?wrp_mollie_health=1` | Health check |
| `POST /?ro=1` | Create remote payment |
| `GET /?rop=…&rt=…` | Hosted checkout redirect |
| `GET /?ros=…&rt=…` | Return from Mollie |
| `GET /?rof=…&rt=…` | Cancel |
| `POST /?mrp=1` | Mollie webhook |

## Vercel env vars

```
MOLLIE_REMOTE_API_KEY=live_...
MOLLIE_REMOTE_SHARED_SECRET=...
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-DOMAIN
```

Optional: `MOLLIE_REMOTE_CURRENCY` (empty = accept any order currency).

These are **separate** from `MOLLIE_API_KEY` (InvoiceRush SaaS subscriptions).

## Database

Apply migration `drizzle/0001_remote_payments.sql` (or `npm run db:migrate` / `db:push`) on the production database after deploy.
