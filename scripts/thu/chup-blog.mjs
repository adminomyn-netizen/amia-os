// Chụp màn hình THẬT (Chrome không đầu) trang Blog ở 3 cỡ màn hình và chạy trọn luồng form Thêm blog (có tải ảnh).
// Dùng: node scripts/thu/chup-blog.mjs <thư mục ra> [BASE]   (BASE mặc định bản thật). Dữ liệu thử có tiền tố [THỬ] và được xoá cuối.
import { createClient } from "@supabase/supabase-js";
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import zlib from "node:zlib";

const RA = process.argv[2]; if (!RA) { console.error("Thiếu thư mục ra"); process.exit(2); } mkdirSync(RA, { recursive: true });
const BASE = process.argv[3] ?? "https://amia-os-neon.vercel.app";
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env[Object.keys(env).find((x) => /SERVICE/.test(x))]);
const anonKey = env[Object.keys(env).find((x) => /ANON|PUBLISHABLE/.test(x))];
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9337, THU_MUC = mkdtempSync(join(tmpdir(), "amia-chup-"));
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
let chrome, uid, nvId, cmId, baiIds = [], duongAnhThu = [];
try {
  // 1. tài khoản Chủ thử + dữ liệu mẫu
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-blog-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  nvId = (await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ] Chủ chụp Blog", vai_tro: "chu", email }).select("id").single()).data.id;
  const s = await createClient(URL_, anonKey).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  const cookies = parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
  cmId = (await db.from("blog_chuyen_muc").insert({ tieu_de: "[THỬ] Công nghệ tại AMIA", mo_ta: "Chuyên mục thử để chụp giao diện", thu_tu: 99, hoat_dong: true }).select("id").single()).data.id;
  const cm2 = (await db.from("blog_chuyen_muc").insert({ tieu_de: "[THỬ] Hỏi đáp và quy trình", thu_tu: 98, hoat_dong: true }).select("id").single()).data.id;
  const anh = `bai/thu-chup-${Date.now()}.png`; duongAnhThu.push(anh);
  await db.storage.from("blog-anh").upload(anh, png(1200, 800), { contentType: "image/png" });
  const noiDung = "Nhiều chị em băn khoăn không biết làn da của mình hợp với phương pháp nào. Đoạn này dùng để xem cách ngắt dòng và độ rộng chữ trên điện thoại, máy tính bảng và máy tính, nên viết dài hơn một chút để thấy được vài dòng liền nhau trong cùng một đoạn văn.\n\n## Điều nên biết trước khi làm\n\n- Thăm khám và soi da trước khi chọn công nghệ\n- Hiệu quả khác nhau tuỳ cơ địa của từng người\n- Chuyên viên trị liệu hướng dẫn chăm sóc sau buổi làm\n\n## Mời chị em thăm khám\n\nAMIA Phòng khám da liễu, 39A Lê Hồng Phong, TP. Vinh, giấy phép hoạt động số 1233/NA-GPHĐ.";
  const ins = await db.from("blog_bai_viet").insert([
    { chuyen_muc_id: cmId, tieu_de: "[THỬ] Thermage FLX: những điều chị em nên biết trước khi làm", mo_ta_ngan: "Bài mẫu để xem bố cục tiêu đề dài, mô tả ngắn và ảnh bìa trên mọi cỡ màn hình.", anh, tieu_bieu: true, noi_dung: noiDung, hoat_dong: true },
    { chuyen_muc_id: cmId, tieu_de: "[THỬ] Da chuyển mùa", mo_ta_ngan: "Bài mẫu không có ảnh.", anh: null, tieu_bieu: false, noi_dung: noiDung, hoat_dong: true },
    { chuyen_muc_id: cm2, tieu_de: "[THỬ] Một buổi làm tại AMIA diễn ra thế nào", mo_ta_ngan: "Bài mẫu chuyên mục khác.", anh, tieu_bieu: false, noi_dung: noiDung, hoat_dong: true },
    { chuyen_muc_id: cm2, tieu_de: "[THỬ] Bài nháp chưa kích hoạt", mo_ta_ngan: null, anh: null, tieu_bieu: false, noi_dung: "nháp", hoat_dong: false },
  ]).select("id, tieu_de"); baiIds = ins.data.map((b) => b.id);
  const idBaiChinh = ins.data[0].id;

  // 2. Chrome không đầu
  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("DOM.enable"); await c.gui("Runtime.enable");
  for (const k of cookies) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE });
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const di = async (url) => { const dich = url.split("?")[0]; for (let lan = 0; lan < 3; lan++) { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 200 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(1500); if ((await ev("location.pathname")) === dich) return; } throw new Error("không vào được " + url); };
  const chup = async (ten, full = true) => { const r = full ? await c.gui("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }) : await c.gui("Page.captureScreenshot", { format: "png" }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const man = { "dien-thoai": [390, 844, true], "may-tinh-bang": [820, 1180, true], "may-tinh": [1440, 900, false] };
  const tran = async () => ev("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1");
  for (const [ten, [w, h, mobile]] of Object.entries(man)) {
    await c.gui("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    for (const [u, t] of [["/blog", "blog_ds"], [`/blog/${idBaiChinh}`, "blog_bai"], ["/cai-dat/blog", "cd_bai_viet"], ["/cai-dat/blog?tab=chuyen-muc", "cd_chuyen_muc"]]) {
      try { await di(u); await chup(`${ten}__${t}`); nhat(`${ten} ${t}: tràn ngang = ${await tran()}`); } catch (e) { nhat(`LỖI chụp ${ten} ${t}: ${e.message}`); }
    }
  }
  // 3. Trọn luồng form: Thêm blog mới (có tải ảnh) trên điện thoại, rồi sửa, rồi xoá
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await di("/cai-dat/blog");
  const bamChu = (t) => ev(`(() => { const e = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === ${JSON.stringify(t)}); if (!e) return "khong thay"; e.click(); return "ok"; })()`);
  nhat("mở hộp Thêm blog mới: " + await bamChu("Thêm blog mới")); await doi(800);
  await chup("dien-thoai__hop_them_blog_trong", false);
  const fileTmp = join(THU_MUC, "anh-thu.png"); writeFileSync(fileTmp, png(900, 600));
  const goVao = (sel, v) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return "khong thay"; const p = e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, "value").set.call(e, ${JSON.stringify(v)}); e.dispatchEvent(new Event("input", { bubbles: true })); return "ok"; })()`);
  nhat("gõ tiêu đề: " + await goVao("#blog-tieu-de", "[THỬ] Bài tạo từ giao diện"));
  nhat("gõ mô tả: " + await goVao("#blog-mo-ta", "Bài kiểm luồng lưu có ảnh."));
  nhat("gõ nội dung: " + await goVao("#blog-nd", "Đoạn một.\n\n## Tiêu đề nhỏ\n\n- ý một\n- ý hai"));
  // chọn chuyên mục (ô chọn riêng của AMIA): mở rồi bấm đúng dòng
  nhat("mở ô chuyên mục: " + await ev(`(() => { const b = document.querySelector('[aria-label="Chuyên mục"]'); if (!b) return "khong thay"; b.click(); return "ok"; })()`)); await doi(500);
  nhat("chọn chuyên mục: " + await ev(`(() => { const o = [...document.querySelectorAll('[role="option"]')].find((x) => x.textContent.includes("[THỬ] Công nghệ")); if (!o) return "khong thay (" + document.querySelectorAll('[role="option"]').length + " dòng)"; o.click(); return "ok"; })()`)); await doi(400);
  // tải ảnh qua ô file thật
  const doc = await c.gui("DOM.getDocument", {}); const nut = await c.gui("DOM.querySelector", { nodeId: doc.root.nodeId, selector: "#blog-anh" });
  await c.gui("DOM.setFileInputFiles", { files: [fileTmp], nodeId: nut.nodeId }); await doi(600);
  await chup("dien-thoai__hop_them_blog_da_dien", false);
  nhat("bấm Lưu bài: " + await bamChu("Lưu bài")); await doi(4000);
  const { data: moi } = await db.from("blog_bai_viet").select("id, tieu_de, anh, hoat_dong, chuyen_muc_id").eq("tieu_de", "[THỬ] Bài tạo từ giao diện");
  nhat(`DB sau khi lưu: ${moi?.length ?? 0} bài; có ảnh: ${!!moi?.[0]?.anh}; đúng chuyên mục: ${moi?.[0]?.chuyen_muc_id === cmId}; mặc định CHƯA kích hoạt: ${moi?.[0]?.hoat_dong === false}`);
  if (moi?.[0]) { baiIds.push(moi[0].id); if (moi[0].anh) { duongAnhThu.push(moi[0].anh); const r = await fetch(`${URL_}/storage/v1/object/public/blog-anh/${moi[0].anh}`); nhat("ảnh vừa tải mở công khai: " + r.status + " " + r.headers.get("content-type")); } }
  await di("/cai-dat/blog"); nhat("danh sách thấy bài mới: " + await ev(`document.body.innerText.includes("[THỬ] Bài tạo từ giao diện")`)); await chup("dien-thoai__cd_sau_khi_luu");
  // lỗi nhập thiếu: lưu hộp trống phải báo lỗi, không tạo bài
  await bamChu("Thêm blog mới"); await doi(600); await bamChu("Lưu bài"); await doi(1500);
  nhat("lưu hộp trống báo lỗi: " + await ev(`!!document.querySelector('[role="alert"]') && document.querySelector('[role="alert"]').textContent`));
  // bật kích hoạt bài mới bằng nút nhanh
  await di("/cai-dat/blog"); nhat("bấm Kích hoạt: " + await ev(`(() => { const r = [...document.querySelectorAll("tr, li, div")].find((x) => x.children.length && x.textContent.includes("[THỬ] Bài tạo từ giao diện") && x.querySelector("button")); const b = r && [...r.querySelectorAll("button")].find((y) => y.textContent.trim() === "Kích hoạt"); if (!b) return "khong thay"; b.click(); return "ok"; })()`)); await doi(2500);
  const { data: kh } = await db.from("blog_bai_viet").select("hoat_dong").eq("id", moi?.[0]?.id).maybeSingle(); nhat("sau bấm Kích hoạt, DB hoat_dong = " + kh?.hoat_dong);
  const pub = await fetch(`${BASE}/blog/${moi?.[0]?.id}`); nhat("bài vừa kích hoạt mở công khai: " + pub.status);
  ws.close();
} catch (e) { nhat("LỖI: " + (e.stack ?? e.message ?? e).toString().slice(0, 400)); }
finally {
  try { chrome?.kill(); } catch {}
  if (baiIds.length) await db.from("blog_bai_viet").delete().in("id", baiIds);
  await db.from("blog_bai_viet").delete().like("tieu_de", "[THỬ]%");
  await db.from("blog_chuyen_muc").delete().like("tieu_de", "[THỬ]%");
  if (duongAnhThu.length) await db.storage.from("blog-anh").remove(duongAnhThu);
  if (nvId) await db.from("nhan_vien").delete().eq("id", nvId); if (uid) await db.auth.admin.deleteUser(uid);
  const a = await db.from("blog_bai_viet").select("id", { count: "exact", head: true }).like("tieu_de", "[THỬ]%"), b = await db.from("nhan_vien").select("id", { count: "exact", head: true }).like("ho_ten", "[THỬ] Chủ chụp Blog%");
  nhat(`dọn xong: bài thử còn ${a.count}, tài khoản thử còn ${b.count}`);
  writeFileSync(join(RA, "ket-qua.txt"), ghi.join("\n"));
}
