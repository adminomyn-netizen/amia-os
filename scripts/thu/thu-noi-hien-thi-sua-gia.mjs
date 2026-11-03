// Chạy THẬT bằng Chrome không đầu: cờ danh mục 0194 đã nối — Nơi hiển thị + Địa điểm cung cấp (Thu ngân, hộp Đặt lịch nội bộ, truy vấn /dat-lich),
// Sửa giá khi thanh toán (giỏ Thu ngân + lưu nháp, KHÔNG chốt đơn), In giờ phục vụ (hoá đơn NHÁP rồi xoá). Dữ liệu thử tiền tố [THỬ-NOI], xoá cuối.
// Dùng: node scripts/thu/thu-noi-hien-thi-sua-gia.mjs <thư mục ra> [BASE]
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RA = process.argv[2]; if (!RA) { console.error("Thiếu thư mục ra"); process.exit(2); } mkdirSync(RA, { recursive: true });
const BASE = process.argv[3] ?? "http://localhost:3111";
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env[Object.keys(env).find((x) => /SERVICE/.test(x))]);
const anonKey = env[Object.keys(env).find((x) => /ANON|PUBLISHABLE/.test(x))];
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9351, THU_MUC = mkdtempSync(join(tmpdir(), "amia-noi-"));
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const loiTest = [];
const kiem = (ten, dung, chiTiet = "") => { console.log(`${dung ? "ĐẠT" : "HỎNG"} · ${ten}${chiTiet ? " · " + chiTiet : ""}`); if (!dung) loiTest.push(ten); };
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}

