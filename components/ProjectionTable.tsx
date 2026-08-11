import { projectionRows } from "@/lib/cost";
import { formatCents } from "@/lib/money";

/**
 * What the monthly figure becomes at longer horizons, and the date each one
 * lands on. Horizons already lived through are dimmed and marked — they are
 * history, not a forecast.
 */
export function ProjectionTable({
  priceCents,
  days,
  from,
}: {
  priceCents: number;
  days: number;
  /** Purchase date for something owned, today for something merely wanted. */
  from?: string;
}) {
  const rows = projectionRows(priceCents, days, from);

  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">Cost per month if you keep it longer</caption>
      <thead>
        <tr className="text-label uppercase tracking-[0.06em] text-muted">
          <th scope="col" className="pb-2 text-left font-medium">
            If you keep it
          </th>
          {from ? (
            <th scope="col" className="hidden pb-2 text-right font-medium sm:table-cell">
              Until
            </th>
          ) : null}
          <th scope="col" className="pb-2 text-right font-medium">
            Per month
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.years} className={`border-t border-rule ${row.reached ? "opacity-70" : ""}`}>
            <th scope="row" className="py-2.5 text-left font-normal">
              <span className="num">{row.years}</span> {row.years === 1 ? "year" : "years"}
              {row.reached ? (
                <span className="ml-2 text-label uppercase tracking-[0.06em] text-muted">
                  reached
                </span>
              ) : null}
            </th>
            {from ? (
              <td className="num hidden py-2.5 text-right text-label text-muted sm:table-cell">
                {row.on}
              </td>
            ) : null}
            <td className="num py-2.5 text-right">{formatCents(row.perMonth)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
