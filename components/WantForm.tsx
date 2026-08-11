"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import type { WantRecord } from "@/lib/db";
import { emptyFormState, type FormState } from "@/lib/form";
import { NAME_MAX, NOTE_MAX } from "@/lib/validate";

import { MoneyInput } from "./MoneyInput";

const FIELD =
  "w-full rounded-card border border-rule bg-card px-3 py-2 text-body outline-offset-2 focus:outline-2 focus:outline-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-label text-danger">
      {message}
    </p>
  );
}

/** A want is an item without a clock: a name, a price, when you saw it, a link. */
export function WantForm({
  action,
  today,
  want,
  submitLabel,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  today: string;
  want?: WantRecord;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.focus) return;
    const el = formRef.current?.elements.namedItem(state.focus);
    if (el instanceof HTMLElement) el.focus();
  }, [state.focus, state.attempt]);

  const value = (key: string, fallback: string) => state.values[key] ?? fallback;

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-6">
      {want ? <input type="hidden" name="id" value={want.id} /> : null}

      {state.errors.form ? (
        <p role="alert" className="rounded-card bg-card px-4 py-3 text-body text-danger shadow-card">
          {state.errors.form}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-label uppercase tracking-[0.06em] text-muted">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={NAME_MAX}
          autoComplete="off"
          defaultValue={value("name", want?.name ?? "")}
          aria-invalid={state.errors.name ? true : undefined}
          aria-describedby={state.errors.name ? "name-error" : undefined}
          className={`mt-1 ${FIELD}`}
        />
        <FieldError id="name-error" message={state.errors.name} />
      </div>

      <div>
        <label htmlFor="price" className="block text-label uppercase tracking-[0.06em] text-muted">
          Price
        </label>
        <div className="mt-1">
          <MoneyInput
            key={`price-${state.attempt}`}
            id="price"
            name="price"
            defaultValue={value("price", want ? (want.price_cents / 100).toFixed(2) : "")}
            invalid={Boolean(state.errors.price)}
            describedBy={state.errors.price ? "price-error" : undefined}
          />
        </div>
        <FieldError id="price-error" message={state.errors.price} />
      </div>

      <div>
        <label
          htmlFor="priced_on"
          className="block text-label uppercase tracking-[0.06em] text-muted"
        >
          Priced on
        </label>
        <input
          id="priced_on"
          name="priced_on"
          type="date"
          required
          max={today}
          defaultValue={value("priced_on", want?.priced_on ?? today)}
          aria-invalid={state.errors.priced_on ? true : undefined}
          aria-describedby={
            state.errors.priced_on ? "priced_on-error priced_on-hint" : "priced_on-hint"
          }
          className={`mt-1 ${FIELD}`}
        />
        <p id="priced_on-hint" className="mt-1 text-label text-muted">
          The day you saw this price, so you know how stale it is.
        </p>
        <FieldError id="priced_on-error" message={state.errors.priced_on} />
      </div>

      <div>
        <label htmlFor="url" className="block text-label uppercase tracking-[0.06em] text-muted">
          Link <span className="normal-case">(optional)</span>
        </label>
        <input
          id="url"
          name="url"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="https://"
          defaultValue={value("url", want?.url ?? "")}
          aria-invalid={state.errors.url ? true : undefined}
          aria-describedby={state.errors.url ? "url-error url-hint" : "url-hint"}
          className={`mt-1 ${FIELD}`}
        />
        <p id="url-hint" className="mt-1 text-label text-muted">
          How you find it again. Stored as text, never fetched.
        </p>
        <FieldError id="url-error" message={state.errors.url} />
      </div>

      <div>
        <label htmlFor="note" className="block text-label uppercase tracking-[0.06em] text-muted">
          Note <span className="normal-case">(optional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={NOTE_MAX}
          defaultValue={value("note", want?.note ?? "")}
          aria-invalid={state.errors.note ? true : undefined}
          aria-describedby={state.errors.note ? "note-error" : undefined}
          className={`mt-1 ${FIELD} resize-y`}
        />
        <FieldError id="note-error" message={state.errors.note} />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-card bg-tag px-4 py-2 text-body font-medium text-tag-ink transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70 disabled:opacity-60"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="text-body text-muted underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
