import Link from "next/link";

import { DbBroken } from "@/components/DbBroken";
import { ListHeader } from "@/components/ItemRow";
import { SummaryTile } from "@/components/SummaryTile";
import { QUOTE_YEARS, WantRow } from "@/components/WantRow";
import { projectedPerMonth } from "@/lib/cost";
import { dbStatus, listWants, wantTotals } from "@/lib/db";
import { formatCents, formatCount, formatRands } from "@/lib/money";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function WantsPage({ searchParams }: { searchParams: SearchParams }) {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  const params = await searchParams;
  const q = first(params.q).trim();
  const highlight = first(params.new);

  const summary = wantTotals();
  const wants = listWants(q);

  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lede font-medium">What you want</h1>
        {/* When the list is empty the empty state carries the only primary button. */}
        {summary.count > 0 ? (
          <Link
            href="/wants/new"
            className="rounded-card bg-tag px-4 py-2.5 text-body font-medium text-tag-ink transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70"
          >
            Add something
          </Link>
        ) : null}
      </header>

      {summary.count === 0 ? (
        <div className="rounded-card bg-card px-5 py-14 text-center shadow-card">
          <p className="mx-auto max-w-[42ch] text-body">
            Nothing on the list. Add something you&apos;re thinking about and see what it
            would cost you per month before you buy it.
          </p>
          <Link
            href="/wants/new"
            className="mt-6 inline-block rounded-card bg-tag px-4 py-2.5 text-body font-medium text-tag-ink transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70"
          >
            Add something
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryTile
              value={formatRands(summary.total)}
              label="on the list"
              detail={`${formatCount(summary.count)} ${summary.count === 1 ? "thing" : "things"} you haven't bought`}
            />
            <SummaryTile
              value={formatCents(projectedPerMonth(summary.total, QUOTE_YEARS))}
              suffix="/mo"
              label={`if all of it lasted ${QUOTE_YEARS} years`}
              detail="What the whole list would cost you every month"
            />
          </div>

          <div className="space-y-4">
            <form action="/wants" method="get">
              <label htmlFor="q" className="sr-only">
                Search the list
              </label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search"
                autoComplete="off"
                className="w-full rounded-card border border-rule bg-card px-3 py-2.5 text-body outline-offset-2 focus:outline-2 focus:outline-ink"
              />
            </form>

            {wants.length === 0 ? (
              <p className="rounded-card bg-card px-4 py-10 text-center text-body text-muted shadow-card">
                Nothing here matches &ldquo;{q}&rdquo;.
              </p>
            ) : (
              <section>
                <ListHeader first="Thing" third={`Per month, ${QUOTE_YEARS} years`} />
                <ul className="space-y-2">
                  {wants.map((want) => (
                    <WantRow key={want.id} want={want} flash={want.id === highlight} />
                  ))}
                </ul>
              </section>
            )}
          </div>

          <p className="text-label text-muted">
            Right-click a row (or tap the dots) to edit it, mark it bought, or take it off.
          </p>
        </>
      )}
    </main>
  );
}
