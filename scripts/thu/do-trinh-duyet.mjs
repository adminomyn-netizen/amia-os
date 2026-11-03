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
  let id = 0; const cho = new Map(); const su = [];
  s.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); } else if (m.method) su.push(m); };
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
  const doc = async (expr) => (await g("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
  for (const p of process.argv.slice(2)) {
    let kq;
    for (let lan = 0; lan < 2; lan++) {
      su.length = 0;
      const t0 = Date.now(); await g("Page.navigate", { url: BASE + p });
      for (let i = 0; i < 300 && !su.some((m) => m.method === "Page.loadEventFired"); i++) await ngu(50);
      // chờ hết khung xương (aria-busy) tối đa 15 s
      let xong = null; for (let i = 0; i < 300; i++) { const b = await doc(`[...document.querySelectorAll('[aria-busy="true"]')].filter((e) => e.checkVisibility()).length`); if (b === 0) { xong = Date.now() - t0; break; } await ngu(50); }
      const nav = await doc(`JSON.stringify((() => { const n = performance.getEntriesByType("navigation")[0]; return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; })())`);
      kq = { ...JSON.parse(nav ?? "{}"), hien_xong: xong };
    }
    console.log(`${p.padEnd(34)} ttfb ${String(kq.ttfb).padStart(5)}  dcl ${String(kq.dcl).padStart(5)}  load ${String(kq.load).padStart(5)}  hiện xong ${String(kq.hien_xong ?? ">15000").padStart(5)} ms`);
  }
  s.close();
} finally {
  chrome.kill();
  if (nvId) await db.from("nhan_vien").delete().eq("id", nvId);
  if (uid) await db.auth.admin.deleteUser(uid);
}
