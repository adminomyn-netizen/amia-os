// Chạy THẬT câu 6 đợt 2: thẻ bật "Sửa giá khi thanh toán" bán ở Thu ngân với đơn giá sửa; giá trị mỗi buổi theo giá thực. (Khung giống thu-ngan-dot2.mjs)
// Gốc khung: Chạy THẬT bằng Chrome không đầu — đợt 2 Thu ngân / hoá đơn (03/11/2026, y SalonHero):
//   câu 1 ví điện tử + loại ví ở Thu ngân, cột ví ở báo cáo ngày, quỹ ngân hàng tách theo tài khoản/ví;
//   câu 2 lùi ngày hoá đơn ở Thu ngân (doanh thu + khoản thu về ngày lùi);
//   câu 3 thu nợ bằng ví, điều chỉnh nợ (xoá nợ, chỉ Chủ), huỷ lần trả nợ chỉ dòng cuối; câu 7 in phiếu thu;
//   câu 4 (khi có cờ --sua) "Sửa" hoá đơn đã chốt = mở lại về nháp rồi chốt lại.
// Dữ liệu thử tiền tố [THỬ-TN]. Sổ cái chỉ-thêm: hoá đơn thử được HUỶ cuối (dòng hoàn triệt tiêu), id in ra để ghi báo cáo; khách/dịch vụ thử không xoá được thì đổi tên + ngừng dùng.
// Dùng: node scripts/thu/thu-ngan-the-sua-gia.mjs <thư mục ra> [BASE] [--sua]
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RA = process.argv[2]; if (!RA) { console.error("Thiếu thư mục ra"); process.exit(2); } mkdirSync(RA, { recursive: true });
const BASE = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "http://localhost:3105";
const SUA = process.argv.includes("--sua");
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY);
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9363, THU_MUC = mkdtempSync(join(tmpdir(), "amia-tn2-"));
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const loiTest = [];
const kiem = (ten, dung, chiTiet = "") => { console.log(`${dung ? "ĐẠT" : "HỎNG"} · ${ten}${chiTiet ? " · " + chiTiet : ""}`); if (!dung) loiTest.push(ten); };
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}

