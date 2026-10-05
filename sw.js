/* Website Deals service worker — network first, so edits show up immediately.
   Falls back to the cache when offline. data/websites.json is never served stale. */
const CACHE_NAME = "website-deals-v6";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./wallpaper.html",
  "./packages.html",
  "./shared/site.css",
  "./shared/packages.js",
  "./shared/data.js",
  "./shared/store.js",
  "./presentation/index.html",
  "./package/index.html",
  "./icons/icon-192.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // live website previews stay live

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && !url.pathname.includes("/data/")) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
