// Service Worker — Orchidées 2
const CACHE = "orchidees2-v1";
const OFFLINE_URL = "/offline";

// Assets to pre-cache
const PRECACHE = ["/", "/dashboard", "/login"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Only handle same-origin GET requests
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  // Skip API routes and Next.js internals
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful page responses
        if (res.ok && res.status < 300) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached ?? new Response("Hors ligne", { status: 503 }))
      )
  );
});
