/**
 * Shown instead of a stack trace when the database file cannot be opened or
 * read. The path and the escape hatch are the whole message.
 */
export function DbBroken({ path, detail }: { path: string; detail: string }) {
  return (
    <main className="rounded-card bg-card px-5 py-8 shadow-card">
      <h1 className="text-lede font-medium">Kept can&apos;t read its database.</h1>
      <p className="mt-4 text-body">The file is here:</p>
      <p className="num mt-1 wrap-anywhere text-body">{path}</p>
      <p className="mt-4 text-body font-medium">Delete this file to start fresh.</p>
      <p className="mt-6 text-label text-muted">
        Everything logged so far is in that file, so copy it somewhere first if you want to
        try to recover it.
      </p>
      <pre className="num mt-4 overflow-x-auto rounded-card border border-rule p-3 text-label text-muted">
        {detail}
      </pre>
    </main>
  );
}
