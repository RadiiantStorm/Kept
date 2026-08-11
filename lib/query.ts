/**
 * List parameters shared by the server (which runs the query) and the client
 * (which renders the controls). Kept out of lib/db.ts so the sort options can be
 * imported into a client component without dragging the database in with them.
 */

export const PAGE_SIZE = 100;

export type SortKey = "newest" | "oldest" | "price" | "monthly";

export const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "price", label: "Highest price" },
  { key: "monthly", label: "Highest per month" },
];

export const DEFAULT_SORT: SortKey = "newest";

export function isSortKey(value: unknown): value is SortKey {
  return SORTS.some((s) => s.key === value);
}

export function toSortKey(value: unknown): SortKey {
  return isSortKey(value) ? value : DEFAULT_SORT;
}

export function toPage(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
