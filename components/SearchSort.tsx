"use client";

import { SORTS, type SortKey } from "@/lib/query";

/**
 * A plain GET form: the server does the searching and sorting, the URL carries
 * the state, and there is no client-side list to keep in sync.
 */
export function SearchSort({ q, sort }: { q: string; sort: SortKey }) {
  return (
    <form action="/" method="get" className="flex flex-wrap items-center gap-2">
      <label htmlFor="q" className="sr-only">
        Search names and notes
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Search"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-card border border-rule bg-card px-3 py-2 text-body outline-offset-2 focus:outline-2 focus:outline-ink"
      />

      <label htmlFor="sort" className="sr-only">
        Sort
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={sort}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-card border border-rule bg-card px-3 py-2 text-body outline-offset-2 focus:outline-2 focus:outline-ink"
      >
        {SORTS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Enter submits; this keeps the form usable without a pointer or JS. */}
      <button type="submit" className="sr-only focus:not-sr-only">
        Search
      </button>
    </form>
  );
}
