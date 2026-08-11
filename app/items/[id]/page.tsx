import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteItem, retireItem } from "@/app/actions";
import { CostFigure } from "@/components/CostFigure";
import { DbBroken } from "@/components/DbBroken";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ProjectionTable } from "@/components/ProjectionTable";
import { RetireForm } from "@/components/RetireForm";
import { ShelfTag } from "@/components/ShelfTag";
import {
  addDays,
  costsFor,
  DAYS_PER_MONTH,
  DAYS_PER_WEEK,
  DAYS_PER_YEAR,
  isSettled,
  isSettling,
  monthsOwned,
  SETTLING_DAYS,
  todayIso,
} from "@/lib/cost";
import { dbStatus, getItem } from "@/lib/db";
import { formatCents, formatCount } from "@/lib/money";
import { hostLabel } from "@/lib/validate";

export const dynamic = "force-dynamic";

/** `1.4` reads better than `1` here, and `18` better than `18.0`. */
function formatSpan(value: number): string {
  return value >= 10 ? formatCount(value) : value.toFixed(1);
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  const today = todayIso();
  const cost = costsFor(item, today);
  const settled = isSettled(cost.days);
  const settling = isSettling(cost.days);
  const retired = item.ended_on !== null;
  const months = monthsOwned(cost.days);

  return (
    <main className="mx-auto max-w-[1000px] space-y-8">
      <header>
        <Link
          href="/"
          className="text-label text-muted underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
        >
          Back to Kept
        </Link>
        <h1 className="mt-4 text-lede font-medium wrap-anywhere">{item.name}</h1>
        <p className="num mt-1 text-figure">{formatCents(item.price_cents)}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          <section>
            <ShelfTag value={formatCents(cost.perMonth)} caption="per month, so far" />
            {settling ? (
              <p className="mt-3 text-label text-muted">
                first month — this settles as time passes, from{" "}
                <span className="num">{addDays(item.purchased_on, SETTLING_DAYS)}</span>
              </p>
            ) : null}
          </section>

          <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-label uppercase tracking-[0.06em] text-muted">
              What it costs you
            </h2>
            <CostFigure label="per day" value={formatCents(cost.perDay)} />
            <CostFigure label="per week" value={formatCents(cost.perWeek)} />
            <CostFigure
              label="per month"
              value={formatCents(cost.perMonth)}
              tone={settled ? "settled" : "ink"}
            />
            <CostFigure label="per year" value={formatCents(cost.perYear)} />
          </section>

          <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-label uppercase tracking-[0.06em] text-muted">
              If you keep it longer
            </h2>
            <ProjectionTable
              priceCents={item.price_cents}
              days={cost.days}
              from={item.purchased_on}
            />
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-label uppercase tracking-[0.06em] text-muted">
              How long you&apos;ve had it
            </h2>

            <CostFigure label="bought" value={item.purchased_on} />
            <CostFigure label="days" value={formatCount(cost.days)} />

            {/* Each unit appears only once it means something: no rows of 0.0. */}
            {cost.days >= DAYS_PER_WEEK ? (
              <CostFigure label="weeks" value={formatSpan(cost.days / DAYS_PER_WEEK)} />
            ) : null}
            {cost.days >= DAYS_PER_MONTH ? (
              <CostFigure label="months" value={formatSpan(months)} />
            ) : null}
            {cost.days >= DAYS_PER_YEAR ? (
              <CostFigure
                label="years"
                value={formatSpan(months / 12)}
                tone={settled ? "settled" : "ink"}
              />
            ) : null}

            {item.ended_on ? <CostFigure label="clock stopped" value={item.ended_on} /> : null}

            {/* Only worth saying while it is still ahead of you. */}
            {!item.ended_on && cost.days < DAYS_PER_YEAR ? (
              <CostFigure
                label="a year in"
                value={addDays(item.purchased_on, Math.round(DAYS_PER_YEAR))}
              />
            ) : null}

            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 inline-block rounded-control border border-rule px-4 py-2 text-body transition-colors duration-[120ms] hover:bg-raised active:opacity-80"
              >
                {hostLabel(item.url)}
              </a>
            ) : null}
          </section>

          {item.note ? (
            <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
              <h2 className="text-label uppercase tracking-[0.06em] text-muted">Note</h2>
              <p className="mt-2 text-body wrap-anywhere">{item.note}</p>
            </section>
          ) : null}

          <section className="flex flex-wrap items-start gap-3 rounded-card bg-card p-5 shadow-card sm:p-6">
            <Link
              href={`/items/${item.id}/edit`}
              className="rounded-control border border-rule px-4 py-2 text-body transition-colors duration-[120ms] hover:bg-raised active:opacity-80"
            >
              Edit
            </Link>

            {retired ? (
              <p className="py-2 text-label text-muted">Clock stopped. Edit to restart it.</p>
            ) : (
              <RetireForm
                id={item.id}
                purchasedOn={item.purchased_on}
                today={today}
                action={retireItem}
              />
            )}

            <DeleteDialog id={item.id} name={item.name} action={deleteItem} />
          </section>
        </div>
      </div>
    </main>
  );
}
