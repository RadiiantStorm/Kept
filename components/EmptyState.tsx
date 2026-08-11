import Link from "next/link";

/** No illustration, no spinner: the copy and one button, centred. */

export function EmptyState() {
  return (
    <div className="rounded-card bg-card px-5 py-12 text-center shadow-card">
      <p className="mx-auto max-w-[36ch] text-body text-ink">
        Nothing logged yet. Add the last thing you bought and watch what it actually costs
        you.
      </p>
      <Link
        href="/items/new"
        className="mt-6 inline-block rounded-card bg-tag px-4 py-2 text-body font-medium text-tag-ink transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70"
      >
        Log something
      </Link>
    </div>
  );
}
