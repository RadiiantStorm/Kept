# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kept is a single-user, local cost-of-ownership tracker: log what you bought and watch the
per-month figure fall as time passes, plus a second list of things not bought yet. It runs
on one machine against one SQLite file. There are no accounts, no server to deploy, and no
outbound network calls.

## Commands

```bash
pnpm dev            # dev server on http://localhost:3000
pnpm test           # full vitest suite
pnpm build          # production build
pnpm start          # serve the production build
npx tsc --noEmit    # typecheck; there is no lint step
```

Single test file or single case:

```bash
pnpm vitest run tests/cost.test.ts
pnpm vitest run -t "charges a brand-new thing"
```

`Kept.cmd` at the repo root is the end-user launcher: builds once, then serves the
production build and opens a browser.

### Two environment variables

- `KEPT_DB_PATH` — move the database off `./data/kept.db`.
- `KEPT_DIST_DIR` — build somewhere other than `.next`. **Running `pnpm build` while
  `pnpm dev` is up overwrites the dev server's chunks and breaks it with
  `Cannot find module './xxx.js'`.** Use `KEPT_DIST_DIR=.next-check pnpm build` to verify a
  build without killing a running dev server, then delete the directory.

## Architecture

Next.js 15 App Router. Server Components do every read, Server Actions do every write.
There is no client-side data fetching layer and no client state library.

### The cost engine is mirrored in two places — change both together

`lib/cost.ts` holds the money-over-time maths as pure functions. `lib/db.ts` re-implements
the same formula in SQL (`DAYS_OWNED_SQL`, `EFFECTIVE_DAYS_SQL`, `PER_MONTH_SQL`) so
dashboard totals and the "highest per month" sort are `SUM`/`ORDER BY` aggregates rather
than a full table scan in JavaScript. If the two drift, the dashboard tile stops matching
the rows it is summing. Any change to `costsFromDays` needs the same change in those SQL
fragments.

Three rules that look like bugs if you do not know them:

- **Days owned counts the purchase day**, so something bought today has been owned one day
  and nothing divides by zero.
- **The divisor is floored at one averaged month (30.4375 days).** Dividing a whole price
  by one day gives an arithmetically true and completely useless monthly cost — a R26 000
  purchase would claim to cost R791 375 a month. The floor makes the honest statement
  instead: in its first month a thing has cost you its price. From day 31 the real figure
  takes over. Anything owned longer than a month is untouched, and all four cadences stay
  exact multiples of each other.
- **Months are averaged, never calendar months.** Calendar arithmetic would make an item's
  cost per month jump every February.

Money is integer cents end to end, parsed from text at the form (`lib/money.ts`) and
rounded only at the moment it is printed. Dates are `YYYY-MM-DD` strings treated as UTC
midnights; there is no date library.

### Why `lib/query.ts` and `lib/form.ts` exist

`lib/db.ts` imports `server-only`, so anything it touches is poisoned for client bundles.
Two small modules exist purely to break that chain:

- `lib/query.ts` — sort keys and page size, so `SearchSort` (a client component) can render
  the options without importing the database.
- `lib/form.ts` — `FormState` and `emptyFormState`, because a `"use server"` file may only
  export async functions, so they cannot live in `app/actions.ts`.

### Database lifecycle

`migrations/NNN_name.sql` files are applied on boot by a small runner that records applied
versions in a `_migrations` table. The runner also re-checks on module re-evaluation
(`migratedInThisModule`), because the connection is cached on `globalThis` across dev hot
reloads — without that, a migration added mid-session would never apply and the new table
would appear to be missing.

Seeding happens only when no database **file** existed at boot, not when the table is
empty. Deleting every item must not conjure the examples back.

A failed open renders `DbBroken` with the file path instead of crashing, so every page that
reads data starts with a `dbStatus()` guard.

## Conventions worth keeping

- **Every number on screen is monospaced and tabular** via the `num` utility, so columns of
  rand align on the decimal point. Tabular values are right-aligned; display figures share a
  left edge.
- **One accent colour per screen.** `--color-tag` is the shelf tag and the primary button,
  nothing else. `--color-tag-ink` is its text colour and does not follow the theme.
- **Theme** is a cookie read in `app/layout.tsx` and stamped onto `<html data-theme>`, so
  the first server render is already correct and nothing flashes. The dark palette lives in
  *unlayered* CSS in `globals.css` so it outranks the `@theme` defaults.
- **Tailwind v4 inlines theme tokens into utilities.** Overriding `--shadow-card` per theme
  does nothing; only `var()` references nested inside a token stay live. That is why the
  card shadow reads `0 0 0 1px var(--color-rule), 0 1px 2px var(--color-lift)`.
- **Row menus open on `contextmenu` only** — right-click, long-press, or Shift+F10. There
  is no visible trigger button. A `contextmenu` event reporting `(0, 0)` is the keyboard
  Menu key and gets anchored to the row rather than the screen corner.
- Accessibility floor that is already met and should stay met: 4.5:1 contrast in both
  themes, visible focus rings, real `<label>`s, focus-trapped `<dialog>` confirms, and
  `prefers-reduced-motion` disabling both animations.

## Hard constraints

- **Zero outbound network calls.** A pasted product URL is inert text — never fetched,
  scraped, or unfurled. Fonts are self-hosted from `node_modules`; Next telemetry is
  disabled in `.env`.
- **Never compute dashboard totals by selecting all rows into JavaScript.** The list
  paginates at 100; totals are SQL aggregates.
- **Delete is delete.** Retiring (setting `ended_on`) is the only "keep it around" path;
  there is no soft delete.
- `data/` is gitignored and holds real user data. It must never be committed.

## Currency

ZAR only, formatted `R1 299.00` with a space thousands separator. The parser accepts
`R1 299,50`, `1,299.50`, `1299.5` and `R 1299` alike — a comma is a decimal separator only
when followed by exactly two digits at the end of the string. Changing currency means
editing `lib/money.ts`; there is no multi-currency support.
