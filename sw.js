/* Jarvis servis çalışanı: uygulama kabuğunu önbelleğe alır, API çağrılarına karışmaz. */
var SURUM = 'jarvis-v1';
var KABUK = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon-180.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SURUM).then(function (c) {
    return Promise.all(KABUK.map(function (u) { return c.add(u).catch(function () { /* eksik dosya kurulumu engellemesin */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== SURUM; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  var yazi = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (u.origin !== self.location.origin && !yazi) return;       // Gemini, hava, kur… doğrudan ağa gider
  if (r.mode === 'navigate') {
    e.respondWith(
      Promise.race([fetch(r), new Promise(function (_, red) { setTimeout(red, 4000); })])
        .then(function (yanit) { var k = yanit.clone(); caches.open(SURUM).then(function (c) { c.put('index.html', k); }); return yanit; })
        .catch(function () { return caches.match('index.html').then(function (m) { return m || caches.match('./'); }); })
    );
    return;
  }
  e.respondWith(caches.match(r).then(function (m) {
    var ag = fetch(r).then(function (yanit) {
      if (yanit && (yanit.ok || yanit.type === 'opaque')) { var k = yanit.clone(); caches.open(SURUM).then(function (c) { c.put(r, k); }); }
      return yanit;
    }).catch(function () { return m; });
    return m || ag;
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (l) { return l.length ? l[0].focus() : self.clients.openWindow('./'); }));
});
