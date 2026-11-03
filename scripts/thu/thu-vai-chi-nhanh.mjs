// Xem bằng Chrome không đầu — VAI TRÒ THEO TỪNG CHI NHÁNH (đợt 4, 03/11/2026). Không ghi tiền, không đụng người thật.
// Dữ liệu thử: 2 tài khoản "[THỬ-VCN]" (Quản lý Vinh + Lễ tân Đà Lạt; Kỹ thuật) — xoá hết cuối bài.
// Dùng: node scripts/thu/thu-vai-chi-nhanh.mjs <thư mục ra> [BASE]
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
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9377, THU_MUC = mkdtempSync(join(tmpdir(), "amia-vcn-"));
const doi = (ms) => new Promise((r) => setTimeout(r, ms));
const loiTest = [];
const kiem = (ten, dung, chiTiet = "") => { console.log(`${dung ? "ĐẠT" : "HỎNG"} · ${ten}${chiTiet ? " · " + chiTiet : ""}`); if (!dung) loiTest.push(ten); };
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.cho = new Map(); this.sk = []; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.cho.has(m.id)) { this.cho.get(m.id)(m); this.cho.delete(m.id); } else this.sk.push(m); }; }
  gui(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((r, j) => { this.cho.set(id, (m) => (m.error ? j(new Error(method + ": " + m.error.message)) : r(m.result))); }); }
}

