// Chạy THẬT nối đợt 2 (03/11/2026): việc 2 quyền Đảo phiếu sổ quỹ (Kế toán có, Quản lý không), việc 4 hoá đơn đã xuất HĐĐT không hiện nút Sửa,
// việc 5 Thanh toán từ lịch nhiều khách gom 1 hoá đơn + số khách + cờ khách mới, việc 6 thẻ SalonHero bật sửa giá hiện ô sửa đơn giá, việc 7 cột ví ở Excel + trang chủ/tổng quan.
// Dữ liệu thử tiền tố [THỬ-NOI]; hoá đơn thử HUỶ cuối (dòng hoàn triệt tiêu); phiếu sổ quỹ thử được đảo (triệt tiêu). Dùng: node scripts/thu/thu-noi-dot2.mjs <thư mục ra> [BASE]
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
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9371, THU_MUC = mkdtempSync(join(tmpdir(), "amia-noi-"));
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const loiTest = [];
const kiem = (ten, dung, chiTiet = "") => { console.log(`${dung ? "ĐẠT" : "HỎNG"} · ${ten}${chiTiet ? " · " + chiTiet : ""}`); if (!dung) loiTest.push(ten); };
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}
import ExcelJS from "exceljs";

const TAI_KHOAN = []; let chrome, nhomId; const dvIds = [], hdIds = [], lichIds = [], soQuyIds = []; let khachId;
async function taoNguoi(vai, CN) {
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-noi-${vai}-${Date.now()}@amia-os.invalid`;
  const uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const r = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: `[THỬ-NOI] ${vai}`, vai_tro: vai, email, chi_nhanh_id: CN }).select("id").single();
  if (r.error) throw new Error("tạo nhân viên thử: " + r.error.message);
  TAI_KHOAN.push({ uid, nvId: r.data.id });
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  return { nvId: r.data.id, cookies: parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) })) };
}
try {
  const CN = (await db.from("chi_nhanh").select("id").eq("ma", "VINH").single()).data.id;
  const chu = await taoNguoi("chu", CN), keToan = await taoNguoi("ke_toan", CN), quanLy = await taoNguoi("quan_ly", CN);
  const kh = await db.from("khach_hang").insert({ ma: "KHNOI" + Date.now().toString().slice(-7), ho_ten: "[THỬ-NOI] Khách nhóm", dien_thoai: "09" + Date.now().toString().slice(-8), chi_nhanh_id: CN, nguoi_phu_trach_id: chu.nvId, nguon: "khac", ngay_sinh: "1990-01-01" }).select("id, ma").single();
  if (kh.error) throw new Error("khách thử: " + kh.error.message); khachId = kh.data.id;
  const nhomDv = (await db.from("dich_vu_nhom").select("id").limit(1).single()).data.id;
  for (const [ma, ten, gia] of [["NOI-DV1", "[THỬ-NOI] Dịch vụ khách 1", 300000], ["NOI-DV2", "[THỬ-NOI] Dịch vụ khách 2", 200000]]) {
    const r = await db.from("dich_vu").insert({ ma: ma + "-" + Date.now().toString().slice(-5), nhom_id: nhomDv, ten, gia, hoat_dong: true }).select("id").single(); if (r.error) throw new Error("dịch vụ thử: " + r.error.message); dvIds.push(r.data.id);
  }
  const bd = new Date(Date.now() + 3 * 3600e3), kt = new Date(bd.getTime() + 3600e3);
  const lich = await db.from("lich_hen").insert({ khach_id: khachId, chi_nhanh_id: CN, bat_dau: bd.toISOString(), ket_thuc: kt.toISOString(), trang_thai: "da_xac_nhan", nhan_vien_id: chu.nvId, so_khach: 2, ghi_chu: "[THỬ-NOI] lịch 2 khách" }).select("id").single();
  if (lich.error) throw new Error("lịch thử: " + lich.error.message); lichIds.push(lich.data.id);
  await db.from("lich_hen_dich_vu").insert({ lich_id: lich.data.id, dich_vu_id: dvIds[0], so_luong: 1 });
  const k2 = await db.from("lich_hen_khach").insert({ lich_id: lich.data.id, thu_tu: 2, ten: "Bạn đi cùng", dich_vu_ids: [dvIds[1]], nhan_vien_id: keToan.nvId });
  if (k2.error) throw new Error("khách 2: " + k2.error.message);

  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("Runtime.enable");
  const dangNhap = async (n) => { await c.gui("Network.clearBrowserCookies"); for (const k of n.cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE }); };
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const di = async (url) => { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 600 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(2000); };
  const chup = async (ten) => { const r = await c.gui("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const cho = async (dk, ms = 20000) => { for (let i = 0; i < ms / 250; i++) { if (await ev(dk)) return true; await doi(250); } return false; };
  const chu_ = () => ev("document.body.textContent");
  const J = JSON.stringify;
  const bam = (text, trongHop = false) => ev(`(() => { const goc = ${trongHop} ? document.querySelector('[role=dialog]') : document; const b = [...(goc ?? document).querySelectorAll('button, a')].filter((x) => x.textContent.trim() === ${J(text)}).pop(); if (!b) return false; b.click(); return true; })()`);
  const go = (sel, v) => ev(`(() => { const e = ${sel}; if (!e) return false; const p = e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(e, ${J(v)}); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  const tran = () => ev(`document.documentElement.scrollWidth > window.innerWidth + 1`);
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // ───── Việc 5: lịch 2 khách → MỘT hoá đơn ─────  (--bo-5: bỏ qua việc 5 + 4, không tạo hoá đơn thử)
  await dangNhap(chu);
  let hdId = null;
  if (!process.argv.includes("--bo-5")) {
  await di(`/ban-hang?lich=${lich.data.id}`);
  await cho(`[...document.querySelectorAll('[aria-label^="Bỏ "]')].filter((b) => b.getAttribute('aria-label').includes('[THỬ-NOI]')).length >= 2`, 40000);
  const dong = await ev(`[...document.querySelectorAll('[aria-label^="Bỏ "]')].map((b) => b.getAttribute('aria-label')).filter((x) => x.includes('[THỬ-NOI]'))`);
  kiem("Giỏ có dịch vụ của cả 2 khách", dong?.length === 2, J(dong));
  const soKhach = await ev(`[...document.querySelectorAll('input[id^="so-khach-"]')].map((x) => x.value)`);
  kiem("Ô Số khách = 2", soKhach?.[0] === "2", J(soKhach));
  await chup("5-gio-lich-nhom");
  await bam("Thêm khoản thu"); await doi(400);
  await go(`[...document.querySelectorAll('[aria-label="Số tiền thu"]')].pop()`, "500000"); await doi(300);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith("Chốt đơn")).click()`);
  for (let i = 0; i < 160 && !hdId; i++) { await doi(250); hdId = (await db.from("hoa_don").select("id").eq("khach_id", khachId).eq("trang_thai", "hoan_thanh").maybeSingle()).data?.id ?? null; if (!hdId && await ev(`!!document.querySelector('[role=tabpanel]:not([hidden]) [role=alert]')`)) break; }
  const loiChot = hdId ? "" : await ev(`document.querySelector('[role=tabpanel]:not([hidden]) [role=alert]')?.textContent ?? "?"`);
  kiem("Chốt hoá đơn nhóm", !!hdId, loiChot);
  if (!hdId) throw new Error("không có hoá đơn");
  hdIds.push(hdId);
  const { data: hd } = await db.from("hoa_don").select("ma, tong_phai_thu, so_khach, khach_moi, lich_hen_id").eq("id", hdId).single();
  const { data: dd } = await db.from("hoa_don_dong").select("dich_vu_id, thanh_tien, dong_nhan_vien(nhan_vien_id, vai)").eq("hoa_don_id", hdId);
  kiem("Hoá đơn 500.000, số khách 2, gắn lịch, cờ khách mới", Number(hd.tong_phai_thu) === 500000 && hd.so_khach === 2 && hd.lich_hen_id === lich.data.id && hd.khach_moi === true, J(hd));
  const pv = (dv) => dd.find((d) => d.dich_vu_id === dv)?.dong_nhan_vien?.find((x) => x.vai === "phuc_vu")?.nhan_vien_id;
  kiem("Mỗi dòng giữ người thực hiện của khách đó", pv(dvIds[0]) === chu.nvId && pv(dvIds[1]) === keToan.nvId, J(dd));
  await di(`/hoa-don/${hdId}`);
  kiem("Trang hoá đơn có nhãn Khách mới", (await chu_()).includes("Khách mới"));

  // ───── Việc 4: đã xuất HĐĐT → không có nút Sửa, có lời giải thích; máy chủ cũng chặn ─────
  await db.from("hoa_don").update({ vat_hd_so: "0009999", vat_hd_ky_hieu: "C26TNO", vat_hd_luc: new Date().toISOString() }).eq("id", hdId);
  await di(`/hoa-don/${hdId}`);
  const t4 = await chu_();
  kiem("Đã xuất HĐĐT: ẩn nút Sửa hoá đơn, hiện lý do", !(await ev(`[...document.querySelectorAll('button')].some((b) => b.textContent.trim() === "Sửa hoá đơn")`)) && t4.includes("Không sửa được: đã xuất hoá đơn điện tử số 0009999"));
  const r4 = await db.rpc("mo_lai_hoa_don", { p_id: hdId, p_ly_do: "[THỬ-NOI] thử chặn", p_nguoi: chu.nvId });
  kiem("Máy chủ chặn sửa đơn đã xuất HĐĐT", !!r4.error && r4.error.message.includes("đã xuất hoá đơn điện tử"), r4.error?.message);
  await chup("4-hddt");
  await db.from("hoa_don").update({ vat_hd_so: null, vat_hd_ky_hieu: null, vat_hd_luc: null }).eq("id", hdId);
  await di(`/hoa-don/${hdId}`);
  kiem("Xoá số HĐĐT thì nút Sửa hoá đơn hiện lại", await ev(`[...document.querySelectorAll('button')].some((b) => b.textContent.trim() === "Sửa hoá đơn")`));
  }

  // ───── Việc 6: thẻ SalonHero bật sửa giá → ô sửa đơn giá ─────
  const { data: goi } = await db.from("goi_the").select("id, ten").eq("hoat_dong", true).eq("cho_sua_gia", true).not("sh_id", "is", null).eq("loai", "lan").order("ten").limit(1).single();
  await di("/ban-hang");
  await cho(`!!document.querySelector('[aria-label="Tìm trong danh mục"]')`, 40000);
  await ev(`[...document.querySelectorAll('button, [role=tab]')].find((b) => b.textContent.trim().startsWith("Thẻ và liệu trình"))?.click()`); await doi(800);
  await go(`document.querySelector('[aria-label="Tìm trong danh mục"]')`, goi.ten);
  let coThe = await cho(`[...document.querySelectorAll('button')].some((b) => b.textContent.includes(${J(goi.ten)}))`, 15000);
  if (!coThe) for (const t of await ev(`[...document.querySelectorAll('[aria-label="Danh mục bán"] [role=tab], [aria-label="Danh mục bán"] button')].map((x) => x.textContent.trim())`)) { await bam(t); await doi(400); if (await ev(`[...document.querySelectorAll('button')].some((b) => b.textContent.includes(${J(goi.ten)}))`)) { coThe = true; break; } }
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes(${J(goi.ten)}))?.click()`); await doi(700);
  kiem(`Thẻ SalonHero "${goi.ten}" có ô Sửa đơn giá ở Thu ngân`, await ev(`!!document.querySelector('[aria-label="Sửa đơn giá dòng"]')`));
  await chup("6-the-sua-gia"); // KHÔNG chốt

  // ───── Việc 7: cột ví ở Excel + trang chủ / tổng quan tải được ─────
  const layXlsx = async (url) => { const b64 = await ev(`fetch(${J(url)}).then((r) => r.ok ? r.arrayBuffer() : null).then((b) => b ? btoa(String.fromCharCode(...new Uint8Array(b))) : null)`); if (!b64) return null; const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Buffer.from(b64, "base64")); return wb.worksheets[0]; };
  const tieuDe = (ws) => (ws?.getRow(1).values ?? []).filter(Boolean).map(String);
  const x1 = tieuDe(await layXlsx("/api/xuat/doanh-thu?tu=2026-10-01&den=2026-11-03"));
  kiem("Excel doanh thu theo ngày có cột Momo/VNPay/Shopee Pay/GrabPay/Ví điện tử khác", ["Momo", "VNPay", "Shopee Pay", "GrabPay", "Ví điện tử khác"].every((k) => x1.includes(k)), J(x1));
  const ws2 = await layXlsx("/api/xuat/bao-cao?tab=doanh-thu&tu=2026-10-01&den=2026-11-03");
  const x2 = []; ws2?.eachRow((r) => { const v = (r.values ?? []).filter(Boolean).map(String); if (v.includes("Momo")) x2.push(...v); });
  kiem("Excel Báo cáo › Doanh thu có cột ví", ["Momo", "VNPay", "Shopee Pay", "GrabPay", "Ví điện tử khác"].every((k) => x2.includes(k)), J(x2.slice(0, 20)));
  await di("/trang-chu"); await cho(`document.body.innerHTML.includes("Cơ cấu thu")`, 45000);
  kiem("Trang chủ tải được, có Cơ cấu thu", (await ev("document.body.innerHTML")).includes("Cơ cấu thu"), (await chu_()).replace(/\s+/g, " ").slice(0, 300)); await chup("7-trang-chu");
  await di("/tong-quan?tab=doanh-thu"); await cho(`document.body.innerHTML.includes("Thực thu theo hình thức")`, 45000);
  kiem("Tổng quan tải được, có Thực thu theo hình thức", (await ev("document.body.innerHTML")).includes("Thực thu theo hình thức"), (await chu_()).replace(/\s+/g, " ").slice(0, 300)); await chup("7-tong-quan");

  // ───── Việc 2: Đảo phiếu sổ quỹ chỉ Kế toán (và Chủ) ─────
  const HOM_NAY = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const quyTm = (await db.from("quy").select("id").eq("chi_nhanh_id", CN).eq("loai", "tien_mat").single()).data.id;
  const pq = await db.from("so_quy").insert({ ma: "PTNOI" + Date.now().toString().slice(-6), quy_id: quyTm, loai: "thu", so_tien: 1000, noi_dung: "[THỬ-NOI] phiếu thử quyền đảo", nguoi_id: keToan.nvId }).select("id, ma").single();
  if (pq.error) throw new Error("phiếu thử: " + pq.error.message); soQuyIds.push(pq.data.id);
  const coNutDao = () => ev(`[...document.querySelectorAll('tr')].some((tr) => tr.textContent.includes(${J(pq.data.ma)}) && [...tr.querySelectorAll('button')].some((b) => b.textContent.trim() === "Đảo phiếu"))`);
  await dangNhap(quanLy); await di(`/tai-chinh/so-quy?tab=tien-mat&tu=${HOM_NAY}&den=${HOM_NAY}&cn=${CN}`);
  const qlThay = await cho(`document.body.textContent.includes(${J(pq.data.ma)})`, 30000);
  kiem("Quản lý: thấy phiếu nhưng KHÔNG có nút Đảo phiếu", qlThay && !(await coNutDao()), `thấy phiếu: ${qlThay} · ${(await chu_()).replace(/\s+/g, " ").slice(0, 300)}`); await chup("2-quan-ly");
  await dangNhap(keToan); await di(`/tai-chinh/so-quy?tab=tien-mat&tu=${HOM_NAY}&den=${HOM_NAY}&cn=${CN}`);
  kiem("Kế toán: có nút Đảo phiếu", await coNutDao());
  await ev(`[...document.querySelectorAll('tr')].find((tr) => tr.textContent.includes(${J(pq.data.ma)}))?.querySelectorAll('button').forEach((b) => { if (b.textContent.trim() === "Đảo phiếu") b.click(); })`); await doi(600);
  await go(`document.querySelector('[role=dialog] input:not([type=hidden])')`, "[THỬ-NOI] dọn phiếu thử"); await doi(200);
  await bam("Đảo phiếu", true); await doi(1200); if (await ev(`!!document.querySelector('[role=dialog]')`)) await bam("Đảo phiếu", true);
  let dao = null; for (let i = 0; i < 60 && !dao; i++) { await doi(300); dao = (await db.from("so_quy").select("id, ma").eq("phieu_goc_id", pq.data.id).maybeSingle()).data; }
  kiem("Kế toán đảo phiếu được (ghi dòng ngược)", !!dao, dao?.ma ?? "");
  if (dao) soQuyIds.push(dao.id);
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await dangNhap(chu); if (hdId) { await di(`/hoa-don/${hdId}`); kiem("Hoá đơn 390px không tràn ngang", !(await tran())); }
  await di("/trang-chu"); await doi(2000); kiem("Trang chủ 390px không tràn ngang", !(await tran()));
} catch (e) {
  kiem("chạy script", false, e.message);
} finally {
  for (const id of hdIds) {
    const { data: h } = await db.from("hoa_don").select("ma, trang_thai").eq("id", id).maybeSingle();
    if (h && h.trang_thai !== "huy") { const r = await db.rpc("huy_hoa_don", { p_id: id, p_ly_do: "[THỬ-NOI] dọn dữ liệu chạy thử", p_nguoi: TAI_KHOAN[0]?.nvId }); console.log("huỷ hoá đơn thử", h.ma, id, r.error?.message ?? "ok"); }
    const { data: t } = await db.from("thanh_toan").select("id, loai, so_tien").eq("hoa_don_id", id); console.log("  dòng thanh_toan (giữ, đã triệt tiêu):", (t ?? []).map((x) => `${x.id}:${x.loai}:${x.so_tien}`).join(", "));
  }
  console.log("phiếu sổ quỹ thử (giữ, triệt tiêu):", soQuyIds.join(", "));
  for (const n of TAI_KHOAN) await db.from("don_nhap").delete().eq("nguoi_lap_id", n.nvId);
  for (const id of lichIds) { const r = await db.from("lich_hen").delete().eq("id", id); if (r.error) console.log("lịch thử giữ (còn hoá đơn trỏ tới):", id, r.error.message); }
  if (khachId) { const r = await db.from("khach_hang").delete().eq("id", khachId); if (r.error) { await db.from("khach_hang").update({ ho_ten: "[THỬ-NOI] Khách thử (đã dùng chạy thử, không xoá được)" }).eq("id", khachId); console.log("khách thử giữ lại:", khachId); } }
  for (const id of dvIds) { const r = await db.from("dich_vu").delete().eq("id", id); if (r.error) { await db.from("dich_vu").update({ hoat_dong: false }).eq("id", id); console.log("dịch vụ thử ngừng dùng (giữ):", id); } }
  for (const n of TAI_KHOAN) { const r = await db.from("nhan_vien").delete().eq("id", n.nvId); if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", n.nvId); console.log("nhân viên thử giữ (hoat_dong=false):", n.nvId); } await db.auth.admin.deleteUser(n.uid); }
  console.log(`${loiTest.length ? "HỎNG: " + loiTest.join("; ") : "Tất cả ĐẠT"}`);
  chrome?.kill();
  process.exit(loiTest.length ? 1 : 0);
}
