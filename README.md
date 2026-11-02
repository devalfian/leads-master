# Call Playbooks

A single-user sales workspace for a freelance web developer selling website work to service
businesses. It holds the lead list, branching cold-calling playbooks, quotations, call history,
sales analytics and a reminder queue, on top of the three cold-calling guides (Indonesia,
Australia, United States) that supply the markets, niches, schedules and prices behind them.

Everything runs on Next.js 15 + Cloudflare Workers + D1. There is **no authentication** and no
per-user isolation: read [Access model](#access-model-important-limitation) before you put an
instance on a public hostname.

| Area | Where | Section |
| --- | --- | --- |
| Leads, call logging, follow-ups | `/leads` | [Leads, call logging and follow-ups](#leads-call-logging-and-follow-ups-phase-3) |
| Call Playbooks: build, publish, run live | `/callbooks`, `/calls` | [What works](#what-works) |
| Quotations | `/quotes` | [Quote Builder](#quote-builder-phase-4) |
| Sales analytics | `/analytics` | [Analytics and automation](#analytics-and-automation-phase-5) |
| Reminder rules | `/automation` | [Analytics and automation](#analytics-and-automation-phase-5) |
| Pricing library, session planner, guide data | `/dashboard/*` | [Pricing Library + Session Planner](#pricing-library--session-planner-phase-1) |
| Offline use (installable app) | — | [Offline use and syncing](#offline-use-and-syncing-phase-5) |
| Running your own copy | — | [Run it yourself](#run-it-yourself) |
| Deploying to Cloudflare | — | [DEPLOY.md](./DEPLOY.md) |

Every page is listed in [Pages and endpoints](#pages-and-endpoints); the tables are in
[Data model at a glance](#data-model-at-a-glance) and the code layout in
[How the feature is put together](#how-the-feature-is-put-together).

## What works

- **Leads** — create, edit, archive, search and filter (market, niche, status, follow-up state,
  website recorded or not, contacted or not, six sort orders, SQL pagination). A lead page shows its
  calls, quotations, follow-ups and activity; duplicate warnings are advisory and never merge
  records; permanent deletion is refused while call history exists.
- **Call Playbooks** — the library, builder, preview and Call Mode described in the bullets below.
- **Quotations** — priced from the Pricing Library, snapshotted at save time, with a
  `draft → sent → accepted | rejected` (plus `cancelled`) lifecycle and a print view.
- **Sales analytics** — calls, conversations, interested leads, follow-ups, quotations and a cohort
  funnel over a WIB reporting period, filtered by market and niche.
- **Automation** — five deterministic rules (overdue follow-ups, expiring quotations, stale leads,
  interest with no next action, quotations awaiting a decision), evaluated on demand, with an in-app
  reminder queue and a run log.
- **Callbook library** — search, status filter, sorting, **market and niche filters**, duplicate,
  archive/restore.
- **Create Callbook** — from scratch (one start step) or from ten editable starter templates:
  proposal follow-up, med spa / cosmetic dentistry (US), F&B, motor & car rental and tour & travel
  in “no website” and “outdated website” variants set in the fictional Northbay market, and an
  Australia plumber pair set in the real Australia market. The market, niche and language fields are
  populated from the Phase 1 guide data.
- **Builder** — directed graph of message and outcome steps, per-response branches with example
  phrases, start-step selection, node inspector (script, coaching note, **step type, purpose, talking
  points**), ordered step list with keyboard reorder controls, live validation, atomic save, publish.
- **Preview** — walk the draft graph as a conversation without writing anything.
- **Call Mode** — follows the *published snapshot*, one step at a time, with copyable script,
  delivery tips, response buttons, back, unexpected-response handling and quick notes. It also shows a
  collapsible **call context panel** with the market, niche and package references from the pricing
  database.
- **Call result** — outcome, notes, next action, follow-up date. A call started from a lead turns that
  follow-up date into a real follow-up task on the lead (`follow_ups.call_session_id`), so the lead
  page, the dashboard, Analytics and Automation all see the same commitment.
- **Call History** — every session with its outcome, follow-up and the route taken. Callbook runs and
  calls logged against a lead are shown in one list, with search, market/type/outcome/date filters and
  pagination. Each logged call can be followed up with another log from the same row.
- **Offline** — the app is installable and the pages you have opened stay readable without a
  connection. Logging a call, following a call step, saving a call result and updating a follow-up all
  work offline; the change is stored on the device and synced when the connection returns. See
  “Offline use and syncing” below.

Everything is persisted in Cloudflare D1. There are no mock endpoints and no fake success states.

## Pages and endpoints

Every page below is implemented; there are no placeholder screens.

| Page | Purpose |
| --- | --- |
| `/` | redirects to `/dashboard` |
| `/dashboard` | overview: market cards with reference targets and recommended packages, lead pipeline counts, follow-ups due/overdue, estimated pipeline per currency, latest sessions |
| `/dashboard/pricing`, `/dashboard/pricing/[marketCode]` | Pricing Library: package cards and comparison, niche-price grid, niche catalog, calling schedule, call preparation reference |
| `/dashboard/sessions`, `/new`, `/[id]`, `/[id]/edit` | Session Planner: create, reopen, edit, duplicate, delete, print |
| `/dashboard/settings/guide-data` | Guide Data editor plus the seed-validation report |
| `/leads`, `/leads/new`, `/leads/[id]`, `/leads/[id]/edit` | lead list, create form, lead detail (calls, quotes, follow-ups, activity), edit form |
| `/callbooks`, `/callbooks/new` | Callbook library, create (scratch or template) |
| `/callbooks/[id]` | builder: graph canvas, node inspector, validation, publish |
| `/callbooks/[id]/preview` | walk the draft without writing anything |
| `/calls` | Call History: Callbook runs and logged calls in one searchable, filterable list |
| `/calls/[id]` | live Call Mode for one session |
| `/calls/[id]/summary` | call result form (outcome, notes, next action, follow-up) |
| `/quotes`, `/quotes/new`, `/quotes/[id]`, `/quotes/[id]/edit` | quotation list, create, document/print view, edit |
| `/analytics` | sales analytics for a WIB reporting period, filtered by market and niche |
| `/automation` | automation rules, open reminders, evaluation run log |
| `/offline.html` | static fallback for a navigation that was never cached |

JSON route handlers live under `/api`:

- leads and follow-ups — `/api/leads`, `/api/leads/[id]`, `/api/leads/[id]/calls`,
  `/api/leads/[id]/follow-ups`, `/api/leads/duplicates`, `/api/follow-ups/[id]`
- callbooks — `/api/callbooks`, `/api/callbooks/[id]`, `/…/graph`, `/…/publish`, `/…/duplicate`,
  `/…/archive`, `/…/sessions`
- call sessions — `/api/sessions`, `/api/sessions/[id]`, `/…/advance`, `/…/back`, `/…/notes`,
  `/…/unexpected`, `/…/finish`, `/…/duplicate`
- quotations — `/api/quotes`, `/api/quotes/[id]`, `/…/status`, `/…/duplicate`, `/…/refresh-prices`
- guide data — `/api/markets/[id]`, `/api/schedules/[id]`, `/api/niches/categories/[id]`,
  `/api/niches/categories/[id]/services`, `/api/niches/services/[id]`,
  `/api/pricing/packages/[id]`, `/api/pricing/packages/[id]/features`,
  `/api/pricing/features/[id]`, `/api/pricing/niche-rows/[id]`, `/api/guide-data/[resource]`,
  `/api/guide-data/[resource]/[id]`
- automation — `/api/automation/run`, `/api/automation/rules/[key]`

## Analytics and automation (Phase 5)

`/analytics` and `/automation`. Neither adds a data source: both read the leads, calls, follow-ups
and quotations the rest of the application already stores.

**Analytics**

- **One reporting period, defined once** — `src/lib/analytics/period.ts` is the only place a period
  is computed. Presets are Today, Last 7 days, Last 30 days, This month, Previous month and a custom
  range; every boundary is a WIB (UTC+07:00) calendar day converted to a UTC instant. Periods are
  half-open (`start ≤ t < end`), so two adjacent periods can never both contain the same call.
- **A comparison window comes with it** — the immediately preceding period of the same length, so a
  figure can be shown with a change instead of on its own.
- **Figures come from records, never from constants** — calls made, unique leads contacted,
  conversations, interested leads, follow-ups due and overdue, active leads by stage, quotations
  created / sent / accepted / rejected, acceptance rate, outstanding and accepted value **grouped per
  currency**, a cohort funnel over leads created in the period, a daily trend, an outcome histogram
  and market/niche breakdowns.
- **Empty denominators are `N/A`, not `0%`** — a rate with nothing to divide by is reported as
  unavailable, and the page explains each such gap in its own "data notes" list instead of rendering
  a misleading zero.
- **What counts as a call** — a manually logged call is always an attempt; a Callbook run counts only
  when it is `completed` (an `in_progress` run is unfinished and an `abandoned` one was discarded).
  Event time is the call itself, not row creation, so back-dated logging lands in the right period.
- **Nothing is converted or summed across currencies** and there is no revenue metric, because no
  payment is ever recorded.
- **A safety cap exists and says so** — a period returns at most 20 000 call events
  (`EVENT_ROW_CAP`); if it is hit, the page states the figures are partial and asks you to narrow the
  range rather than silently reporting a wrong total.

**Automation**

- **Five rules, each a deterministic query** — overdue follow-ups, quotation expiring soon, stale
  leads, interested lead with no next action, quotation awaiting a decision. Each rule's exact
  condition is shown in the UI in words, so you can predict what will fire.
- **On demand, and the UI says so** — this deployment configures no cron trigger, so rules run when
  you press run on `/automation` (or call `POST /api/automation/run`). Nothing claims to run in the
  background, and there is no email, SMS, WhatsApp or push integration: a "reminder" is an entry in
  the in-app queue.
- **Idempotent by construction** — reminders are upserted by a dedupe key, so running twice opens
  nothing new and a reminder re-opens the same row instead of duplicating it. A reminder whose
  condition no longer holds is resolved automatically, and every run is written to a run log with the
  counts it produced.
- **Rules never write to your data** — an evaluation only touches its own three tables
  (`automation_rules`, `automation_alerts`, `automation_runs`). No lead, call, follow-up or quotation
  is modified, so switching a rule on can never change what the rest of the app reports.
- **Settings are clamped** — each window (days without contact, days before expiry, days pending) has
  a declared min/max, and a stored value is normalised into that range on read, so an edited database
  row cannot produce a nonsensical window.
- **One follow-up rule everywhere** — the same `src/lib/leads/follow-up-time.ts` decision decides
  "due today" and "overdue" for the dashboard counters, the lead badge, Analytics and these rules, so
  a follow-up due today is never overdue in one place and pending in another.

## Offline use and syncing (Phase 5)

Field calling happens where the signal is bad, so the workspace is installable and keeps working
without a connection.

- **The app shell and visited pages are cached** — `public/sw.js` is a hand-written service worker
  with three strategies: network-first for documents and for Next.js server-component payloads (so a
  page is always as fresh as the connection allows and only falls back to the cache when it has to),
  and cache-first for content-hashed build output. A navigation that was never cached lands on
  `/offline.html`, which says so plainly instead of showing an empty screen.
- **The service worker never touches `/api/`** — replaying a request from a worker would duplicate
  calls. Writes are queued by the application instead, which knows which requests can be replayed.
- **Changes are queued, not lost** — `src/lib/offline/` keeps an IndexedDB outbox. A write made with no
  connection (or one whose request fails at the transport layer) is stored with the time it was made,
  and replayed oldest-first. A failure the server can fix later (5xx, 408, 429) keeps the record
  queued and stops the flush; a refusal (4xx) is surfaced in the sync panel with **Retry** and
  **Discard**, because repeating it would never work.
- **Only these writes can be queued** — create/edit a lead, log a call, session `advance` / `back` /
  `notes` / `unexpected` / `finish`, and a follow-up status change. Everything else (publishing a
  Callbook, saving a graph, creating a quotation, editing guide data) stays an online request: those
  depend on server-side validation the browser cannot reproduce, so a replay would not be equivalent.
  The allowlist is `QUEUEABLE_WRITES` in `src/lib/offline/policy.ts`.
- **A replay cannot duplicate a write** — every queued record carries an `Idempotency-Key`, and
  `src/lib/api/idempotency.ts` runs the handler at most once per key (`migration 0008`). The guarantee
  is made with a reservation, not a post-hoc lookup, so two simultaneous replays cannot both run the
  write. A refused write releases its key, so a corrected retry still works. A request without the
  header behaves exactly as before.
- **Call Mode keeps going offline** — following a prepared response and stepping back move the view
  locally (`src/lib/callbooks/optimistic.ts`) and queue the same request. The server still owns the
  step log: the queued steps replay in order, and anything that cannot be shown locally is refused
  rather than faked.
- **The queue is visible** — a status bar appears above the content only when there is something to
  say (offline, changes waiting, or a change the server refused), with a **Sync now** action. The
  sidebar shows the same state in compact form. Syncing happens automatically on `online`, on tab
  focus and when the tab becomes visible, and a completed sync refreshes the server-rendered pages.
- **Installable** — `public/manifest.webmanifest` plus generated PNG icons
  (`node scripts/generate-icons.mjs`). The app opens standalone and its icon shortcuts point at Leads,
  Call playbooks and Call history.

Not offline: Analytics, Automation, the Callbook builder and the quotation form are readable only from
the cache of the last visit. Their writes need the server (and analytics/automation need a live query),
and the UI does not pretend otherwise.

## Quote Builder (Phase 4)

`/quotes`, `/quotes/new`, `/quotes/[id]`, `/quotes/[id]/edit`.

- **Prices come from the Pricing Library** — a quotation may only use a package from the lead's own
  market; the option list is built server-side as `lead -> that market's packages`. A package from
  another market is rejected (`invalid_reference`), and there is no second price catalog.
- **Money is integer minor units** — `quote_line_items.unit_price_minor` / `line_total_minor` and the
  quote totals are whole minor units (IDR exponent 0, AUD/USD exponent 2). Percent discounts are stored
  as basis points. No float ever reaches the database, and a database trigger rejects a line total that
  is not `quantity × unit price`.
- **The server recalculates everything** — the browser never submits a total. `POST /api/quotes` and
  `PATCH /api/quotes/[id]` re-read the prices and run the same `calculateQuoteTotals()` used by the form
  preview, the document preview and the print view.
- **History is frozen per quote** — the client details, package name/price/timeline/features, terms and
  every line item are snapshotted at save time. Changing a package price later does not alter a saved
  quotation. A **draft** shows the drift (`saved → current`) and only re-prices after an explicit
  confirmation (`POST /api/quotes/[id]/refresh-prices`); a **sent** quote is never re-priced.
- **One currency per quotation** — line items carry the quote currency and a trigger rejects a mismatch.
  Prices are never converted between IDR, AUD and USD.
- **Lifecycle** — `draft → sent → accepted | rejected`, plus `cancelled`; transitions are validated
  server-side and recorded in `quote_status_events`. Only drafts can be edited or deleted. **Expired** is
  derived for display from `valid_until` and is never stored, so an accepted quote is never shown as
  expired.
- **Quote numbers** — `DLC-<year>-####`, allocated with a single atomic UPSERT on
  `quote_number_counters`, so concurrent creates cannot collide and the sequence is never derived from
  `COUNT(*)`.
- **No invented terms** — discounts are only what the operator enters; there is no discount, tax,
  deposit, warranty or refund policy in this application, so none is applied or printed. The document
  says plainly that no tax is calculated.
- **Print / PDF** — the quotation is rendered as a document and printed through the browser's own print
  pipeline with the existing print stylesheet. There is no fake "download PDF" action and no public
  share link.
- **Integration** — a lead shows its quotations and a **New quote** action; a Call History row can start
  a quote with `?lead=…&call=` (or `&session=` for Callbook runs), which is validated against the lead
  before it is stored. Quote events appear on the lead activity timeline.
- **Not revenue** — an accepted quotation records an acceptance, not a payment. No payment record exists,
  so the Quotes page labels its totals as quoted value and groups them per currency.

## Leads, call logging and follow-ups (Phase 3)

`/leads`, `/leads/new`, `/leads/[id]`, `/leads/[id]/edit`, and the upgraded `/calls`.

- **Leads** — business name + market are required; contact details, website, city, source, notes and an
  optional estimated value are optional. Search, market/niche/status filters, follow-up state,
  "website recorded / not recorded", "never contacted / contacted", six sort orders and SQL pagination
  all run in the database, not in the browser.
- **Duplicate warnings** — phone (last nine digits), email, website domain and business-name-plus-city
  are compared on indexed normalised columns. The result is a warning with links; nothing is merged.
- **Call logging** — `POST /api/leads/[id]/calls` writes the call, an optional follow-up and an optional
  explicit status change in **one D1 batch**. Logging a call never changes the lead status unless the
  user picks one.
- **Follow-ups** — `follow_ups` rows with a due date, type and status (`scheduled`/`completed`/
  `cancelled`). Overdue follow-ups are never auto-completed, and a do-not-contact lead cannot be given a
  new follow-up until the flag is cleared.
- **One follow-up rule everywhere** — `src/lib/leads/follow-up-time.ts` decides what "due today" and
  "overdue" mean, because `due_at` is stored either as a calendar day (lead forms) or as a full UTC
  instant (a Callbook call asks for a date *and* a time). The lead badge, `getLeadStats()`, Analytics
  and the automation rules all compare **days in the reporting zone (WIB)**, so a follow-up due today is
  never "due today" in one place and "overdue" in another. A follow-up due today still counts as a next
  action: it is not "overdue" and it suppresses the stale-lead and "interested with no next action"
  reminders.
- **Deletion** — permanent deletion is refused while the lead has call history (`409 has_calls`);
  archiving is the safe path and keeps every call.
- **Callbook integration** — a Callbook run can be started for a lead (`/callbooks/[id]?lead=…`). The
  business name is snapshotted into `call_sessions.prospect_name` and the run appears on the lead's
  activity. A Callbook from another market is rejected. Finishing that call with a follow-up date writes
  a `follow_ups` row in the same atomic batch (type `meeting` for a booked meeting, `call_back` otherwise,
  notes taken from the next action), linked through `call_session_id`. A do-not-contact or archived lead
  still gets its call result saved, but no outreach task is created.
- **Dashboard** — lead counts, calls logged, never-contacted leads, follow-ups due/overdue and estimated
  pipeline **per currency**. Currencies are never summed together and no conversion happens. "Calls
  logged" counts every recorded attempt, including a Callbook run that was started but never finished;
  Analytics counts only finished calls inside the reporting period, and says so.

Two call shapes are stored because they are genuinely different records: `call_sessions` (a run through
a published Callbook, unchanged) and `lead_calls` (a call logged manually, with no invented snapshot).
`listCallHistory()` unions both in one SQL query, so there is a single Call History view and no second
history system.

## Callbook context: market, niche, pricing and sessions (Phase 2)

The Call Playbooks module is wired to the Phase 1 guide data instead of carrying a second copy of it.

- **Callbook context** — a Callbook may point at a market (`callbooks.market_id`) and a niche
  (`callbooks.niche_category_id`) from the guide tables, plus a language and internal notes. The pair
  is validated server-side (`resolveGuideContext`), so a Callbook can never carry a niche from another
  market, and changing the market clears a stale niche.
- **Steps carry intent** — each step can hold a `step_type` (opening, qualification, discovery, value
  proposition, demo pitch, pricing, objection handling, closing, follow-up, end), a `purpose` and
  `talking_points_json`. The type is organisational only: it never forces an order and never blocks
  publishing. The steps panel lists the authored order with keyboard up/down controls.
- **Live Call Mode context panel** — read-only prices resolved on the server from the guide data:
  `src/lib/callbooks/context.ts` reuses `getMarketGuideById` and the Phase 1 pricing rules, so package
  prices, the recommended package and the supplied niche price rows (including the US Law Firm and
  Accounting / Consulting rows at US$750 / US$1,500 / US$3,000) come from the database, never from
  component constants.
- **Session Planner integration** — a saved session lists the Callbooks for its market (niche matches
  first). Opening one carries `?context=<sessionId>`; starting the call appends the same value to the
  live call. When the session's market **and** niche match the Callbook, Live Call Mode shows the
  session's **frozen** snapshot prices; otherwise it ignores the session and shows current guide data,
  with a note explaining why. Historical snapshots are never overwritten.
- **Backward compatibility** — every new column is nullable or defaulted, and the snapshot schema
  applies defaults, so Callbooks, nodes, published snapshots and call history created before Phase 2
  keep loading unchanged (they simply report an unset market, unclassified step and no talking points).

## Pricing Library + Session Planner (Phase 1)

The three cold-calling guides (Indonesia, Australia, United States) are stored as D1 master data and
drive two connected modules:

- **Pricing Library** (`/dashboard/pricing`, `/dashboard/pricing/[marketCode]`) — market summary,
  package cards and comparison, a searchable niche-price grid, the niche catalog (category cards plus
  their source child labels), the calling schedule and the call-preparation reference. Package prices,
  niche price cells, category names, child labels, schedule times/labels/notes, objectives,
  objections and tools are all editable.
- **Session Planner** (`/dashboard/sessions`, `/new`, `/[id]`, `/[id]/edit`) — pick a market, one of its
  supplied WIB schedule blocks, a niche (or “Not specified”), a date and a primary objective, review
  the exact recommendation, then save. The saved preparation page shows targeting, pricing, the
  discovery checklist, objections, tools and a print view; sessions can be reopened, edited,
  duplicated and deleted.
- **Guide Data** (`/dashboard/settings/guide-data`) — the data-management screen, including the live
  seed-validation report.

Key rules enforced in code and in the database:

- Prices are integers in the market's native currency (`Rp`, `A$`, `US$`); display strings are
  formatted from them. Nothing is converted between currencies.
- A niche price row wins over the package base price **only** when the source guide supplies a row for
  that market, niche and package. Otherwise the standard price is shown and labelled as a reference —
  no niche price is ever interpolated. Editing a base price never rewrites the niche grid (and vice
  versa); the US Law Firm / Accounting rows at `US$750 / US$1,500 / US$3,000` stay independent.
- Every saved session stores a snapshot of the market, schedule, niche, package prices, objectives,
  checklist, objections and tools. Later master-data edits never change a saved session; editing a
  session refreshes its snapshot explicitly.
- Schedule times are the supplied WIB values and are never recalculated from a timezone offset. The
  USA daylight-saving note is stored verbatim and shown as a non-blocking “verify the schedule”
  warning until an administrator reviews it.

### Guide data: migrate, seed, validate

Every migration is applied by the same two commands (see [Run it yourself](#run-it-yourself)):

```bash
npm run db:migrate:local     # local D1 used by `npm run dev`
npm run db:migrate:remote    # the deployed D1, before deploying new code
```

`migrations/0003_seed_source_guides.sql` is the seed. It is idempotent (`INSERT OR IGNORE` over unique
constraints), so replaying it never duplicates rows and never overwrites an edited price — seeding
never runs at application startup. Seeded totals: 3 markets, 11 schedule blocks, 12 packages, 98
package inclusions, 28 niche categories, 122 child labels, 31 niche-price rows (stored as 93 price
records, one per niche × package), 12 call objectives, 3 Indonesian session goals, 18 checklist items,
9 objections and 18 tools.

To reset local development data, delete the local database and re-apply the migrations — the exact
command is in [Run it yourself](#run-it-yourself).

The seed-validation report (counts, market codes, recommended prices, US specialty rows, schedule
times, market-consistency checks) is rendered on `/dashboard/settings/guide-data` and asserted by
`src/lib/guides/seed.test.ts` against a real database built from the migrations.

## Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15.5 (App Router, React 19) |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS v4 + shadcn-style primitives (Radix Dialog/Slot, cva, tailwind-merge) |
| Icons | `lucide-react` |
| Graph editor | `@xyflow/react` v12 (builder only — not loaded in Call Mode) |
| Validation | `zod` on every write path |
| Database | Cloudflare D1 (SQLite) with SQL migrations; `node:sqlite` as a development/test fallback |
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` (Wrangler 4) |
| Tests | Vitest, Node environment, `src/**/*.test.ts` |

No runtime dependency is optional: the app needs one database binding and nothing else.

## Run it yourself

The whole workspace runs on one machine with no Cloudflare account. A Cloudflare account is only
needed for the last step (putting it on the internet). There are **no environment variables and no
secrets** to configure, and there is no sign-up: `/` redirects straight to `/dashboard`.

### What you need

| Requirement | Notes |
| --- | --- |
| Node.js **22.5 or newer** | Verified on v22.22.0. `node:sqlite` (used by the dev/test database driver) does not exist before 22.5 — on an older Node the fallback fails with an explicit message instead of pretending. |
| npm 10 | Verified on 10.9.7. pnpm/yarn are not used by the scripts. |
| ~1 GB free disk | `node_modules` is ~700 MB in a clean install, plus the local SQLite database and build output. |
| Cloudflare account | **Only** to deploy. `wrangler` is already a devDependency; `npx wrangler login` is needed for remote commands only. |
| Windows, macOS or Linux | Works everywhere Node runs. The OpenNext build warns it is "not fully compatible with Windows" but deploys successfully from Windows; Linux CI is the more reproducible build host. |

### 1. Install

```bash
git clone <your-fork-or-clone-url> leads-master
cd leads-master
npm install
```

### 2. Create the local database — before the first page load

```bash
npm run db:migrate:local
```

This creates `.wrangler/state/v3/d1` (a real SQLite file) and applies `migrations/0001` … `0008` in
order, including the guide seed. **The order matters:** if you start the dev server first and open
`/dashboard`, the D1 binding resolves but the tables do not exist yet, so the page logs
`D1_ERROR: no such table: markets` and renders empty panels. Migrating fixes it — no reinstall needed.

Check the seed landed:

```bash
npx wrangler d1 execute leads_master --local --command "SELECT (SELECT COUNT(*) FROM markets) AS markets, (SELECT COUNT(*) FROM packages) AS packages, (SELECT COUNT(*) FROM niche_categories) AS niches"
# expected: 3 | 12 | 28
```

### 3. Start it

```bash
npm run dev            # http://localhost:3000  ->  /dashboard
```

`next dev` resolves the `DB` D1 binding through OpenNext's Wrangler proxy (the dev log prints
`driver: "d1"`), so development uses the same D1 engine, schema and SQL as production. `/dashboard`,
`/leads`, `/leads/new`, `/callbooks`, `/callbooks/new`, `/calls`, `/quotes`, `/quotes/new`,
`/dashboard/pricing`, `/dashboard/sessions`, `/dashboard/sessions/new`,
`/dashboard/settings/guide-data`, `/analytics` and `/automation` were each verified to return `200`
against a freshly migrated local database. Detail pages (`/leads/[id]`, `/callbooks/[id]`,
`/calls/[id]`, `/quotes/[id]`) need a record to open, which the seed deliberately does not create.

### 4. First run, in the order the app expects

1. **`/dashboard/settings/guide-data`** — the seed-validation panel should read *all checks pass*.
   Prices, niches, schedules, objectives, objections and tools are editable from here and from the
   Pricing Library; nothing is hard-coded in components.
2. **`/leads/new`** — business name + market are the only required fields.
3. **`/callbooks/new`** — start from one of the ten templates or from scratch, then **Publish**. A
   draft can be previewed, but only a published snapshot can be called.
4. **Start the call** — from the Callbook (`?lead=…` to attach it to a lead) or from the lead page.
   Call Mode follows the published snapshot; the result form records outcome, notes, next action and a
   follow-up date, which becomes a real follow-up task on the lead.
5. **`/quotes/new`** — a quotation only offers packages from the lead's own market; preview it, print
   it, then move it `draft → sent → accepted/rejected`.
6. **`/analytics` and `/automation`** — pick a period, then run an evaluation; reminders appear in the
   in-app queue.
7. **Install it** (optional) — open the site in Chrome/Edge and use the install icon. Offline
   behaviour is only representative in a production build (`npm run cf:preview` or a real deploy);
   `next dev` is not a faithful service-worker environment.

**What a fresh install contains:** the guide data (3 markets, 11 schedule blocks, 12 packages, 28
niches and their price rows) and nothing else. There are **no sample leads, calls, quotations or
Callbooks**, so the dashboard and analytics start empty by design — you create your first Callbook from
a template (step 3) and your first lead at step 2. The starter templates are example material: the
Northbay businesses are fictional, and every placeholder, price claim and factual statement in them
must be verified before you use them on a real call.

**What it does not do:** there is no CSV import or export of leads, no sample-data reset command for a
deployed database, no multi-user accounts and no background scheduler. Backup and restore go through
D1 (`npx wrangler d1 export`), see [DEPLOY.md](./DEPLOY.md).

### The two database modes (and why you never edit data by hand)

| How you run it | Driver | Where the data lives | How the schema gets there |
| --- | --- | --- | --- |
| `npm run dev` | D1 binding, proxied by OpenNext/Wrangler | `.wrangler/state/v3/d1` | `npm run db:migrate:local` (you run it) |
| `npm test`, CI, or a `next dev` with no binding | `node:sqlite` file driver | `.data/leads-master.sqlite`, or `LOCAL_DATABASE_PATH` | applied automatically from `migrations/*.sql` on first open, tracked in `_local_migrations` |
| `npm run cf:preview` | real workerd + local D1 | the same `.wrangler` state as `dev` | `npm run db:migrate:local` |
| Deployed Worker | real D1 | your Cloudflare database | `npm run db:migrate:remote` |

The local fallback is **development only**: in a production build a missing binding raises
`DatabaseNotConfiguredError` instead of silently writing to a file that does not exist in the Workers
runtime. Tests use the fallback deliberately — each database test builds a throwaway database from the
real migrations in a temp directory, which is why the suite needs Node 22.5+.

To reset everything locally:

```bash
# PowerShell
Remove-Item -Recurse -Force .wrangler\state\v3\d1, .data
npm run db:migrate:local
```

### 5. Quality gates before you change anything

```bash
npm run lint        # ESLint, next/core-web-vitals + next/typescript
npm run typecheck   # tsc --noEmit
npm test            # Vitest: 257 tests in 20 files, including real-database integration tests
```

Run all three before a deploy; that is exactly what [DEPLOY.md](./DEPLOY.md) lists as the release
gate.

### 6. Make it yours

- **Prices, niches, schedules, objectives, objections, tools** — edit them in `/dashboard/pricing`
  and `/dashboard/settings/guide-data`. Saved sessions and sent quotations keep their snapshot, so
  history never changes under you.
- **Starter templates** — `src/lib/callbooks/templates/` holds one typed file per template plus the
  registry in `index.ts`; adding a template is a new file and one registry entry. The market and niche
  fields are looked up by code/name from the guide data, so a template cannot invent a market.
- **Reporting timezone** — `REPORTING_TIMEZONE` in `src/lib/analytics/period.ts` is `Asia/Jakarta`
  (WIB) and is used by the dashboard, analytics, automation and the follow-up badges. It is a
  constant, not a per-user setting, so "today" means the same thing on every screen.
- **Currencies** — `IDR`, `AUD` and `USD` come from the guide data with their exponent in
  `src/lib/quotes/money.ts`. Nothing converts between them; supporting another currency is a data
  change plus an exponent, never a rate.
- **Branding** — the app title and navigation live in `src/components/layout/sidebar.tsx`, the install
  metadata in `public/manifest.webmanifest` (icons are generated by
  `node scripts/generate-icons.mjs`).
- **Access control** — there is none. Read [Access model](#access-model-important-limitation) and put
  Cloudflare Access, a VPN or real auth in front of it before it holds real data.

### 7. Put it online

Follow **[DEPLOY.md](./DEPLOY.md)**: it covers the first deploy, every release, migration ordering,
rollback, backups, the Cloudflare Access setup, the offline/service-worker checks after a deploy and
the known platform notes. The short version:

```bash
npx wrangler login
npm run db:create            # prints the D1 database id
# paste that id into wrangler.jsonc -> d1_databases[0].database_id
npm run db:migrate:remote    # schema + seed for the deployed database
npm run cf:deploy            # OpenNext build + deploy to Workers
```

`wrangler.jsonc` already binds D1 as `DB`, enables `nodejs_compat` and serves the OpenNext assets. The
shipped `database_id` is a placeholder: a D1 id belongs to one Cloudflare account, so every deployment
must create its own database. `npm run cf:preview` builds and runs the same Worker locally in workerd
if you want to check production behaviour on your own machine first.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `D1_ERROR: no such table: markets` (or `leads`) on `/dashboard` | The dev server started before the schema existed. Run `npm run db:migrate:local`, then reload. |
| `Local SQLite support (node:sqlite) is unavailable` | Node is older than 22.5. Upgrade Node, or run with a D1 binding (`npm run dev` / `cf:preview`). |
| Port 3000 already in use | `npm run dev -- -p 3001`, or stop the other process. |
| `The Cloudflare D1 binding 'DB' is not available` in a production build | You are serving a production build outside Workers. Use `npm run cf:preview` / `cf:deploy`, or configure the binding. |
| Guide data pages are empty on a fresh clone | The seed has not run: `npm run db:migrate:local`. |
| A rule still shows nothing after you press run | The conditions genuinely match nothing (for example no overdue follow-ups). The run log records the counts it evaluated. |
| An offline change is stuck in the sync bar | A 4xx means the server refused it: fix the input and **Retry**, or **Discard**. A 5xx keeps it queued and retries later. |
| An installed app shows an old shell | `CACHE_VERSION` in `public/sw.js` was not bumped for a caching change; bump it and redeploy. |

## Cloudflare deployment

Deployment lives in **[DEPLOY.md](./DEPLOY.md)** — first deploy, the release checklist, migration
ordering, rollback, backups, Cloudflare Access and the post-deploy offline checks. The commands
themselves are in [Run it yourself → Put it online](#7-put-it-online); in short: create a D1 database,
paste its id into `wrangler.jsonc`, apply the remote migrations, then `npm run cf:deploy`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (D1 through the Wrangler proxy) |
| `npm run build` / `npm start` | Standard Next.js build / serve (needs a D1 binding at runtime) |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals` + `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest run, once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:create` | `wrangler d1 create leads_master` — prints the `database_id` to paste into `wrangler.jsonc` |
| `npm run db:migrate:local` / `:remote` | Apply `migrations/*.sql` to the local or deployed D1 |
| `npm run cf:build` | OpenNext build → `.open-next/` |
| `npm run cf:preview` | Build + run the Worker locally in workerd |
| `npm run cf:deploy` | Build + deploy to Cloudflare Workers |
| `npm run cf:typegen` | Regenerate `cloudflare-env.d.ts` binding types from `wrangler.jsonc` |
| `node scripts/generate-icons.mjs` | Regenerate the PWA PNG icons in `public/icons/` |

## Data model at a glance

Everything lives in D1; there is no cache database, no queue service and no external store.

| Group | Tables | Migration |
| --- | --- | --- |
| Guides (markets, prices, niches, schedules, objectives, objections, tools) | `markets`, `packages`, `package_features`, `market_schedules`, `niche_categories`, `niche_services`, `niche_price_rows`, `market_call_goals`, `market_call_checklist_items`, `market_objections`, `market_recommended_tools` | `0002`, seeded by `0003` |
| Session Planner | `sessions` (each row carries its own frozen snapshot) | `0002` |
| Call Playbooks | `callbooks`, `call_nodes`, `call_branches`; runs in `call_sessions`, `call_session_steps`, `call_session_notes` | `0001`, `0004` |
| Leads and calling | `leads`, `lead_calls`, `follow_ups` | `0005` |
| Quotations | `quotes`, `quote_line_items`, `quote_status_events`, `quote_number_counters` | `0006` |
| Automation | `automation_rules`, `automation_alerts`, `automation_runs` | `0007` |
| Offline replay safety | `mutation_receipts` (idempotency keys, safe to prune) | `0008` |

Analytics owns no tables: it reads the lead, call, follow-up and quote tables above.

## How the feature is put together

```
next.config.ts                          Next.js config (the D1 binding comes from OpenNext)
open-next.config.ts                     OpenNext/Workers adapter config
wrangler.jsonc                          Worker name, `DB` D1 binding, `nodejs_compat`, assets
eslint.config.mjs, tsconfig.json        lint + strict TypeScript config
vitest.config.mts                       Vitest config (`src/**/*.test.ts`, `@` alias)
postcss.config.mjs                      Tailwind v4 PostCSS plugin
DEPLOY.md                               deployment, release, rollback and security runbook
public/_headers                         service-worker headers Cloudflare must send
migrations/0001_callbooks.sql            Call Playbooks schema
migrations/0002_guide_data_schema.sql    pricing + session-planner schema, indexes, integrity triggers
migrations/0003_seed_source_guides.sql   idempotent seed of the three source guides
migrations/0004_callbook_context.sql     additive Callbook market/niche/language/step-context columns
migrations/0005_leads_and_calls.sql      leads, manual call logs, follow-ups, call_sessions.lead_id
migrations/0006_quotes.sql               quotes, line items, status events, numbering counters, money triggers
migrations/0007_analytics_automation.sql automation rules, reminder queue, run log (analytics reads existing tables)
migrations/0008_offline_sync.sql         mutation_receipts — the idempotency keys that make a replay write once
src/lib/guides/
  types.ts                               market / schedule / package / niche / snapshot types
  currency.ts                            deterministic Rp / A$ / US$ formatting, "+" for starting prices
  format.ts                              date-only and WIB range formatting, date/time validation
  pricing.ts                             recommendation + niche-price resolution rules
  snapshot.ts                            snapshot build, JSON serialisation, zod-validated parsing
  repository.ts                          all guide + session D1 access (parameterised SQL)
  seed-validation.ts                     the seed-validation report used by the UI and the tests
  *.test.ts                              dataset, pricing, snapshot, session and route tests
src/lib/callbooks/                       Call Playbooks domain
  context.ts                           server-only pricing context (guide data + frozen session)
  pricing-context-types.ts             client-safe shapes for the call context panel
  guide-options.ts                     market/niche selector options built from the guide data
  graph.ts                             pure graph operations, validation and step ordering
  session.ts                           published snapshot (zod-validated) + path folding
  repository.ts                        all D1 access (parameterised SQL, atomic batches)
  outcomes.ts                          the fixed outcome catalogue (interest / not interested / …)
  optimistic.ts                        local Call Mode step folding used by the offline queue
  templates/                           typed starter templates + instantiation
  *.test.ts                            domain, integration and API contract tests
src/lib/leads/                           lead + logged-call + follow-up domain
  repository.ts                        lead CRUD, SQL filtering/pagination, atomic call+follow-up writes
  follow-up-time.ts                    the one "due today" / "overdue" rule every screen shares
  normalize.ts                         phone / email / domain normalisation used by duplicate warnings
  *.test.ts                            database integration and API contract tests
src/lib/quotes/                          Quote Builder domain
  types.ts                             quote / line item / status lifecycle types
  money.ts                             currency exponents, minor-unit maths, one totals function
  options.ts                           server-only lead → market package options for the form
  repository.ts                        all quote D1 access, snapshotting and status rules
  *.test.ts                            money and database integration tests
src/lib/analytics/                       analytics (read-only) + the period definition
  period.ts                            WIB reporting periods, presets, previous-period comparison
  metrics.ts                           pure rate/funnel/trend/histogram functions
  repository.ts                        one read-only snapshot of lead/call/follow-up/quote rows
  dashboard.ts                         composes the dashboard object, including its "data notes"
  service.ts                           server-only composition used by the two pages
src/lib/automation/                      automation rules, reminder queue, run log
  types.ts                             rule catalogue, config bounds, alert and run shapes
  rules.ts                             pure evaluation: records in, reminders out
  repository.ts                        rule settings, idempotent upsert/resolve, run log
src/lib/offline/                         offline outbox + queue + browser wiring
  policy.ts                            the allowlist of queueable writes, status classification
  queue.ts                             ordered flush, retry/refuse handling, no duplicate replay
  idb-store.ts, store.ts, types.ts      IndexedDB persistence and the outbox contract
  client.ts, use-offline.ts             browser transport, `online`/focus triggers, sync panel state
src/lib/api/                             request schemas, route helpers, typed browser client, idempotency
src/lib/db/                              D1 driver, dev-only SQLite driver, resolver, driver types
src/app/api/…                            route handlers (leads, callbooks, sessions, quotes, guide data, automation)
src/app/dashboard/…                      overview, session planner, pricing library, guide data
src/app/leads/…                          lead list, create, detail, edit
src/app/callbooks/…                      library, create, builder, preview
src/app/calls/…                          live call, result form, history, session detail
src/app/quotes/…                         quote list, create, detail (document + print), edit
src/app/analytics/, src/app/automation/   the two Phase 5 pages
public/sw.js, manifest.webmanifest, offline.html, icons/   installable app + offline shell
src/components/…                         UI primitives, pricing, session planner, guide data, callbooks,
                                         leads, quotes, analytics, automation, offline status
```

### Key behaviour

**Graph, not a document.** A message step owns its responses; each response points at the next
step. Many responses may point at the same step. Ids are UUIDs — titles are never used as keys.

**Validation is shared.** `validateGraph()` is pure and runs both in the builder (live checks)
and on the server before publishing, so client and server cannot disagree. It **blocks** missing
start step, empty titles/scripts, steps without responses, unconnected responses, missing or
self-referencing targets, responses on outcome steps, and missing outcome categories. It **warns**
about steps that loop back to an earlier step and about unreachable steps.

**Loops are a supported shape.** A real call returns to earlier ground — asking the price again,
replaying the demo, going back to “what's included”. `cycle_detected` is therefore a warning, not a
publishing error. Termination is guaranteed by construction rather than by banning cycles:
`reachableNodeIds()` and `findCycleNodeIds()` carry a visited set, Call Mode advances exactly one
step per chosen response, and session history is folded from an append-only step log.

**Publishing is a snapshot.** Publishing validates, then stores an immutable
`published_snapshot_json` plus `published_version` and a hash of the draft graph. The hash drives
the "Unpublished changes" badge. Editing never touches the published snapshot until the next
successful publish, and a publish is guarded by `WHERE published_version = ?` so two publishes
cannot interleave.

**Calls run on the snapshot.** Starting a call copies the published snapshot into the session
row. Later edits and re-publishes cannot change an active or historical call. The session's route
is derived by folding an append-only step log (`call_session_steps`), which is the single source
of truth; `path_json` / `current_node_id` are caches written in the same transaction. Going back
appends a `back` event, so choosing a different response afterwards naturally replaces the
abandoned forward route.

**Saving is atomic.** The whole draft graph is written in one D1 batch: delete branches, delete
removed nodes, upsert nodes, insert branches, update the start step. A failure rolls back and the
previous draft stays intact.

**Money never becomes a float.** Quotations store integers in minor units and percentages in basis
points; the server recalculates every total with the same `calculateQuoteTotals()` the form preview
uses, and a database trigger rejects a line total that is not `quantity × unit price`. No total is
ever submitted by the browser.

**Analytics is a read, not a second copy.** There is no analytics table: `loadAnalyticsSnapshot()`
assembles the same rows the Leads, Call History and Quotes pages read, and pure functions in
`metrics.ts` turn them into figures. That is why a metric can never disagree with the list it came
from, and why the only tables Phase 5 writes are the automation ones.

**An offline write is replayed once, or not at all.** `QUEUEABLE_WRITES` decides what may be queued,
`mutation_receipts` reserves an idempotency key before the handler runs, and a refused write releases
its key so a corrected retry still works. The queue never reorders, never skips ahead on a transport
failure, and never invents a result.

## Access model (important limitation)

This workspace has **no authentication**: it is a single-user tool. There is no `owner_id` column
and no per-user data isolation, because inventing a login would be worse than being explicit.
Anyone who can reach the deployment can read and edit every lead, Callbook, call record, quotation,
saved session, analytics view and the guide data (prices, niches, schedules) behind them.

**This is a deployment concern, not a repository concern.** The repository ships no credentials, no
`.env` file and no secrets, so it is safe to clone and read — but a deployment of it is not safe to
expose until you put something in front of it.

If you deploy this, do one of these **before** you put real data in it:

- **Cloudflare Access** — an edge login in front of the Worker. No code changes; see
  [DEPLOY.md](./DEPLOY.md#security-do-this-before-using-real-data).
- **Keep it private** — a VPN, a private network, or `npm run cf:preview` on localhost only.
- **Add real auth** — an `owner_id` column, an auth provider, and ownership checks in
  `src/lib/*/repository.ts`. All SQL is centralised there, so the change stays contained.

Do not rely on the URL being hard to guess. It is not.

## Deliberate scope decisions

- **Loops are allowed.** A conversation may return to an earlier step; publish reports it as a
  warning so the author can check every loop still reaches an outcome. Traversal and Back still
  terminate because every walk uses a visited set and Call Mode advances one response at a time.
- **No ambiguous edge drawing.** Dragging between steps connects the step's only unconnected
  response; when several are unconnected the canvas says the inspector must be used, so a
  connection is never guessed.
- **Unexpected answers are manual.** There is no speech recognition or AI: the user types what the
  prospect said, optionally picks a prepared response, and decides whether to continue.
- **No telephony, recording, calendar, email or messaging integration.** Follow-ups and reminders are
  stored in this workspace only, and the UI says so; nothing is sent anywhere.
- **Analytics reports only what the records say.** There are no targets, benchmarks, industry
  conversion rates or forecasts, no revenue metric (no payment is ever recorded) and no currency
  conversion. A rate with an empty denominator is shown as `N/A`, never `0%`.
- **Automation is on demand, not a scheduler.** No cron trigger is configured, so rules run when you
  press run; the page states that instead of implying background work.
- **Permanent deletion is refused while history exists.** Archiving is reversible and never deletes
  history, so a lead with calls keeps every call.
- **Offline is not a second source of truth.** The queue replays the user's own writes; it never
  invents a result, never merges records and never retries a refusal. A change the server rejects stays
  on the device and is shown to the user until they retry or discard it.

## Tests

```bash
npm test        # 257 tests in 20 files (verified)
```

The suite needs no fixtures: database tests open a real SQLite database in a temp directory and apply
`migrations/*.sql`, so the schema under test is exactly the schema you deploy. That also means the
tests need Node 22.5+ (see [Run it yourself](#run-it-yourself)).

Covered for the guides module: dataset integrity against a database built from the migrations (3
markets and their codes, 11 schedule blocks with the supplied times/cities/priorities, 12 packages
with exact prices/timelines/inclusions, 28 categories with their exact child labels, all 31
niche-price rows including the US Law Firm and Accounting exceptions, the reference data, and seed
idempotency), pricing rules (recommendation from the market setting, specialty row precedence, no
fabricated niche price, conflict fallback, page-count text), currency formatting, snapshot
build/serialise/parse and its immunity to later edits, session persistence (create, reopen, edit,
duplicate, delete, cross-market rejection, snapshot isolation) and the route handlers (status codes,
validation messages, price-isolation between base prices and niche rows).

Covered for Call Playbooks: graph validation (missing start, unconnected branch, invalid target,
self-connection, loop warnings, loop-safe traversal, unreachable warnings, outcome rules, empty
content), graph mutations (delete does not redirect incoming links, start is cleared not reassigned,
many-to-one links), snapshot isolation from later edits, snapshot parsing failures, path folding
(advance, back, alternate branch after back, unexpected with/without a branch, restart, duplicate
transitions), every starter template (display order, unique ids, unique authoring keys, resolvable
targets, publishable instantiation, loop-safe reachability, independent copies, create+publish through
the repository, and a live call that follows a documented loop and then goes back), Callbook context
(market/niche/language persistence, cross-market niche rejection, niche clearing on market change,
duplication, legacy rows without the new columns, step context across save/publish/live call, US
specialty price rows, session-snapshot precedence with a frozen-vs-current price check, mismatch
fallback, and the meta/graph API contracts including a pre-Phase 2 payload), leads and call logging
(lead CRUD with market/niche integrity, duplicate warnings on phone/domain/name+city, SQL filters and
pagination, atomic call+follow-up+status writes, do-not-contact guard, follow-up lifecycle without
auto-completion, deletion blocked by call history, unified Call History across Callbook runs and logged
calls, legacy runs without a lead, and the lead/follow-up/callbook-session API contracts), and the
SQLite driver (migrations, parameterised queries, atomic batch rollback, foreign keys and cascade
deletes).

Covered for quotations and money: currency exponents, minor-unit arithmetic and the one totals function;
and against a real database — the price always coming from the pricing database rather than the
request, a package from another market being refused, custom lines and a percentage discount computed
exactly, a discount larger than the subtotal being rejected, one unique `DLC-<year>-####` number per
quotation, a saved quote keeping its own prices when the catalog changes, an edited draft keeping the
previously saved price, the lifecycle guards (`draft → sent → accepted`, refused shortcuts, a sent
quote locked), expiry derived for display without rewriting the stored status, duplicate and delete,
currencies never summed together, and the list/validation paths.

Covered for analytics and automation: the reporting-period semantics (WIB day boundaries, half-open
windows) and — most importantly — one cross-feature file that pins the dashboard counters and the
automation rules to the same follow-up day rule, so a follow-up due today is never "overdue" on one
screen and "pending" on another. Be aware that the wider metrics composition and the rule
open/re-open/resolve cycle have no dedicated test file: `src/lib/analytics/` and
`src/lib/automation/` are the thinnest-covered parts of the codebase, and are the first place to add
tests if you change them.

Covered for offline use and syncing: which writes may be queued and which must stay online, the
replay order and that a transport failure keeps the change and stops the flush, that a refusal is
surfaced instead of retried forever, that retry and discard do what they say, that two overlapping
flushes never send the same change twice, the local step changes Call Mode makes without a connection
(following a branch, stepping back, adding a note, and refusing a branch with no target), and the
server-side idempotency guarantee through the real route handlers — one key writes once even when the
replay carries a different body, a different key writes again, a request without the header behaves as
before, a refused write releases its key so a corrected retry is accepted, a claimed key is never run
twice, and a replayed call log or call step is stored once.

**Note on the template registry test:** `templates.test.ts` used to expect two starter templates
(`contractor-website-outreach`, `cleaning-business-outreach`) that commit `edf61db` removed, so it
was failing before this change. It now asserts the real registry — the ten shipped templates plus
their structural guarantees (unique ids and keys, resolvable targets, publishable instantiation,
loop-safe traversal, independent copies).

## Project origin

The repository was empty (`.git` with no commits, empty remote) when this workspace was built, so the
application shell — layout, sidebar, design tokens, UI primitives — was created as part of the work
rather than modified. No existing code was replaced. The guides module, Call Playbooks, leads and call
logging, the Quote Builder, analytics/automation and offline support were then built on that shell in
that order, which is why the phase numbers in this document match the migration numbers.