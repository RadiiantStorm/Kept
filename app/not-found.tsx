import Link from "next/link";

export default function NotFound() {
  return (
    <main className="rounded-card bg-card px-5 py-12 text-center shadow-card">
      <h1 className="text-lede font-medium">That&apos;s not here.</h1>
      <p className="mt-2 text-body text-muted">
        It was either deleted or never logged in the first place.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-card bg-tag px-4 py-2 text-body font-medium text-tag-ink transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70"
      >
        Back to Kept
      </Link>
    </main>
  );
}
