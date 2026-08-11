import Link from "next/link";

import type { SortKey } from "@/lib/query";

function href(page: number, q: string, sort: SortKey): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

const LINK =
  "rounded-card border border-rule bg-card px-3 py-2 text-body transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70";

export function Pagination({
  page,
  pageCount,
  q,
  sort,
}: {
  page: number;
  pageCount: number;
  q: string;
  sort: SortKey;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={href(page - 1, q, sort)} className={LINK} rel="prev">
          Previous
        </Link>
      ) : (
        <span className={`${LINK} opacity-60`} aria-disabled="true">
          Previous
        </span>
      )}

      <p className="text-label text-ink">
        Page <span className="num">{page}</span> of <span className="num">{pageCount}</span>
      </p>

      {page < pageCount ? (
        <Link href={href(page + 1, q, sort)} className={LINK} rel="next">
          Next
        </Link>
      ) : (
        <span className={`${LINK} opacity-60`} aria-disabled="true">
          Next
        </span>
      )}
    </nav>
  );
}
