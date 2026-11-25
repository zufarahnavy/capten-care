/* Capten Care — service worker
 * Hanya menyimpan aset statis milik situs ini (HTML/CSS/JS/gambar) agar pembukaan berikutnya instan.
 * Permintaan ke Apps Script (API) & data pasien TIDAK PERNAH di-cache di sini.
 * Naikkan VERSI setiap kali merilis frontend baru. */
var VERSI = 'cc-2.0.0';
var INTI = ['./', 'index.html', 'css/style.css?v=2.0.0', 'js/config.js?v=2.0.0', 'js/ikon.js?v=2.0.0', 'js/core.js?v=2.0.0',
  'js/hal-utama.js?v=2.0.0', 'js/hal-layanan.js?v=2.0.0', 'js/hal-data.js?v=2.0.0', 'js/hal-bisnis.js?v=2.0.0', 'js/hal-sistem.js?v=2.0.0',
  'assets/logo.svg', 'assets/icons/favicon.svg', 'manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(INTI).catch(function () { }); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSI; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;          // API GAS, font, CDN → langsung ke jaringan
  if (req.mode === 'navigate') {                                                 // halaman: jaringan dulu, cadangan cache saat offline
    e.respondWith(fetch(req).then(function (r) { var k = r.clone(); caches.open(VERSI).then(function (c) { c.put('index.html', k); }); return r; }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {                         // aset: cache dulu, segarkan di belakang
    var net = fetch(req).then(function (r) { if (r && r.ok) { var k = r.clone(); caches.open(VERSI).then(function (c) { c.put(req, k); }); } return r; }).catch(function () { return hit; });
    return hit || net;
  }));
});
