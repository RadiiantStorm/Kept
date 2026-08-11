const TONES = {
  ink: "text-ink",
  settled: "text-settled",
  muted: "text-muted",
} as const;

/**
 * One cadence: its name on the left, its figure hard against the right edge.
 * Stacked, these put every decimal point on the same vertical line — which a
 * row of three side-by-side figures could never do.
 */
export function CostFigure({
  label,
  value,
  note,
  tone = "ink",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-rule py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-label uppercase tracking-[0.06em] text-muted">
        {label}
        {note ? <span className="ml-2 normal-case">{note}</span> : null}
      </span>
      <span className={`num text-lede ${TONES[tone]}`}>{value}</span>
    </div>
  );
}
