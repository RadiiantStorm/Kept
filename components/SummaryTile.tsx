/** One headline number on a card, with its label and a quiet second line. */
export function SummaryTile({
  value,
  suffix,
  label,
  detail,
}: {
  value: string;
  suffix?: string;
  label: string;
  detail?: string;
}) {
  return (
    <div className="rounded-card bg-card p-5 shadow-card sm:p-6">
      <p className="num text-figure">
        {value}
        {suffix ? <span className="text-label text-muted"> {suffix}</span> : null}
      </p>
      <p className="mt-1 text-label uppercase tracking-[0.06em] text-muted">{label}</p>
      {detail ? <p className="mt-3 text-label text-muted">{detail}</p> : null}
    </div>
  );
}
