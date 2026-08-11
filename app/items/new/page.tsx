import Link from "next/link";

import { createItem } from "@/app/actions";
import { DbBroken } from "@/components/DbBroken";
import { ItemForm } from "@/components/ItemForm";
import { todayIso } from "@/lib/cost";
import { dbStatus, getWant } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewItemPage({ searchParams }: { searchParams: SearchParams }) {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  const params = await searchParams;
  const wantId = Array.isArray(params.want) ? params.want[0] : params.want;
  const want = wantId ? getWant(wantId) : null;

  return (
    <main className="mx-auto max-w-[640px] space-y-6">
      <header>
        <Link
          href={want ? "/wants" : "/"}
          className="text-label text-ink underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
        >
          {want ? "Back to the list" : "Back to Kept"}
        </Link>
        <h1 className="mt-4 text-lede font-medium">Log something</h1>
        {want ? (
          <p className="mt-1 text-label text-muted">
            Carried over from the list. Saving this takes it off.
          </p>
        ) : null}
      </header>

      <div className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <ItemForm
          action={createItem}
          today={todayIso()}
          prefill={
            want
              ? {
                  name: want.name,
                  price: (want.price_cents / 100).toFixed(2),
                  url: want.url ?? "",
                  note: want.note ?? "",
                }
              : undefined
          }
          fromWant={want?.id}
          submitLabel="Save"
          cancelHref={want ? "/wants" : "/"}
        />
      </div>
    </main>
  );
}
