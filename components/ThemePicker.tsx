"use client";

import { useTransition } from "react";

import { type Theme, THEMES } from "@/lib/theme";

/**
 * Writes the preference to a cookie through a server action, so the very next
 * server render already carries the right theme and nothing ever flashes.
 */
export function ThemePicker({
  current,
  action,
}: {
  current: Theme;
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <fieldset disabled={pending} className="space-y-2">
      <legend className="sr-only">Appearance</legend>
      {THEMES.map((option) => {
        const active = option.key === current;
        return (
          <form
            key={option.key}
            action={(formData) => startTransition(() => action(formData).then(() => {}))}
          >
            <input type="hidden" name="theme" value={option.key} />
            <button
              type="submit"
              aria-pressed={active}
              className={`flex w-full items-center justify-between gap-4 rounded-card border px-4 py-3 text-left transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70 ${
                active ? "border-ink bg-raised" : "border-rule bg-card"
              }`}
            >
              <span>
                <span className="block text-body font-medium">{option.label}</span>
                <span className="block text-label text-muted">{option.hint}</span>
              </span>
              <span
                aria-hidden
                className={`size-[14px] shrink-0 rounded-full border-2 ${
                  active ? "border-ink bg-ink" : "border-rule"
                }`}
              />
            </button>
          </form>
        );
      })}
    </fieldset>
  );
}
