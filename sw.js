/* Atıl Hukuk Hesaplama Araçları: çevrimdışı çalışma.
   Giriş sayfası ve şifreli içerik: önce ağdan (güncel sürüm), ağ yoksa saklanan kopya. Diğer dosyalar: önce saklanan kopya. */
var SURUM = "e15aa3ae3187";
var ONBELLEK = "atil-hesaplama-v2";
var IC = ["./", "icerik.json", "kilit.json", "manifest.webmanifest", "jspdf.umd.min.js", "jspdf.plugin.autotable.min.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(ONBELLEK).then(function (c) { return c.addAll(IC); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== ONBELLEK; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var q = e.request; if (q.method !== "GET") return;
  var u = new URL(q.url), ayni = u.origin === self.location.origin, ad = u.pathname.split("/").pop();
  var sayfa = q.mode === "navigate" || (ayni && (ad === "" || ad === "index.html"));
  if (sayfa || (ayni && (ad === "icerik.json" || ad === "kilit.json"))) {
    var anahtar = sayfa ? "./" : ad;
    e.respondWith(fetch(q, { cache: "no-store" }).then(function (r) {
      if (r && r.ok) { var k = r.clone(); caches.open(ONBELLEK).then(function (c) { c.put(anahtar, k); }); }
      return r;
    }).catch(function () { return caches.match(anahtar).then(function (r) { return r || caches.match(q); }); }));
    return;
  }
  var dis = /(^|\.)fonts\.googleapis\.com$|(^|\.)fonts\.gstatic\.com$/.test(u.hostname);
  if (ayni || dis) {
    e.respondWith(caches.match(q).then(function (r) {
      var ag = fetch(q).then(function (y) { if (y && (y.ok || y.type === "opaque")) { var k = y.clone(); caches.open(ONBELLEK).then(function (c) { c.put(q, k); }); } return y; });
      return r || ag;
    }));
  }
});