let chrome, uid, nvId, nhomId, khachId, lichId, hdId; const dvIds = {};
try {
  const cn = (await db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma")).data;
  const [CN1, CN2] = cn.map((x) => x.id);
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-noi-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  // Gắn chi nhánh 1 để thu ngân / đặt lịch lọc theo chi nhánh đó.
  const ins0 = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ-NOI] Chủ thử", vai_tro: "chu", email, chi_nhanh_id: CN1 }).select("id").single(); if (ins0.error) throw new Error("tạo nhân viên thử: " + ins0.error.message); nvId = ins0.data.id;
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  nhomId = (await db.from("dich_vu_nhom").insert({ ten: "[THỬ-NOI] Nhóm", thu_tu: 995 }).select("id").single()).data.id;
  const MAU = { nhom_id: nhomId, don_vi_tinh: "lần", thoi_luong_phut: 30, dat_online: true, hoat_dong: true };
  const tao = async (k, ma, ten, them) => { const r = await db.from("dich_vu").insert({ ...MAU, ma, ten, gia: 500000, ...them }).select("id").single(); if (r.error) throw new Error(ma + ": " + r.error.message); dvIds[k] = r.data.id; };
  await tao("tatCa", "NOIT-1", "[THỬ-NOI] Tất cả", {});
  await tao("thuNgan", "NOIT-2", "[THỬ-NOI] Chỉ thu ngân", { noi_hien_thi: "thu_ngan", cho_sua_gia: true, in_gio_phuc_vu: true });
  await tao("datLich", "NOIT-3", "[THỬ-NOI] Chỉ đặt lịch", { noi_hien_thi: "dat_lich" });
  await tao("an", "NOIT-4", "[THỬ-NOI] Ẩn", { noi_hien_thi: "an" });
  await tao("cn2", "NOIT-5", "[THỬ-NOI] Chỉ chi nhánh 2", { chi_nhanh_ids: [CN2] });
  await tao("cn1", "NOIT-6", "[THỬ-NOI] Chỉ chi nhánh 1", { chi_nhanh_ids: [CN1] });

  // ───── /dat-lich: đặt online đang TẮT trên bản thật nên không mở được trang; kiểm đúng truy vấn lọc máy chủ dùng (cùng cú pháp với actions.ts). ─────
  const ids = Object.values(dvIds);
  const qDat = async (c) => ((await db.from("dich_vu").select("id").in("id", ids).eq("hoat_dong", true).eq("dat_online", true).in("noi_hien_thi", ["tat_ca", "dat_lich"]).or(`chi_nhanh_ids.is.null,chi_nhanh_ids.eq.{},chi_nhanh_ids.cs.{${c}}`)).data ?? []).map((x) => x.id).sort();
  const mong = (ks) => ks.map((k) => dvIds[k]).sort();
  kiem("/dat-lich lọc máy chủ, chi nhánh 1: Tất cả + Chỉ đặt lịch + Chỉ CN1", JSON.stringify(await qDat(CN1)) === JSON.stringify(mong(["tatCa", "datLich", "cn1"])));
  kiem("/dat-lich lọc máy chủ, chi nhánh 2: Tất cả + Chỉ đặt lịch + Chỉ CN2", JSON.stringify(await qDat(CN2)) === JSON.stringify(mong(["tatCa", "datLich", "cn2"])));

  // Lịch cũ có dịch vụ "Chỉ đặt lịch" → mở Thu ngân từ lịch vẫn phải có dòng đó.
  const ma = "KHT" + Date.now().toString().slice(-7);
  const kh = await db.from("khach_hang").insert({ ma, ho_ten: "[THỬ-NOI] Khách", dien_thoai: "09" + Date.now().toString().slice(-8), chi_nhanh_id: CN1, nguoi_phu_trach_id: nvId, nguon: "khac", ngay_sinh: "1990-01-01" }).select("id").single();
  if (kh.error) throw new Error("khách thử: " + kh.error.message); khachId = kh.data.id;
  const bd = new Date(Date.now() + 2 * 3600e3);
  const lh = await db.from("lich_hen").insert({ khach_id: khachId, chi_nhanh_id: CN1, bat_dau: bd.toISOString(), ket_thuc: new Date(bd.getTime() + 1800e3).toISOString(), trang_thai: "da_xac_nhan" }).select("id").single();
  if (lh.error) throw new Error("lịch thử: " + lh.error.message); lichId = lh.data.id;
  await db.from("lich_hen_dich_vu").insert({ lich_id: lichId, dich_vu_id: dvIds.datLich, so_luong: 1 });

  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("Runtime.enable");
  for (const k of cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE });
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const di = async (url) => { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 600 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(2500); };
  const chup = async (ten) => { const r = await c.gui("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const cho = async (dk, ms = 15000) => { for (let i = 0; i < ms / 250; i++) { if (await ev(dk)) return true; await doi(250); } return false; };
  const chu = () => ev("document.body.innerText");
  const tenTrongNut = () => ev(`[...document.querySelectorAll('button')].map((b) => b.textContent).join('\\n')`);
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // ───── Thu ngân ─────
  await di("/ban-hang");
  await cho(`document.body.innerText.includes("[THỬ-NOI] Tất cả")`, 30000);
  let nut = await tenTrongNut();
  kiem("Thu ngân hiện 'Tất cả', 'Chỉ thu ngân', 'Chỉ CN1'", ["Tất cả", "Chỉ thu ngân", "Chỉ chi nhánh 1"].every((x) => nut.includes("[THỬ-NOI] " + x)));
  kiem("Thu ngân ẨN 'Chỉ đặt lịch', 'Ẩn', 'Chỉ CN2'", !["Chỉ đặt lịch", "Ẩn", "Chỉ chi nhánh 2"].some((x) => nut.includes("[THỬ-NOI] " + x)));
  // Thêm "Chỉ thu ngân" (bật sửa giá) và "Tất cả" (không bật) vào giỏ.
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes("[THỬ-NOI] Chỉ thu ngân")).click()`); await doi(400);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes("[THỬ-NOI] Tất cả")).click()`); await doi(600);
  const soO = await ev(`document.querySelectorAll('[aria-label="Sửa đơn giá dòng"]').length`);
  kiem("Giỏ: chỉ dòng bật cờ có ô 'Đơn giá' (1 ô cho 2 dòng)", soO === 1, String(soO));
  const sua = await ev(`(() => { const e = document.querySelector('[aria-label="Sửa đơn giá dòng"]'); e.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, '350000'); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); return e.value; })()`);
  await doi(800);
  const t2 = await chu();
  kiem("Sửa đơn giá 350.000: dòng hiện giá mới + 'giá gốc 500.000', tiền hàng 850.000", /350\.000/.test(t2) && /giá gốc 500\.000/.test(t2) && /850\.000/.test(t2), "ô=" + sua);
  await chup("thu-ngan-sua-gia");
  // Lưu nháp (không chốt) → DB giữ giá sửa.
  const coNutNhap = await ev(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Lưu nháp/.test(x.textContent.trim())); if (!b) return false; b.click(); return true; })()`);
  let nhap = null; for (let i = 0; i < 30 && coNutNhap; i++) { nhap = (await db.from("don_nhap").select("id, dong").eq("nguoi_lap_id", nvId).maybeSingle()).data; if (nhap) break; await doi(1000); }
  kiem("Lưu nháp giữ giá sửa 350.000 cho đúng dòng", !!nhap && nhap.dong.some((d) => d.ref === dvIds.thuNgan && d.gia === 350000) && nhap.dong.some((d) => d.ref === dvIds.tatCa && d.gia === undefined), coNutNhap ? JSON.stringify(nhap?.dong?.map((d) => d.gia)) : "không thấy nút Lưu nháp");
  if (nhap) await db.from("don_nhap").delete().eq("id", nhap.id);

  // Mở Thu ngân từ lịch cũ có dịch vụ "Chỉ đặt lịch": dòng phải có trong giỏ.
  await di(`/ban-hang?lich=${lichId}`);
  await cho(`document.body.innerText.includes("[THỬ-NOI] Tất cả")`, 30000);
  const coDong = await ev(`!![...document.querySelectorAll('button[aria-label^="Bỏ "]')].find((b) => b.getAttribute('aria-label') === "Bỏ [THỬ-NOI] Chỉ đặt lịch")`);
  kiem("Thu ngân mở từ lịch: dòng 'Chỉ đặt lịch' (ẩn ở ô chọn) vẫn vào giỏ", coDong);

  // Điện thoại 390px: không tràn ngang.
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await doi(800); kiem("Thu ngân 390px không tràn ngang", !(await ev("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"))); await chup("thu-ngan-390");
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // ───── Hộp Đặt lịch nội bộ ─────
  await di("/lich-hen");
  await cho(`!![...document.querySelectorAll('button')].find((b) => b.textContent.trim() === "Đặt lịch")`, 30000);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === "Đặt lịch").click()`);
  await cho(`!!document.querySelector('[aria-label="Tìm dịch vụ"]')`);
  await ev(`(() => { const e = document.querySelector('[aria-label="Tìm dịch vụ"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, 'NOIT'); e.dispatchEvent(new Event('input', { bubbles: true })); })()`); await doi(600);
  const dsLich = await ev(`[...document.querySelectorAll('[role=checkbox]')].map((x) => x.textContent).join('\\n')`);
  kiem("Đặt lịch nội bộ hiện 'Tất cả', 'Chỉ đặt lịch', 'Chỉ CN1'", ["Tất cả", "Chỉ đặt lịch", "Chỉ chi nhánh 1"].every((x) => dsLich.includes("[THỬ-NOI] " + x)), dsLich.replace(/\n/g, " | ").slice(0, 300));
  kiem("Đặt lịch nội bộ ẨN 'Chỉ thu ngân', 'Ẩn', 'Chỉ CN2'", !["Chỉ thu ngân", "Ẩn", "Chỉ chi nhánh 2"].some((x) => dsLich.includes("[THỬ-NOI] " + x)));
  await chup("dat-lich-noi-bo");

  // ───── In hoá đơn NHÁP: dịch vụ bật in giờ phục vụ ─────
  const gv = new Date(Date.now() - 3600e3), gr = new Date(Date.now() - 1800e3);
  const hd = await db.from("hoa_don").insert({ ma: "HDTHUNOI" + Date.now().toString().slice(-6), chi_nhanh_id: CN1, nguoi_lap_id: nvId, gio_vao: gv.toISOString(), gio_ra: gr.toISOString() }).select("id").single();
  if (hd.error) throw new Error("hoá đơn nháp thử: " + hd.error.message); hdId = hd.data.id;
  await db.from("hoa_don_dong").insert([{ hoa_don_id: hdId, loai: "dich_vu", ten: "[THỬ-NOI] Chỉ thu ngân", so_luong: 1, don_gia: 350000, dich_vu_id: dvIds.thuNgan }, { hoa_don_id: hdId, loai: "dich_vu", ten: "[THỬ-NOI] Tất cả", so_luong: 1, don_gia: 500000, dich_vu_id: dvIds.tatCa }]);
  await di(`/in/hoa-don/${hdId}`);
  const hm = (d) => d.toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false });
  const tIn = await chu(), soDongGio = (tIn.match(/Giờ phục vụ/g) ?? []).length;
  kiem("In hoá đơn: 1 dòng 'Giờ phục vụ' đúng giờ vào–ra (chỉ dịch vụ bật cờ)", soDongGio === 1 && tIn.includes(`Giờ phục vụ ${hm(gv)}–${hm(gr)}`), `số dòng ${soDongGio}`);
  await chup("in-hoa-don-gio-phuc-vu");
} catch (e) {
  kiem("chạy script", false, e.message);
} finally {
  // Xoá dòng trước: xoá dây chuyền (cascade) bị trigger dòng hoá đơn chặn vì lúc đó không còn thấy hoá đơn "nháp".
  if (hdId) { await db.from("hoa_don_dong").delete().eq("hoa_don_id", hdId); const r = await db.from("hoa_don").delete().eq("id", hdId); if (r.error) console.log("không xoá được hoá đơn nháp thử: " + r.error.message); }
  if (lichId) { await db.from("lich_hen_dich_vu").delete().eq("lich_id", lichId); await db.from("lich_hen").delete().eq("id", lichId); }
  if (khachId) { const r = await db.from("khach_hang").delete().eq("id", khachId); if (r.error) console.log("không xoá được khách thử: " + r.error.message); }
  if (nvId) await db.from("don_nhap").delete().eq("nguoi_lap_id", nvId);
  const ids = Object.values(dvIds); if (ids.length) await db.from("dich_vu").delete().in("id", ids);
  if (nhomId) await db.from("dich_vu_nhom").delete().eq("id", nhomId);
  if (nvId) { const r = await db.from("nhan_vien").delete().eq("id", nvId); if (r.error) { console.log("nhân viên thử không xoá được, đặt hoat_dong=false: " + r.error.message); await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); } }
  if (uid) await db.auth.admin.deleteUser(uid);
  const con = (await db.from("dich_vu").select("id").like("ten", "[THỬ-NOI]%")).data?.length ?? 0;
  console.log(`Dọn xong (dịch vụ thử còn lại: ${con}). ${loiTest.length ? "HỎNG: " + loiTest.join("; ") : "Tất cả ĐẠT"}`);
  chrome?.kill();
  process.exit(loiTest.length ? 1 : 0);
}
