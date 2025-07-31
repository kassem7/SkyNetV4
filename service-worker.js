const cacheName = "sky-net-cache-v2";
const fallbackPage = "./offline.html";

const assets = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style/style.css",
  "./script/script.js",
  fallbackPage,
  "./img/logo.png",
  // صور البطاقات من 1 إلى 22
  ...Array.from({ length: 22 }, (_, i) => `./img/card${i + 1}.png`)
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        return caches.open(cacheName).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() =>
        caches.match(event.request).then(res =>
          res || caches.match(fallbackPage)
        )
      )
  );
});