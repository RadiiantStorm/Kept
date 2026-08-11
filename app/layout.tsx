import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

// Self-hosted from node_modules: the browser makes no outbound request for these.
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";

import { Nav } from "@/components/Nav";
import { THEME_COOKIE, toTheme } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kept",
  description: "What the things you bought actually cost you.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read on the server so the first paint is already the right theme.
  const theme = toTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="en" data-theme={theme === "system" ? undefined : theme}>
      <body className="min-h-dvh">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
