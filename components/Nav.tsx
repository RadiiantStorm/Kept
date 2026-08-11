"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Kept", match: (p: string) => p === "/" || p.startsWith("/items") },
  { href: "/wants", label: "Want", match: (p: string) => p.startsWith("/wants") },
];

/** A cog with real teeth — radiating strokes read as a sun, not as settings. */
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden focusable="false">
      <path
        d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6a.5.5 0 0 0 .12-.63l-1.9-3.28a.5.5 0 0 0-.6-.22l-2.36.95a7.3 7.3 0 0 0-1.74-1l-.36-2.5a.5.5 0 0 0-.5-.42h-3.8a.5.5 0 0 0-.5.42l-.36 2.5a7.3 7.3 0 0 0-1.74 1l-2.36-.95a.5.5 0 0 0-.6.22L2.5 8.77a.5.5 0 0 0 .12.63L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.6a.5.5 0 0 0-.12.63l1.9 3.28a.5.5 0 0 0 .6.22l2.36-.95c.53.42 1.12.76 1.74 1l.36 2.5a.5.5 0 0 0 .5.42h3.8a.5.5 0 0 0 .5-.42l.36-2.5a7.3 7.3 0 0 0 1.74-1l2.36.95a.5.5 0 0 0 .6-.22l1.9-3.28a.5.5 0 0 0-.12-.63l-2-1.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const onSettings = pathname.startsWith("/settings");

  return (
    <nav className="mb-6 flex items-center justify-between gap-3">
      <Link
        href="/"
        className="text-lede font-semibold tracking-[0.16em] uppercase transition-opacity duration-[120ms] hover:opacity-80"
      >
        Kept
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex rounded-control border border-rule bg-card p-1">
          {TABS.map((tab) => {
            const active = !onSettings && tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-control px-3 py-1.5 text-label transition-colors duration-[120ms] ${
                  active ? "bg-raised font-medium text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/settings"
          aria-label="Settings"
          aria-current={onSettings ? "page" : undefined}
          className={`flex size-[38px] items-center justify-center rounded-control border border-rule bg-card transition-colors duration-[120ms] hover:text-ink ${
            onSettings ? "bg-raised text-ink" : "text-muted"
          }`}
        >
          <GearIcon />
        </Link>
      </div>
    </nav>
  );
}
