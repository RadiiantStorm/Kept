import type { MetadataRoute } from "next";

/**
 * Lets a browser install Kept as a standalone window with its own icon, so it
 * stops looking like a tab. Nothing here changes how the app runs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kept",
    short_name: "Kept",
    description: "What the things you bought actually cost you.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0c0e12",
    theme_color: "#0c0e12",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
