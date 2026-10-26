/* AMIA OS — service worker tối giản và an toàn:
 * - Tài nguyên tĩnh bất biến (/_next/static, biểu tượng, phông): lấy từ bộ nhớ đệm trước, có thì khỏi tải lại.
 * - Trang (điều hướng): luôn hỏi mạng trước (dữ liệu y tế/tiền không bao giờ phục vụ bản cũ); mất mạng mới hiện trang dự phòng.
 * - API, hành động máy chủ, mọi yêu cầu không phải GET: không đụng tới. */
const BO_NHO = "amia-os-v1";
const DU_PHONG = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(BO_NHO).then((c) => c.addAll([DU_PHONG, "/icon-192.png"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== BO_NHO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).catch(() => caches.match(DU_PHONG)));
    return;
  }
  if (u.pathname.startsWith("/_next/static/") || /\.(?:png|jpg|svg|ico|woff2?)$/.test(u.pathname)) {
    e.respondWith(caches.open(BO_NHO).then(async (c) => {
      const co = await c.match(r);
      if (co) return co;
      const moi = await fetch(r);
      if (moi.ok) c.put(r, moi.clone());
      return moi;
    }));
  }
});
