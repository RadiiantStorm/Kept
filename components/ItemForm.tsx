"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import type { ItemRecord } from "@/lib/db";
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

/**
 * The log form, reused verbatim for editing. The end date only appears when
 * editing — that is the one place retiring can be undone.
 */
export function ItemForm({
  action,
  today,
  item,
  prefill,
  fromWant,
  submitLabel,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  today: string;
  item?: ItemRecord;
  /** Carried over from the wishlist when something is marked bought. */
  prefill?: Partial<Record<"name" | "price" | "url" | "note", string>>;
  /** The want to retire off the list once this saves. */
  fromWant?: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const formRef = useRef<HTMLFormElement>(null);

  // A rejected field keeps focus, on every attempt, not just the first.
  useEffect(() => {
    if (!state.focus) return;
    const el = formRef.current?.elements.namedItem(state.focus);
    if (el instanceof HTMLElement) el.focus();
  }, [state.focus, state.attempt]);

  const value = (key: string, fallback: string) => state.values[key] ?? fallback;

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-6">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {fromWant ? <input type="hidden" name="from_want" value={fromWant} /> : null}

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
          defaultValue={value("name", prefill?.name ?? item?.name ?? "")}
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
            defaultValue={value(
              "price",
              prefill?.price ?? (item ? (item.price_cents / 100).toFixed(2) : ""),
            )}
            invalid={Boolean(state.errors.price)}
            describedBy={state.errors.price ? "price-error" : undefined}
          />
        </div>
        <FieldError id="price-error" message={state.errors.price} />
      </div>

      <div>
        <label
          htmlFor="purchased_on"
          className="block text-label uppercase tracking-[0.06em] text-muted"
        >
          Date bought
        </label>
        <input
          id="purchased_on"
          name="purchased_on"
          type="date"
          required
          max={today}
          defaultValue={value("purchased_on", item?.purchased_on ?? today)}
          aria-invalid={state.errors.purchased_on ? true : undefined}
          aria-describedby={state.errors.purchased_on ? "purchased_on-error" : undefined}
          className={`mt-1 ${FIELD}`}
        />
        <FieldError id="purchased_on-error" message={state.errors.purchased_on} />
      </div>

      {item ? (
        <div>
          <label
            htmlFor="ended_on"
            className="block text-label uppercase tracking-[0.06em] text-muted"
          >
            Clock stopped on
          </label>
          <input
            id="ended_on"
            name="ended_on"
            type="date"
            defaultValue={value("ended_on", item.ended_on ?? "")}
            aria-invalid={state.errors.ended_on ? true : undefined}
            aria-describedby={
              state.errors.ended_on ? "ended_on-error ended_on-hint" : "ended_on-hint"
            }
            className={`mt-1 ${FIELD}`}
          />
          <p id="ended_on-hint" className="mt-1 text-label text-muted">
            Clear this to start the clock again.
          </p>
          <FieldError id="ended_on-error" message={state.errors.ended_on} />
        </div>
      ) : (
        <input type="hidden" name="ended_on" value="" />
      )}

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
          defaultValue={value("url", prefill?.url ?? item?.url ?? "")}
          aria-invalid={state.errors.url ? true : undefined}
          aria-describedby={state.errors.url ? "url-error url-hint" : "url-hint"}
          className={`mt-1 ${FIELD}`}
        />
        <p id="url-hint" className="mt-1 text-label text-muted">
          Stored as text. Nothing is ever fetched from it.
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
          defaultValue={value("note", prefill?.note ?? item?.note ?? "")}
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