let chrome, uid, nvId, nhomId, dvId, khachId, goiId; const hdIds = [];
try {
  const CN = (await db.from("chi_nhanh").select("id").eq("ma", "VINH").single()).data.id;
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-tn2-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const ins0 = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ-TN] Chủ thử", vai_tro: "chu", email, chi_nhanh_id: CN }).select("id").single();
  if (ins0.error) throw new Error("tạo nhân viên thử: " + ins0.error.message); nvId = ins0.data.id;
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  const kh = await db.from("khach_hang").insert({ ma: "KHTN" + Date.now().toString().slice(-7), ho_ten: "[THỬ-TN] Khách thu ngân", dien_thoai: "09" + Date.now().toString().slice(-8), chi_nhanh_id: CN, nguoi_phu_trach_id: nvId, nguon: "khac", ngay_sinh: "1990-01-01" }).select("id, ma").single();
  if (kh.error) throw new Error("khách thử: " + kh.error.message); khachId = kh.data.id;
  const gt = await db.from("goi_the").insert({ ma: "TNT-" + Date.now().toString().slice(-6), ten: "[THỬ-TN] Thẻ 10 buổi sửa giá", loai: "lan", gia: 1000000, so_buoi: 10, cho_sua_gia: true, hoat_dong: true }).select("id").single();
  if (gt.error) throw new Error("gói thẻ thử: " + gt.error.message); goiId = gt.data.id;

  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("Runtime.enable");
  for (const k of cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE });
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const di = async (url) => { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 600 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(2000); };
  const chup = async (ten) => { const r = await c.gui("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const cho = async (dk, ms = 20000) => { for (let i = 0; i < ms / 250; i++) { if (await ev(dk)) return true; await doi(250); } return false; };
  const chu = () => ev("document.body.textContent"); // textContent: tiêu đề bảng viết hoa bằng CSS thì innerText ra "MOMO"
  const J = JSON.stringify;
  // Bấm nút có chữ đúng (cuối cùng trên trang — hộp thoại mở sau nằm cuối).
  const bam = (text, trongHop = false) => ev(`(() => { const goc = ${trongHop} ? document.querySelector('[role=dialog]') : document; const b = [...(goc ?? document).querySelectorAll('button, a')].filter((x) => x.textContent.trim() === ${J(text)}).pop(); if (!b) return false; b.click(); return true; })()`);
  const go = (sel, v) => ev(`(() => { const e = ${sel}; if (!e) return false; const p = e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(e, ${J(v)}); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  // Chọn trong ô Chon: nút theo aria-label (hoặc nhãn trong hộp thoại) → mục theo chữ.
  const chonO = async (selNut, nhan) => {
    const mo = await ev(`(() => { const b = ${selNut}; if (!b) return false; b.click(); return true; })()`); if (!mo) return false; await doi(300);
    return ev(`(() => { const o = [...document.querySelectorAll('[role=option]')].find((x) => x.textContent.trim() === ${J(nhan)}); if (!o) return false; o.click(); return true; })()`);
  };
  const nutTheoNhan = (nhan) => `(() => { const l = [...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.replace('*', '').trim().startsWith(${J(nhan)})); return l ? document.getElementById(l.htmlFor) : null; })()`;
  const luuHop = async (nhanLuu) => { await bam(nhanLuu, true); await cho(`!document.querySelector('[role=dialog]') || !!document.querySelector('[role=dialog] [role=alert]')`, 20000); await doi(1500); return ev(`document.querySelector('[role=dialog] [role=alert]')?.textContent ?? ""`); };
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // ───── Câu 6: bán thẻ (bật sửa giá) với đơn giá 800.000 thay vì 1.000.000 ─────
  await di("/ban-hang");
  await cho(`!!document.querySelector('[aria-label="Tìm khách"]')`, 40000);
  await go(`document.querySelector('[aria-label="Tìm khách"]')`, kh.data.ma);
  await cho(`[...document.querySelectorAll('button')].some((b) => b.textContent.includes("[THỬ-TN] Khách thu ngân"))`);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes("[THỬ-TN] Khách thu ngân")).click()`); await doi(800);
  await go(`document.querySelector('[aria-label="Tìm trong danh mục"]')`, "[THỬ-TN] Thẻ 10");
  const coThe = await cho(`[...document.querySelectorAll('button')].some((b) => b.textContent.includes("[THỬ-TN] Thẻ 10 buổi sửa giá"))`, 20000);
  if (!coThe) for (const t of await ev(`[...document.querySelectorAll('[aria-label="Danh mục bán"] [role=tab], [aria-label="Danh mục bán"] button')].map((x) => x.textContent.trim())`)) { await bam(t); await doi(400); if (await ev(`[...document.querySelectorAll('button')].some((b) => b.textContent.includes("[THỬ-TN] Thẻ 10 buổi sửa giá"))`)) break; }
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes("[THỬ-TN] Thẻ 10 buổi sửa giá")).click()`); await doi(600);
  kiem("Dòng thẻ có ô Sửa đơn giá", await ev(`!!document.querySelector('[aria-label="Sửa đơn giá dòng"]')`));
  await go(`document.querySelector('[aria-label="Sửa đơn giá dòng"]')`, "800000"); await doi(400);
  await bam("Thêm khoản thu"); await doi(400);
  await go(`[...document.querySelectorAll('[aria-label="Số tiền thu"]')].pop()`, "800000"); await doi(300);
  await chup("6-the-sua-gia");
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith("Chốt đơn")).click()`);
  let hdId = null; // chờ trạng thái hoan_thanh: hoá đơn được tạo trước, chốt sau
  for (let i = 0; i < 160 && !hdId; i++) { await doi(250); hdId = (await db.from("hoa_don").select("id").eq("khach_id", khachId).eq("trang_thai", "hoan_thanh").maybeSingle()).data?.id ?? null; if (!hdId && await ev(`!!document.querySelector('[role=tabpanel]:not([hidden]) [role=alert]')`)) break; }
  const loiChot = hdId ? "" : await ev(`document.querySelector('[role=tabpanel]:not([hidden]) [role=alert]')?.textContent ?? "?"`);
  kiem("Chốt đơn bán thẻ giá sửa", !!hdId, loiChot);
  if (!hdId) throw new Error("không có hoá đơn");
  hdIds.push(hdId);
  const { data: hd } = await db.from("hoa_don").select("tong_phai_thu, con_no").eq("id", hdId).single();
  const { data: dd } = await db.from("hoa_don_dong").select("don_gia, thanh_tien").eq("hoa_don_id", hdId);
  const { data: tk } = await db.from("the_khach").select("id, so_buoi_tong, gia_tri_buoi").eq("khach_id", khachId);
  kiem("Hoá đơn 800.000, dòng thẻ đơn giá 800.000", Number(hd.tong_phai_thu) === 800000 && Number(dd?.[0]?.thanh_tien) === 800000, JSON.stringify({ hd, dd }));
  kiem("Thẻ cấp 10 buổi, giá trị mỗi buổi 80.000 (theo giá thực)", tk?.length === 1 && Number(tk[0].so_buoi_tong) === 10 && Number(tk[0].gia_tri_buoi) === 80000, JSON.stringify(tk));
} catch (e) {
  kiem("chạy script", false, e.message);
} finally {
  // Hoá đơn thử có dòng sổ thu tiền (chỉ thêm) nên không xoá được: HUỶ để dòng hoàn triệt tiêu, ghi id ra báo cáo.
  for (const id of hdIds) {
    const { data: h } = await db.from("hoa_don").select("ma, trang_thai").eq("id", id).maybeSingle();
    if (h && h.trang_thai !== "huy") { const r = await db.rpc("huy_hoa_don", { p_id: id, p_ly_do: "[THỬ-TN] dọn dữ liệu chạy thử", p_nguoi: nvId }); console.log("huỷ hoá đơn thử", h.ma, id, r.error?.message ?? "ok"); }
    const { data: t } = await db.from("thanh_toan").select("id, loai, so_tien").eq("hoa_don_id", id); console.log("  dòng thanh_toan (giữ, đã triệt tiêu):", (t ?? []).map((x) => `${x.id}:${x.loai}:${x.so_tien}`).join(", "));
  }
  if (nvId) await db.from("don_nhap").delete().eq("nguoi_lap_id", nvId);
  if (khachId) { const r = await db.from("khach_hang").delete().eq("id", khachId); if (r.error) { await db.from("khach_hang").update({ ho_ten: "[THỬ-TN] Khách thử (đã dùng chạy thử, không xoá được)" }).eq("id", khachId); console.log("khách thử giữ lại:", khachId); } }
  if (goiId) { const r = await db.from("goi_the").delete().eq("id", goiId); if (r.error) { await db.from("goi_the").update({ hoat_dong: false }).eq("id", goiId); console.log("gói thẻ thử ngừng dùng (giữ):", goiId); } }
  if (dvId) { const r = await db.from("dich_vu").delete().eq("id", dvId); if (r.error) { await db.from("dich_vu").update({ hoat_dong: false }).eq("id", dvId); console.log("dịch vụ thử ngừng dùng (giữ):", dvId); } }
  if (nhomId) { const r = await db.from("dich_vu_nhom").delete().eq("id", nhomId); if (r.error) console.log("nhóm dịch vụ thử giữ (còn dịch vụ thử):", nhomId); }
  if (nvId) { const r = await db.from("nhan_vien").delete().eq("id", nvId); if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); console.log("nhân viên thử giữ (hoat_dong=false):", nvId); } }
  if (uid) await db.auth.admin.deleteUser(uid);
  console.log(`${loiTest.length ? "HỎNG: " + loiTest.join("; ") : "Tất cả ĐẠT"}`);
  chrome?.kill();
  process.exit(loiTest.length ? 1 : 0);
}
