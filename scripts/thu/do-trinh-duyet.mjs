// Dùng: [BASE=...] node scripts/thu/do-trinh-duyet.mjs /trang1 /trang2 (cần Google Chrome; tài khoản tạm vai Chủ, tự xoá)
// Đo thời gian trình duyệt hiện xong (Chrome headless qua CDP): đăng nhập tài khoản tạm Chủ, mở từng trang, đọc
// responseStart (TTFB), domContentLoaded, load và thời điểm hết "aria-busy" (khung xương stream đã thay bằng dữ liệu). Mỗi trang đo 2 lần, lấy lần sau (đã có JS trong bộ nhớ).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdtempSync } from "node:fs";
import { spawn } from "node:child_process";
const BASE = process.env.BASE ?? "https://amia-os-neon.vercel.app";
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const k = l.indexOf("="); return [l.slice(0, k), l.slice(k + 1).replace(/^"|"$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY);
const prof = mkdtempSync(process.env.TMPDIR + "/cdp-");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${prof}`, "--no-first-run", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
let uid, nvId;
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let ws; for (let i = 0; i < 40 && !ws; i++) { await ngu(250); try { const l = await (await fetch("http://127.0.0.1:9333/json/list")).json(); const p = l.find((x) => x.type === "page"); if (p) ws = p.webSocketDebuggerUrl; } catch {} }
  const s = new WebSocket(ws); await new Promise((r) => (s.onopen = r));
  let id = 0; const cho = new Map(); const su = [], tat = [], tatLog = []; // tat: mọi sự kiện mạng từ đầu (để soi yêu cầu còn treo)
  s.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); } else if (m.method) { su.push(m); if (m.method.startsWith("Network.")) tat.push(m); if (m.method === "Runtime.exceptionThrown") tatLog.push("EXC " + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 200)); if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) tatLog.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200)); } };
  const g = (method, params = {}) => new Promise((r) => { const i = ++id; cho.set(i, r); s.send(JSON.stringify({ id: i, method, params })); });
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-kiem-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  nvId = (await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ] Chủ kiểm trang", vai_tro: "chu", email }).select("id").single()).data.id;
  const ss = await createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(ss.data.session)).toString("base64url"); const parts = [];
  for (let j = 0; j < val.length; j += 3180) parts.push(val.slice(j, j + 3180));
  await g("Network.enable");
  for (const [j, p] of parts.entries()) await g("Network.setCookie", { name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${j}`, value: encodeURIComponent(p), url: BASE });
  await g("Page.enable"); await g("Runtime.enable");
  // KHONG_SW=1: bỏ qua service worker (so có/không SW).
  if (process.env.KHONG_SW) await g("Network.setBypassServiceWorker", { bypass: true });
  const doc = async (expr) => (await g("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
  // PREFETCH=1: mở từng trang, chờ 8 s, đếm các yêu cầu RSC trình duyệt tự bắn (prefetch link) — mỗi yêu cầu là một lượt máy chủ dựng khung + hỏi CSDL.
  if (process.env.PREFETCH) {
    for (const p of process.argv.slice(2)) {
      su.length = 0; await g("Page.navigate", { url: BASE + p }); await ngu(8000);
      const yc = su.filter((m) => m.method === "Network.requestWillBeSent" && m.params.request.url.includes("_rsc="));
      const nhom = new Map(); for (const m of yc) { const h = m.params.request.headers; const k = `${new URL(m.params.request.url).pathname.replace(/[0-9a-f-]{36}/, ":id")} [${h["Next-Router-Segment-Prefetch"] ?? h["next-router-segment-prefetch"] ?? (h["Next-Router-Prefetch"] ?? h["next-router-prefetch"] ? "prefetch" : "đầy đủ")}]`; nhom.set(k, (nhom.get(k) ?? 0) + 1); }
      console.log(`${p}: ${yc.length} yêu cầu RSC trong 8 s (tổng ${su.filter((m) => m.method === "Network.requestWillBeSent").length} yêu cầu)`, su.filter((m) => m.method === "Network.requestWillBeSent").slice(-6).map((m) => m.params.request.url.slice(-70))); for (const [k, n] of [...nhom].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`   ${String(n).padStart(3)} × ${k}`);
    }
    s.close(); process.exit(0);
  }
  // BAM=1: mở trang đầu tiên rồi BẤM link menu sang từng trang còn lại (chuyển trang trong app), đo từ lúc bấm tới khi URL đổi + hết khung xương.
  if (process.env.BAM) {
    const [dau, ...con] = process.argv.slice(2);
    const choXong = async (t0, path) => { for (let i = 0; i < 300; i++) { const v = await doc(`location.pathname + location.search === ${JSON.stringify(path)} && document.querySelector('main') && [...document.querySelectorAll('[aria-busy="true"]')].filter((e) => e.checkVisibility()).length === 0`); if (v) return Date.now() - t0; await ngu(20); } console.log("  lỗi/console:", tatLog.slice(-6));
    console.log("  RSC còn treo:", [...new Map(tat.filter((m) => m.method === "Network.requestWillBeSent" && !/\/_next\/static\//.test(m.params.request.url)).map((m) => [m.params.requestId, m])).values()].filter((m) => !tat.some((x) => (x.method === "Network.loadingFinished" || x.method === "Network.loadingFailed") && x.params.requestId === m.params.requestId)).map((m) => { const h = m.params.request.headers; const r = tat.find((x) => x.method === "Network.responseReceived" && x.params.requestId === m.params.requestId); return `${new URL(m.params.request.url).pathname}${new URL(m.params.request.url).search.slice(0, 20)}${h["Next-Router-Prefetch"] || h["next-router-prefetch"] ? " [prefetch]" : ""} gửi ${Math.round((Date.now() / 1000 - m.params.wallTime))}s trước, ${r ? "đã có byte đầu" : "chưa có byte đầu"}`; }));
    console.log("  chưa xong sau 6 s:", await doc(`JSON.stringify({ url: location.pathname + location.search, main: !!document.querySelector('main'), ban: [...document.querySelectorAll('[aria-busy="true"]')].filter((e) => e.checkVisibility()).map((e) => (e.getAttribute('aria-label') || e.tagName).slice(0, 50)) })`)); return null; };
    for (let vong = 0; vong < 2; vong++) {
      await g("Page.navigate", { url: BASE + dau }); await choXong(Date.now(), dau); await ngu(1500); // để link menu kịp prefetch như người dùng thật
      for (const p of con) {
        su.length = 0; const t0 = Date.now();
        const ok = await doc(`(() => { const a = [...document.querySelectorAll('a[href=${JSON.stringify(p)}]')].find((x) => x.checkVisibility()); if (!a) return false; a.click(); return true; })()`);
        const ms = ok ? await choXong(t0, p) : null;
        if (vong === 1) {
          // Yêu cầu RSC (?_rsc=) phát ra trong lúc chuyển trang: thời gian máy chủ trả byte đầu / xong, cỡ.
          const yc = new Map(); for (const m of su) { if (m.method === "Network.requestWillBeSent" && m.params.request.url.includes("_rsc=")) yc.set(m.params.requestId, { url: m.params.request.url, t: m.params.timestamp }); }
          const rsc = [...yc.entries()].map(([id, x]) => { const r = su.find((m) => m.method === "Network.responseReceived" && m.params.requestId === id); const f = su.find((m) => m.method === "Network.loadingFinished" && m.params.requestId === id);
            return `${new URL(x.url).pathname} byte-đầu ${r ? Math.round((r.params.timestamp - x.t) * 1000) : "?"}ms xong ${f ? Math.round((f.params.timestamp - x.t) * 1000) : "?"}ms ${f ? Math.round(f.params.encodedDataLength / 1024) : "?"}KB`; });
          console.log(`bấm ${dau} → ${p.padEnd(24)} ${ok ? (ms ?? ">6000") + " ms" : "không thấy link menu"}   RSC: ${rsc.join(" | ") || "không (đã có sẵn)"}`);
        }
        await ngu(800);
      }
    }
    s.close(); process.exit(0);
  }
  for (const p of process.argv.slice(2)) {
    let kq;
    for (let lan = 0; lan < 2; lan++) {
      su.length = 0;
      const t0 = Date.now(); await g("Page.navigate", { url: BASE + p });
      for (let i = 0; i < 300 && !su.some((m) => m.method === "Page.loadEventFired"); i++) await ngu(50);
      // chờ hết khung xương (aria-busy) tối đa 15 s
      let xong = null; for (let i = 0; i < 300; i++) { if (process.env.BUSY && i === 60) console.log("  sau 3 s còn bận:", await doc(`JSON.stringify({ url: location.pathname + location.search, ban: [...document.querySelectorAll('[aria-busy="true"]')].filter((e) => e.checkVisibility()).map((e) => (e.getAttribute("aria-label") || e.tagName).slice(0, 60)), rsc: performance.getEntriesByType("resource").filter((r) => r.name.includes("_rsc")).map((r) => r.name.replace(location.origin, "").slice(0, 60) + " " + Math.round(r.duration)) })`)); const b = await doc(`[...document.querySelectorAll('[aria-busy="true"]')].filter((e) => e.checkVisibility()).length`); if (b === 0) { xong = Date.now() - t0; break; } await ngu(50); }
      const nav = await doc(`JSON.stringify((() => { const n = performance.getEntriesByType("navigation")[0]; const r = (x) => Math.round(x); return { ttfb: r(n.responseStart), dcl: r(n.domContentLoadedEventEnd), load: r(n.loadEventEnd), ws: r(n.workerStart), fs: r(n.fetchStart), ce: r(n.connectEnd), rq: r(n.requestStart), sw: !!navigator.serviceWorker.controller }; })())`);
      kq = { ...JSON.parse(nav ?? "{}"), hien_xong: xong };
    }
    console.log(`${p.padEnd(34)} ttfb ${String(kq.ttfb).padStart(5)}  dcl ${String(kq.dcl).padStart(5)}  load ${String(kq.load).padStart(5)}  hiện xong ${String(kq.hien_xong ?? ">15000").padStart(5)} ms  [sw ${kq.sw ? "có" : "không"} workerStart ${kq.ws} fetchStart ${kq.fs} connectEnd ${kq.ce} requestStart ${kq.rq}]`);
  }
  s.close();
} finally {
  chrome.kill();
  // Xoá nhân viên tạm (thử lại vì lúc CSDL bận có thể hết giờ); không xoá được thì khoá lại và báo, để không sót tài khoản Chủ còn mở.
  if (nvId) { let r; for (let k = 0; k < 3; k++) { r = await db.from("nhan_vien").delete().eq("id", nvId); if (!r.error) break; await new Promise((x) => setTimeout(x, 2000)); }
    if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); console.error("CẢNH BÁO: chưa xoá được nhân viên tạm", nvId, r.error.message, "→ đã khoá (hoat_dong=false)"); } }
  if (uid) await db.auth.admin.deleteUser(uid);
}
