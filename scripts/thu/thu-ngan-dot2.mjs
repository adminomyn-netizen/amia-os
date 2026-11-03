// Chạy THẬT bằng Chrome không đầu — đợt 2 Thu ngân / hoá đơn (03/11/2026, y SalonHero):
//   câu 1 ví điện tử + loại ví ở Thu ngân, cột ví ở báo cáo ngày, quỹ ngân hàng tách theo tài khoản/ví;
//   câu 2 lùi ngày hoá đơn ở Thu ngân (doanh thu + khoản thu về ngày lùi);
//   câu 3 thu nợ bằng ví, điều chỉnh nợ (xoá nợ, chỉ Chủ), huỷ lần trả nợ chỉ dòng cuối; câu 7 in phiếu thu;
//   câu 4 (khi có cờ --sua) "Sửa" hoá đơn đã chốt = mở lại về nháp rồi chốt lại.
// Dữ liệu thử tiền tố [THỬ-TN]. Sổ cái chỉ-thêm: hoá đơn thử được HUỶ cuối (dòng hoàn triệt tiêu), id in ra để ghi báo cáo; khách/dịch vụ thử không xoá được thì đổi tên + ngừng dùng.
// Dùng: node scripts/thu/thu-ngan-dot2.mjs <thư mục ra> [BASE] [--sua]
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

