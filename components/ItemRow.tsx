import Link from "next/link";

import { deleteItem } from "@/app/actions";
import { costsFor, isSettled, isSettling } from "@/lib/cost";
import type { ItemRecord } from "@/lib/db";
import { formatCents, formatCount } from "@/lib/money";
import { hostLabel } from "@/lib/validate";

import { RowMenu } from "./RowMenu";

/** Shared by the rows and the column headings, so the columns line up. */
export const ROW_GRID = "sm:grid sm:grid-cols-[minmax(0,1fr)_150px_190px] sm:gap-6";

/** One row, read like a tag hanging off the thing you bought. */
export function ItemRow({
  item,
  today,
  flash = false,
}: {
  item: ItemRecord;
  today: string;
  flash?: boolean;
}) {
  const cost = costsFor(item, today);
  const settled = isSettled(cost.days);
  const settling = isSettling(cost.days);
  const host = item.url ? hostLabel(item.url) : null;

  const price = formatCents(item.price_cents);
  const perMonth = formatCents(cost.perMonth);

  return (
    <li>
      <RowMenu
        id={item.id}
        name={item.name}
        items={[
          { kind: "link", label: "Open", href: `/items/${item.id}` },
          { kind: "link", label: "Edit", href: `/items/${item.id}/edit` },
          {
            kind: "action",
            label: "Delete forever",
            action: deleteItem,
            danger: true,
            confirm: `Delete ${item.name}? Its history goes with it.`,
          },
        ]}
      >
        <Link
          href={`/items/${item.id}`}
          className={`block rounded-card border-l-[3px] bg-card py-4 pr-12 pl-4 shadow-card transition-colors duration-[120ms] hover:bg-raised active:opacity-80 sm:py-5 sm:pl-5 ${
            settled ? "border-l-settled" : "border-l-rule"
          } ${flash ? "flash" : ""}`}
        >
          <div className={`${ROW_GRID} sm:items-center`}>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 flex-1 truncate text-body font-medium">
                  {item.name}
                </span>
                <span className="num shrink-0 text-body sm:hidden">{price}</span>
              </div>

              <div className="mt-1 flex items-baseline justify-between gap-4 text-label text-muted">
                <span className="min-w-0 flex-1 truncate">
                  <span className="num">{formatCount(cost.days)}</span>{" "}
                  {cost.days === 1 ? "day" : "days"}
                  {host ? <> &middot; {host}</> : null}
                </span>
                <span className="shrink-0 sm:hidden">
                  <span className={`num ${settled ? "text-settled" : ""}`}>{perMonth}</span>{" "}
                  /mo
                </span>
              </div>

              {settling ? (
                <p className="mt-2 text-label text-muted sm:hidden">
                  first month — this settles as time passes
                </p>
              ) : null}
            </div>

            <p className="num hidden text-right text-body sm:block">{price}</p>

            <div className="hidden text-right sm:block">
              <p className="text-body">
                <span className={`num ${settled ? "text-settled" : ""}`}>{perMonth}</span>
                <span className="text-label text-muted"> /mo</span>
              </p>
              {settling ? (
                <p className="mt-0.5 text-label text-muted">first month — this settles</p>
              ) : null}
            </div>
          </div>
        </Link>
      </RowMenu>
    </li>
  );
}

/** Column headings, shown once above a list on screens wide enough to hold them. */
export function ListHeader({
  first,
  second = "Price",
  third = "Per month",
}: {
  first: string;
  second?: string;
  third?: string;
}) {
  return (
    <div
      className={`${ROW_GRID} ml-[3px] hidden px-5 pb-1 text-label uppercase tracking-[0.06em] text-muted`}
    >
      <span>{first}</span>
      <span className="text-right">{second}</span>
      <span className="text-right">{third}</span>
    </div>
  );
}

/** Matches the real row's height exactly, so nothing shifts when data lands. */
export function ItemRowSkeleton() {
  return (
    <li aria-hidden>
      <div className="rounded-card border-l-[3px] border-l-rule bg-card px-4 py-4 shadow-card sm:py-5 sm:pl-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="block h-[22px] w-1/2 rounded-[2px] bg-rule" />
          <span className="block h-[22px] w-20 rounded-[2px] bg-rule" />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <span className="block h-[18px] w-24 rounded-[2px] bg-rule" />
          <span className="block h-[18px] w-16 rounded-[2px] bg-rule" />
        </div>
      </div>
    </li>
  );
}
