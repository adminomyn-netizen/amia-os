// Xem bằng Chrome không đầu — Thu ngân đợt 3 (03/11/2026): CHỈ XEM, KHÔNG chốt đơn / không thu tiền (luật: không ghi tiền trên DB thật).
//   giảm % dòng, người giới thiệu theo dòng, ghi chú dòng, chia nợ theo dòng, tick đặt lịch tiếp + in sau khi hoàn thành, Chờ thanh toán, in tạm tính, bản in tiếng Anh.
// Dữ liệu thử: tài khoản Chủ tạm + khách "[THỬ]" (không có hoá đơn) — xoá hết cuối bài.
// Dùng: node scripts/thu/thu-ngan-dot3-xem.mjs <thư mục ra> [BASE]
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RA = process.argv[2]; if (!RA) { console.error("Thiếu thư mục ra"); process.exit(2); } mkdirSync(RA, { recursive: true });
const BASE = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "http://localhost:3105";
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY);
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9364, THU_MUC = mkdtempSync(join(tmpdir(), "amia-tn3-"));
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const loiTest = [];
const kiem = (ten, dung, chiTiet = "") => { console.log(`${dung ? "ĐẠT" : "HỎNG"} · ${ten}${chiTiet ? " · " + chiTiet : ""}`); if (!dung) loiTest.push(ten); };
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}

let chrome, uid, nvId, khachId;
try {
  const CN = (await db.from("chi_nhanh").select("id").eq("ma", "VINH").single()).data.id;
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-tn3-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const ins0 = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ-TN3] Chủ thử", vai_tro: "chu", email, chi_nhanh_id: CN }).select("id").single();
  if (ins0.error) throw new Error("tạo nhân viên thử: " + ins0.error.message); nvId = ins0.data.id;
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  const kh = await db.from("khach_hang").insert({ ma: "KHTN3" + Date.now().toString().slice(-6), ho_ten: "[THỬ] Khách thu ngân đợt 3", dien_thoai: "09" + Date.now().toString().slice(-8), chi_nhanh_id: CN, nguoi_phu_trach_id: nvId, nguon: "khac", ngay_sinh: "1990-01-01" }).select("id, ma").single();
  if (kh.error) throw new Error("khách thử: " + kh.error.message); khachId = kh.data.id;
  const hdIn = (await db.from("hoa_don").select("id, ma").eq("trang_thai", "hoan_thanh").eq("la_lich_su", true).not("thu_ngan_ten", "is", null).order("ngay_hd", { ascending: false }).limit(1).single()).data;

  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("Runtime.enable");
  for (const k of cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE });
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const di = async (url) => { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 600 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(2500); };
  const chup = async (ten) => { const r = await c.gui("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const cho = async (dk, ms = 20000) => { for (let i = 0; i < ms / 250; i++) { if (await ev(dk)) return true; await doi(250); } return false; };
  const chu = () => ev("document.body.textContent");
  const J = JSON.stringify;
  const bam = (text) => ev(`(() => { const b = [...document.querySelectorAll('button, a')].filter((x) => x.textContent.trim().startsWith(${J(text)})).pop(); if (!b) return false; b.click(); return true; })()`);
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // Thu ngân mở với khách thử, thêm 2 dịch vụ (KHÔNG chốt đơn).
  await di(`/ban-hang?khach=${khachId}`);
  for (const m of c.sk.filter((x) => x.method === "Runtime.exceptionThrown" || (x.method === "Runtime.consoleAPICalled" && x.params.type === "error"))) console.log("LỖI TRÌNH DUYỆT:", JSON.stringify(m.params).slice(0, 600));
  kiem("mở Thu ngân", await cho(`[...document.querySelectorAll('button[role=tab]')].some((b) => b.textContent.includes('[THỬ]'))`, 60000));
  await cho(`(() => { const b = [...document.querySelectorAll('section button.group')][0]; return !!b && Object.keys(b).some((k) => k.startsWith("__reactProps")); })()`, 30000);
  await ev(`(() => { const ds = [...document.querySelectorAll('section button.group')]; ds[0]?.click(); ds[1]?.click(); return ds.length; })()`);
  await doi(800);
  kiem("có ô Giảm % dòng", await ev(`document.querySelectorAll('[aria-label="Giảm % dòng"]').length === 2`));
  kiem("có nút Người giới thiệu + Ghi chú dòng", await ev(`(() => { const t = document.body.textContent; return t.includes('Người giới thiệu') && t.includes('Ghi chú dòng'); })()`));
  kiem("đơn còn nợ hiện 'Xác nhận các mục còn nợ'", (await chu()).includes("Xác nhận các mục còn nợ"));
  kiem("có tick Đặt lịch hẹn tiếp theo + In hoá đơn sau khi hoàn thành", await ev(`(() => { const t = document.body.textContent; return t.includes('Đặt lịch hẹn tiếp theo') && t.includes('In hoá đơn sau khi hoàn thành'); })()`));
  await bam("Ghi chú dòng"); await doi(400);
  kiem("mở ô ghi chú dòng", await ev(`!!document.querySelector('textarea[aria-label^="Ghi chú dòng"]')`));
  await bam("Người giới thiệu"); await cho(`!!document.querySelector('[role=dialog]')`, 8000);
  kiem("hộp Người giới thiệu có 3 nhóm", await ev(`(() => { const d = document.querySelector('[role=dialog]'); return !!d && ['Khách hàng','Nhân viên','Khác'].every((x) => d.textContent.includes(x)); })()`));
  await chup("thu-ngan-nguoi-gioi-thieu");
  await bam("Huỷ"); await doi(500);
  await chup("thu-ngan-dong-no");
  await bam("Chờ thanh toán"); await doi(2500);
  kiem("bấm Chờ thanh toán mở danh sách đơn đang xử lý", (await chu()).includes("Đơn đang xử lý của chi nhánh"));
  await chup("thu-ngan-cho-thanh-toan");
  // In trước khi chốt: ghi đơn tạm vào bộ nhớ rồi mở trang in tạm tính trong cùng tab.
  await bam("In hoá đơn"); await doi(800);
  await di("/in/tam-tinh");
  kiem("trang In tạm tính có dòng hàng", (await chu()).includes("Hoá đơn tạm tính"));
  await chup("in-tam-tinh");
  if (hdIn) {
    await di(`/in/hoa-don/${hdIn.id}?nn=en`);
    const t = await chu();
    kiem("bản in tiếng Anh", t.includes("Invoice") && t.includes("Subtotal"), hdIn.ma);
    kiem("bản in đơn SalonHero không còn 'Dữ liệu SalonHero'", !t.includes("Dữ liệu SalonHero"));
    await chup("in-hoa-don-tieng-anh");
  }
} catch (e) { console.error("LỖI", e.message); loiTest.push(e.message); }
finally {
  if (nvId) await db.from("don_nhap").delete().eq("nguoi_lap_id", nvId);
  if (khachId) { const r = await db.from("khach_hang").delete().eq("id", khachId); if (r.error) console.log("khách thử chưa xoá được:", khachId, r.error.message); }
  if (nvId) { const r = await db.from("nhan_vien").delete().eq("id", nvId); if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); console.log("nhân viên thử giữ (hoat_dong=false):", nvId); } }
  if (uid) await db.auth.admin.deleteUser(uid);
  console.log(`${loiTest.length ? "HỎNG: " + loiTest.join("; ") : "Tất cả ĐẠT"}`);
  chrome?.kill();
  process.exit(loiTest.length ? 1 : 0);
}
