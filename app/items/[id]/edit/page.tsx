import Link from "next/link";
import { notFound } from "next/navigation";

import { updateItem } from "@/app/actions";
import { DbBroken } from "@/components/DbBroken";
import { ItemForm } from "@/components/ItemForm";
import { todayIso } from "@/lib/cost";
import { dbStatus, getItem } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-[640px] space-y-6">
      <header>
        <Link
          href={`/items/${item.id}`}
          className="text-label text-ink underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
        >
          Back to {item.name}
        </Link>
        <h1 className="mt-4 text-lede font-medium">Edit</h1>
      </header>

      <div className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <ItemForm
          action={updateItem}
          today={todayIso()}
          item={item}
          submitLabel="Save changes"
          cancelHref={`/items/${item.id}`}
        />
      </div>
    </main>
  );
}
