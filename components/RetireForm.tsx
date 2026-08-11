"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { isIsoDate, utcDaysBetween } from "@/lib/cost";
import { emptyFormState, type FormState } from "@/lib/form";
import { MESSAGES } from "@/lib/validate";

/**
 * Stops an item's clock. The end date is checked here as you type and again on
 * the server; an end date before the purchase date disables the save either way.
 */
export function RetireForm({
  id,
  purchasedOn,
  today,
  action,
}: {
  id: string;
  purchasedOn: string;
  today: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [open, setOpen] = useState(false);
  const [endedOn, setEndedOn] = useState(today);
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.focus === "ended_on") dateRef.current?.focus();
  }, [state.focus, state.attempt]);

  const localError = !isIsoDate(endedOn)
    ? MESSAGES.endedInvalid
    : utcDaysBetween(purchasedOn, endedOn) < 0
      ? MESSAGES.endedBeforePurchase
      : undefined;

  const error = localError ?? state.errors.ended_on ?? state.errors.form;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-card border border-rule px-4 py-2 text-body transition-colors duration-[120ms] hover:bg-raised active:opacity-80"
      >
        Stop the clock
      </button>
    );
  }

  return (
    <form action={formAction} noValidate className="w-full">
      <input type="hidden" name="id" value={id} />

      <label
        htmlFor="ended_on"
        className="block text-label uppercase tracking-[0.06em] text-muted"
      >
        Clock stopped on
      </label>
      <input
        ref={dateRef}
        id="ended_on"
        name="ended_on"
        type="date"
        min={purchasedOn}
        value={endedOn}
        onChange={(e) => setEndedOn(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "retire-error" : undefined}
        className="mt-1 w-full max-w-[220px] rounded-card border border-rule bg-card px-3 py-2 text-body outline-offset-2 focus:outline-2 focus:outline-ink"
      />

      {error ? (
        <p id="retire-error" className="mt-1 text-label text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || Boolean(localError)}
          /* Ink, not yellow: the shelf tag is the only yellow on this screen. */
          className="rounded-card bg-ink px-4 py-2 text-body font-medium text-card transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70 disabled:opacity-60"
        >
          Stop the clock
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-body text-muted underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
