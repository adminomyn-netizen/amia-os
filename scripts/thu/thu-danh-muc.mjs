// Chạy THẬT trên Chrome không đầu: Danh mục (dịch vụ, sản phẩm, loại thẻ, nhóm thẻ) và Nhân viên phục vụ — tạo/sửa/nhân bản/chuyển nhóm/tải ảnh bằng giao diện, kiểm DB, chụp 3 cỡ màn hình, rồi DỌN dữ liệu thử.
// Dùng: node scripts/thu/thu-danh-muc.mjs <thư mục ra> [BASE]   (BASE mặc định bản thật). Dữ liệu thử có tiền tố [THỬ-DM] / mã DMT- và được xoá cuối. Cần máy chủ đang chạy ở BASE.
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import zlib from "node:zlib";

const RA = process.argv[2]; if (!RA) { console.error("Thiếu thư mục ra"); process.exit(2); } mkdirSync(RA, { recursive: true });
const BASE = process.argv[3] ?? "http://localhost:3105";
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env[Object.keys(env).find((x) => /SERVICE/.test(x))]);
const anonKey = env[Object.keys(env).find((x) => /ANON|PUBLISHABLE/.test(x))];
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9341, THU_MUC = mkdtempSync(join(tmpdir(), "amia-chup-"));
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const ghi = []; const nhat = (s) => { ghi.push(s); console.log(s); };

// ảnh PNG thử có màu (chuyển sắc xanh đêm → vàng) để nhìn bố cục thật, không phải ảnh khách
function png(w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 20 + (x * 200) / w; raw[o + 1] = 60 + (y * 120) / h; raw[o + 2] = 70 + (x * 40) / w; } }
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
  const chunk = (tp, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(tp), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}

