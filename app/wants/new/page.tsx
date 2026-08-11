import Link from "next/link";

import { createWant } from "@/app/actions";
import { DbBroken } from "@/components/DbBroken";
import { WantForm } from "@/components/WantForm";
import { todayIso } from "@/lib/cost";
import { dbStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function NewWantPage() {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  return (
    <main className="mx-auto max-w-[640px] space-y-6">
      <header>
        <Link
          href="/wants"
          className="text-label text-ink underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
        >
          Back to the list
        </Link>
        <h1 className="mt-4 text-lede font-medium">Add something</h1>
      </header>

      <div className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <WantForm
          action={createWant}
          today={todayIso()}
          submitLabel="Save"
          cancelHref="/wants"
        />
      </div>
    </main>
  );
}