let chrome; const tam = [];
const taoNguoi = async (hoTen, vai, cn) => {
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-vcn-${Date.now()}-${tam.length}@amia-os.invalid`;
  const uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  const r = await db.from("nhan_vien").insert({ user_id: uid, ho_ten: hoTen, vai_tro: vai, email, chi_nhanh_id: cn }).select("id").single();
  if (r.error) throw new Error("tạo nhân viên thử: " + r.error.message);
  tam.push({ uid, nvId: r.data.id }); return { email, pw, nvId: r.data.id };
};
const phien = async (email, pw) => {
  const s = await createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = []; for (let i = 0; i < val.length; i += 3180) parts.push(val.slice(i, i + 3180));
  return parts.map((p, i) => ({ name: parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${i}`, value: encodeURIComponent(p) }));
};
try {
  const VINH = (await db.from("chi_nhanh").select("id, ten").eq("ma", "VINH").single()).data;
  const DL = (await db.from("chi_nhanh").select("id, ten").eq("ma", "DALAT").single()).data;
  const A = await taoNguoi("[THỬ-VCN] Hai cơ sở", "quan_ly", VINH.id);
  const gan = await db.from("nhan_vien_chi_nhanh").insert({ nhan_vien_id: A.nvId, chi_nhanh_id: DL.id, vai_tro: "le_tan" }); if (gan.error) throw new Error(gan.error.message);
  const K = await taoNguoi("[THỬ-VCN] Kỹ thuật", "ky_thuat", null);

  chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${THU_MUC}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let tg; for (let i = 0; i < 40 && !tg; i++) { await doi(250); tg = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null); }
  const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); const c = new CDP(ws);
  await c.gui("Page.enable"); await c.gui("Network.enable"); await c.gui("Runtime.enable");
  await c.gui("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  const ev = async (expr) => (await c.gui("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const di = async (url) => { c.sk.length = 0; await c.gui("Page.navigate", { url: BASE + url }); for (let i = 0; i < 600 && !c.sk.some((m) => m.method === "Page.loadEventFired"); i++) await doi(150); await doi(2500); };
  const chup = async (ten) => { const r = await c.gui("Page.captureScreenshot", { format: "png" }); writeFileSync(join(RA, ten + ".png"), Buffer.from(r.data, "base64")); };
  const cho = async (dk, ms = 20000) => { for (let i = 0; i < ms / 250; i++) { if (await ev(dk)) return true; await doi(250); } return false; };
  const dangNhap = async (ck) => { await c.gui("Network.clearBrowserCookies"); for (const k of ck) await c.gui("Network.setCookie", { name: k.name, value: k.value, url: BASE }); };
  const moMenu = async () => { await ev(`document.querySelector('.dau-trang-may button[title="Tài khoản của tôi"]')?.click()`); await cho(`!!document.querySelector('[role=menu]')`, 5000); };
  const chuMenu = () => ev(`document.querySelector('[role=menu]')?.innerText ?? ''`);
  const duongDan = () => ev("location.pathname");

  // 1) Người hai cơ sở: mặc định ở chi nhánh chính (Vinh) với vai Quản lý
  await dangNhap(await phien(A.email, A.pw));
  await di("/ban-hang");
  kiem("Ở Vinh (Quản lý) vào được Bán hàng", (await duongDan()) === "/ban-hang", await duongDan());
  await moMenu(); let m = await chuMenu();
  kiem("Bảng tài khoản có 'Chi nhánh làm việc' + 2 chi nhánh", /chi nhánh làm việc/i.test(m) && m.includes(VINH.ten) && m.includes(DL.ten), m.replace(/\s+/g, " ").slice(0, 200));
  kiem("Vinh đang làm, Đà Lạt có nút Chọn", /Đang làm/.test(m) && /Chọn/.test(m));
  await chup("1-menu-vinh");

  // 2) Sửa tay cookie sang chi nhánh không được gán → vẫn ở Vinh
  await c.gui("Network.setCookie", { name: "amia_cn_lam_viec", value: "00000000-0000-0000-0000-000000000000", url: BASE });
  await di("/ban-hang");
  kiem("Cookie giả (chi nhánh không gán) bị bỏ, vẫn Quản lý Vinh", (await duongDan()) === "/ban-hang");

  // 3) Bấm Chọn Đà Lạt → vai Lễ tân: Bán hàng (ban.tao) bị chặn
  await di("/trang-chu"); await moMenu();
  await ev(`[...document.querySelectorAll('[role=menu] button')].find((b) => b.innerText.trim() === 'Chọn')?.click()`);
  await doi(3500);
  await di("/trang-chu"); await moMenu(); m = await chuMenu();
  kiem("Sau khi Chọn: Đà Lạt đang làm, vai Lễ tân", m.includes("Lễ tân") && (await ev(`(() => { const li = [...document.querySelectorAll('[role=menu] li')].find((x) => x.innerText.includes('Đang làm')); return li ? li.innerText : ''; })()`)).includes(DL.ten), m.replace(/\s+/g, " ").slice(0, 220));
  await chup("2-menu-da-lat");
  await di("/ban-hang");
  kiem("Ở Đà Lạt (Lễ tân) KHÔNG vào được Bán hàng", (await duongDan()) !== "/ban-hang", await duongDan());

  // 4) Kỹ thuật xem màn Tài khoản đăng nhập + Sửa: thấy "Quyền tại …" và bỏ quyền Đà Lạt
  await dangNhap(await phien(K.email, K.pw));
  await di("/cai-dat/tai-khoan-dang-nhap?q=" + encodeURIComponent("[THỬ-VCN]"));
  const dongA = await ev(`[...document.querySelectorAll('tr')].find((t) => t.innerText.includes('Hai cơ sở'))?.innerText ?? ''`);
  kiem("Tài khoản đăng nhập: cột Quyền chi nhánh có Quản lý Vinh + Lễ tân Đà Lạt", dongA.includes("Quản lý") && dongA.includes("Lễ tân") && dongA.includes(DL.ten), dongA.replace(/\s+/g, " "));
  await chup("3-tai-khoan-dang-nhap");
  await di("/nhan-vien");
  await ev(`(() => { const tr = [...document.querySelectorAll('tr')].find((t) => t.innerText.includes('Hai cơ sở')); [...tr.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Sửa').click(); })()`);
  await cho(`[...document.querySelectorAll('label')].some((l) => l.innerText.startsWith('Quyền tại'))`, 8000);
  const nhanO = await ev(`[...document.querySelectorAll('label')].filter((l) => l.innerText.startsWith('Quyền tại')).map((l) => l.innerText + '=' + (document.getElementById(l.htmlFor)?.innerText ?? '')).join(' | ')`);
  kiem("Hộp Sửa có ô Quyền tại từng chi nhánh, Đà Lạt = Lễ tân", nhanO.includes(DL.ten + "=Lễ tân"), nhanO);
  await chup("4-sua-quyen-chi-nhanh");
  // đổi Đà Lạt về "Không có quyền" rồi Lưu (người thử)
  await ev(`(() => { const l = [...document.querySelectorAll('label')].find((x) => x.innerText === 'Quyền tại ${DL.ten}'); document.getElementById(l.htmlFor).click(); })()`);
  await cho(`!!document.querySelector('[role=listbox]')`, 5000); await doi(300);
  await ev(`[...document.querySelectorAll('[role=listbox] [role=option]')].find((o) => o.innerText.trim() === 'Không có quyền')?.click()`);
  await doi(300);
  await ev(`[...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Lưu').pop()?.click()`);
  await doi(4000);
  const thongBao = await ev(`[...document.querySelectorAll('[role=dialog], [role=alert]')].map((x) => x.innerText).join(' | ').slice(0, 300)`);
  if (thongBao) console.log("Hộp sau khi Lưu:", thongBao.replace(/\s+/g, " "));
  await chup("5-sau-khi-luu");
  const conLai = (await db.from("nhan_vien_chi_nhanh").select("vai_tro").eq("nhan_vien_id", A.nvId)).data ?? [];
  const hsA = (await db.from("nhan_vien").select("vai_tro, chi_nhanh_id").eq("id", A.nvId).single()).data;
  kiem("Lưu 'Không có quyền' → xoá dòng Đà Lạt, hồ sơ chính giữ Quản lý Vinh", conLai.length === 0 && hsA.vai_tro === "quan_ly" && hsA.chi_nhanh_id === VINH.id, JSON.stringify({ conLai, hsA }));
  for (const x of c.sk.filter((x) => x.method === "Runtime.exceptionThrown")) console.log("LỖI TRÌNH DUYỆT:", JSON.stringify(x.params).slice(0, 300));
} catch (e) { console.log("LỖI KỊCH BẢN:", e.message); loiTest.push("kịch bản"); }
finally {
  for (const t of tam) {
    const r = await db.from("nhan_vien").delete().eq("id", t.nvId);
    if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", t.nvId); console.log("nhân viên thử giữ (hoat_dong=false):", t.nvId); }
    await db.auth.admin.deleteUser(t.uid);
  }
  console.log(`${loiTest.length ? "HỎNG: " + loiTest.join("; ") : "Tất cả ĐẠT"}`);
  chrome?.kill();
  process.exit(loiTest.length ? 1 : 0);
}
