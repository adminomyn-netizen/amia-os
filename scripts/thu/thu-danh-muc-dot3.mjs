// Xem bằng Chrome không đầu — Danh mục / Thẻ đợt 3 (03/11/2026, nhóm B). KHÔNG cấp thẻ thật, không ghi tiền.
//   Dịch vụ: lọc chi nhánh + nơi hiển thị, mã tự sinh, Tuỳ chọn giá · Sản phẩm: lọc chi nhánh, VAT, nhãn hiệu, địa điểm bán
//   Loại thẻ: thời hạn tháng + ngày, thời gian 1 lần, chọn nhiều + xoá hàng loạt · Cấp thẻ tay: ngày cấp, số lượng, chi nhánh, hạn dự kiến (KHÔNG bấm Cấp)
//   Nhà cung cấp: ô tìm.
// Dữ liệu thử: tài khoản Chủ tạm + dịch vụ/loại thẻ tên "[THỬ-DM3]" — xoá hết cuối bài.
// Dùng: node scripts/thu/thu-danh-muc-dot3.mjs <thư mục ra> [BASE]
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RA = process.argv[2]; if (!RA) { console.error("Thiếu thư mục ra"); process.exit(2); } mkdirSync(RA, { recursive: true });
const BASE = process.argv[3] || "http://localhost:3105";
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9371, THU_MUC = mkdtempSync(join(tmpdir(), "amia-dm3-"));
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const loiTest = [];
const kiem = (ten, dung, chiTiet = "") => { console.log(`${dung ? "ĐẠT" : "HỎNG"} · ${ten}${chiTiet ? " · " + chiTiet : ""}`); if (!dung) loiTest.push(ten); };
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}

