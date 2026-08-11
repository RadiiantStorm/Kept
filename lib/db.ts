import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { DAYS_PER_MONTH } from "./cost";
import { PAGE_SIZE, type SortKey } from "./query";

export const DB_PATH =
  process.env.KEPT_DB_PATH ?? path.join(process.cwd(), "data", "kept.db");

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

export type ItemRecord = {
  id: string;
  name: string;
  price_cents: number;
  purchased_on: string;
  ended_on: string | null;
  url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type DbStatus =
  | { ok: true }
  | { ok: false; path: string; detail: string };

/**
 * Days owned, expressed in SQL so aggregates never pull rows into JS.
 * Mirrors `daysOwned()` and `costsFromDays()` in lib/cost.ts — change together.
 * The outer MAX is the one-month floor that stops a same-day purchase reporting
 * thirty times its price per month.
 */
const DAYS_OWNED_SQL = `MAX(1, CAST(ROUND(julianday(COALESCE(ended_on, @today)) - julianday(purchased_on)) AS INTEGER) + 1)`;
const EFFECTIVE_DAYS_SQL = `MAX(${DAYS_PER_MONTH}, ${DAYS_OWNED_SQL})`;
const PER_MONTH_SQL = `(price_cents * ${DAYS_PER_MONTH}) / ${EFFECTIVE_DAYS_SQL}`;

type Connection = { db: Database.Database } | { error: Error };

// Survives dev-server hot reloads; a second connection to the same file is
// harmless but wasteful, and re-running the migration check every render is not
// what we want.
const globalCache = globalThis as unknown as { __keptDb?: Connection };

/**
 * Reset every time this module is evaluated, which in dev means every hot
 * reload. The connection itself is deliberately kept across reloads, so without
 * this a migration added mid-session would never be applied to it.
 */
let migratedInThisModule = false;

function connect(): Connection {
  try {
    const firstRun = !fs.existsSync(DB_PATH);
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    migrate(db);
    migratedInThisModule = true;
    if (firstRun) seed(db);

    return { db };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

function connection(): Connection {
  const cached = globalCache.__keptDb;

  if (!cached) {
    globalCache.__keptDb = connect();
  } else if (!migratedInThisModule && "db" in cached) {
    // Reusing a connection opened before this version of the code loaded:
    // catch it up on any migrations that have appeared since.
    try {
      migrate(cached.db);
      migratedInThisModule = true;
    } catch (error) {
      globalCache.__keptDb = {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  return globalCache.__keptDb!;
}

/** Non-throwing probe, so a page can render the recovery screen instead of a stack trace. */
export function dbStatus(): DbStatus {
  const c = connection();
  if ("db" in c) {
    try {
      c.db.prepare("SELECT 1 FROM items LIMIT 1").get();
      return { ok: true };
    } catch (error) {
      return { ok: false, path: DB_PATH, detail: String(error) };
    }
  }
  return { ok: false, path: DB_PATH, detail: c.error.message };
}

function db(): Database.Database {
  const c = connection();
  if ("error" in c) throw c.error;
  return c.db;
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

function migrate(conn: Database.Database): void {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set<number>(
    conn
      .prepare("SELECT version FROM _migrations")
      .all()
      .map((r) => (r as { version: number }).version),
  );

  const files = fs.existsSync(MIGRATIONS_DIR)
    ? fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort()
    : [];

  const record = conn.prepare(
    "INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)",
  );

  for (const file of files) {
    const version = Number(file.slice(0, file.indexOf("_")));
    if (!Number.isInteger(version)) {
      throw new Error(`Migration filename must start with a number: ${file}`);
    }
    if (applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    conn.transaction(() => {
      conn.exec(sql);
      record.run(version, file, new Date().toISOString());
    })();
  }
}

// ---------------------------------------------------------------------------
// Seed — only ever on a genuinely first run, i.e. no database file existed.
// Emptying the list must not conjure the examples back.
// ---------------------------------------------------------------------------

const SEED: Array<Omit<ItemRecord, "id" | "created_at" | "updated_at">> = [
  {
    name: "Logitech G Pro X keyboard",
    price_cents: 189_900,
    purchased_on: "2024-11-03",
    ended_on: null,
    url: "https://www.takealot.com/example-keyboard",
    note: "hall effect switches",
  },
  {
    name: "Espresso machine",
    price_cents: 649_900,
    purchased_on: "2022-06-18",
    ended_on: null,
    url: null,
    note: null,
  },
  {
    name: "Running shoes",
    price_cents: 210_000,
    purchased_on: "2025-09-01",
    ended_on: "2026-06-30",
    url: null,
    note: null,
  },
];

function seed(conn: Database.Database): void {
  const count = (
    conn.prepare("SELECT COUNT(*) AS n FROM items").get() as { n: number }
  ).n;
  if (count > 0) return;

  const now = new Date().toISOString();
  const insert = conn.prepare(`
    INSERT INTO items (id, name, price_cents, purchased_on, ended_on, url, note, created_at, updated_at)
    VALUES (@id, @name, @price_cents, @purchased_on, @ended_on, @url, @note, @created_at, @updated_at)
  `);

  conn.transaction(() => {
    for (const row of SEED) {
      insert.run({ ...row, id: crypto.randomUUID(), created_at: now, updated_at: now });
    }
  })();
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const ORDER_BY: Record<SortKey, string> = {
  newest: "purchased_on DESC, created_at DESC",
  oldest: "purchased_on ASC, created_at ASC",
  price: "price_cents DESC, purchased_on DESC",
  monthly: `${PER_MONTH_SQL} DESC, purchased_on DESC`,
};

/** Escapes the LIKE wildcards so a search for `100%` means what it says. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export type ListQuery = {
  q: string;
  sort: SortKey;
  page: number;
  today: string;
};

export type ListResult = {
  active: ItemRecord[];
  retired: ItemRecord[];
  total: number;
  page: number;
  pageCount: number;
};

export function listItems({ q, sort, page, today }: ListQuery): ListResult {
  const conn = db();

  // better-sqlite3 rejects named parameters the statement does not use, so the
  // parameter object is assembled to match whichever clauses are in play.
  const where = q
    ? `WHERE (name LIKE @like ESCAPE '\\' OR COALESCE(note, '') LIKE @like ESCAPE '\\')`
    : "";
  const filter = q ? { like: likePattern(q) } : {};

  const total = (
    conn.prepare(`SELECT COUNT(*) AS n FROM items ${where}`).get(filter) as { n: number }
  ).n;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const rows = conn
    .prepare(
      `SELECT id, name, price_cents, purchased_on, ended_on, url, note, created_at, updated_at
         FROM items
         ${where}
        ORDER BY (ended_on IS NOT NULL) ASC, ${ORDER_BY[sort]}
        LIMIT @limit OFFSET @offset`,
    )
    .all({
      ...filter,
      ...(sort === "monthly" ? { today } : {}),
      limit: PAGE_SIZE,
      offset: (safePage - 1) * PAGE_SIZE,
    }) as ItemRecord[];

  return {
    active: rows.filter((r) => r.ended_on === null),
    retired: rows.filter((r) => r.ended_on !== null),
    total,
    page: safePage,
    pageCount,
  };
}

export type Totals = {
  count: number;
  activeCount: number;
  spentAllTime: number;
  spentStillOwned: number;
  activePerMonth: number;
};

/** One scan, computed in SQL. Never select all rows to add them up in JS. */
export function totals(today: string): Totals {
  const row = db()
    .prepare(
      `SELECT
         COUNT(*)                                                            AS count,
         COALESCE(SUM(ended_on IS NULL), 0)                                  AS activeCount,
         COALESCE(SUM(price_cents), 0)                                       AS spentAllTime,
         COALESCE(SUM(CASE WHEN ended_on IS NULL THEN price_cents END), 0)   AS spentStillOwned,
         COALESCE(SUM(CASE WHEN ended_on IS NULL THEN ${PER_MONTH_SQL} END), 0) AS activePerMonth
       FROM items`,
    )
    .get({ today }) as Totals;
  return row;
}

export function getItem(id: string): ItemRecord | null {
  const row = db().prepare("SELECT * FROM items WHERE id = ?").get(id) as
    | ItemRecord
    | undefined;
  return row ?? null;
}

export function allItems(): ItemRecord[] {
  return db()
    .prepare("SELECT * FROM items ORDER BY purchased_on DESC, created_at DESC")
    .all() as ItemRecord[];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type ItemInput = {
  name: string;
  price_cents: number;
  purchased_on: string;
  ended_on: string | null;
  url: string | null;
  note: string | null;
};

export function insertItem(input: ItemInput): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db()
    .prepare(
      `INSERT INTO items (id, name, price_cents, purchased_on, ended_on, url, note, created_at, updated_at)
       VALUES (@id, @name, @price_cents, @purchased_on, @ended_on, @url, @note, @created_at, @updated_at)`,
    )
    .run({ ...input, id, created_at: now, updated_at: now });
  return id;
}

/** Last write wins — two tabs editing the same row is not worth a conflict dialog. */
export function updateItem(id: string, input: ItemInput): void {
  db()
    .prepare(
      `UPDATE items
          SET name = @name,
              price_cents = @price_cents,
              purchased_on = @purchased_on,
              ended_on = @ended_on,
              url = @url,
              note = @note,
              updated_at = @updated_at
        WHERE id = @id`,
    )
    .run({ ...input, id, updated_at: new Date().toISOString() });
}

export function setEndedOn(id: string, endedOn: string | null): void {
  db()
    .prepare("UPDATE items SET ended_on = ?, updated_at = ? WHERE id = ?")
    .run(endedOn, new Date().toISOString(), id);
}

/** Delete is delete. There is no soft-delete path. */
export function deleteItem(id: string): void {
  db().prepare("DELETE FROM items WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Wants — the list of things not bought yet
// ---------------------------------------------------------------------------

export type WantRecord = {
  id: string;
  name: string;
  price_cents: number;
  priced_on: string;
  url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type WantInput = {
  name: string;
  price_cents: number;
  priced_on: string;
  url: string | null;
  note: string | null;
};

export function listWants(q = ""): WantRecord[] {
  const conn = db();
  if (!q) {
    return conn
      .prepare("SELECT * FROM wants ORDER BY created_at DESC")
      .all() as WantRecord[];
  }
  return conn
    .prepare(
      `SELECT * FROM wants
        WHERE (name LIKE @like ESCAPE '\\' OR COALESCE(note, '') LIKE @like ESCAPE '\\')
        ORDER BY created_at DESC`,
    )
    .all({ like: likePattern(q) }) as WantRecord[];
}

export function getWant(id: string): WantRecord | null {
  const row = db().prepare("SELECT * FROM wants WHERE id = ?").get(id) as
    | WantRecord
    | undefined;
  return row ?? null;
}

export type WantTotals = { count: number; total: number };

export function wantTotals(): WantTotals {
  return db()
    .prepare(
      "SELECT COUNT(*) AS count, COALESCE(SUM(price_cents), 0) AS total FROM wants",
    )
    .get() as WantTotals;
}

export function insertWant(input: WantInput): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db()
    .prepare(
      `INSERT INTO wants (id, name, price_cents, priced_on, url, note, created_at, updated_at)
       VALUES (@id, @name, @price_cents, @priced_on, @url, @note, @created_at, @updated_at)`,
    )
    .run({ ...input, id, created_at: now, updated_at: now });
  return id;
}

export function updateWant(id: string, input: WantInput): void {
  db()
    .prepare(
      `UPDATE wants
          SET name = @name,
              price_cents = @price_cents,
              priced_on = @priced_on,
              url = @url,
              note = @note,
              updated_at = @updated_at
        WHERE id = @id`,
    )
    .run({ ...input, id, updated_at: new Date().toISOString() });
}

export function deleteWant(id: string): void {
  db().prepare("DELETE FROM wants WHERE id = ?").run(id);
}

/** Bytes on disk, including the write-ahead log. Shown in settings. */
export function databaseSize(): number {
  let total = 0;
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      total += fs.statSync(DB_PATH + suffix).size;
    } catch {
      // A missing WAL just means nothing is pending.
    }
  }
  return total;
}
