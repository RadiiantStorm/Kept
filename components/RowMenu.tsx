"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type RowMenuItem =
  | { kind: "link"; label: string; href: string }
  | {
      kind: "action";
      label: string;
      action: (formData: FormData) => Promise<void>;
      danger?: boolean;
      /** When set, choosing this opens a confirm dialog carrying this sentence. */
      confirm?: string;
    };

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 36;

/**
 * Wraps a list row and gives it a menu on `contextmenu`: right-click, long-press
 * on a touch screen, or Shift+F10 / the Menu key on a focused row — all three
 * fire the same event.
 */
export function RowMenu({
  id,
  name,
  items,
  children,
}: {
  id: string;
  name: string;
  items: RowMenuItem[];
  children: React.ReactNode;
}) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [confirming, setConfirming] = useState<RowMenuItem | null>(null);
  const [cursor, setCursor] = useState(0);

  const row = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const close = useCallback((restoreFocus = true) => {
    setAt(null);
    // Hand focus back to the row itself, since there is no button to return to.
    if (restoreFocus) row.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, []);

  const openAt = (x: number, y: number) => {
    // Keep the whole menu on screen without measuring it first.
    const height = items.length * ITEM_HEIGHT + 8;
    setAt({
      x: Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
    });
    setCursor(0);
  };

  useEffect(() => {
    if (!at) return;
    menu.current?.querySelector<HTMLElement>("[data-menuitem]")?.focus();
  }, [at]);

  useEffect(() => {
    if (!at) return;
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && menu.current?.contains(event.target)) return;
      close(false);
    };
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [at, close]);

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const options = Array.from(
      menu.current?.querySelectorAll<HTMLElement>("[data-menuitem]") ?? [],
    );
    if (options.length === 0) return;

    const move = (next: number) => {
      event.preventDefault();
      const wrapped = (next + options.length) % options.length;
      setCursor(wrapped);
      options[wrapped].focus();
    };

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") move(cursor + 1);
    else if (event.key === "ArrowUp") move(cursor - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(options.length - 1);
    else if (event.key === "Tab") close();
  };

  const choose = (item: RowMenuItem) => {
    if (item.kind === "action" && item.confirm) {
      setAt(null);
      setConfirming(item);
      queueMicrotask(() => dialog.current?.showModal());
    }
  };

  return (
    <div
      ref={row}
      className="relative"
      onContextMenu={(event) => {
        event.preventDefault();
        // The keyboard Menu key reports (0, 0); anchor to the row instead.
        if (event.clientX === 0 && event.clientY === 0) {
          const box = event.currentTarget.getBoundingClientRect();
          openAt(box.left + 24, box.bottom - 8);
        } else {
          openAt(event.clientX, event.clientY);
        }
      }}
    >
      {children}

      {at
        ? createPortal(
            <div
              ref={menu}
              role="menu"
              aria-label={name}
              onKeyDown={onMenuKeyDown}
              style={{ left: at.x, top: at.y, width: MENU_WIDTH }}
              className="fixed z-50 rounded-card border border-rule bg-card p-1 shadow-card"
            >
              {items.map((item) =>
                item.kind === "link" ? (
                  <Link
                    key={item.label}
                    data-menuitem
                    role="menuitem"
                    href={item.href}
                    onClick={() => setAt(null)}
                    className="block rounded-control px-3 py-2 text-label text-ink hover:bg-raised"
                  >
                    {item.label}
                  </Link>
                ) : item.confirm ? (
                  <button
                    key={item.label}
                    data-menuitem
                    role="menuitem"
                    type="button"
                    onClick={() => choose(item)}
                    className={`block w-full rounded-control px-3 py-2 text-left text-label hover:bg-raised ${
                      item.danger ? "text-danger" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ) : (
                  <form key={item.label} action={item.action} onSubmit={() => setAt(null)}>
                    <input type="hidden" name="id" value={id} />
                    <button
                      data-menuitem
                      role="menuitem"
                      type="submit"
                      className={`block w-full rounded-control px-3 py-2 text-left text-label hover:bg-raised ${
                        item.danger ? "text-danger" : "text-ink"
                      }`}
                    >
                      {item.label}
                    </button>
                  </form>
                ),
              )}
            </div>,
            document.body,
          )
        : null}

      {confirming && confirming.kind === "action" ? (
        <dialog
          ref={dialog}
          aria-labelledby={`confirm-${id}`}
          onClose={() => setConfirming(null)}
          className="m-auto w-[min(420px,calc(100vw-32px))] rounded-card bg-card p-5 text-ink shadow-card backdrop:bg-[rgba(9,11,14,0.6)]"
        >
          <h2 id={`confirm-${id}`} className="text-lede font-medium">
            {confirming.label}
          </h2>
          <p className="mt-2 text-body">{confirming.confirm}</p>
          <div className="mt-6 flex items-center gap-4">
            <form action={confirming.action}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className={`rounded-card px-4 py-2 text-body font-medium text-card transition-opacity duration-[120ms] hover:opacity-80 active:opacity-70 ${
                  confirming.danger ? "bg-danger" : "bg-ink"
                }`}
              >
                {confirming.label}
              </button>
            </form>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="text-body text-muted underline underline-offset-4 transition-opacity duration-[120ms] hover:opacity-80"
            >
              Cancel
            </button>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
