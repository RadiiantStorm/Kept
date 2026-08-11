"use client";

import { useState } from "react";

import { formatCents, parsePriceToCents } from "@/lib/money";

/**
 * A plain text field — no masking, no keystroke rewriting. It shows what the
 * parser made of what you typed, which is the only feedback that matters.
 */
export function MoneyInput({
  id,
  name,
  defaultValue = "",
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const parsed = parsePriceToCents(value);
  const canonical = parsed.ok ? formatCents(parsed.cents) : null;
  const worthShowing = canonical !== null && canonical !== value.trim();

  return (
    <div>
      {/* The ring lives on the wrapper because the R sits inside the field. */}
      <div className="flex items-stretch rounded-card border border-rule bg-card outline-offset-2 focus-within:outline-2 focus-within:outline-ink">
        <span
          aria-hidden
          className="num flex items-center pl-3 text-body text-muted"
        >
          R
        </span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="1899"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="num w-full bg-transparent px-2 py-2 text-body outline-none"
        />
      </div>
      <p className="mt-1 min-h-[18px] text-label text-muted" aria-live="polite">
        {worthShowing ? <span className="num">{canonical}</span> : null}
      </p>
    </div>
  );
}
