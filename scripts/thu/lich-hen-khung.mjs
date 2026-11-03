// Khung chạy thử Lịch hẹn bằng Chrome không đầu (mẫu từ chup-blog.mjs): tạo tài khoản Chủ tạm, nạp cookie đăng nhập, mở trang thật ở BASE,
// và dọn sạch dữ liệu thử ([THỬ]) + tài khoản tạm khi xong. Dùng: import { batDau } from "./lich-hen-khung.mjs"; const k = await batDau(BASE); ...; await k.ketThuc();
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const doi = (ms) => new Promise((r) => setTimeout(r, ms));
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}

export async function batDau(BASE, { ra = "/tmp/lich-hen-thu", vaiTro = "chu", port = 9347 } = {}) {
  mkdirSync(ra, { recursive: true });
  const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
  const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
  const db = createClient(URL_, env[Object.keys(env).find((x) => /SERVICE/.test(x))]);
  const anonKey = env[Object.keys(env).find((x) => /ANON|PUBLISHABLE/.test(x))];
  const THU_MUC = mkdtempSync(join(tmpdir(), "amia-lh-"));
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-lich-${Date.now()}@amia-os.invalid`;
  const uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const { data: cn } = await db.from("chi_nhanh").select("id").eq("hoat_dong", true).order("thu_tu").order("ma").limit(1).single();
  const nv = (await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ] Chủ lịch hẹn", vai_tro: vaiTro, email }).select("id").single()).data;
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  for (const m of ["Page.enable", "Network.enable", "DOM.enable", "Runtime.enable"]) await c.gui(m);
  for (const k of cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE });
  const ev = async (expr) => { const r = await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "loi ev"); return r.result.value; };
  const di = async (url) => { const dich = url.split("?")[0]; for (let lan = 0; lan < 3; lan++) { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 200 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(1500); if ((await ev("location.pathname")) === dich) return; } throw new Error("không vào được " + url); };
  const chup = async (ten, full = true) => { const r = await c.gui("Page.captureScreenshot", { format: "png", captureBeyondViewport: full }); writeFileSync(join(ra, ten + ".png"), Buffer.from(r.data, "base64")); };
  const man = (w, h, mobile) => c.gui("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  const bam = (chu, goc = "button,a,[role=checkbox]") => ev(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(goc)})].find((b) => b.textContent.trim() === ${JSON.stringify(chu)} && b.offsetParent); if (!e) return "khong thay"; e.click(); return "ok"; })()`);
  const tran = () => ev("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1");
  const ketThuc = async (donThem) => {
    try { chrome.kill(); } catch {}
    try { await donThem?.(db, { cn: cn.id, nvId: nv.id }); } catch (e) { console.error("dọn thêm lỗi", e.message); }
    // nhat_ky_truy_cap chỉ-thêm: nếu có dòng gắn người này thì không xoá được → đặt hoat_dong=false
    const x = await db.from("nhan_vien").delete().eq("id", nv.id);
    if (x.error) await db.from("nhan_vien").update({ hoat_dong: false, email: null, user_id: null }).eq("id", nv.id);
    await db.auth.admin.deleteUser(uid);
    const dem = await db.from("nhan_vien").select("id", { count: "exact", head: true }).like("ho_ten", "[THỬ] Chủ lịch hẹn%").eq("hoat_dong", true);
    return `tài khoản thử còn hoạt động: ${dem.count}`;
  };
  return { db, c, ev, di, chup, man, bam, tran, ketThuc, doi, cn: cn.id, nvId: nv.id, uid };
}
