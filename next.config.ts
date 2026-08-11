import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon: it must stay a real CommonJS require on the
  // server rather than being traced into the bundle.
  serverExternalPackages: ["better-sqlite3"],

  // A production build writes over the running dev server's chunks and breaks it.
  // Set KEPT_DIST_DIR to build somewhere else while `pnpm dev` is up.
  distDir: process.env.KEPT_DIST_DIR ?? ".next",
};

export default nextConfig;
