import { cookies } from "next/headers";

import { setTheme } from "@/app/actions";
import { DbBroken } from "@/components/DbBroken";
import { ThemePicker } from "@/components/ThemePicker";
import { todayIso } from "@/lib/cost";
import { DB_PATH, databaseSize, dbStatus, totals, wantTotals } from "@/lib/db";
import { formatCount } from "@/lib/money";
import { THEME_COOKIE, toTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function SettingsPage() {
  const status = dbStatus();
  if (!status.ok) return <DbBroken path={status.path} detail={status.detail} />;

  const theme = toTheme((await cookies()).get(THEME_COOKIE)?.value);
  const kept = totals(todayIso());
  const wants = wantTotals();

  return (
    <main className="space-y-8">
      <h1 className="text-lede font-medium">Settings</h1>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <h2 className="mb-3 text-label uppercase tracking-[0.06em] text-muted">Appearance</h2>
        <ThemePicker current={theme} action={setTheme} />
      </section>

      <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <h2 className="mb-3 text-label uppercase tracking-[0.06em] text-muted">Your data</h2>

        <dl className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-body">Things kept</dt>
            <dd className="num text-body">{formatCount(kept.count)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-body">On the want list</dt>
            <dd className="num text-body">{formatCount(wants.count)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-body">Database size</dt>
            <dd className="num text-body">{formatBytes(databaseSize())}</dd>
          </div>
        </dl>

        <a
          href="/export"
          className="mt-5 inline-block rounded-card border border-rule px-4 py-2 text-body transition-colors duration-[120ms] hover:bg-raised active:opacity-80"
        >
          Export everything as JSON
        </a>
      </section>

      <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <h2 className="mb-3 text-label uppercase tracking-[0.06em] text-muted">
          Where it lives
        </h2>
        <p className="num wrap-anywhere text-body">{DB_PATH}</p>
        <p className="mt-3 text-label text-muted">
          One file, on this machine, and nothing else. Delete it to start completely fresh —
          the app rebuilds it, with the three examples, on the next boot. Export first if you
          want to keep any of it.
        </p>
      </section>

      <section className="rounded-card bg-card p-5 shadow-card sm:p-6">
        <h2 className="mb-3 text-label uppercase tracking-[0.06em] text-muted">Shortcuts</h2>
        <dl className="space-y-3 text-body">
          <div className="flex items-baseline justify-between gap-4">
            <dt>Row actions</dt>
            <dd className="text-muted">Right-click, long-press, or Shift+F10</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>Close a menu or dialog</dt>
            <dd className="num text-muted">Esc</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>Move through a menu</dt>
            <dd className="num text-muted">Up / Down</dd>
          </div>
        </dl>
      </section>
      </div>
    </main>
  );
}
