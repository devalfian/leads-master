import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The Cloudflare Workers build (OpenNext) handles bundling of the server runtime.
  // No Node-only packages are required by the server: D1 is used through bindings
  // and the local development driver uses a dynamic import of `node:sqlite`.
  serverExternalPackages: [],

  /**
   * The service worker must never be served from a stale cache, or a released
   * update would not reach devices that already installed the app.
   * `Service-Worker-Allowed` lets the worker at `/sw.js` control the whole origin.
   *
   * These headers cover `next dev` and `next start`. In the Workers deployment the
   * assets are served by the ASSETS binding, which reads `public/_headers`.
   */
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
};

export default nextConfig;
