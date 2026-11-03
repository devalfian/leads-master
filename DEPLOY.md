# Deployment (Cloudflare Workers + D1)

Deployment target: **Cloudflare Workers** (via OpenNext) + **D1**. The application needs no
environment variables and no secrets — everything it needs is the `DB` D1 binding.

> ⚠️ **This deployment has no authentication.** Anyone who can reach the URL can read and edit every
> lead, call record, quotation and Callbook. Complete
> [Security: do this before using real data](#security-do-this-before-using-real-data) before you
> put real data in it.

## What you need

| Item | Notes |
| --- | --- |
| Worker | `leads-master` (rename in `wrangler.jsonc` if you prefer another name) |
| D1 database | `leads_master`, created by `npm run db:create` |
| Binding | `DB` (see `wrangler.jsonc`) |
| Migrations | `0001` … `0008`, applied with `npm run db:migrate:remote` |
| Secrets | none |

`wrangler.jsonc` ships with a placeholder `database_id`. Replace it with the id `npm run db:create`
prints for **your** account — a database id belongs to a single Cloudflare account and cannot be
reused across accounts. Nothing else in that file needs changing to deploy your own instance.

If the database already exists (for example you pulled this repository after deploying once), the id
is recoverable without creating anything:

```bash
npx wrangler d1 list    # find the `uuid` column for your database name
```

## First-time setup

```bash
npx wrangler login                       # OAuth in the browser
npm run db:create                        # wrangler d1 create leads_master -> prints database_id
#   paste the id into wrangler.jsonc -> d1_databases[0].database_id
npm run db:migrate:remote                # apply migrations/*.sql to the remote D1
npm run cf:deploy                        # opennextjs-cloudflare build && ... deploy
```

## Every release

```bash
npm run lint && npm run typecheck && npm test   # gates
npm run db:migrate:remote                       # only if new migrations/*.sql were added (run first)
npm run cf:deploy
```

Deploy output ends with the URL and a `Current Version ID`. Useful follow-ups:

```bash
npx wrangler tail                          # live logs
npx wrangler deployments list               # deployment history
npx wrangler rollback <version-id>          # fast rollback
npx wrangler d1 export leads_master --remote --output backup.sql   # backup
```

## Order matters when a release changes the schema

1. Add `migrations/000N_<name>.sql`.
2. `npm run db:migrate:local` and test.
3. `npm run db:migrate:remote` (additive migrations keep the currently deployed version working).
4. `npm run cf:deploy`.

Never deploy code that reads a column before the migration that adds it has run remotely.

## First run of the pricing/session module

`0002_guide_data_schema.sql` creates the pricing and session tables; `0003_seed_source_guides.sql`
imports the three source guides; `0004_callbook_context.sql` adds the Phase 2 Callbook market/niche
and step-context columns; `0005_leads_and_calls.sql` adds leads, manual call logs, follow-ups and the
`call_sessions.lead_id` link; `0006_quotes.sql` adds the Phase 4 quotation tables (quotes, line items,
status events, the numbering counter and the money/currency triggers); `0007_analytics_automation.sql`
adds the analytics/automation tables; `0008_offline_sync.sql` adds `mutation_receipts`, which makes a
replayed offline write happen once. All are additive: existing Callbooks, call records, leads,
quotations and history keep working. All are applied by the same command:

```bash
npm run db:migrate:remote
```

The seed is idempotent (`INSERT OR IGNORE` over unique constraints), so re-running it is safe and it
never overwrites a price an operator has edited. Seeding never happens at application startup.

Verify the import against the deployed database:

1. Open `/dashboard/settings/guide-data` — the **Seed validation** panel runs on each load and should
   read *all checks pass*.
2. Or check the raw counts:

```bash
npx wrangler d1 execute leads_master --remote --command "SELECT (SELECT COUNT(*) FROM markets) AS markets, (SELECT COUNT(*) FROM market_schedules) AS schedules, (SELECT COUNT(*) FROM packages) AS packages, (SELECT COUNT(*) FROM niche_categories) AS niches, (SELECT COUNT(*) FROM niche_price_rows) AS price_rows"
```

Expected: `3 | 11 | 12 | 28 | 93`. Do not use a multi-term `UNION` query here — this D1 build rejects
compound selects with many terms; scalar sub-selects work.

## Security: do this before using real data

The application is a **single-user workspace with no authentication**. There is no `owner_id`
column and no login. Anyone who knows the URL can read and edit every lead, call record, quotation
and Callbook, and can read the guide data (prices, niches, schedules) behind them.

Deploying this to a public hostname without protecting it is the same as publishing your CRM.

### Option A — Cloudflare Access (no code changes)

Access runs at Cloudflare's edge, before the request reaches the Worker, so it requires no change to
this repository.

1. Cloudflare dashboard → **Zero Trust** → **Settings** → **Authentication** → add a login method.
   **One-time PIN** needs no external identity provider and is the quickest.
2. Then either:
   - **Worker-level** — **Workers & Pages** → your Worker → **Access** tab. This single toggle
     covers the production `workers.dev` URL, preview URLs and version URLs together, which closes
     the preview-URL bypass that is easy to miss.
   - **Self-hosted application** — **Access** → **Applications** → **Add an application** →
     **Self-hosted**, public hostname = your Worker hostname. More precise, but it only covers the
     hostname you name.
3. Add an **Allow** policy limited to your own email address (or your email domain).
4. Set a session duration (e.g. 24 hours) and save.

`*.workers.dev` hostnames **are** supported by Access. A custom domain is still worth attaching
(**Workers & Pages → your Worker → Settings → Domains & Routes → Add custom domain**) if you want a
stable hostname and the option to disable `workers.dev` entirely.

Verify from a machine with no Access cookie — you should get a redirect to the login page, never
JSON:

```bash
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://<your-worker-host>/api/leads
# expect: 302 https://<your-team>.cloudflareaccess.com/cdn-cgi/access/login/...
```

#### Optional: bypass the static shell

`/sw.js`, `/offline.html`, `/manifest.webmanifest` and `/icons/*` carry no data. Adding a **Bypass**
policy for them (Access → your application → **Add a policy** → Action `Bypass` → Include
`Path` in `/sw.js`, `/offline.html`, `/manifest.webmanifest`, `/icons/*`) keeps them reachable when a
session has just expired, which is what the service worker install needs. Leave `/api/*` and every
page behind the login.

#### What happens when an Access session expires mid-use

The behaviour is already correct, but it is worth knowing:

- **A page navigation** redirects to the Access login page. The service worker does not cache that
  page — it only caches same-origin responses — so offline reading is not poisoned with a login
  screen.
- **A queued offline write** fails at the transport layer (the redirect is cross-origin, so the
  browser rejects it), which the outbox treats as a retryable failure: the change **stays queued**
  and the flush stops. Sign in again and press **Retry** in the sync bar; nothing is lost. The
  message says "No connection to the server", which in this case means "your session ended".
- **Pages already cached** stay readable offline until the cache is cleared. That is by design for a
  single-user tool; on a shared device, clear site data when you are done.

### Option B — do not expose it at all

Run it only somewhere private: `npm run cf:preview` on localhost, a VPN, or a reverse proxy that
authenticates. `npm run dev` is local-only and never reachable from the internet.

### If you want authentication inside the application

That is a code change, not configuration: add an `owner_id` column, an auth provider and ownership
checks in the repository layer. All SQL is centralised in `src/lib/*/repository.ts` on purpose, so
the change stays contained. The [Access model](./README.md#access-model-the-one-real-limitation)
section of the README describes the current limits.

## Offline use in production

`public/sw.js`, `public/manifest.webmanifest`, `public/offline.html` and `public/icons/` are served as
static assets by the `ASSETS` binding, so they deploy with the Worker. `public/_headers` sets the
headers Cloudflare must return for them (`Service-Worker-Allowed`, no-cache on `sw.js`).

Things to check after a deploy:

1. Open the site in a private window. **DevTools → Application → Service Workers** should show
   `sw.js` activated with the scope `/`.
2. Reload once so the first navigation is cached, then go offline (**Network → Offline**) and reload:
   the page should still render, and a page you never visited should show `/offline.html`.
3. With the connection still off, log a call. The bar above the content should say the change is saved
   on the device. Go back online: the bar should report the change syncing, and the call should appear
   in Call History once.
4. Check the receipts were recorded:

```bash
npx wrangler d1 execute leads_master --remote --command "SELECT COUNT(*) AS receipts FROM mutation_receipts"
```

`mutation_receipts` grows by one row per offline write. It is safe to prune at any time — a pruned
receipt only means a replay of that specific write would no longer be recognised:

```bash
npx wrangler d1 execute leads_master --remote --command "DELETE FROM mutation_receipts WHERE created_at < date('now','-30 days')"
```

**Releasing a service worker update:** bump `CACHE_VERSION` in `public/sw.js` when a change to the
caching behaviour must reach installed devices. The worker calls `skipWaiting()` on install and the
page reloads once on `controllerchange` (guarded against a reload loop), so a stale worker cannot pin
an old shell. Assets under `/_next/static/` are content-hashed, so an update never serves a stale chunk.

## Known platform notes

- Build must run in a shell that can symlink; OpenNext warns it is "not fully compatible with
  Windows". The build and deploy both succeed from Windows (verified), but CI (GitHub Actions on
  Linux) is the more reproducible option.
- Worker bundle is ~5.7 MB uploaded / ~1.16 MB gzip; startup time ~11 ms.
- Call Mode deliberately does not load `@xyflow/react`; only the builder does.
- D1 jurisdiction depends on where you create the database. Pick the region closest to your users
  when you run `npm run db:create`; moving it later means creating a new database, re-pointing
  `database_id` and re-running the migrations.