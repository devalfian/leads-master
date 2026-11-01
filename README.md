# Call Playbooks

Structured, branching cold-calling guides for a freelance web developer selling website work
to service businesses. Build the conversation once, publish it, then follow it live during a
call and log the result.

This repository contains the complete Call Playbooks feature on a fresh Next.js + Cloudflare
stack (the repository started empty — see "Project origin" at the end).

## What works

- **Callbook library** — search, status filter, sorting, **market and niche filters**, duplicate,
  archive/restore.
- **Create Callbook** — from scratch (one start step) or from eight editable starter templates
  (proposal follow-up, med spa / cosmetic dentistry, and F&B, motor & car rental and tour & travel
  outreach, each in “no website” and “outdated website” variants, set in a fictional market). The
  market, niche and language fields are populated from the Phase 1 guide data.
- **Builder** — directed graph of message and outcome steps, per-response branches with example
  phrases, start-step selection, node inspector (script, coaching note, **step type, purpose, talking
  points**), ordered step list with keyboard reorder controls, live validation, atomic save, publish.
- **Preview** — walk the draft graph as a conversation without writing anything.
- **Call Mode** — follows the *published snapshot*, one step at a time, with copyable script,
  delivery tips, response buttons, back, unexpected-response handling and quick notes. It also shows a
  collapsible **call context panel** with the market, niche and package references from the pricing
  database.
- **Call result** — outcome, notes, next action, follow-up date; stored per session.
- **Call History** — every session with its outcome, follow-up and the route taken. Callbook runs and
  calls logged against a lead are shown in one list, with search, market/type/outcome/date filters and
  pagination. Each logged call can be followed up with another log from the same row.
- **Offline** — the app is installable and the pages you have opened stay readable without a
  connection. Logging a call, following a call step, saving a call result and updating a follow-up all
  work offline; the change is stored on the device and synced when the connection returns. See
  “Offline use and syncing” below.

Everything is persisted in Cloudflare D1. There are no mock endpoints and no fake success states.

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

Not offline: analytics, the Callbook builder and the quotation form are readable only from the cache
of the last visit. Their writes need the server, and the UI does not pretend otherwise.

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
- **Deletion** — permanent deletion is refused while the lead has call history (`409 has_calls`);
  archiving is the safe path and keeps every call.
- **Callbook integration** — a Callbook run can be started for a lead (`/callbooks/[id]?lead=…`). The
  business name is snapshotted into `call_sessions.prospect_name` and the run appears on the lead's
  activity. A Callbook from another market is rejected.
- **Dashboard** — lead counts, calls logged, never-contacted leads, follow-ups due/overdue and estimated
  pipeline **per currency**. Currencies are never summed together and no conversion happens.

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

```bash
npm run db:migrate:local     # applies 0002 (schema) + 0003 (seed) to the local D1
npm run db:migrate:remote    # same for the deployed D1, before deploying the new code
```

`migrations/0003_seed_source_guides.sql` is the seed. It is idempotent (`INSERT OR IGNORE` over unique
constraints), so replaying it never duplicates rows and never overwrites an edited price — seeding
never runs at application startup. Seeded totals: 3 markets, 11 schedule blocks, 12 packages, 98
package inclusions, 28 niche categories, 122 child labels, 31 niche-price rows (stored as 93 price
records, one per niche × package), 12 call objectives, 3 Indonesian session goals, 18 checklist items,
9 objections and 18 tools.

To reset local development data, delete the local database and re-apply the migrations:

```bash
# PowerShell
Remove-Item -Recurse -Force .wrangler\state\v3\d1, .data
npm run db:migrate:local
```

The seed-validation report (counts, market codes, recommended prices, US specialty rows, schedule
times, market-consistency checks) is rendered on `/dashboard/settings/guide-data` and asserted by
`src/lib/guides/seed.test.ts` against a real database built from the migrations.

## Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15.5.28 (App Router, React 19) |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS v4 + shadcn-style primitives (Radix Dialog/Slot, cva, tailwind-merge) |
| Icons | `lucide-react` |
| Graph editor | `@xyflow/react` v12 (builder only — not loaded in Call Mode) |
| Validation | `zod` on every write path |
| Database | Cloudflare D1 (SQLite) with SQL migrations |
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` |
| Tests | Vitest (domain logic) |

## Getting started

```bash
npm install
npm run db:migrate:local     # creates .wrangler/state/v3/d1 and applies migrations
npm run dev                  # http://localhost:3000
```

`next dev` resolves the `DB` D1 binding through OpenNext's Wrangler proxy, so development uses
the same D1 engine, schema and SQL as production.

If no D1 binding is available at all (for example a bare `next dev` outside Wrangler, or CI),
`getDb()` falls back to a file-backed SQLite database through Node's built-in `node:sqlite`
(`.data/leads-master.sqlite`) and applies the same `migrations/*.sql` files. That fallback is
**development only** — in a production build a missing binding raises
`DatabaseNotConfiguredError` instead of writing to a local file.

## Cloudflare deployment

See **[DEPLOY.md](./DEPLOY.md)** for the full self-hosting guide, the release checklist, rollback,
and the security hardening that is **required before you put real data in it**.

```bash
npm run db:create            # prints the D1 database id
# put that id into wrangler.jsonc -> d1_databases[0].database_id
npm run db:migrate:remote    # apply migrations to the remote D1
npm run cf:build             # OpenNext build -> .open-next/
npm run cf:deploy            # build + deploy to Workers
npm run cf:preview           # build + run locally in workerd
```

`wrangler.jsonc` already binds D1 as `DB`, sets `nodejs_compat`, and serves the OpenNext assets.
`database_id` ships as a placeholder: every deployment needs its own D1 database, because a database
id belongs to one Cloudflare account. No secrets or environment variables are required.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Standard Next.js build / serve |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals` + `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest domain tests |
| `npm run db:migrate:local` / `:remote` | Apply D1 migrations |
| `npm run cf:build` / `cf:preview` / `cf:deploy` | OpenNext + Wrangler |

## How the feature is put together

```
migrations/0001_callbooks.sql            Call Playbooks schema
migrations/0002_guide_data_schema.sql    pricing + session-planner schema, indexes, integrity triggers
migrations/0003_seed_source_guides.sql   idempotent seed of the three source guides
migrations/0004_callbook_context.sql     additive Callbook market/niche/language/step-context columns
migrations/0005_leads_and_calls.sql      leads, manual call logs, follow-ups, call_sessions.lead_id
migrations/0006_quotes.sql              quotes, line items, status events, numbering counters, money triggers
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
  templates/                           typed starter templates + instantiation
  *.test.ts                            domain, integration and API contract tests
src/lib/db/                              D1 driver, dev-only SQLite driver, resolver
src/lib/quotes/                          Quote Builder domain
  types.ts                             quote / line item / status lifecycle types
  money.ts                             currency exponents, minor-unit maths, one totals function
  options.ts                           server-only lead → market package options for the form
  repository.ts                        all quote D1 access, snapshotting and status rules
  *.test.ts                            money and database integration tests
src/lib/api/                             request schemas, route helpers, typed browser client
src/app/api/…                            route handlers (pricing, niches, schedules, markets, guide-data, sessions)
src/app/dashboard/…                      overview, session planner, pricing library, guide data
src/app/callbooks/…                      library, create, builder, preview
src/app/calls/…                          live call, result form, history, session detail
src/app/quotes/…                         quote list, create, detail (document + print), edit
src/components/…                         UI primitives, pricing, session planner, guide data, callbooks
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

## Access model (important limitation)

This workspace has **no authentication**: it is a single-user tool. There is no `owner_id` column
and no per-user data isolation, because inventing a login would be worse than being explicit.
Anyone who can reach the deployment can read and edit every Callbook, call record, saved session and
the guide data (prices, niches, schedules) behind them.

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
- **No telephony, recording or calendar integration.** Follow-ups are stored in this workspace only
  and the UI says so.
- **Call History is the only analytics.** No conversion rates or fabricated metrics.
- **Archiving is reversible and never deletes history.**
- **Offline is not a second source of truth.** The queue replays the user's own writes; it never
  invents a result, never merges records and never retries a refusal. A change the server rejects stays
  on the device and is shown to the user until they retry or discard it.

## Tests

```bash
npm test        # 246 tests (19 files)
```

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
was failing before this change. It now asserts the real registry — the eight shipped templates plus
their structural guarantees (unique ids and keys, resolvable targets, publishable instantiation,
loop-safe traversal, independent copies).

## Project origin

The repository was empty (`.git` with no commits, empty remote) when this feature was built, so the
application shell — layout, sidebar, design tokens, UI primitives — was created as part of the work
rather than modified. No existing code was replaced.