let chrome, uid, nvId, nhomId, dvId, khachId; const hdIds = [];
try {
  const CN = (await db.from("chi_nhanh").select("id").eq("ma", "VINH").single()).data.id;
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-tn2-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const ins0 = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ-TN] Chủ thử", vai_tro: "chu", email, chi_nhanh_id: CN }).select("id").single();
  if (ins0.error) throw new Error("tạo nhân viên thử: " + ins0.error.message); nvId = ins0.data.id;
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  nhomId = (await db.from("dich_vu_nhom").insert({ ten: "[THỬ-TN] Nhóm " + Date.now().toString().slice(-6), thu_tu: 996 }).select("id").single()).data.id;
  const dv = await db.from("dich_vu").insert({ nhom_id: nhomId, ma: "TN2-" + Date.now().toString().slice(-6), ten: "[THỬ-TN] Dịch vụ thu ngân", gia: 300000, don_vi_tinh: "lần", thoi_luong_phut: 30, hoat_dong: true }).select("id").single();
  if (dv.error) throw new Error("dịch vụ thử: " + dv.error.message); dvId = dv.data.id;
  const kh = await db.from("khach_hang").insert({ ma: "KHTN" + Date.now().toString().slice(-7), ho_ten: "[THỬ-TN] Khách thu ngân", dien_thoai: "09" + Date.now().toString().slice(-8), chi_nhanh_id: CN, nguoi_phu_trach_id: nvId, nguon: "khac", ngay_sinh: "1990-01-01" }).select("id, ma").single();
  if (kh.error) throw new Error("khách thử: " + kh.error.message); khachId = kh.data.id;

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

  // ───── Câu 1 + 2: Thu ngân — khách, dịch vụ, khoản thu Ví Momo, lùi ngày ─────
  await di("/ban-hang");
  await cho(`!!document.querySelector('[aria-label="Tìm khách"]')`, 40000);
  await go(`document.querySelector('[aria-label="Tìm khách"]')`, kh.data.ma);
  await cho(`[...document.querySelectorAll('button')].some((b) => b.textContent.includes("[THỬ-TN] Khách thu ngân"))`);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes("[THỬ-TN] Khách thu ngân")).click()`); await doi(800);
  await cho(`[...document.querySelectorAll('button')].some((b) => b.textContent.includes("[THỬ-TN] Dịch vụ thu ngân"))`, 30000);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes("[THỬ-TN] Dịch vụ thu ngân")).click()`); await doi(600);
  await bam("Thêm khoản thu"); await doi(400);
  kiem("Ô phương thức có Ví điện tử + Ship COD", await chonO(`[...document.querySelectorAll('[aria-label="Phương thức"]')].pop()`, "Ví điện tử"));
  await doi(300);
  kiem("Chọn loại ví Momo", await chonO(`document.querySelector('[aria-label="Loại ví điện tử"]')`, "Momo"));
  await go(`[...document.querySelectorAll('[aria-label="Số tiền thu"]')].pop()`, "100000"); await doi(300);
  // Lùi ngày hoá đơn: bút → ô ngày giờ.
  kiem("Có cây bút sửa Ngày hoá đơn", await ev(`(() => { const b = document.querySelector('[aria-label="Sửa ngày hoá đơn"]'); if (!b) return false; b.click(); return true; })()`));
  await doi(300);
  const maxNgay = await ev(`document.querySelector('[aria-label="Ngày hoá đơn (chỉ lùi)"]')?.max ?? ""`);
  kiem("Ô ngày hoá đơn có max = bây giờ (chỉ lùi)", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(maxNgay), maxNgay);
  await go(`document.querySelector('[aria-label="Ngày hoá đơn (chỉ lùi)"]')`, "2026-10-20T09:30"); await doi(200); await bam("Xong"); await doi(300);
  kiem("Dải thông tin hiện ngày lùi", (await chu()).includes("09:30 20/10/2026 (lùi ngày)"));
  await chup("1-thu-ngan-vi-lui-ngay");
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await doi(800);
  kiem("Thu ngân 390px không tràn ngang", !(await ev("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"))); await chup("1b-thu-ngan-390");
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }); await doi(500);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith("Chốt đơn")).click()`);
  // Chốt xong Thu ngân ở lại trang, hiện khung "đã chốt" — tìm hoá đơn của khách thử trong DB.
  let hdId = null; // chờ trạng thái hoan_thanh: hoá đơn được tạo trước, chốt sau
  for (let i = 0; i < 160 && !hdId; i++) { await doi(250); hdId = (await db.from("hoa_don").select("id").eq("khach_id", khachId).eq("trang_thai", "hoan_thanh").maybeSingle()).data?.id ?? null; if (!hdId && await ev(`!!document.querySelector('[role=tabpanel]:not([hidden]) [role=alert]')`)) break; }
  const loiChot = hdId ? "" : await ev(`document.querySelector('[role=tabpanel]:not([hidden]) [role=alert]')?.textContent ?? "?"`);
  kiem("Chốt đơn thành công", !!hdId, loiChot);
  if (!hdId) throw new Error("không có hoá đơn");
  hdIds.push(hdId); await doi(1000); await chup("1c-da-chot");
  const { data: h1 } = await db.from("hoa_don").select("ma, ngay_hd, tao_luc, con_no, trang_thai").eq("id", hdId).single();
  const { data: tt1 } = await db.from("thanh_toan").select("id, ngay, phuong_thuc, loai_vi, so_tien, so_phieu").eq("hoa_don_id", hdId);
  kiem("Câu 2: ngày hoá đơn = 20/10/2026, tạo lúc 09:30 giờ VN", h1.ngay_hd === "2026-10-20" && new Date(h1.tao_luc).toISOString() === "2026-10-20T02:30:00.000Z", `${h1.ngay_hd} ${h1.tao_luc}`);
  kiem("Câu 1+2: khoản thu Ví Momo 100.000 ghi ngày 20/10", tt1.length === 1 && tt1[0].phuong_thuc === "vi_dien_tu" && tt1[0].loai_vi === "MOMO" && tt1[0].ngay === "2026-10-20" && tt1[0].so_tien === 100000, J(tt1));
  kiem("Còn nợ 200.000", Number(h1.con_no) === 200000, String(h1.con_no));
  const { data: nk } = await db.from("nhat_ky_truy_cap").select("hanh_dong").eq("doi_tuong_id", hdId).eq("hanh_dong", "lui_ngay_hoa_don");
  kiem("Nhật ký lùi ngày có dòng", (nk ?? []).length === 1);
  const { data: bcNgay } = await db.rpc("bc_doanh_thu_ngay", { p_tu: "2026-10-20", p_den: "2026-10-20", p_cn: CN });
  kiem("Báo cáo ngày 20/10 có Doanh thu ≥ 300.000 (đơn lùi tính vào ngày lùi)", Number(bcNgay?.[0]?.doanh_thu ?? 0) >= 300000);

  // ───── Câu 3: thu nợ bằng ví ZaloPay trên trang hoá đơn ─────
  await di(`/hoa-don/${hdId}`);
  kiem("Trang hoá đơn hiện 'Ví điện tử · Momo' + số phiếu PT", (await chu()).includes("Ví điện tử · Momo") && /PT\d{6}/.test(await chu()));
  await bam("Thu nợ"); await cho(`!!document.querySelector('[role=dialog]')`);
  await chonO(nutTheoNhan("Phương thức"), "Ví điện tử"); await doi(300);
  kiem("Hộp thu nợ: chọn ví ZaloPay", await chonO(nutTheoNhan("Loại ví"), "Zalo Pay"));
  await go(`document.getElementById([...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.startsWith("Số tiền thu")).htmlFor)`, "50000");
  const l1 = await luuHop("Lưu"); kiem("Thu nợ 50.000 bằng Zalo Pay", !l1, l1);
  const { data: tn } = await db.from("thanh_toan").select("id, phuong_thuc, loai_vi, so_tien").eq("hoa_don_id", hdId).eq("so_tien", 50000);
  kiem("DB: dòng thu nợ ví ZALO", tn?.length === 1 && tn[0].loai_vi === "ZALO", J(tn));
  // Câu 7: in phiếu thu.
  if (tn?.[0]) {
    await di(`/in/phieu-thu/${tn[0].id}`);
    const tIn = await chu();
    kiem("Câu 7: phiếu thu có số PT, bằng chữ, nợ còn lại 150.000", tIn.includes("PHIẾU THU") && /PT\d{6}/.test(tIn) && tIn.includes("Năm mươi nghìn đồng") && tIn.includes("150.000"), tIn.replace(/\s+/g, " ").slice(0, 200));
    await chup("2-phieu-thu");
  }
  // Điều chỉnh nợ (chỉ Chủ): nợ 150.000 → 50.000.
  await di(`/hoa-don/${hdId}`);
  kiem("Chủ thấy nút Điều chỉnh nợ", await bam("Điều chỉnh nợ")); await cho(`!!document.querySelector('[role=dialog]')`);
  await go(`document.getElementById([...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.startsWith("Số nợ mới")).htmlFor)`, "50000");
  const l2a = await luuHop("Lưu điều chỉnh"); kiem("Thiếu lý do thì báo lỗi", /lý do/i.test(l2a), l2a);
  if (await ev(`!!document.querySelector('[role=dialog]')`)) {
    await go(`document.getElementById([...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.startsWith("Lý do điều chỉnh nợ")).htmlFor)`, "[THỬ-TN] khách khó khăn");
    const l2 = await luuHop("Lưu điều chỉnh"); kiem("Điều chỉnh nợ 150.000 → 50.000", !l2, l2);
  }
  const no2 = (await db.from("hoa_don").select("con_no, no_da_xoa").eq("id", hdId).single()).data;
  kiem("DB: còn nợ 50.000, đã xoá 100.000", Number(no2.con_no) === 50000 && Number(no2.no_da_xoa) === 100000, J(no2));
  await di(`/hoa-don/${hdId}`);
  const t3 = await chu();
  kiem("Lịch sử nợ: Xoá nợ + Trả nợ, chỉ 1 nút Huỷ", t3.includes("Lịch sử nợ") && t3.includes("Xoá nợ") && t3.includes("Trả nợ") && (await ev(`[...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === "Huỷ").length`)) === 1);
  await chup("3-lich-su-no");
  // Huỷ dòng cuối (xoá nợ) rồi huỷ lần trả nợ.
  await bam("Huỷ"); await cho(`!!document.querySelector('[role=dialog]')`); const l3 = await luuHop("Huỷ dòng này"); kiem("Huỷ lần xoá nợ", !l3, l3);
  await di(`/hoa-don/${hdId}`); await bam("Huỷ"); await cho(`!!document.querySelector('[role=dialog]')`); const l4 = await luuHop("Huỷ dòng này"); kiem("Huỷ lần trả nợ Zalo Pay", !l4, l4);
  const no3 = (await db.from("hoa_don").select("con_no, no_da_xoa, da_thu").eq("id", hdId).single()).data;
  const { data: dao } = await db.from("thanh_toan").select("ngay, phuong_thuc, loai_vi, so_tien, dao_cua_id").eq("hoa_don_id", hdId).eq("loai", "hoan");
  kiem("DB: nợ về 200.000; dòng hoàn đảo đúng ví ZALO, cùng ngày", Number(no3.con_no) === 200000 && Number(no3.no_da_xoa) === 0 && dao?.length === 1 && dao[0].loai_vi === "ZALO" && dao[0].dao_cua_id === tn?.[0]?.id, J({ no3, dao }));
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await di(`/hoa-don/${hdId}`);
  kiem("Trang hoá đơn 390px không tràn ngang", !(await ev("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"))); await chup("3b-hoa-don-390");
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // ───── Báo cáo ngày + sổ quỹ ngân hàng ─────
  await di(`/bao-cao?tab=doanh-thu&tu=2026-10-20&den=2026-10-20&cn=${CN}`);
  const tBc = await chu();
  kiem("Báo cáo ngày có cột Momo/VNPay/Shopee Pay/GrabPay/Ví điện tử khác", ["Momo", "VNPay", "Shopee Pay", "GrabPay", "Ví điện tử khác"].every((x) => tBc.includes(x)));
  await chup("4-bao-cao-ngay");
  await di(`/tai-chinh/so-quy?tab=ngan-hang&tu=2026-10-20&den=2026-10-20&cn=${CN}`);
  const tQ = await chu();
  kiem("Sổ quỹ ngân hàng có phần tách theo tài khoản / loại ví (Momo)", tQ.includes("theo tài khoản / loại ví"), tQ.includes("theo tài khoản") ? "" : tQ.slice(0, 200));

  // ───── Câu 4 (cờ --sua): Sửa hoá đơn đã chốt ─────
  if (SUA) {
    await di(`/hoa-don/${hdId}`);
    kiem("Có nút Sửa hoá đơn", await bam("Sửa hoá đơn")); await cho(`!!document.querySelector('[role=dialog]')`);
    await go(`document.getElementById([...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.startsWith("Lý do sửa")).htmlFor)`, "[THỬ-TN] sửa giá");
    await bam("Mở lại để sửa", true);
    await cho(`location.pathname === "/ban-hang" || !!document.querySelector('[role=dialog] [role=alert]')`, 30000);
    const lSua = await ev(`location.pathname === "/ban-hang" ? "" : document.querySelector('[role=dialog] [role=alert]')?.textContent ?? "?"`);
    kiem("Mở lại về nháp, chuyển sang Thu ngân", !lSua, lSua);
    const h4 = (await db.from("hoa_don").select("trang_thai, da_thu, con_no").eq("id", hdId).single()).data;
    kiem("DB: hoá đơn về nháp, tiền đã thu đảo hết (đã thu 0)", h4.trang_thai === "nhap" && Number(h4.da_thu) === 0, J(h4));
    await cho(`[...document.querySelectorAll('button')].some((b) => b.textContent.startsWith("Chốt đơn"))`, 30000);
    await doi(1500);
    kiem("Thu ngân mở đơn đang sửa (ghi rõ mã đơn)", (await chu()).includes(h1.ma));
    await chup("5-sua-hoa-don-thu-ngan");
    await bam("Thêm khoản thu"); await doi(300);
    await go(`[...document.querySelectorAll('[aria-label="Số tiền thu"]')].pop()`, "300000"); await doi(300);
    await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith("Chốt đơn")).click()`);
    await cho(`location.pathname.startsWith("/hoa-don/") || !!document.querySelector('[role=alert]')`, 40000);
    const lc = await ev(`location.pathname.startsWith("/hoa-don/") ? "" : document.querySelector('[role=alert]')?.textContent ?? "?"`);
    kiem("Chốt lại đơn đã sửa", !lc, lc);
    const h5 = (await db.from("hoa_don").select("id, ma, trang_thai, ngay_hd, con_no, da_thu").eq("id", hdId).single()).data;
    kiem("Cùng mã, cùng ngày 20/10, hoàn thành, đã thu 300.000", h5.ma === h1.ma && h5.trang_thai === "hoan_thanh" && h5.ngay_hd === "2026-10-20" && Number(h5.da_thu) === 300000 && Number(h5.con_no) === 0, J(h5));
  }
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
  if (dvId) { const r = await db.from("dich_vu").delete().eq("id", dvId); if (r.error) { await db.from("dich_vu").update({ hoat_dong: false }).eq("id", dvId); console.log("dịch vụ thử ngừng dùng (giữ):", dvId); } }
  if (nhomId) { const r = await db.from("dich_vu_nhom").delete().eq("id", nhomId); if (r.error) console.log("nhóm dịch vụ thử giữ (còn dịch vụ thử):", nhomId); }
  if (nvId) { const r = await db.from("nhan_vien").delete().eq("id", nvId); if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); console.log("nhân viên thử giữ (hoat_dong=false):", nvId); } }
  if (uid) await db.auth.admin.deleteUser(uid);
  console.log(`${loiTest.length ? "HỎNG: " + loiTest.join("; ") : "Tất cả ĐẠT"}`);
  chrome?.kill();
  process.exit(loiTest.length ? 1 : 0);
}
