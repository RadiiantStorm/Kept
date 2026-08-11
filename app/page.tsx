import Link from "next/link";

import { DbBroken } from "@/components/DbBroken";
import { EmptyState } from "@/components/EmptyState";
import { ItemRow, ListHeader } from "@/components/ItemRow";
import { Pagination } from "@/components/Pagination";
import { SearchSort } from "@/components/SearchSort";
import { SummaryTile } from "@/components/SummaryTile";
import { todayIso } from "@/lib/cost";
import { dbStatus, listItems, totals } from "@/lib/db";
import { formatCents, formatCount, formatRands } from "@/lib/money";
import { toPage, toSortKey } from "@/lib/query";

// Every render reads the database; there is nothing here worth caching.
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  const params = await searchParams;
  const q = first(params.q).trim();
  const sort = toSortKey(first(params.sort));
  const page = toPage(first(params.page));
  const highlight = first(params.new);
  const today = todayIso();

  const summary = totals(today);
  const list = listItems({ q, sort, page, today });
  const retiredCount = summary.count - summary.activeCount;

  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lede font-medium">What you own</h1>
        {/* When the list is empty the empty state carries the only primary button. */}
        {summary.count > 0 ? (
          <Link
            href="/items/new"
            className="rounded-card bg-tag px-4 py-2.5 text-body font-medium text-tag-ink transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70"
          >
            Log something
          </Link>
        ) : null}
      </header>

      {summary.count === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryTile
              value={formatRands(summary.spentAllTime)}
              label="spent, all time"
              detail={`${formatCount(summary.count)} ${summary.count === 1 ? "thing" : "things"} logged`}
            />
            <SummaryTile
              value={formatRands(summary.spentStillOwned)}
              label="on things you still own"
              detail={
                retiredCount > 0
                  ? `${formatCount(retiredCount)} ${retiredCount === 1 ? "clock" : "clocks"} stopped`
                  : "every clock still running"
              }
            />
            <SummaryTile
              value={formatCents(summary.activePerMonth)}
              suffix="/mo"
              label="everything you still own"
              detail={`${formatCount(summary.activeCount)} ${summary.activeCount === 1 ? "thing" : "things"} still counting`}
            />
          </div>

          <div className="space-y-4">
            <SearchSort q={q} sort={sort} />

            {list.total === 0 ? (
              <p className="rounded-card bg-card px-4 py-10 text-center text-body text-muted shadow-card">
                Nothing here matches &ldquo;{q}&rdquo;.
              </p>
            ) : (
              <div className="space-y-8">
                {list.active.length > 0 ? (
                  <section>
                    <ListHeader first="Thing" />
                    <ul className="space-y-2">
                      {list.active.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          today={today}
                          flash={item.id === highlight}
                        />
                      ))}
                    </ul>
                  </section>
                ) : null}

                {list.retired.length > 0 ? (
                  <section>
                    <h2 className="mb-2 text-label uppercase tracking-[0.1em] text-ink">
                      Clock stopped
                    </h2>
                    <ListHeader first="Thing" third="Per month, final" />
                    <ul className="space-y-2">
                      {list.retired.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          today={today}
                          flash={item.id === highlight}
                        />
                      ))}
                    </ul>
                  </section>
                ) : null}

                <Pagination page={list.page} pageCount={list.pageCount} q={q} sort={sort} />
              </div>
            )}
          </div>

          <p className="text-label text-muted">
            Right-click a row (or tap the dots) to open, edit, or delete it.
          </p>
        </>
      )}
    </main>
  );
}
