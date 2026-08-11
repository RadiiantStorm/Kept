import Link from "next/link";
import { notFound } from "next/navigation";

import { updateWant } from "@/app/actions";
import { DbBroken } from "@/components/DbBroken";
import { ProjectionTable } from "@/components/ProjectionTable";
import { WantForm } from "@/components/WantForm";
import { todayIso } from "@/lib/cost";
import { dbStatus, getWant } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditWantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  const { id } = await params;
  const want = getWant(id);
  if (!want) notFound();

  return (
    <main className="mx-auto max-w-[640px] space-y-6">
      <header>
        <Link
          href="/wants"
          className="text-label text-ink underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
        >
          Back to the list
        </Link>
        <h1 className="mt-4 text-lede font-medium wrap-anywhere">{want.name}</h1>
      </header>

      <div className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <WantForm
          action={updateWant}
          today={todayIso()}
          want={want}
          submitLabel="Save changes"
          cancelHref="/wants"
        />
      </div>

      <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <h2 className="mb-4 text-label uppercase tracking-[0.06em] text-muted">
          What it would cost you
        </h2>
        {/* Nothing is "reached" yet — you don't own it. Dates run from today. */}
        <ProjectionTable priceCents={want.price_cents} days={0} from={todayIso()} />
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-card bg-card p-5 shadow-card sm:p-6">
        <Link
          href={`/items/new?want=${want.id}`}
          className="rounded-control border border-rule px-4 py-2 text-body transition-colors duration-[120ms] hover:bg-raised active:opacity-80"
        >
          I bought it
        </Link>
        {want.url ? (
          <a
            href={want.url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-control border border-rule px-4 py-2 text-body transition-colors duration-[120ms] hover:bg-raised active:opacity-80"
          >
            Find it again
          </a>
        ) : null}
      </section>
    </main>
  );
}
