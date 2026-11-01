/*
 * Service worker for the Call Playbooks workspace.
 *
 * Two responsibilities, and no more:
 *
 * 1. Keep the application shell and every page the user has already opened
 *    readable with no connection. Navigations and React Server Component
 *    payloads are network-first with a cache fallback, so a page is always as
 *    fresh as the connection allows and only falls back when it has to.
 * 2. Never interfere with writes. `/api/` is left entirely alone: offline writes
 *    are queued in IndexedDB by the app (`src/lib/offline`), which knows which
 *    requests can be replayed and gives each one an idempotency key. A service
 *    worker replaying a POST would duplicate calls.
 *
 * Bumping CACHE_VERSION drops every previous cache on activate.
 */

const CACHE_VERSION = "v2";
const SHELL_CACHE = `leads-master-shell-${CACHE_VERSION}`;
const PAGE_CACHE = `leads-master-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `leads-master-assets-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([SHELL_CACHE, PAGE_CACHE, ASSET_CACHE]);

const OFFLINE_URL = "/offline.html";

/** Small, stable files fetched on install so the shell exists before first use. */
const SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // A missing icon must not fail the whole install.
      await Promise.all(
        SHELL_ASSETS.map(async (url) => {
          try {
            /*
             * Fetch first, then cache through `put()` so the same-origin guard
             * applies here too. `cache.add()` would follow a Cloudflare Access
             * redirect and store the login page under `/offline.html` and the
             * icons, which is exactly what a session that expired during
             * install would produce.
             */
            const request = new Request(url, { cache: "reload" });
            await put(SHELL_CACHE, request, await fetch(request));
          } catch {
            /* ignore */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("leads-master-") && !CURRENT_CACHES.has(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/** Static build output is content-hashed, so a cache hit is always correct. */
const STATIC_PREFIXES = ["/_next/static/", "/_next/image"];
const STATIC_EXTENSIONS = /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|map)$/i;

function isStaticAsset(url) {
  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return true;
  return STATIC_EXTENSIONS.test(url.pathname);
}

/** Next.js fetches route payloads with `?_rsc=` or an `RSC` header. */
function isServerComponentRequest(request, url) {
  return request.headers.get("rsc") === "1" || url.searchParams.has("_rsc");
}

async function put(cacheName, request, response) {
  if (!response || !response.ok || response.status === 206) return;

  /*
   * Cloudflare Access answers a request whose session has expired with a
   * cross-origin redirect to its login page, which resolves to a `200` HTML
   * document. Caching that document under the URL the user asked for would
   * poison the cache: offline, `/leads` would render the Access login page
   * instead of the page they opened, and it would stay wrong until a request
   * succeeded again. Only same-origin responses are cacheable. Same-origin
   * redirects (`/` -> `/dashboard`) still match and are still cached.
   */
  try {
    if (new URL(response.url).origin !== self.location.origin) return;
  } catch {
    return;
  }

  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch {
    // Quota or an uncacheable response: serving fresh data still worked.
  }
}

async function networkFirst(cacheName, request, fallback) {
  try {
    const response = await fetch(request);
    await put(cacheName, request, response);
    return response;
  } catch (error) {
    const cached = await caches.match(request, { cacheName });
    if (cached) return cached;
    if (fallback) {
      const offline = await caches.match(fallback);
      if (offline) return offline;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await put(ASSET_CACHE, request, response);
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Writes and non-GET requests are the app's business, not the worker's.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(PAGE_CACHE, request, OFFLINE_URL));
    return;
  }

  if (isServerComponentRequest(request, url)) {
    // Falling back to the cached payload keeps client-side navigation working;
    // with no cached payload the fetch rejects and Next.js reloads the document,
    // which the navigation handler above can answer from the cache.
    event.respondWith(networkFirst(PAGE_CACHE, request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
