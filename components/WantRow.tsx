import Link from "next/link";

import { deleteWant } from "@/app/actions";
import { projectedPerMonth } from "@/lib/cost";
import type { WantRecord } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { hostLabel } from "@/lib/validate";

import { ROW_GRID } from "./ItemRow";
import { RowMenu } from "./RowMenu";

/** The horizon a want is quoted at — long enough to be honest, short enough to be real. */
export const QUOTE_YEARS = 2;

export function WantRow({ want, flash = false }: { want: WantRecord; flash?: boolean }) {
  const host = want.url ? hostLabel(want.url) : null;
  const price = formatCents(want.price_cents);
  const perMonth = formatCents(projectedPerMonth(want.price_cents, QUOTE_YEARS));

  return (
    <li>
      <RowMenu
        id={want.id}
        name={want.name}
        items={[
          { kind: "link", label: "Edit", href: `/wants/${want.id}/edit` },
          { kind: "link", label: "I bought it", href: `/items/new?want=${want.id}` },
          {
            kind: "action",
            label: "Take it off the list",
            action: deleteWant,
            danger: true,
            confirm: `Take ${want.name} off the list?`,
          },
        ]}
      >
        <Link
          href={`/wants/${want.id}/edit`}
          className={`block rounded-card border-l-[3px] border-l-rule bg-card px-4 py-4 shadow-card transition-colors duration-[120ms] hover:bg-raised active:opacity-80 sm:px-5 sm:py-5 ${
            flash ? "flash" : ""
          }`}
        >
          <div className={`${ROW_GRID} sm:items-center`}>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 flex-1 truncate text-body font-medium">
                  {want.name}
                </span>
                <span className="num shrink-0 text-body sm:hidden">{price}</span>
              </div>

              <div className="mt-1 flex items-baseline justify-between gap-4 text-label text-muted">
                <span className="min-w-0 flex-1 truncate">
                  priced <span className="num">{want.priced_on}</span>
                  {host ? <> &middot; {host}</> : null}
                </span>
                <span className="num shrink-0 sm:hidden">{perMonth} /mo</span>
              </div>
            </div>

            <p className="num hidden text-right text-body sm:block">{price}</p>

            <div className="hidden text-right sm:block">
              <p className="text-body">
                <span className="num">{perMonth}</span>
                <span className="text-label text-muted"> /mo</span>
              </p>
              <p className="mt-0.5 text-label text-muted">over {QUOTE_YEARS} years</p>
            </div>
          </div>
        </Link>
      </RowMenu>
    </li>
  );
}
