# Kept

A local cost-of-ownership tracker. Log what you bought and what it cost, and watch the
per-month figure fall as time passes. Keep a second list of what you haven't bought yet,
priced the same way, so you can see the monthly cost before you commit.

It runs on your own machine. There is no account, no server to sign up for, and no
telemetry — your data is a single SQLite file in the project folder and never leaves it.

## Running it

You need [Node.js](https://nodejs.org) 20.11 or newer and [pnpm](https://pnpm.io):

```bash
npm install -g pnpm
```

Then:

```bash
git clone https://github.com/RadiiantStorm/kept.git
cd kept
pnpm install
pnpm dev
```

Open http://localhost:3000. The database is created for you at `data/kept.db` on the first
run and seeded with three example items to show you the shape of it — delete them and it
stays empty. The file is gitignored, so your own data is never committed.

To reach it from your phone on the same wifi, use the network address `pnpm dev` prints.

## Using it every day

`pnpm dev` is the development server — slower, and it expects a terminal you keep an eye
on. For everyday use, double-click **`Kept.cmd`** in the project folder instead.

It builds the app the first time (about a minute), then serves the fast production build on
http://localhost:3000 and opens your browser. Leave its window running, minimised, for as
long as you want the app available; closing it stops the server. Double-clicking it again
while it is already running just reopens the browser.

Two things worth doing once:

- **Pin it.** Right-click `Kept.cmd` → *Send to* → *Desktop (create shortcut)*, or pin the
  shortcut to your taskbar.
- **Install it as an app.** With Kept open in Edge or Chrome, use the install icon in the
  address bar (or ⋯ → *Apps* → *Install this site as an app*). You get a proper window with
  its own icon and no browser chrome.

To start it automatically when you log in, press `Win+R`, run `shell:startup`, and drop a
shortcut to `Kept.cmd` in the folder that opens.

After you change the code — or pull a new version — run `pnpm rebuild` so the production
build picks it up.

| Command      | What it does                            |
| ------------ | --------------------------------------- |
| `pnpm dev`   | Serves the app at http://localhost:3000 |
| `pnpm test`  | Runs the unit tests                     |
| `pnpm build` | Production build                        |
| `pnpm start` | Serves the production build             |

Set `KEPT_DB_PATH` to put the database somewhere else, or `KEPT_DIST_DIR` to build without
clobbering a running dev server. Nothing else is configurable, and nothing here talks to
the network — a pasted product link is stored as text and is never fetched.

### If the install fails

`better-sqlite3` is a native module. It ships prebuilt binaries for common platforms, but
if yours isn't one of them it compiles from source and needs a C++ toolchain:

- **Windows** — `npm install -g windows-build-tools`, or install the "Desktop development
  with C++" workload from the Visual Studio Build Tools.
- **macOS** — `xcode-select --install`
- **Linux** — `sudo apt install build-essential python3` (or your distribution's equivalent)

If pnpm reports `Ignored build scripts`, run `pnpm approve-builds` and allow
`better-sqlite3` — this project already allows it in `pnpm-workspace.yaml`, so you should
not normally see it.

## The two lists

**Kept** is what you own. Each item has a purchase date, so it has a clock, a cost per
month, and a projection. Stopping the clock freezes those figures.

**Want** is what you don't own yet. Each entry has a price and the date you saw that price,
so you know how stale it is, plus a link to find it again. There is no clock — only what it
*would* cost per month at various horizons. Marking something bought carries it over to
Kept, pre-filled, and takes it off the list.

Every row in both lists answers to a right-click — or a long-press on a touch screen, or
Shift+F10 on a focused row: open, edit, delete. The menu takes arrow keys and closes on
Escape.

Appearance lives in **Settings**: light, dark, or match the system. The choice is a cookie
the server reads, so the first paint is already right and the page never flashes.

## How the numbers work

`lib/cost.ts` holds all of it, as pure functions:

- **Days owned** counts the purchase day, so something bought today has been owned one day
  and nothing ever divides by zero. Retiring an item freezes the count at its end date.
- **The divisor is floored at one month.** Dividing a whole price by one day and calling
  the result a monthly cost is arithmetically true and useless — a R26 000 PC bought this
  morning would claim to cost R791 375 a month. Flooring says the honest thing instead: in
  its first month, a thing has cost you its price. From day 31 the real figure takes over
  and starts falling. Anything owned longer than a month is unaffected, and the three
  cadences stay exact multiples of each other.
- **A month is 30.4375 days** — a twelfth of a 365.25-day year. Calendar-month arithmetic
  would make an item's cost per month jump every February.
- **Money is integer cents** end to end. It is parsed from text at the form and rounded
  only at the moment it is printed.

The dashboard totals are `SUM` aggregates in SQLite, including the combined per-month
figure, so the list can grow without the summary getting slower. The list paginates at 100.

## Layout

```
app/          dashboard, item screens, want screens, settings, actions, JSON export
components/   the shelf-label UI
lib/          cost.ts, money.ts, validate.ts, db.ts, theme.ts
migrations/   numbered .sql files, applied on boot
tests/        vitest suites for cost, money, and validation
```

Migrations apply on boot, and also when the module reloads — so adding a numbered `.sql`
file takes effect without restarting the dev server.

## Currency

Prices are South African rand, formatted `R1 299.00`. The parser accepts `R1 299,50`,
`1,299.50`, `1299.5` and `R 1299` alike. Changing currency means editing the symbol and the
grouping in `lib/money.ts`; there is no multi-currency support and no exchange rates.

## Licence

MIT — see [LICENSE](LICENSE). Do what you like with it.