let chrome, uid, nvId; const dvThu = [], goiThu = [];
try {
  const CN = (await db.from("chi_nhanh").select("id").eq("ma", "VINH").single()).data.id;
  const CN2 = (await db.from("chi_nhanh").select("id").neq("id", CN).eq("hoat_dong", true).limit(1).single()).data?.id;
  const nhom = (await db.from("dich_vu_nhom").select("id").order("thu_tu").limit(1).single()).data.id;
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-dm3-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const ins0 = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ-DM3] Chủ thử", vai_tro: "chu", email, chi_nhanh_id: CN }).select("id").single();
  if (ins0.error) throw new Error("tạo nhân viên thử: " + ins0.error.message); nvId = ins0.data.id;
  // Dịch vụ thử: 1 chỉ ở chi nhánh 2 + chỉ thu ngân (để thử lọc), 1 để thử Tuỳ chọn giá. Loại thẻ thử: 2 cái để xoá hàng loạt.
  const dv = await db.from("dich_vu").insert([
    { ma: "THUDM3A", nhom_id: nhom, ten: "[THỬ-DM3] Dịch vụ lọc", gia: 100000, chi_nhanh_ids: CN2 ? [CN2] : null, noi_hien_thi: "thu_ngan", hoat_dong: true },
    { ma: "THUDM3B", nhom_id: nhom, ten: "[THỬ-DM3] Dịch vụ tuỳ chọn giá", gia: 500000, chi_nhanh_ids: null, noi_hien_thi: "tat_ca", hoat_dong: true },
  ]).select("id, ma"); if (dv.error) throw new Error(dv.error.message); dvThu.push(...dv.data.map((x) => x.id));
  const gt = await db.from("goi_the").insert([
    { ma: "THUDM3G1", ten: "[THỬ-DM3] Thẻ xoá 1", loai: "lan", gia: 0, so_buoi: 5, han_dung_thang: 18, han_dung_ngay: 99, thoi_gian_1_lan_phut: 45 },
    { ma: "THUDM3G2", ten: "[THỬ-DM3] Thẻ xoá 2", loai: "lan", gia: 0, so_buoi: 5, han_dung_thang: null, han_dung_ngay: null, thoi_gian_1_lan_phut: 30 },
  ]).select("id"); if (gt.error) throw new Error(gt.error.message); goiThu.push(...gt.data.map((x) => x.id));

  const s = await createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("Runtime.enable");
  for (const k of cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE });
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const di = async (url) => { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 600 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(2500); };
  const chup = async (ten) => { const r = await c.gui("Page.captureScreenshot", { format: "png" }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const cho = async (dk, ms = 20000) => { for (let i = 0; i < ms / 250; i++) { if (await ev(dk)) return true; await doi(250); } return false; };
  const J = JSON.stringify;
  const chu = () => ev("document.body.innerText");
  const bam = (text, trong = "document") => ev(`(() => { const b = [...${trong}.querySelectorAll('button, a')].filter((x) => x.textContent.trim().startsWith(${J(text)})); const x = b[0]; if (!x) return false; x.click(); return true; })()`);
  const hop = `document.querySelector('[role=dialog]')`;
  const hydrat = () => cho(`(() => { const b = document.querySelector('main button'); return !!b && Object.keys(b).some((k) => k.startsWith("__reactProps")); })()`, 60000);

  // 1. Dịch vụ: lọc chi nhánh + nơi hiển thị
  await di(`/danh-muc?tab=dich-vu&q=${encodeURIComponent("[THỬ-DM3]")}`); await hydrat();
  let t = await chu();
  kiem("Dịch vụ: có hàng lọc chi nhánh + nơi hiển thị", t.includes("Tất cả các chi nhánh") && t.includes("Mọi nơi hiển thị") && t.includes("Chỉ hiển thị ở thu ngân"));
  kiem("Dịch vụ: tìm [THỬ-DM3] ra 2 dòng", t.includes("Dịch vụ lọc") && t.includes("Dịch vụ tuỳ chọn giá"));
  await di(`/danh-muc?tab=dich-vu&q=${encodeURIComponent("[THỬ-DM3]")}&cn=${CN}`); t = await chu();
  kiem("Lọc chi nhánh Vinh: ẩn dịch vụ chỉ cung cấp ở chi nhánh khác", !t.includes("Dịch vụ lọc") && t.includes("Dịch vụ tuỳ chọn giá"));
  await di(`/danh-muc?tab=dich-vu&q=${encodeURIComponent("[THỬ-DM3]")}&hien=thu_ngan`); t = await chu();
  kiem("Lọc nơi hiển thị = chỉ thu ngân", t.includes("Dịch vụ lọc") && !t.includes("Dịch vụ tuỳ chọn giá"));
  await chup("1-dich-vu-loc");

  // 2. Tuỳ chọn giá: mở hộp trên dịch vụ thử, thêm 1 dòng dịch vụ bổ sung, lưu, kiểm DB
  await di(`/danh-muc?tab=dich-vu&q=${encodeURIComponent("Dịch vụ tuỳ chọn giá")}`); await hydrat();
  kiem("có nút Tuỳ chọn giá", await bam("Tuỳ chọn giá"));
  await cho(`!!${hop}`);
  await bam("+ Thêm tùy chọn", hop); await doi(300);
  // thêm dòng thứ 2 (dịch vụ khác)
  await ev(`(() => { const b = [...${hop}.querySelectorAll('button')].filter((x) => x.textContent.trim() === '+ Thêm tùy chọn'); b[1].click(); return b.length; })()`); await doi(300);
  await ev(`(() => { const i = ${hop}.querySelector('input[placeholder="Tên dịch vụ bổ sung"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, 'Thêm vùng cằm'); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await ev(`(() => { const o = [...${hop}.querySelectorAll('input[aria-label="Giá cộng thêm"]')]; const i = o[o.length - 1]; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '200000'); i.dispatchEvent(new Event('input', { bubbles: true })); return o.length; })()`);
  await doi(300); await chup("2-tuy-chon-gia-hop");
  kiem("Lưu thiếu nhân viên bị báo lỗi", await ev(`(() => { [...${hop}.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Lưu').click(); return true; })()`) && await cho(`(${hop}?.innerText || '').includes('chưa chọn nhân viên')`, 5000));
  await ev(`(() => { const b = [...${hop}.querySelectorAll('button')].filter((x) => x.textContent.trim() === 'Bỏ'); b[0].click(); return true; })()`); await doi(300);
  await ev(`(() => { [...${hop}.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Lưu').click(); return true; })()`);
  await cho(`!document.querySelector('[role=dialog]')`, 15000); await doi(1500);
  const tcg = (await db.from("dich_vu_tuy_chon_gia").select("loai, ten, gia_cong_them").eq("dich_vu_id", dvThu[1])).data;
  kiem("Tuỳ chọn giá đã lưu đúng (bổ sung 'Thêm vùng cằm' +200.000)", tcg?.length === 1 && tcg[0].ten === "Thêm vùng cằm" && Number(tcg[0].gia_cong_them) === 200000, JSON.stringify(tcg));
  t = await chu(); kiem("nút hiện số tuỳ chọn (1)", t.includes("Tuỳ chọn giá (1)"));

  // 3. Thêm dịch vụ bỏ trống mã → tự sinh DV…
  await di(`/danh-muc?tab=dich-vu`); await hydrat();
  await bam("Thêm dịch vụ"); await cho(`!!${hop}`);
  await ev(`(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const i = document.getElementById('f-ten'); set.call(i, '[THỬ-DM3] Dịch vụ mã tự sinh'); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  // chọn nhóm: mở ô chọn nhóm rồi bấm mục đầu
  await ev(`document.getElementById('f-nhom_id').click()`); await doi(400);
  await ev(`(() => { const o = document.querySelector('[role=listbox] [role=option]'); o?.click(); return !!o; })()`); await doi(300);
  await chup("3-them-dich-vu");
  await ev(`(() => { [...${hop}.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Lưu').click(); return true; })()`);
  await cho(`!document.querySelector('[role=dialog]')`, 15000); await doi(1000);
  const moi = (await db.from("dich_vu").select("id, ma").eq("ten", "[THỬ-DM3] Dịch vụ mã tự sinh").maybeSingle()).data;
  if (moi) dvThu.push(moi.id);
  kiem("Mã dịch vụ tự sinh khi bỏ trống", !!moi && /^DV\d{6}$/.test(moi.ma), moi?.ma ?? "(không tạo được) " + ((await ev(`${hop}?.innerText`)) ?? ""));

  // 4. Sản phẩm: lọc chi nhánh + hộp có VAT / Nhãn hiệu / Địa điểm bán (KHÔNG lưu)
  await di(`/danh-muc?tab=san-pham`); await hydrat(); t = await chu();
  kiem("Sản phẩm: có lọc Tất cả các chi nhánh", t.includes("Tất cả các chi nhánh"));
  await bam("Thêm sản phẩm / vật tư"); await cho(`!!${hop}`); t = await ev(`${hop}.innerText`);
  kiem("Hộp sản phẩm có Mức thuế VAT + Nhãn hiệu + Địa điểm bán", t.includes("Mức thuế VAT") && t.includes("Nhãn hiệu") && t.includes("Địa điểm bán"));
  await ev(`document.getElementById('f-nhan_hieu').click()`); await doi(500);
  const soHang = await ev(`document.querySelectorAll('[role=listbox] [role=option]').length`);
  kiem("Nhãn hiệu chọn từ danh mục (≥ 314 hãng)", soHang >= 314, String(soHang));
  await chup("4-hop-san-pham");
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);

  // 5. Loại thẻ: cột thời hạn kiểu SalonHero + chọn nhiều + xoá hàng loạt
  await di(`/danh-muc?tab=goi-the&q=${encodeURIComponent("[THỬ-DM3]")}`); await hydrat(); t = (await chu()) ?? "";
  if (!t.includes("THỬ-DM3")) { await chup("5-loi-loai-the"); console.log("TRANG LOẠI THẺ:", (await ev("document.documentElement.innerText"))?.slice(0, 800)); }
  kiem("Loại thẻ: thời hạn hiện '1 năm 6 tháng 99 ngày' + 45 phút", t.includes("1 năm 6 tháng 99 ngày") && t.includes("45 phút"));
  await di(`/danh-muc?tab=goi-the`); await hydrat(); t = (await chu()) ?? "";
  kiem("Loại thẻ thật hiện thời hạn theo tháng (vd '1 năm')", /\b1 năm\b/.test(t));
  await di(`/danh-muc?tab=goi-the&q=${encodeURIComponent("[THỬ-DM3]")}`); await hydrat();
  await bam("Sửa"); await cho(`!!${hop}`); t = await ev(`${hop}.innerText`);
  kiem("Hộp loại thẻ có Thời hạn: số tháng / số ngày + Thời gian làm 1 lần", t.includes("số tháng") && t.includes("số ngày") && t.includes("Thời gian làm 1 lần dịch vụ"));
  await chup("5-hop-loai-the");
  await ev(`[...${hop}.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Huỷ').click()`); await doi(500);
  const nChk = await ev(`(() => { const o = [...document.querySelectorAll('input[data-chon-nhieu="goi-the"]')]; o.forEach((x) => { x.click(); }); return o.length; })()`);
  await doi(400); t = await chu();
  kiem("Tích chọn 2 loại thẻ, nút Xoá hiện số đã chọn", nChk === 2 && t.includes("Xoá 2 loại thẻ đã chọn"), String(nChk));
  await chup("6-chon-nhieu");
  await bam("Xoá 2 loại thẻ đã chọn"); await cho(`!!${hop}`);
  await ev(`(() => { window.alert = () => {}; [...${hop}.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Xoá').click(); return true; })()`);
  await cho(`!document.querySelector('[role=dialog]')`, 15000); await doi(1500);
  const conLai = (await db.from("goi_the").select("id").in("id", goiThu)).data;
  kiem("Xoá hàng loạt: 2 loại thẻ thử (chưa cấp) bị xoá hẳn", (conLai ?? []).length === 0);

  // 6. Cấp thẻ tay: ô Ngày cấp, Số lượng cấp, Tại chi nhánh, dòng Thời hạn thẻ tính sẵn (KHÔNG bấm Lưu)
  await di(`/the`); await hydrat();
  await bam("Cấp thẻ tay"); await cho(`!!${hop}`);
  t = await ev(`${hop}.innerText`);
  kiem("Hộp Cấp thẻ có Ngày cấp + Số lượng cấp + Tại chi nhánh", t.includes("Ngày cấp") && t.includes("Số lượng cấp") && t.includes("Tại chi nhánh"));
  await ev(`document.getElementById('f-goi_id').click()`); await doi(400);
  await ev(`(() => { const o = [...document.querySelectorAll('[role=listbox] [role=option]')].find((x) => /1 năm|12|buổi/.test(x.textContent)); (o || document.querySelector('[role=listbox] [role=option]'))?.click(); return true; })()`);
  kiem("Hiện Thời hạn thẻ tính sẵn", await cho(`(${hop}?.innerText || '').includes('Thời hạn thẻ:')`, 10000), (await ev(`${hop}?.innerText`))?.match(/Thời hạn thẻ:[^\n]*/)?.[0] ?? "");
  await chup("7-cap-the");
  await ev(`[...${hop}.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Huỷ').click()`);

  // 7. Nhà cung cấp: ô tìm
  await di(`/kho-mua-sam/nha-cung-cap?q=zzzkhongco`); t = await chu();
  kiem("Nhà cung cấp có ô tìm, tìm không ra báo 'Không có nhà cung cấp nào khớp'", t.includes("Không có nhà cung cấp nào khớp") || t.includes("Chưa có nhà cung cấp"));
  await chup("8-ncc");
  for (const m of c.sk.filter((x) => x.method === "Runtime.exceptionThrown")) console.log("LỖI TRÌNH DUYỆT:", JSON.stringify(m.params).slice(0, 300));
} catch (e) { console.log("LỖI KỊCH BẢN:", e.message); loiTest.push("kịch bản"); }
finally {
  if (dvThu.length) { const r = await db.from("dich_vu").delete().in("id", dvThu); if (r.error) console.log("dịch vụ thử chưa xoá:", r.error.message); }
  if (goiThu.length) await db.from("goi_the").delete().in("id", goiThu);
  if (nvId) { const r = await db.from("nhan_vien").delete().eq("id", nvId); if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); console.log("nhân viên thử giữ (hoat_dong=false):", nvId); } }
  if (uid) await db.auth.admin.deleteUser(uid);
  console.log(`${loiTest.length ? "HỎNG: " + loiTest.join("; ") : "Tất cả ĐẠT"}`);
  chrome?.kill();
  process.exit(loiTest.length ? 1 : 0);
}
