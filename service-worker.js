const CACHE_NAME = 'shopping-memo-v5';
const ASSETS = [
  '/workflow/',
  '/workflow/index.html',
  '/workflow/style.css',
  '/workflow/app.js',
  '/workflow/manifest.webmanifest',
  '/workflow/icons/icon-192.png',
  '/workflow/icons/icon-512.png',
];

// インストール: 静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// アクティベート: 旧キャッシュをすべて削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// フェッチ: キャッシュ優先、なければネットワーク
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
