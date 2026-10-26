/* AMIA OS — service worker tối giản và an toàn:
 * - Tài nguyên tĩnh bất biến (/_next/static, biểu tượng, phông): lấy từ bộ nhớ đệm trước, có thì khỏi tải lại.
 * - Trang (điều hướng): luôn hỏi mạng trước (dữ liệu y tế/tiền không bao giờ phục vụ bản cũ); mất mạng mới hiện trang dự phòng.
 * - API, hành động máy chủ, mọi yêu cầu không phải GET: không đụng tới. */
const BO_NHO = "amia-os-v2";
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

/* Thông báo đẩy: máy chủ gửi {tieuDe, noiDung, url, tag}. Chạm vào thì mở/tập trung vào AMIA đúng trang. */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { noiDung: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.tieuDe || "AMIA OS", {
    body: d.noiDung || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: d.tag || undefined, renotify: !!d.tag,
    data: { url: d.url || "/trang-chu" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/trang-chu", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ds) => {
    const co = ds.find((c) => c.url.startsWith(self.location.origin));
    return co ? co.focus().then((c) => ("navigate" in c ? c.navigate(url) : c)) : self.clients.openWindow(url);
  }));
});
