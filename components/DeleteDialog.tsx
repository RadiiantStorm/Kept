"use client";

import { useRef } from "react";

/**
 * A native `<dialog>` opened with `showModal()`: the browser traps focus and
 * closes it on Escape, which is exactly the behaviour required.
 */
export function DeleteDialog({
  id,
  name,
  action,
}: {
  id: string;
  name: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="rounded-card border border-rule px-4 py-2 text-body text-danger transition-colors duration-[120ms] hover:bg-raised active:opacity-80"
      >
        Delete forever
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-card bg-card p-5 text-ink shadow-card backdrop:bg-[rgba(9,11,14,0.6)]"
      >
        <h2 id="delete-title" className="text-lede font-medium">
          Delete forever
        </h2>
        <p className="mt-2 text-body">Delete {name}? Its history goes with it.</p>

        <div className="mt-6 flex items-center gap-4">
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="rounded-card bg-danger px-4 py-2 text-body font-medium text-card transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70"
            >
              Delete forever
            </button>
          </form>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="text-body text-muted underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
          >
            Keep it
          </button>
        </div>
      </dialog>
    </>
  );
}