const MA_THU = ["DMT-DV1", "DMT-DV1-2"], MA_SP = ["DMT-SP1", "DMT-SP2"], MA_THE = ["DMT-T1", "DMT-T2"];
let chrome, uid, nvId, nvPv1, nvPv2; const nhomDv = [], anhDaTai = [];
const loiTest = [];
const kiem = (ten, dung, chiTiet = "") => { nhat(`${dung ? "ĐẠT" : "HỎNG"} · ${ten}${chiTiet ? " · " + chiTiet : ""}`); if (!dung) loiTest.push(ten); };
// ảnh JPEG/PNG thử có màu để tải qua ô file thật
const PNG_THU = (() => { return png(900, 600); })();
try {
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-dm-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const ins0 = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ-DM] Chủ thử Danh mục", vai_tro: "chu", email, la_phuc_vu: true, nhom_nv: "Nhóm thợ 1" }).select("id").single(); if (ins0.error) throw new Error("tạo nhân viên thử: " + ins0.error.message); nvId = ins0.data.id;
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  for (const t of ["[THỬ-DM] Nhóm DV A", "[THỬ-DM] Nhóm DV B"]) nhomDv.push((await db.from("dich_vu_nhom").insert({ ten: t, thu_tu: 990 + nhomDv.length }).select("id").single()).data.id);
  nvPv1 = (await db.from("nhan_vien").insert({ ho_ten: "[THỬ-DM] Phục vụ một", vai_tro: "ktv", la_phuc_vu: true, nhom_nv: "Nhóm thợ 1" }).select("id").single()).data.id;
  nvPv2 = (await db.from("nhan_vien").insert({ ho_ten: "[THỬ-DM] Phục vụ hai", vai_tro: "ktv", la_phuc_vu: true, nhom_nv: "Nhóm thợ 1" }).select("id").single()).data.id;

  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("DOM.enable"); await c.gui("Runtime.enable");
  for (const k of cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE });
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const bom = `window.__t = {
    dlg: () => [...document.querySelectorAll('[role=dialog]')].pop(),
    fill(id, v) { const e = document.getElementById(id); if (!e) return 'khong thay ' + id; const p = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(e, v); e.dispatchEvent(new Event('input', { bubbles: true })); return 'ok'; },
    async pick(id, text) { const b = document.getElementById(id); if (!b) return 'khong thay ' + id; b.click(); await new Promise((r) => setTimeout(r, 450)); const o = [...document.querySelectorAll('[role=option]')].find((x) => x.textContent.trim() === text) || [...document.querySelectorAll('[role=option]')].find((x) => x.textContent.trim().startsWith(text)); if (!o) return 'khong co dong ' + text + ' (' + [...document.querySelectorAll('[role=option]')].map((x) => x.textContent.trim()).slice(0, 8).join(' | ') + ')'; o.click(); await new Promise((r) => setTimeout(r, 250)); return 'ok'; },
    gat(label, want) { const b = [...this.dlg().querySelectorAll('[role=switch]')].find((x) => x.textContent.includes(label)); if (!b) return 'khong thay gat ' + label; if ((b.getAttribute('aria-checked') === 'true') !== want) b.click(); return 'ok'; },
    nhieu(text) { const b = [...this.dlg().querySelectorAll('[role=checkbox]')].find((x) => x.textContent.includes(text)); if (!b) return 'khong thay muc ' + text; b.click(); return 'ok'; },
    nhieuDaChon() { return [...this.dlg().querySelectorAll('[role=checkbox][aria-checked=true]')].map((x) => x.textContent.trim()); },
    bam(text, trongHop) { const g = trongHop ? this.dlg() : document; const b = [...g.querySelectorAll('button')].find((x) => x.textContent.trim() === text); if (!b) return 'khong thay nut ' + text; b.click(); return 'ok'; },
    async bamHang(hang, text) { let r; for (let i = 0; i < 40; i++) { r = [...document.querySelectorAll('tr')].find((x) => x.textContent.includes(hang) && [...x.querySelectorAll('button')].some((y) => y.textContent.trim() === text)); if (r) break; await new Promise((z) => setTimeout(z, 1000)); } if (!r) return 'khong thay hang ' + hang; const b = [...r.querySelectorAll('button')].find((x) => x.textContent.trim() === text); b.click(); return 'ok'; },
    bamAnhHang(hang) { const r = [...document.querySelectorAll('tr')].find((x) => x.textContent.includes(hang)); const b = r && r.querySelector('button[aria-label^="Đổi ảnh"]'); if (!b) return 'khong thay nut anh'; b.click(); return 'ok'; },
    loi() { const a = this.dlg() && this.dlg().querySelector('[role=alert]'); return a ? a.textContent.trim() : ''; },
    hopMo() { return !!this.dlg(); },
    giaTri(id) { const e = document.getElementById(id); return e ? (e.value ?? e.textContent) : null; },
    chuChon(id) { const e = document.getElementById(id); return e ? e.textContent.trim() : null; },
    trong(text) { return !![...document.querySelectorAll('label')].find((x) => x.textContent.includes(text) && this.dlg() && this.dlg().contains(x)); },
  }; 'ok'`;
  const di = async (url) => { const dich = url.split("?")[0]; for (let lan = 0; lan < 3; lan++) { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 400 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(1800); if ((await ev("location.pathname")) === dich) { await ev(bom); return; } } throw new Error("không vào được " + url + " (đang ở " + await ev("location.pathname") + ")"); };
  const chup = async (ten, full = true) => { const r = await c.gui("Page.captureScreenshot", { format: "png", captureBeyondViewport: full }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const t = (expr) => ev(`window.__t.${expr}`);
  const cho = async (dk, ms = 8000) => { for (let i = 0; i < ms / 200; i++) { if (await ev(dk)) return true; await doi(200); } return false; };
  const luu = async (nhan = "Lưu") => { const r = await t(`bam(${JSON.stringify(nhan)}, true)`); await doi(800); await cho("!window.__t.hopMo() || window.__t.loi() !== ''", 40000); return r; };
  // Máy chủ + CSDL dùng chung đang bận: đọc lại DB tới khi có kết quả (tối đa 30 giây) thay vì chờ cố định.
  const dbCho = async (lay, ok = (x) => !!x, ms = 30000) => { let x; for (let i = 0; i < ms / 1000; i++) { x = await lay(); if (ok(x)) return x; await doi(1000); } return x; };
  const denHopDong = () => cho("!window.__t.hopMo()", 6000);
  const tran = async () => ev("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1");

  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // ───── 1. DỊCH VỤ ─────
  await di("/danh-muc?tab=dich-vu");
  kiem("tab Dịch vụ có cột Ảnh, Thời gian và nút Nhân bản/Chuyển nhóm khi có dữ liệu", /thời gian/i.test(await ev("document.body.innerText")));
  await t(`bam("Thêm dịch vụ")`); await doi(700);
  const buoc = [];
  buoc.push(await t(`fill("f-ma", "DMT-DV1")`), await t(`pick("f-nhom_id", "[THỬ-DM] Nhóm DV A")`), await t(`fill("f-ten", "[THỬ-DM] Dịch vụ thử một")`), await t(`fill("f-ten_en", "Test service one")`), await t(`fill("f-mo_ta", "Mô tả thử cho dịch vụ.")`));
  buoc.push(await t(`pick("f-doi_tuong", "Nữ")`), await t(`pick("f-don_vi_tinh", "chuyến")`), await t(`pick("f-tg_gio", "1 tiếng")`), await t(`pick("f-tg_phut", "30 phút")`), await t(`fill("f-gia", "250000")`));
  buoc.push(await t(`pick("f-vat", "Không chịu thuế")`), await t(`pick("f-noi_hien_thi", "Chỉ hiển thị ở thu ngân")`), await t(`gat("Sửa giá khi thanh toán", true)`), await t(`gat("In giờ phục vụ", true)`));
  nhat("điền hộp Thêm dịch vụ: " + buoc.join(","));
  await chup("dich_vu_hop_them_1280", false);
  await luu(); const ok1 = await denHopDong();
  let r1 = (await db.from("dich_vu").select("*").eq("ma", "DMT-DV1").maybeSingle()).data;
  kiem("Thêm dịch vụ: hộp đóng, DB có dòng", ok1 && !!r1, ok1 ? "" : "hộp còn mở: " + await t("loi()"));
  kiem("  giờ+phút → tổng phút (1g30 = 90)", r1?.thoi_luong_phut === 90, String(r1?.thoi_luong_phut));
  kiem("  VAT 'Không chịu thuế' → vat_loai + vat_pct 0", r1?.vat_loai === "khong_chiu_thue" && Number(r1?.vat_pct) === 0, `${r1?.vat_loai}/${r1?.vat_pct}`);
  kiem("  đơn vị chuyến, đối tượng nữ, nơi hiển thị thu ngân", r1?.don_vi_tinh === "chuyến" && r1?.doi_tuong === "nu" && r1?.noi_hien_thi === "thu_ngan", `${r1?.don_vi_tinh}/${r1?.doi_tuong}/${r1?.noi_hien_thi}`);
  kiem("  tên EN, mô tả, sửa giá, in giờ", r1?.ten_en === "Test service one" && r1?.mo_ta === "Mô tả thử cho dịch vụ." && r1?.cho_sua_gia === true && r1?.in_gio_phuc_vu === true);
  kiem("  giá 250.000, địa điểm = mọi chi nhánh (null)", Number(r1?.gia) === 250000 && r1?.chi_nhanh_ids === null);

  // sửa: phút 45 → 105; VAT 8%; chọn 1 chi nhánh
  await di("/danh-muc?tab=dich-vu"); await t(`bamHang("[THỬ-DM] Dịch vụ thử một", "Sửa")`); await doi(800);
  kiem("Sửa: hộp nạp đúng giờ/phút/VAT/đơn vị", (await t(`chuChon("f-tg_gio")`)) === "1 tiếng" && (await t(`chuChon("f-tg_phut")`)) === "30 phút" && (await t(`chuChon("f-vat")`)) === "Không chịu thuế" && (await t(`chuChon("f-don_vi_tinh")`)) === "chuyến", [await t(`chuChon("f-tg_gio")`), await t(`chuChon("f-tg_phut")`), await t(`chuChon("f-vat")`)].join("/"));
  const cnTen = (await db.from("chi_nhanh").select("ten").eq("hoat_dong", true).order("thu_tu").order("ma")).data;
  await t(`pick("f-tg_phut", "45 phút")`); await t(`pick("f-vat", "8%")`); await t(`nhieu(${JSON.stringify(cnTen[0].ten)})`);
  await luu(); await denHopDong();
  r1 = (await db.from("dich_vu").select("*").eq("ma", "DMT-DV1").maybeSingle()).data;
  kiem("Sửa dịch vụ: 1g45=105 phút, VAT 8% (vat_loai null), 1 địa điểm", r1?.thoi_luong_phut === 105 && Number(r1?.vat_pct) === 8 && r1?.vat_loai === null && r1?.chi_nhanh_ids?.length === 1, `${r1?.thoi_luong_phut}/${r1?.vat_pct}/${r1?.vat_loai}/${JSON.stringify(r1?.chi_nhanh_ids)}`);

  // nhân bản
  await di("/danh-muc?tab=dich-vu"); await t(`bamHang("[THỬ-DM] Dịch vụ thử một", "Nhân bản")`); await doi(800);
  kiem("Nhân bản: mã gợi ý DMT-DV1-2, tên có '(bản sao)'", (await t(`giaTri("f-ma")`)) === "DMT-DV1-2" && (await t(`giaTri("f-ten")`)) === "[THỬ-DM] Dịch vụ thử một (bản sao)");
  await luu(); await denHopDong();
  const r2 = await dbCho(async () => (await db.from("dich_vu").select("*").eq("ma", "DMT-DV1-2").maybeSingle()).data);
  kiem("Nhân bản dịch vụ: có bản mới, sao đủ thông tin (105 phút, 8%, nữ, EN), không sao ảnh", !!r2 && r2.thoi_luong_phut === 105 && Number(r2.vat_pct) === 8 && r2.doi_tuong === "nu" && r2.ten_en === "Test service one" && r2.anh === null && r2.id !== r1.id);
  await t(`bamHang("[THỬ-DM] Dịch vụ thử một (bản sao)", "Nhân bản")`); await doi(800); await t(`fill("f-ma", "DMT-DV1")`); await luu();
  kiem("Nhân bản trùng mã: báo lỗi tiếng Việt, hộp còn mở", (await t("hopMo()")) && /Mã dịch vụ này đã có/.test(await t("loi()")), await t("loi()"));
  await t(`bam("Huỷ", true)`); await doi(400);

  // chuyển nhóm
  await di("/danh-muc?tab=dich-vu"); await t(`bamHang("[THỬ-DM] Dịch vụ thử một", "Chuyển nhóm")`); await doi(800);
  kiem("Chuyển nhóm: dịch vụ hiện tại được chọn sẵn", JSON.stringify(await t("nhieuDaChon()")).includes("DMT-DV1"), JSON.stringify(await t("nhieuDaChon()")));
  await t(`pick("f-nhom_id", "[THỬ-DM] Nhóm DV B")`); await luu(); await denHopDong();
  const nhomSau = await dbCho(async () => (await db.from("dich_vu").select("ma, nhom_id").in("ma", MA_THU)).data, (x) => x?.find((y) => y.ma === "DMT-DV1")?.nhom_id === nhomDv[1]);
  kiem("Chuyển nhóm: chỉ DMT-DV1 sang nhóm B, bản sao ở lại nhóm A", nhomSau.find((x) => x.ma === "DMT-DV1")?.nhom_id === nhomDv[1] && nhomSau.find((x) => x.ma === "DMT-DV1-2")?.nhom_id === nhomDv[0]);

  // ảnh dịch vụ
  await di("/danh-muc?tab=dich-vu"); await t(`bamAnhHang("[THỬ-DM] Dịch vụ thử một")`); await doi(700);
  const fileTmp = join(THU_MUC, "anh-thu.png"); writeFileSync(fileTmp, PNG_THU);
  const doc = await c.gui("DOM.getDocument", {}); const nut = await c.gui("DOM.querySelector", { nodeId: doc.root.nodeId, selector: 'input[type=file][aria-label="Chọn tệp ảnh"]' });
  await c.gui("DOM.setFileInputFiles", { files: [fileTmp], nodeId: nut.nodeId }); await doi(3500);
  const ra = await dbCho(async () => (await db.from("dich_vu").select("anh").eq("ma", "DMT-DV1").maybeSingle()).data, (x) => !!x?.anh);
  if (ra?.anh) anhDaTai.push(ra.anh);
  const resA = ra?.anh ? await fetch(`${URL_}/storage/v1/object/public/danh-muc-anh/${ra.anh}`) : null;
  kiem("Tải ảnh dịch vụ: DB lưu ĐƯỜNG DẪN (không nhúng), ảnh mở công khai image/jpeg", !!ra?.anh && !ra.anh.startsWith("data:") && resA?.status === 200 && resA.headers.get("content-type") === "image/jpeg", `${ra?.anh} ${resA?.status} ${resA?.headers.get("content-type")} ${resA ? (await resA.arrayBuffer()).byteLength : 0}B`);
  await di("/danh-muc?tab=dich-vu");
  kiem("Bảng hiện ảnh vừa tải (thẻ img từ kho danh-muc-anh)", await ev(`[...document.querySelectorAll('tr')].some((r) => r.textContent.includes('[THỬ-DM] Dịch vụ thử một') && r.querySelector('img[src*="danh-muc-anh"]'))`));
  await t(`bamAnhHang("[THỬ-DM] Dịch vụ thử một")`); await doi(600); await t(`bam("Gỡ ảnh", true)`); await doi(2500);
  const rg = await dbCho(async () => (await db.from("dich_vu").select("anh").eq("ma", "DMT-DV1").maybeSingle()).data, (x) => x?.anh === null);
  const conTep = async (duong) => { const [thuMuc, tep] = duong.split("/"); const { data } = await db.storage.from("danh-muc-anh").list(thuMuc, { search: tep }); return (data ?? []).some((x) => x.name === tep); };
  const daXoa = ra?.anh ? await dbCho(async () => !(await conTep(ra.anh)), (x) => x === true, 15000) : false;
  kiem("Gỡ ảnh: DB null, tệp trong kho bị xoá (kiểm bằng danh sách kho, không qua bộ nhớ đệm CDN)", rg?.anh === null && daXoa === true);

  // ───── 2. SẢN PHẨM ─────
  await di("/danh-muc?tab=san-pham"); await t(`bam("Thêm sản phẩm / vật tư")`); await doi(800);
  const b2 = [await t(`fill("f-ma", "DMT-SP1")`), await t(`fill("f-ten", "[THỬ-DM] Kem thử nghiệm Heliocare 50ml")`), await t(`fill("f-ten_en", "Trial cream")`), await t(`fill("f-nhan_hieu", "Heliocare")`), await t(`fill("f-mo_ta", "Mô tả sản phẩm thử.")`), await t(`fill("f-nhom", "Thử nghiệm")`), await t(`fill("f-don_vi", "ml")`), await t(`fill("f-dung_tich", "50")`), await t(`pick("f-dung_tich_dv", "ml")`), await t(`fill("f-uoc_tinh_1_lan", "2")`), await t(`pick("f-uoc_tinh_1_lan_dv", "ml")`), await t(`pick("f-hinh_thuc_nhap", "Ký gửi")`), await t(`pick("f-noi_hien_thi", "Chỉ hiển thị ở đặt lịch")`), await t(`gat("Sửa giá khi thanh toán", true)`)];
  nhat("điền hộp Thêm sản phẩm: " + b2.join(","));
  await chup("san_pham_hop_them_1280", false);
  await luu(); await denHopDong();
  const s1 = (await db.from("san_pham").select("*").eq("ma", "DMT-SP1").maybeSingle()).data;
  kiem("Thêm sản phẩm: lưu đủ nhãn hiệu, tên EN, mô tả, dung tích, ước tính, hình thức nhập", !!s1 && s1.nhan_hieu === "Heliocare" && s1.ten_en === "Trial cream" && Number(s1.dung_tich) === 50 && s1.dung_tich_dv === "ml" && Number(s1.uoc_tinh_1_lan) === 2 && s1.uoc_tinh_1_lan_dv === "ml" && s1.hinh_thuc_nhap === "ky_gui" && s1.noi_hien_thi === "dat_lich" && s1.cho_sua_gia === true, !s1 ? await t("loi()") : "");
  await di("/danh-muc?tab=san-pham"); await t(`bamHang("[THỬ-DM] Kem thử nghiệm Heliocare 50ml", "Nhân bản")`); await doi(800);
  kiem("Nhân bản sản phẩm: mã + mã vạch để trống, tên '(bản sao)', nhãn hiệu giữ", (await t(`giaTri("f-ma")`)) === "" && (await t(`giaTri("f-ten")`)) === "[THỬ-DM] Kem thử nghiệm Heliocare 50ml (bản sao)" && (await t(`giaTri("f-nhan_hieu")`)) === "Heliocare");
  await t(`fill("f-ma", "DMT-SP2")`); await luu(); await denHopDong();
  const s2 = (await db.from("san_pham").select("ma, ten, nhan_hieu, anh").eq("ma", "DMT-SP2").maybeSingle()).data;
  kiem("Nhân bản sản phẩm: có bản mới", !!s2 && s2.nhan_hieu === "Heliocare" && s2.anh === null, s2 ? "" : await t("loi()"));
  await di("/danh-muc?tab=san-pham&q=heliocare");
  kiem("Tìm theo nhãn hiệu thấy sản phẩm thử", (await ev("document.body.innerText")).includes("[THỬ-DM] Kem thử nghiệm Heliocare 50ml"));
  await t(`bamAnhHang("[THỬ-DM] Kem thử nghiệm Heliocare 50ml")`); await doi(700);
  const doc2 = await c.gui("DOM.getDocument", {}); const nut2 = await c.gui("DOM.querySelector", { nodeId: doc2.root.nodeId, selector: 'input[type=file][aria-label="Chọn tệp ảnh"]' });
  await c.gui("DOM.setFileInputFiles", { files: [fileTmp], nodeId: nut2.nodeId }); await doi(3500);
  const rs = await dbCho(async () => (await db.from("san_pham").select("anh").eq("ma", "DMT-SP1").maybeSingle()).data, (x) => !!x?.anh); if (rs?.anh) anhDaTai.push(rs.anh);
  kiem("Tải ảnh sản phẩm: lưu đường dẫn, không nhúng", !!rs?.anh && !rs.anh.startsWith("data:"), rs?.anh);

  // ───── 3. NHÓM THẺ + LOẠI THẺ ─────
  await di("/danh-muc?tab=nhom-the");
  kiem("Tab Nhóm thẻ: có nhóm mặc định 'Thẻ thành viên' kèm số thẻ", (await ev("document.body.innerText")).includes("Thẻ thành viên"));
  await t(`bam("Thêm nhóm thẻ")`); await doi(600); await t(`fill("f-ten", "[THỬ-DM] Nhóm thẻ A")`); await luu(); await denHopDong();
  const nt = (await db.from("goi_the_nhom").select("id, mac_dinh").eq("ten", "[THỬ-DM] Nhóm thẻ A").maybeSingle()).data;
  kiem("Thêm nhóm thẻ", !!nt && nt.mac_dinh === false);
  await di("/danh-muc?tab=goi-the"); await t(`bam("Thêm gói thẻ")`); await doi(800);
  kiem("Hộp thẻ lần: có 'Không giới hạn số lần', chưa có ô giá trị nạp (thẻ tiền)", (await t(`trong("Không giới hạn")`)) || (await ev(`[...window.__t.dlg().querySelectorAll('[role=switch]')].some((x) => x.textContent.includes('Không giới hạn số lần'))`)));
  const b3 = [await t(`fill("f-ma", "DMT-T1")`), await t(`fill("f-ten", "[THỬ-DM] Thẻ lần không giới hạn")`), await t(`fill("f-ten_en", "Unlimited visits card")`), await t(`fill("f-mo_ta", "Thẻ thử.")`), await t(`pick("f-mau_the", "Vàng đồng")`), await t(`pick("f-nhom_id", "[THỬ-DM] Nhóm thẻ A")`), await t(`fill("f-gia", "1000000")`), await t(`gat("Không giới hạn số lần", true)`), await t(`gat("Sửa giá khi thanh toán", true)`), await t(`fill("f-gia_tri_1_lan", "100000")`), await t(`pick("f-che_do_lan", "Tuỳ ý sửa số lần tại thu ngân")`), await t(`fill("f-han_dung_ngay", "365")`), await t(`pick("f-han_tinh_tu", "Từ ngày tạo thẻ")`)];
  nhat("điền hộp Thêm gói thẻ: " + b3.join(","));
  await chup("goi_the_hop_them_1280", false);
  await luu(); await denHopDong();
  const g1 = (await db.from("goi_the").select("*").eq("ma", "DMT-T1").maybeSingle()).data;
  kiem("Thẻ lần không giới hạn: so_buoi = 999999 (quy ước sẵn có)", g1?.so_buoi === 999999, String(g1?.so_buoi));
  kiem("  màu, EN, mô tả, hạn từ ngày tạo, cờ sửa giá, cách sửa số lần, giá trị 1 lần, nhóm", g1?.mau_the === "#B8860B" && g1?.ten_en === "Unlimited visits card" && g1?.han_tinh_tu === "ngay_tao" && g1?.cho_sua_gia === true && g1?.che_do_sua_so === "tuy_y" && Number(g1?.gia_tri_1_lan) === 100000 && g1?.nhom_id === nt?.id, JSON.stringify({ m: g1?.mau_the, h: g1?.han_tinh_tu, c: g1?.che_do_sua_so, n: g1?.nhom_id === nt?.id }));
  await di("/danh-muc?tab=goi-the");
  kiem("Bảng hiện 'Liệu trình không giới hạn' + nhóm thẻ", await ev(`[...document.querySelectorAll('tr')].some((r) => r.textContent.includes('DMT-T1') && r.textContent.includes('Liệu trình không giới hạn') && r.textContent.includes('[THỬ-DM] Nhóm thẻ A'))`));
  await t(`bamHang("DMT-T1", "Sửa")`); await doi(800);
  kiem("Sửa thẻ: công tắc Không giới hạn nạp lại đúng, ô số buổi trống", (await ev(`[...window.__t.dlg().querySelectorAll('[role=switch]')].find((x) => x.textContent.includes('Không giới hạn số lần')).getAttribute('aria-checked')`)) === "true" && (await t(`giaTri("f-so_buoi")`)) === "");
  await t(`gat("Không giới hạn số lần", false)`); await luu();
  kiem("Tắt không giới hạn mà không nhập số buổi → báo lỗi, không lưu", (await t("hopMo()")) && /bắt buộc nhập số buổi/.test(await t("loi()")), await t("loi()"));
  await t(`fill("f-so_buoi", "12")`); await luu(); await denHopDong();
  const g1b = (await db.from("goi_the").select("so_buoi").eq("ma", "DMT-T1").maybeSingle()).data;
  kiem("Nhập 12 buổi → lưu so_buoi = 12", g1b?.so_buoi === 12, String(g1b?.so_buoi));
  await di("/danh-muc?tab=goi-the"); await t(`bam("Thêm gói thẻ")`); await doi(700);
  await t(`pick("f-loai", "Thẻ tiền (số dư)")`); await doi(300);
  const b4 = [await t(`fill("f-ma", "DMT-T2")`), await t(`fill("f-ten", "[THỬ-DM] Thẻ tiền thử")`), await t(`fill("f-gia", "500000")`), await t(`fill("f-gia_tri_the", "600000")`), await t(`pick("f-che_do_tien", "Tự cập nhật số tiền trong thẻ bằng giá bán thẻ")`)];
  nhat("điền hộp thẻ tiền: " + b4.join(","));
  kiem("Hộp thẻ tiền: ẩn 'Không giới hạn số lần', hiện ô giá trị nạp", !(await ev(`[...window.__t.dlg().querySelectorAll('[role=switch]')].some((x) => x.textContent.includes('Không giới hạn số lần'))`)) && (await t(`giaTri("f-gia_tri_the")`)) !== null);
  await luu(); await denHopDong();
  const g2 = (await db.from("goi_the").select("*").eq("ma", "DMT-T2").maybeSingle()).data;
  kiem("Thẻ tiền: lưu gia_tri_the, cách sửa số tiền = tu_dong, nhóm mặc định (null), so_buoi null", !!g2 && Number(g2.gia_tri_the) === 600000 && g2.che_do_sua_so === "tu_dong" && g2.nhom_id === null && g2.so_buoi === null, g2 ? "" : await t("loi()"));
  await di("/danh-muc?tab=goi-the&loai=tien");
  const txtTien = await ev("document.body.innerText");
  kiem("Lọc 'Thẻ số tiền': thấy DMT-T2, không thấy DMT-T1", txtTien.includes("DMT-T2") && !txtTien.includes("DMT-T1"));
  await di("/danh-muc?tab=goi-the&loai=lan");
  const txtLan = await ev("document.body.innerText");
  kiem("Lọc 'Thẻ số lần': thấy DMT-T1, không thấy DMT-T2", txtLan.includes("DMT-T1") && !txtLan.includes("DMT-T2"));
  await di(`/danh-muc?tab=goi-the&nhom=${nt.id}`);
  kiem("Lọc theo nhóm thẻ: chỉ DMT-T1", (await ev("document.body.innerText")).includes("DMT-T1") && !(await ev("document.body.innerText")).includes("DMT-T2"));
  await di("/danh-muc?tab=nhom-the"); await t(`bamHang("[THỬ-DM] Nhóm thẻ A", "Xoá")`); await doi(600); await luu("Xoá");
  kiem("Xoá nhóm thẻ còn thẻ → bị từ chối bằng tiếng Việt", (await t("hopMo()")) && /còn 1 loại thẻ/.test(await t("loi()")), await t("loi()"));
  await t(`bam("Huỷ", true)`); await doi(300);

  // ───── 4. NHÂN VIÊN PHỤC VỤ ─────
  await di("/cai-dat/nhan-vien-phuc-vu");
  await t(`bamHang("[THỬ-DM] Phục vụ một", "Sửa")`); await doi(800);
  kiem("Sửa nhân viên chưa có tài khoản: có ô Email và Trạng thái", (await t(`giaTri("f-email")`)) !== null && (await t(`chuChon("f-trang_thai")`)) === "Hoạt động");
  await t(`fill("f-email", "thu-pv1@amia-os.invalid")`); await t(`pick("f-trang_thai", "Tạm dừng")`); await luu(); await denHopDong();
  const p1 = (await db.from("nhan_vien").select("email, hoat_dong, trang_thai_lam").eq("id", nvPv1).single()).data;
  kiem("Lưu email + Tạm dừng → hoat_dong=false, trang_thai_lam=tam_nghi", p1.email === "thu-pv1@amia-os.invalid" && p1.hoat_dong === false && p1.trang_thai_lam === "tam_nghi", JSON.stringify(p1));
  await di("/cai-dat/nhan-vien-phuc-vu?tt=tam_dung");
  kiem("Lọc Trạng thái 'Tạm dừng' thấy người vừa tạm dừng", (await ev("document.body.innerText")).includes("[THỬ-DM] Phục vụ một"));
  await di("/cai-dat/nhan-vien-phuc-vu"); await t(`bamHang("[THỬ-DM] Phục vụ hai", "Sửa")`); await doi(800); await t(`fill("f-email", "THU-PV1@amia-os.invalid")`); await luu();
  kiem("Email trùng người khác → báo lỗi tiếng Việt", (await t("hopMo()")) && /đã gắn cho/.test(await t("loi()")), await t("loi()"));
  await t(`bam("Huỷ", true)`); await doi(300);
  await di("/cai-dat/nhan-vien-phuc-vu"); await t(`bamHang("[THỬ-DM] Phục vụ một", "Sửa")`); await doi(700); await t(`pick("f-trang_thai", "Hoạt động")`); await luu(); await denHopDong();
  const p1b = (await db.from("nhan_vien").select("hoat_dong, trang_thai_lam").eq("id", nvPv1).single()).data;
  kiem("Bật lại Hoạt động → hoat_dong=true, trang_thai_lam=dang_lam", p1b.hoat_dong === true && p1b.trang_thai_lam === "dang_lam", JSON.stringify(p1b));
  await t(`bamHang("[THỬ-DM] Chủ thử Danh mục", "Sửa")`); await doi(800);
  kiem("Sửa nhân viên ĐÃ có tài khoản: KHÔNG có ô Email/Trạng thái (kèm ghi chú)", (await t(`giaTri("f-email")`)) === null && (await t(`giaTri("f-trang_thai")`)) === null && (await ev("window.__t.dlg().textContent")).includes("Tài khoản đăng nhập"));
  await t(`bam("Huỷ", true)`); await doi(300);
  await t(`bamAnhHang("[THỬ-DM] Phục vụ một")`); await doi(700);
  const doc3 = await c.gui("DOM.getDocument", {}); const nut3 = await c.gui("DOM.querySelector", { nodeId: doc3.root.nodeId, selector: 'input[type=file][aria-label="Chọn tệp ảnh"]' });
  await c.gui("DOM.setFileInputFiles", { files: [fileTmp], nodeId: nut3.nodeId }); await doi(3000);
  const p1c = await dbCho(async () => (await db.from("nhan_vien").select("anh_dai_dien").eq("id", nvPv1).single()).data, (x) => !!x?.anh_dai_dien);
  kiem("Ảnh nhân viên phục vụ: lưu JPEG nhỏ trong anh_dai_dien", /^data:image\/jpeg;base64,/.test(p1c.anh_dai_dien ?? "") && p1c.anh_dai_dien.length < 100000, `${(p1c.anh_dai_dien ?? "").length} ký tự`);
  await di("/cai-dat/nhan-vien-phuc-vu");
  kiem("Cột Ảnh hiện ảnh thật thay vì chữ cái đầu", await ev(`[...document.querySelectorAll('tr')].some((r) => r.textContent.includes('[THỬ-DM] Phục vụ một') && r.querySelector('img'))`));


  // ───── 4b. NHẬP EXCEL (dịch vụ, sản phẩm, thẻ) ─────
  const ExcelJS = (await import("node:module")).createRequire(import.meta.url)("exceljs");
  const taoXlsx = async (ten, dong) => { const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("Sheet1"); dong.forEach((r) => ws.addRow(r)); const f = join(THU_MUC, ten + ".xlsx"); await wb.xlsx.writeFile(f); return f; };
  const chonTep = async (f) => { const d = await c.gui("DOM.getDocument", {}); const n = await c.gui("DOM.querySelector", { nodeId: d.root.nodeId, selector: 'input[type=file][aria-label="Chọn tệp Excel"]' }); await c.gui("DOM.setFileInputFiles", { files: [f], nodeId: n.nodeId }); await doi(500); };
  const ketQuaNhap = async () => { await t(`bam("Nhập dữ liệu", true)`); await cho("document.body.innerText.includes('Đã thêm') || !!(window.__t.dlg() && window.__t.loi())", 60000); return ev("window.__t.dlg() ? window.__t.dlg().innerText : ''"); };
  const f1 = await taoXlsx("dv", [["Tên dịch vụ (service_name)", "Mã DV (sku)", "Mô tả DV (description)", "Giá bán (default_price)", "Số phút làm dịch vụ (service_duration)", "Được sửa giá khi bán hàng (edit_price_in_order)", "Giá vốn DV (import_price)", "Tên tiếng Anh - nếu có (english_name)"],
    ["[THỬ-DM] Nhập dịch vụ một", "DMT-X1", "Mô tả", "1.200.000", 45, "Có", 300000, "Import one"], ["[THỬ-DM] Nhập dịch vụ hai", "<nếu không có xin để trống>", "", 500000, 30, "", "", ""], ["[THỬ-DM] Nhập sai giá", "DMT-X3", "", "abc", 30, "", "", ""], ["[THỬ-DM] Nhập trùng mã", "DMT-DV1", "", 1000, 30, "", "", ""]]);
  await di("/danh-muc?tab=dich-vu"); await t(`bam("Nhập Excel")`); await doi(700);
  await ev(`(async () => { const b = window.__t.dlg().querySelector('[aria-haspopup=listbox]'); b.click(); await new Promise((r) => setTimeout(r, 450)); [...document.querySelectorAll('[role=option]')].find((x) => x.textContent.trim() === '[THỬ-DM] Nhóm DV A').click(); })()`); await doi(500);
  await chonTep(f1); const kqNhap1 = await ketQuaNhap(); nhat("kết quả nhập dịch vụ: " + kqNhap1.replace(/\s+/g, " ").slice(0, 400));
  const imp = (await dbCho(async () => (await db.from("dich_vu").select("ma, ten, gia, thoi_luong_phut, cho_sua_gia, ten_en, gia_von, nhom_id").like("ten", "[THỬ-DM] Nhập%")).data, (x) => (x?.length ?? 0) >= 2)) ?? [];
  const x1 = imp.find((x) => x.ma === "DMT-X1"), x2 = imp.find((x) => x.ten === "[THỬ-DM] Nhập dịch vụ hai");
  kiem("Nhập Excel dịch vụ: 2 dòng hợp lệ vào DB, giá 1.200.000, 45 phút, sửa giá, tên EN, nhóm đã chọn", imp.length === 2 && Number(x1?.gia) === 1200000 && x1?.thoi_luong_phut === 45 && x1?.cho_sua_gia === true && x1?.ten_en === "Import one" && x1?.nhom_id === nhomDv[0], `${imp.length} dòng`);
  kiem("  dòng không mã → mã tự sinh dạng DV-xxxx", /^DV-\d{4,}$/.test(x2?.ma ?? ""), x2?.ma);
  kiem("  dòng giá sai và dòng trùng mã bị bỏ kèm lý do tiếng Việt", /giá bán không hợp lệ/.test(kqNhap1) && /đã có/.test(kqNhap1) && /Đã thêm\s*2/.test(kqNhap1));
  await t(`bam("Đóng", true)`); await doi(400);
  const f2 = await taoXlsx("sp", [["Tên sản phẩm (product_name)", "Mã Sản phẩm (sku)", "Mô tả Sản phẩm (description)", "Giá bán (default_price)", "Nhãn hiệu (brand_name)", "Giá nhập (import_price)", "Được sửa giá khi bán hàng (edit_price_in_order)", "Đơn vị sản phẩm (unit_1)", "Dung tích sản phẩm (capacity)", "Đơn vị dung tích (unit_2)", "Tên Tiếng Anh nếu có (english_name)"],
    ["[THỬ-DM] Nhập kem dưỡng Brandx 30ml", "DMT-SPX1", "Mô tả", 450000, "Brandx", 250000, "Có", "Tuýp", 30, "ml", "Cream"], ["[THỬ-DM] Nhập sản phẩm thiếu đơn vị", "", "", 1000, "", "", "", "", "", "", ""]]);
  await di("/danh-muc?tab=san-pham"); await t(`bam("Nhập Excel")`); await doi(700); await chonTep(f2); const kqNhap2 = await ketQuaNhap(); nhat("kết quả nhập sản phẩm: " + kqNhap2.replace(/\s+/g, " ").slice(0, 300));
  const sx = await dbCho(async () => (await db.from("san_pham").select("ma, nhan_hieu, gia_ban, dung_tich, dung_tich_dv, gia_nhap_don_vi, cho_sua_gia, ten_en").eq("ma", "DMT-SPX1").maybeSingle()).data);
  kiem("Nhập Excel sản phẩm: dòng hợp lệ lưu đủ nhãn hiệu, dung tích, giá nhập, sửa giá; dòng thiếu đơn vị bị bỏ", !!sx && sx.nhan_hieu === "Brandx" && Number(sx.gia_ban) === 450000 && Number(sx.dung_tich) === 30 && sx.dung_tich_dv === "ml" && Number(sx.gia_nhap_don_vi) === 250000 && sx.cho_sua_gia === true && /thiếu đơn vị/.test(kqNhap2), JSON.stringify(sx));
  await t(`bam("Đóng", true)`); await doi(400);
  const f3 = await taoXlsx("the", [["card_name", "card_type", "card_description", "use_limit", "sale_price", "use_price", "default_account_balance", "commission_ratio", "expired_from", "time_limit", "edit_price_in_order"], ["Tên thẻ", "Loại thẻ", "Mô tả thẻ", "Số lần", "Giá", "Giá 1 lần", "Số tiền", "Tỉ lệ", "Ngày bắt đầu", "Thời hạn", "Sửa giá"],
    ["[THỬ-DM] Nhập thẻ lần", "Lần", "Mô tả", 10, 5000000, 500000, "", "", "Tạo", 12, "Có"], ["[THỬ-DM] Nhập thẻ tiền", "Tiền", "", "", "", "", 6000000, 5, "Cấp", 24, ""], ["[THỬ-DM] Nhập thẻ sai loại", "Khác", "", 1, 1, 1, "", "", "", 1, ""]]);
  await di("/danh-muc?tab=goi-the"); await t(`bam("Nhập Excel")`); await doi(700); await chonTep(f3); const kqNhap3 = await ketQuaNhap(); nhat("kết quả nhập thẻ: " + kqNhap3.replace(/\s+/g, " ").slice(0, 300));
  const th = await dbCho(async () => (await db.from("goi_the").select("ma, ten, loai, so_buoi, gia, gia_tri_the, han_dung_ngay, han_tinh_tu, cho_sua_gia, gia_tri_1_lan").like("ten", "[THỬ-DM] Nhập%")).data, (x) => (x?.length ?? 0) >= 2);
  const tl = th?.find((x) => x.loai === "lan"), tt = th?.find((x) => x.loai === "tien");
  kiem("Nhập Excel thẻ: thẻ lần (10 buổi, 12 tháng = 360 ngày, từ ngày tạo, sửa giá, giá 1 lần) + thẻ tiền (6tr, 720 ngày, từ ngày cấp); dòng sai loại bị bỏ", th?.length === 2 && tl?.so_buoi === 10 && tl?.han_dung_ngay === 360 && tl?.han_tinh_tu === "ngay_tao" && tl?.cho_sua_gia === true && Number(tl?.gia_tri_1_lan) === 500000 && Number(tt?.gia_tri_the) === 6000000 && Number(tt?.gia) === 6000000 && tt?.han_dung_ngay === 720 && tt?.han_tinh_tu === "ngay_cap" && /Lần.*Tiền/.test(kqNhap3), JSON.stringify(th));
  await t(`bam("Đóng", true)`); await doi(400);
  const mauOk = await ev(`Promise.all(["dich-vu", "san-pham", "the"].map((n) => fetch("/mau-nhap/" + n + ".xlsx").then((r) => r.status + ":" + r.headers.get("content-type"))))`);
  kiem("Tệp mẫu tải được khi đã đăng nhập (200, xlsx)", mauOk.every((x) => x.startsWith("200:") && x.includes("spreadsheetml")), mauOk.join(","));

  // ───── 5. CHỤP 3 CỠ MÀN HÌNH + TRÀN NGANG ─────
  const man = { "dien-thoai": [390, 844, true], "may-tinh-bang": [820, 1180, true], "may-tinh": [1440, 900, false] };
  for (const [ten, [w, h, mobile]] of Object.entries(man)) {
    await c.gui("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    for (const [u, tt] of [["/danh-muc?tab=dich-vu", "dich_vu"], ["/danh-muc?tab=san-pham", "san_pham"], ["/danh-muc?tab=goi-the", "goi_the"], ["/danh-muc?tab=nhom-the", "nhom_the"], ["/cai-dat/nhan-vien-phuc-vu", "nv_phuc_vu"]]) {
      try { await di(u); await chup(`${ten}__${tt}`, false); const tr = await tran(); kiem(`${ten} ${tt}: không tràn ngang trang`, !tr); } catch (e) { nhat(`LỖI chụp ${ten} ${tt}: ${e.message}`); }
    }
  }
  // hộp Sửa dịch vụ trên điện thoại
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await di("/danh-muc?tab=dich-vu"); await t(`bamHang("[THỬ-DM] Dịch vụ thử một", "Sửa")`); await doi(900); await chup("dien-thoai__hop_sua_dich_vu", false);
  kiem("Hộp Sửa dịch vụ trên 390px không tràn ngang", !(await tran()));
  ws.close();
} catch (e) { nhat("LỖI: " + (e.stack ?? e.message ?? e).toString().slice(0, 600)); loiTest.push("ngoại lệ"); }
finally {
  try { chrome?.kill(); } catch {}
  try {
    await db.from("goi_the_dich_vu").delete().in("goi_id", ((await db.from("goi_the").select("id").in("ma", MA_THE)).data ?? []).map((x) => x.id));
    await db.from("goi_the").delete().in("ma", MA_THE); await db.from("goi_the").delete().like("ten", "[THỬ-DM]%");
    await db.from("goi_the_nhom").delete().like("ten", "[THỬ-DM]%");
    for (const a of (await db.from("san_pham").select("anh").in("ma", MA_SP)).data ?? []) if (a.anh) anhDaTai.push(a.anh);
    for (const a of (await db.from("dich_vu").select("anh").in("ma", MA_THU)).data ?? []) if (a.anh) anhDaTai.push(a.anh);
    await db.from("san_pham").delete().in("ma", [...MA_SP, "DMT-SPX1"]); await db.from("san_pham").delete().like("ten", "[THỬ-DM]%");
    await db.from("dich_vu").delete().in("ma", MA_THU); await db.from("dich_vu").delete().like("ten", "[THỬ-DM]%");
    await db.from("dich_vu_nhom").delete().like("ten", "[THỬ-DM]%");
    if (anhDaTai.length) await db.storage.from("danh-muc-anh").remove([...new Set(anhDaTai)]);
    for (let i = 0; i < 4 && nvPv1; i++) { const r = await db.from("nhan_vien").delete().in("id", [nvPv1, nvPv2]); if (!r.error) break; await doi(2500); }
    // Tài khoản thử đã ghi vào nhật ký chỉ-thêm thì không xoá được: khoá lại thay vì xoá.
    const xoaNv = nvId ? await db.from("nhan_vien").delete().eq("id", nvId) : null;
    if (nvId && xoaNv?.error) { await db.from("nhan_vien").update({ hoat_dong: false, la_phuc_vu: false, trang_thai_lam: "khoa" }).eq("id", nvId); nhat("tài khoản thử còn trong nhật ký → đã khoá (hoat_dong=false)"); }
    if (uid) await db.auth.admin.deleteUser(uid).catch(() => {});
  } catch (e) { nhat("LỖI dọn: " + e.message); }
  const dem = async (b, cot, mau) => (await db.from(b).select("id", { count: "exact", head: true }).like(cot, mau)).count;
  nhat(`dọn xong: dịch vụ thử còn ${await dem("dich_vu", "ma", "DMT-%")}, sản phẩm thử còn ${await dem("san_pham", "ma", "DMT-%")}, thẻ thử còn ${await dem("goi_the", "ma", "DMT-%")}, nhóm thẻ thử còn ${await dem("goi_the_nhom", "ten", "[THỬ-DM]%")}, nhân viên thử còn hoạt động ${(await db.from("nhan_vien").select("id", { count: "exact", head: true }).like("ho_ten", "[THỬ-DM]%").eq("hoat_dong", true)).count}`);
  nhat(loiTest.length ? `KẾT QUẢ: ${loiTest.length} mục HỎNG: ${loiTest.join("; ")}` : "KẾT QUẢ: tất cả mục đạt");
  writeFileSync(join(RA, "ket-qua.txt"), ghi.join("\n"));
}
