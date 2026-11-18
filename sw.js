/* CampusBite service worker — app shell offline, live data always from network */
const VERSION = 'cb-v1';
const SHELL = [
  './', 'index.html', 'animations.css', 'animations.js', 'mascot.js',
  'theme-override.css', 'theme-override.js', 'role-access.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'offline.html'
];
// Never cache live backend traffic (auth + Firestore) — data must stay real-time.
const LIVE = /(firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebaseinstallations|googleapis\.com\/identitytoolkit|\/__\/auth)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (LIVE.test(url.href)) return;                       // straight to network

  if (req.mode === 'navigate') {                         // pages: network first, fall back to cache
    e.respondWith(fetch(req).then(r => { caches.open(VERSION).then(c => c.put('index.html', r.clone())); return r; })
      .catch(() => caches.match('index.html').then(r => r || caches.match('offline.html'))));
    return;
  }
  // everything else (own files, CDN scripts, food images): stale-while-revalidate
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) caches.open(VERSION).then(c => c.put(req, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
