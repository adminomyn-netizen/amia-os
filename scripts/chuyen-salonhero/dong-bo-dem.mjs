// ĐỒNG BỘ TĂNG DẦN SalonHero → AMIA OS (SalonHero còn nhận dữ liệu tới 15/11/2026). Bản đêm 29/10/2026.
// Việc: xuất PHẦN THAY ĐỔI từ một mốc (chỉ đọc, bằng TAB MỚI của ABA) rồi nạp vào DB thật theo sh_id, idempotent, mã đợt SH-DB-<yyyymmdd>.
//   khách mới/đổi · thẻ mới/đổi số dư/đổi trạng thái · hoá đơn mới/đổi/huỷ/thu nợ · lịch hẹn mới/đổi trạng thái · nhắc chăm sóc mới/đổi
// AN TOÀN:
//   • MẶC ĐỊNH CHẠY THỬ: mọi thứ trong 1 giao dịch rồi ROLLBACK + in đối chiếu với SalonHero (số khách/HĐ/lịch/thẻ, tổng tiền HĐ, doanh thu ngày). Chỉ --that mới ghi.
//   • --that bắt buộc có bản sao lưu DB tên "…truoc-dong-bo-…" trong sao-luu/ tạo trong 3 giờ qua; tự HUỶ nếu đối chiếu lệch hoặc có xung đột với dữ liệu tạo trong app.
//   • KHÔNG đụng dữ liệu tạo trong app: chỉ xử lý dòng có sh_id. Dòng có sh_id nhưng bị sửa trong app sau lần đồng bộ trước (khách/lịch có cap_nhat_luc mới hơn mốc;
//     hoá đơn có thanh toán/dòng tạo trong app; thẻ có dòng sổ cái tạo trong app) = XUNG ĐỘT: bỏ qua, liệt kê, không ghi đè.
//   • Không xoá khách/hoá đơn/lịch nào; chỉ thêm, và sửa các dòng lịch sử (la_lich_su) khi SalonHero đã đổi.
// --ghi-de: lấy theo SalonHero cả chỗ đã sửa trong app (khách/thẻ/lịch/nhắc; hoá đơn có tiền app vẫn bỏ qua). Bật trong chạy đêm từ 03/11/2026.
// Dùng:
//   PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/dong-bo-dem.mjs [--tu 2026-10-28] [--den 2026-11-15] [--thu-muc <thư mục xuất có sẵn>] [--tab <id>] [--that] [--bo-qua-xung-dot] [--tu-kiem]
//   --tu       ngày VN bắt đầu (mặc định: mốc lần đồng bộ trước trong sao-luu/dong-bo-moc.json, nếu chưa có thì 2026-10-28)
//   --thu-muc  dùng lại bản xuất đã có (bỏ qua bước xuất từ SalonHero)
//   --tu-kiem  TỰ KIỂM: trong giao dịch, giả lập "mất" vài khách/HĐ/lịch/thẻ và đổi vài dòng rồi cho đồng bộ vá lại; luôn rollback.
import { ketNoi, docNdjson, theoLo, taoDot, nhanVienHeThong, mapMa, HANG, cnTheoLoc, vnNgay, sdt, sach, so, inBang, chuanBiNganHangSh, nganHangKhoan, vanBanGhiChuSh } from "./lib.mjs";
import { chuanHoaSoQuySh, napSoQuySh, tonQuyAmia } from "./so-quy-sh.mjs";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync, execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ABA = "/Applications/AGS.app/Contents/MacOS/ags";
const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const co = (t) => process.argv.includes(t);
// --ghi-de (chị Lâm 03/11/2026: "bê hết qua cho đầy đủ"): tới 15/11 SalonHero là gốc → khách/thẻ/lịch/nhắc lệch thì LẤY THEO SALONHERO dù đã sửa trong app
// (thẻ: thêm dòng điều chỉnh sổ cái, không xoá dòng cũ). Hoá đơn có tiền/dòng tạo trong app vẫn KHÔNG ghi đè (giữ tiền thật nhập ở AMIA), chỉ liệt kê.
const GHI_DE = co("--ghi-de");
const daGhiDe = { khach: 0, the: 0, lich: 0, nhac: 0 };
const that = co("--that"), tuKiem = co("--tu-kiem");
if (that && tuKiem) throw new Error("--tu-kiem luôn rollback, không dùng chung với --that");
const dich = (ms) => new Date(ms).toISOString();
const homNay = vnNgay(new Date().toISOString());
const cong = (ngay, n) => new Date(Date.parse(ngay + "T00:00:00Z") + n * 86400e3).toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── thư mục sao-luu của repo chính (worktree không có dữ liệu) ──
const goc = (() => { try { return dirname(execSync("git rev-parse --path-format=absolute --git-common-dir", { cwd: dirname(fileURLToPath(import.meta.url)), encoding: "utf8" }).trim()); } catch { return resolve(dirname(fileURLToPath(import.meta.url)), "../.."); } })();
const SAO_LUU = process.env.SAO_LUU || `${goc}/sao-luu`;
const TEP_MOC = `${SAO_LUU}/dong-bo-moc.json`;
const moc = existsSync(TEP_MOC) ? JSON.parse(readFileSync(TEP_MOC, "utf8")) : null;

// ── khoảng thời gian ──
const tuNgay = arg("--tu", moc ? vnNgay(dich(Date.parse(moc.bat_dau_xuat) - 20 * 60e3)) : "2026-10-28");
const mocMs = arg("--tu", null) || !moc ? Date.parse(`${tuNgay}T00:00:00+07:00`) : Date.parse(moc.bat_dau_xuat) - 20 * 60e3;
const mocIso = dich(mocMs);
const denNgay = arg("--den", homNay);
const tuDon = cong(vnNgay(mocIso), -35); // hoá đơn cũ có thể bị sửa/huỷ/thu nợ sau → quét thêm 35 ngày trước mốc
const denExcl = cong(denNgay, 1); // end_date của SalonHero KHÔNG gồm ngày đó
const dot = arg("--dot", `SH-DB-${denNgay.replace(/-/g, "")}`);
const baseline = moc?.xong_luc ?? null; // thời điểm đồng bộ xong lần trước (so cap_nhat_luc để biết app có sửa không)

const thangLich = (() => { const o = []; const a = tuDon.slice(0, 7); const z = cong(denNgay, 240).slice(0, 7); let [y, m] = a.split("-").map(Number); for (;;) { const ym = `${y}-${String(m).padStart(2, "0")}`; if (ym > z) break; const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1; o.push([`${ym}-01`, `${ny}-${String(nm).padStart(2, "0")}-01`]); y = ny; m = nm; } return o; })();

// ══════════ 1. XUẤT TỪ SALONHERO (chỉ đọc) ══════════
function aba(obj, giay = 120) {
  const r = spawnSync(ABA, ["aba", "do", JSON.stringify(obj)], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: giay * 1000 });
  let d; try { d = JSON.parse(r.stdout); } catch { throw new Error("ABA trả về không đọc được: " + (r.stdout || r.stderr || "").slice(0, 200)); }
  if (d.ok === false) throw new Error("ABA lỗi: " + JSON.stringify(d).slice(0, 300));
  return d.result?.payload ?? {};
}
const js = (tab, expression) => { const p = aba({ action: "js", args: { tab_id: tab, expression } }); if (p.threw) throw new Error("JS trong tab lỗi: " + String(p.error).slice(0, 200)); return p.value; };
async function moTab() {
  const tab = arg("--tab", null);
  if (tab) return { tab: Number(tab), dongSau: false };
  const p = aba({ action: "window_new", args: { url: "https://amia.salonhero.vn/#/dashboard", muc_dich: "Đồng bộ tăng dần SalonHero sang AMIA OS (chỉ đọc)" } });
  const id = p.tab_id ?? p.tabId ?? p.id;
  if (!id) throw new Error("Không mở được tab mới: " + JSON.stringify(p).slice(0, 200));
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    try { if (js(id, "(()=>{try{const rs=angular.element(document.body).injector().get('$rootScope');return !!(rs.currentUser&&rs.currentUser.merchant_id)}catch(e){return false}})()") === true) return { tab: id, dongSau: true };
    } catch { /* trang chưa sẵn sàng */ }
  }
  throw new Error("Tab SalonHero chưa đăng nhập/sẵn sàng sau 2 phút");
}
async function keo(tab, thuMucRa) {
  let ack = "false"; let sauCuoi = 0;
  for (;;) {
    const v = js(tab, `window.__E ? window.__E.take2(${ack}) : '__NOE__'`);
    if (v === "__NOE__") throw new Error("Trang mất biến __E (tải lại?)");
    if (!v) {
      ack = "false";
      const st = JSON.parse(js(tab, "JSON.stringify({p:__E.phase,e:__E.err.length,q:__E.q.length,run:__E.running,done:__E.done,fatal:__E.fatal||null})"));
      if (Date.now() - sauCuoi > 20000) { console.log("  …xuất:", st.p, `(lỗi ${st.e})`); sauCuoi = Date.now(); }
      if (st.fatal) throw new Error("Xuất lỗi nặng: " + st.p);
      if (!st.run && st.q === 0) return;
      await sleep(1500); continue;
    }
    const i1 = v.indexOf("\n"), i2 = v.indexOf("\n", i1 + 1);
    const ten = v.slice(0, i1), text = v.slice(i2 + 1);
    appendFileSync(`${thuMucRa}/${ten}.ndjson`, text, "utf8"); ack = "true";
  }
}
const docMang = async (tep) => { const r = []; if (existsSync(tep)) for await (const x of docNdjson(tep)) r.push(x); return r; };
const lo = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

let D = arg("--thu-muc", null);
let batDauXuat = new Date().toISOString();
if (arg("--thu-muc", null)) { // dùng lại bản xuất: mốc lần sau tính từ LÚC XUẤT (không phải lúc ghi)
  const tm = `${arg("--thu-muc")}/_meta.json`; const m = arg("--thu-muc").match(/dong-bo-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/);
  if (existsSync(tm)) batDauXuat = JSON.parse(readFileSync(tm, "utf8")).bat_dau_xuat;
  else if (m) batDauXuat = dich(Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+07:00`));
}
const dbTruoc = await ketNoi(); // chỉ đọc để chọn id cần lấy chi tiết
const qT = async (s, p) => (await dbTruoc.query(s, p)).rows;
if (!D) {
  const gio = new Date(Date.now() + 7 * 3600e3).toISOString();
  D = `${SAO_LUU}/dong-bo-${gio.slice(0, 10).replace(/-/g, "")}-${gio.slice(11, 16).replace(":", "")}`;
  // chạy thử rồi ghi thật trong cùng một phút: không được xuất chồng vào thư mục cũ (ndjson ghi nối → nguồn nhân đôi)
  if (existsSync(D)) { let i = 2; while (existsSync(`${D}-${i}`)) i++; D = `${D}-${i}`; }
  mkdirSync(D, { recursive: true });
  writeFileSync(`${D}/_meta.json`, JSON.stringify({ bat_dau_xuat: batDauXuat, moc: mocIso, tu: tuNgay, den: denNgay }));
  console.log(`XUẤT từ SalonHero: mốc ${mocIso} (VN ${tuNgay}) · hoá đơn ${tuDon} → <${denExcl} · lịch ${thangLich.length} tháng · thư mục ${D}`);
  const { tab, dongSau } = await moTab();
  try {
    const tmpl = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "dong-bo-xuat.trinh-duyet.js"), "utf8");
    const chay = async (tham) => { const kq = js(tab, tmpl.replace(/__THAM_SO__\)\s*$/, () => JSON.stringify({ mocIso, tuDon, denExcl, thangLich, ...tham }) + ")")); if (kq !== "started") throw new Error("Không khởi động được pha xuất: " + kq); await keo(tab, D); };
    await chay({ pha: "ds" });
    // chọn id cần chi tiết
    const dsDon = await docMang(`${D}/don_ds.ndjson`);
    const hdAm = new Map((await qT(`select sh_id, sh_trang_thai from public.hoa_don where sh_id is not null and ngay_hd >= $1::date - 2`, [tuDon])).map((r) => [Number(r.sh_id), r.sh_trang_thai]));
    const sauMoc = (r) => String(r.updated_at ?? r.updatedAt ?? "") >= mocIso || String(r.created_at ?? r.createdAt ?? "") >= mocIso;
    const donIds = dsDon.filter((l) => l.status !== "DRAFT" && (!hdAm.has(Number(l.id)) || sauMoc(l) || hdAm.get(Number(l.id)) !== l.status)).map((l) => Number(l.id));
    // khách trả nợ hoá đơn cũ (ngoài cửa sổ 35 ngày) sau mốc: lấy thêm chi tiết đúng các hoá đơn đó để ghi lần thu (vụ SH-26090170 ngày 06/11)
    const trongDsDon = new Set(dsDon.map((l) => Number(l.id)));
    const donNoCu = [...new Set((await docMang(`${D}/gio_thu.ndjson`)).filter((x) => x.order_id && String(x.createdAt ?? "") >= mocIso && !trongDsDon.has(Number(x.order_id))).map((x) => Number(x.order_id)))];
    donIds.push(...donNoCu);
    if (donNoCu.length) console.log(`  thêm ${donNoCu.length} hoá đơn cũ có lần trả nợ sau mốc: ${donNoCu.join(", ")}`);
    const khachList = await docMang(`${D}/khach.ndjson`);
    const kAm = new Map((await qT(`select sh_id, ho_ten, diem_goc, hang_goc from public.khach_hang where sh_id is not null`)).map((r) => [Number(r.sh_id), r]));
    const chamDen = new Set(); // khách dính hoá đơn/lịch/thẻ đổi
    for (const l of dsDon) if (donIds.includes(Number(l.id)) && l.customer_id) chamDen.add(Number(l.customer_id));
    for (const b of await docMang(`${D}/lich_hen.ndjson`)) if (sauMoc(b) && b.customer_id) chamDen.add(Number(b.customer_id));
    const theDs = await docMang(`${D}/the.ndjson`);
    const theAm = new Map((await qT(`select sh_id, trang_thai from public.the_khach where sh_id is not null`)).map((r) => [Number(r.sh_id), r.trang_thai]));
    const theCham = new Set(); // khách có thẻ mới/đổi
    for (const c of theDs) if (!theAm.has(Number(c.id)) || sauMoc(c)) theCham.add(Number(c.customer_id));
    for (const k of theCham) chamDen.add(k);
    const khachIds = khachList.filter((c) => { const a = kAm.get(Number(c.id)); return !a || chamDen.has(Number(c.id)) || Number(c.loyalty_point) !== Number(a.diem_goc) || (HANG[c.rank] ?? null) !== (a.hang_goc ?? null) || sach(c.full_name) !== sach(a.ho_ten); }).map((c) => Number(c.id));
    const trongDs = new Set(theDs.map((c) => Number(c.id)));
    // thẻ dùng hết/hết hạn biến khỏi danh sách SalonHero: chỉ cần hỏi lại thẻ AMIA còn số dư mà chưa hết hạn từ lâu (thẻ 0 dư hoặc đã hết hạn trước mốc 1 ngày không còn đổi được)
    const theIds = (await qT(`select t.sh_id from public.the_khach t where t.sh_id is not null and t.trang_thai = 'hoat_dong' and (t.han_dung is null or t.han_dung >= $1::date - 1)
      and exists (select 1 from public.the_so_cai c where c.the_id = t.id group by c.the_id having sum(c.so_buoi) > 0 or sum(c.so_tien) > 0)`, [vnNgay(mocIso)])).map((r) => Number(r.sh_id)).filter((id) => !trongDs.has(id));
    console.log(`  chi tiết cần lấy: ${donIds.length} hoá đơn, ${khachIds.length} khách, ${theCham.size} khách có thẻ đổi, ${theIds.length} thẻ ngoài danh sách`);
    const nhomDon = lo(donIds, 800), nhomKhach = lo(khachIds, 800), nhomThe = lo([...theCham], 800), nhomTheId = lo(theIds, 800);
    const soLan = Math.max(nhomDon.length, nhomKhach.length, nhomThe.length, nhomTheId.length, 1);
    for (let i = 0; i < soLan; i++) await chay({ pha: "ct", donIds: nhomDon[i] ?? [], khachIds: nhomKhach[i] ?? [], theTheoKhach: nhomThe[i] ?? [], theIds: nhomTheId[i] ?? [] });
    const err = JSON.parse(js(tab, "JSON.stringify(__E.err.slice(0,200))")); writeFileSync(`${D}/_loi_xuat.json`, JSON.stringify(err));
    if (err.length) console.log(`  CẢNH BÁO: ${err.length} mục xuất lỗi (xem _loi_xuat.json) — sẽ KHÔNG cho --that`);
  } finally { if (dongSau) { try { aba({ action: "tab_close", args: { tab_id: tab } }); } catch { /* bỏ qua */ } } }
}
await dbTruoc.end();
const loiXuat = existsSync(`${D}/_loi_xuat.json`) ? JSON.parse(readFileSync(`${D}/_loi_xuat.json`, "utf8")) : [];

// ══════════ 2. NẠP VÀO AMIA ══════════
// SalonHero: Ví điện tử vào QUỸ NGÂN HÀNG; Ship COD KHÔNG vào quỹ nào (tồn quỹ SalonHero không cộng COD — v_so_quy bỏ ship_cod, migration 0208). Mã riêng từ migration 0199 (03/11/2026).
const PT = { CASH: "tien_mat", TRANSFER: "chuyen_khoan", CARD: "quet_the", COD: "ship_cod", WALLET: "vi_dien_tu" };
const ptDich = (t) => PT[String(t ?? "").toUpperCase()] ?? "chuyen_khoan";
const VI_SH = new Set(["ZALO", "MOMO", "GRAB", "VNPAY", "SAMSUNG", "SHOPEE", "VINID", "GOTIT", "NETSPAY", "PAYNOW", "AIRTEL", "MTN"]);
/** Loại ví (migration 0199): chỉ khi phương thức là ví điện tử; mã lạ/trống = KHAC. */
const viDich = (pt, wallet) => (pt === "vi_dien_tu" ? (VI_SH.has(String(wallet ?? "").toUpperCase()) ? String(wallet).toUpperCase() : "KHAC") : null);
const TT = { BOOKED: "chua_xac_nhan", CONFIRMED: "da_xac_nhan", CHECKIN: "cho_phuc_vu", PROCESSED: "dang_phuc_vu", FINISHED: "hoan_thanh", CANCELED: "huy", NOSHOW: "khong_den" };
const TTN = { ACTIVE: "dang_nhac", INACTIVE: "da_xong", CANCEL: "huy" };
const mang = (s) => { try { const v = typeof s === "string" ? JSON.parse(s) : s; return Array.isArray(v) ? v.map(Number).filter(Boolean) : []; } catch { return []; } };
const iso = (v) => (v && v !== "None" ? v : null);
function dedupe(v0, daCo, id) { let v = v0; if (daCo.has(v)) v = `${v0}-${id}`; daCo.add(v); return v; }
const khacNhau = (a, b) => { const na = a == null || a === "" ? null : a, nb = b == null || b === "" ? null : b; if (na == null || nb == null) return na !== nb; return typeof na === "number" || typeof nb === "number" ? Number(na) !== Number(nb) : String(na) !== String(nb); };

const dsKhach = await docMang(`${D}/khach.ndjson`);
const chiTiet = new Map(); for (const r of await docMang(`${D}/khach_tong_hop.ndjson`)) chiTiet.set(Number(r.id), r);
const theDs = await docMang(`${D}/the.ndjson`);
const theCt = await docMang(`${D}/the_chi_tiet.ndjson`);
const theSh = new Map(); for (const c of theDs) theSh.set(Number(c.id), c); for (const c of theCt) theSh.set(Number(c.id), { ...(theSh.get(Number(c.id)) ?? {}), ...c });
const dsDon = await docMang(`${D}/don_ds.ndjson`);
const donDs = new Map(dsDon.map((l) => [Number(l.id), l]));
const donCt = await docMang(`${D}/hoa_don.ndjson`);
const lichSh = []; { const th = new Set(); for (const r of await docMang(`${D}/lich_hen.ndjson`)) { if (th.has(r.id)) continue; th.add(r.id); lichSh.push(r); } }
const nhacSh = []; { const th = new Set(); for (const r of await docMang(`${D}/nhac_cham_soc.ndjson`)) { if (th.has(r.id)) continue; th.add(r.id); nhacSh.push(r); } }
if (!existsSync(`${D}/dem_don_v2.ndjson`) && dsDon.length) { // cho doi-chieu-thang.mjs: số đếm SỐNG của SalonHero theo tháng (lấy từ danh sách vừa xuất)
  const m = new Map(); for (const l of dsDon) { const k = vnNgay(l.created_at).slice(0, 7); const o = m.get(k) ?? [k, 0, 0, 0, 0, 0, 0, 0]; o[1]++; const t = Number(l.total) || 0; if (l.status === "COMPLETED") { o[2]++; o[5] += t; o[7] += Number(l.debt) || 0; } else if (l.status === "DRAFT") { o[3]++; o[6] += t; } else if (l.status === "VOID") o[4]++; m.set(k, o); }
  writeFileSync(`${D}/dem_don_v2.ndjson`, [...m.values()].map((o) => JSON.stringify(o)).join("\n") + "\n");
}
if (!existsSync(`${D}/dem_lich_v2.ndjson`) && existsSync(`${D}/dem_lich.ndjson`)) writeFileSync(`${D}/dem_lich_v2.ndjson`, readFileSync(`${D}/dem_lich.ndjson`));
console.log(`Nguồn (${D.split("/").pop()}): khách ${dsKhach.length} (chi tiết ${chiTiet.size}) · thẻ ${theSh.size} · hoá đơn danh sách ${dsDon.length} (chi tiết ${donCt.length}) · lịch ${lichSh.length} · nhắc ${nhacSh.length}`);

const db = await ketNoi(); const q = async (sql, p) => (await db.query(sql, p)).rows;
const mapIds = async (bangTen, ids) => new Map((await q(`select sh_id, id from public.${bangTen} where sh_id = any($1::bigint[])`, [[...new Set(ids.map(Number))]])).map((r) => [Number(r.sh_id), r.id]));
const t0 = Date.now(); const tik = (m) => console.log(`  [${Math.round((Date.now() - t0) / 1000)}s] ${m}`);
// Thẻ AMIA còn số dư mà SalonHero đã xoá (vd thẻ "Tiền đặt cọc" 3270634 bị xoá rồi cấp lại 3273616, 4/11/2026): hỏi theo id lần nào cũng lỗi
// và không còn trong danh sách thẻ của khách → KHÔNG chặn cả đợt, chỉ liệt kê để người xem tay. Lỗi xuất khác vẫn chặn như cũ.
const theDaXoaSh = await (async () => {
  const ung = loiXuat.filter((x) => x[0] === "the_chi_tiet" && !theSh.has(Number(x[1]))).map((x) => Number(x[1]));
  if (!ung.length) return [];
  return (await q(`select sh_id, ma from public.the_khach where sh_id = any($1::bigint[])`, [ung])).map((r) => ({ sh_id: Number(r.sh_id), ma: r.ma }));
})();
const loiChan = loiXuat.filter((x) => !(x[0] === "the_chi_tiet" && theDaXoaSh.some((t) => t.sh_id === Number(x[1]))));
if (theDaXoaSh.length) console.log(`  thẻ không còn trên SalonHero (có thể đã xoá, không chặn, cần xem tay): ${JSON.stringify(theDaXoaSh)}`);
const tom = { dot, that, tu: tuNgay, den: denNgay, moc: mocIso, loi_xuat: loiChan.length, the_khong_con_tren_sh: theDaXoaSh };
const xungDot = { khach: [], the: [], hoa_don: [], lich: [], nhac: [], khach_trung_app: [], hoa_don_trung_app: [] };
try {
  await db.query("begin");
  await db.query("set local statement_timeout = '1800s'");
  await taoDot(db, dot, `Đồng bộ tăng dần SalonHero (mốc ${mocIso}, đến ${denNgay})`);
  const he = await nhanVienHeThong(db);
  const chu = (await q(`select id from public.nhan_vien where vai_tro = 'quan_ly' and hoat_dong order by tao_luc limit 1`))[0];
  const cdMoc = baseline ?? (await q(`select max(tao_luc) t from public.nhap_dot where ma like 'SH-%' and ma <> $1`, [dot]))[0].t; // lúc đổ SH lần trước
  tom.moc_xung_dot_cap_nhat_luc = new Date(cdMoc).toISOString();

  // ── TỰ KIỂM: giả lập mất/đổi dữ liệu (luôn rollback) ──
  if (tuKiem) {
    const gl = {};
    await db.query("select set_config('amia.go_dot','on',true)");
    const coCt = donCt.map((r) => Number(r.id));
    const hdMoi = (await q(`select id, sh_id from public.hoa_don where sh_id = any($2::bigint[]) and la_lich_su and trang_thai = 'hoan_thanh' and ngay_hd >= $1::date order by ngay_hd desc, sh_id desc limit 7`, [tuNgay, coCt]));
    const huyLat = (await q(`select id from public.hoa_don where sh_id = any($1::bigint[]) and la_lich_su and trang_thai = 'huy' limit 1`, [coCt])).map((r) => r.id);
    const xoa = hdMoi.slice(0, 3).map((r) => r.id), sua = hdMoi.slice(3, 6).map((r) => r.id);
    await q(`delete from public.thanh_toan where hoa_don_id = any($1::uuid[])`, [xoa]); await q(`delete from public.hoa_don_dong where hoa_don_id = any($1::uuid[])`, [xoa]);
    await db.query("set local session_replication_role = replica");
    await q(`delete from public.hoa_don where id = any($1::uuid[])`, [xoa]);
    await q(`update public.hoa_don set tong_phai_thu = tong_phai_thu + 1000, tong_hang = tong_hang + 1000 where id = any($1::uuid[])`, [sua.slice(0, 2)]); // mô phỏng "SalonHero đã sửa lại số tiền"
    await q(`update public.hoa_don set trang_thai = 'huy', tong_phai_thu = 0, tong_hang = 0, vat_tien = 0, da_thu = 0, con_no = 0 where id = any($1::uuid[])`, [sua.slice(2, 3)]); // mô phỏng "AMIA còn ghi hoàn thành mà SalonHero đã sửa"
    if (huyLat.length) await q(`update public.hoa_don set trang_thai = 'hoan_thanh', tong_phai_thu = 5000 where id = any($1::uuid[])`, [huyLat]); // đơn SalonHero đã huỷ mà AMIA ghi hoàn thành → sẽ phải đi nhánh huỷ
    gl.hoa_don_xoa = xoa.length; gl.hoa_don_sua = sua.length;
    const lichMoi = await q(`select id, sh_id from public.lich_hen where sh_id is not null and la_lich_su and bat_dau >= $1::timestamptz order by bat_dau desc limit 6`, [mocIso]);
    await q(`delete from public.lich_hen where id = any($1::uuid[])`, [lichMoi.slice(0, 3).map((r) => r.id)]);
    await q(`update public.lich_hen set trang_thai = 'khong_den' where id = any($1::uuid[]) and trang_thai <> 'khong_den'`, [lichMoi.slice(3, 6).map((r) => r.id)]);
    gl.lich_xoa = Math.min(3, lichMoi.length); gl.lich_sua = Math.max(0, lichMoi.length - 3);
    await db.query("set local session_replication_role = origin");
    const kMoi = await q(`select id, sh_id from public.khach_hang k where sh_id is not null and not exists (select 1 from public.hoa_don h where h.khach_id = k.id) and not exists (select 1 from public.lich_hen l where l.khach_id = k.id) and not exists (select 1 from public.the_khach t where t.khach_id = k.id) and not exists (select 1 from public.khach_nhac n where n.khach_id = k.id) and not exists (select 1 from public.khach_diem_so s where s.khach_id = k.id) order by tao_luc desc limit 2`);
    await db.query("set local session_replication_role = replica");
    if (kMoi.length) await q(`delete from public.khach_hang where id = any($1::uuid[])`, [kMoi.map((r) => r.id)]);
    await db.query("set local session_replication_role = origin");
    gl.khach_xoa = kMoi.length;
    const mocS = (r) => String(r.updated_at ?? r.updatedAt ?? "") >= mocIso || String(r.created_at ?? r.createdAt ?? "") >= mocIso;
    const idsThe = [...theSh.values()].filter((c) => !c.is_deleted && (mocS(c) || theCt.some((x) => Number(x.id) === Number(c.id)))).map((c) => Number(c.id));
    const theGia = await q(`select t.id from public.the_khach t where t.sh_id = any($1::bigint[]) and t.loai = 'lan' limit 2`, [idsThe]);
    for (const t of theGia) await q(`insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu, nhap_dot) values ($1, 'dieu_chinh', 1, 0, $2, 'TỰ KIỂM: lệch giả lập', $3)`, [t.id, he, dot]);
    gl.the_lech = theGia.length;
    await db.query("set local session_replication_role = replica");
    const kSua = await q(`update public.khach_hang set nghe_nghiep = 'TU-KIEM', diem_goc = coalesce(diem_goc,0) + 7 where id in (select id from public.khach_hang where sh_id = any($1::bigint[]) limit 2) returning id`, [[...chiTiet.keys()]]);
    gl.khach_sua = kSua.length;
    await db.query("set local session_replication_role = origin");
    const lichXd = await q(`update public.lich_hen set trang_thai = 'huy' where id = (select id from public.lich_hen where sh_id = any($1::bigint[]) and la_lich_su and trang_thai <> 'huy' limit 1) returning id`, [lichSh.map((r) => Number(r.id))]); // sửa "trong app" (trigger đặt cap_nhat_luc = now) → phải bị báo XUNG ĐỘT, không bị ghi đè
    gl.lich_xung_dot = lichXd.length;
    await db.query("select set_config('amia.go_dot','off',true)");
    tom.tu_kiem = gl; console.log("TỰ KIỂM đã giả lập:", JSON.stringify(gl));
  }

  // ════ A. KHÁCH ════
  const shKhachAm = new Set((await q(`select sh_id from public.khach_hang where sh_id is not null`)).map((r) => Number(r.sh_id)));
  const hienCo = new Map((await q(`select id, sh_id, dien_thoai, cap_nhat_luc, ho_ten, zalo, email, gioi_tinh, to_char(ngay_sinh,'YYYY-MM-DD') ngay_sinh, dia_chi, nghe_nghiep, cong_ty, facebook, website, chieu_cao_cm, can_nang_kg, ma_so_thue, tinh_thanh, quan_huyen,
      quoc_gia, sdt_phu, ma_the_giay, co_so_goc, hang_goc, diem_goc, tong_chi_goc, so_lan_den_goc, to_char(lan_den_cuoi,'YYYY-MM-DD') lan_den_cuoi from public.khach_hang where sh_id = any($1::bigint[])`, [[...chiTiet.keys()]])).map((r) => [Number(r.sh_id), r]));
  const moiCan = dsKhach.some((c) => !shKhachAm.has(Number(c.id)));
  const maDaCo = new Set(moiCan ? (await q(`select ma from public.khach_hang`)).map((r) => r.ma) : []);
  const sdtDaCo = new Set(moiCan ? (await q(`select dien_thoai from public.khach_hang`)).map((r) => r.dien_thoai) : []);
  const sdtApp = new Set(moiCan ? (await q(`select dien_thoai from public.khach_hang where sh_id is null`)).map((r) => r.dien_thoai) : []); // khách tạo trong app: nếu SalonHero có khách mới trùng SĐT = nạp đúp, phải người quyết
  const baoK = { sdt_doi_bo_qua: 0, sdt_trong: 0, sdt_trung: 0, thieu_chi_tiet_moi: 0, doi_thong_tin: 0, doi_chi_so: 0 };
  const dongKhach = (c) => {
    const rt = chiTiet.get(Number(c.id)); const ct = rt?.chi_tiet ?? {};
    const dobOk = Number(ct.dob_year) > 1900 && Number(ct.dob_month) >= 1 && Number(ct.dob_month) <= 12 && Number(ct.dob_date) >= 1 && Number(ct.dob_date) <= 31;
    const ngaySinh = dobOk ? `${ct.dob_year}-${String(ct.dob_month).padStart(2, "0")}-${String(ct.dob_date).padStart(2, "0")}` : null;
    const diaChi = [sach(ct.address), sach(ct.district_name), sach(ct.city_name)].filter(Boolean).join(", ") || null;
    return {
      sh_id: Number(c.id), ho_ten: sach(ct.full_name || c.full_name) || `Khách ${c.id}`, zalo: sdt(c.zalo) || null, email: sach(ct.email || c.email) || null,
      gioi_tinh: c.gender === "F" ? "nữ" : c.gender === "M" ? "nam" : null, ngay_sinh: ngaySinh, dia_chi: diaChi,
      nghe_nghiep: sach(ct.job) || null, cong_ty: sach(ct.organization) || null, facebook: sach(ct.facebook_id) || null, website: sach(ct.website) || null,
      chieu_cao_cm: Number(ct.height) > 0 ? Number(ct.height) : null, can_nang_kg: Number(ct.weight) > 0 ? Number(ct.weight) : null, ma_so_thue: sach(ct.tax_code) || null,
      tinh_thanh: sach(ct.city_name) || null, quan_huyen: sach(ct.district_name) || null, quoc_gia: sach(ct.country_code) || null, sdt_phu: sdt(ct.new_mobile) || null,
      ma_the_giay: sach(ct.card_code || c.card_code) || null, co_so_goc: sach(c.location_names || ct.location_names) || null,
      hang_goc: HANG[c.rank] ?? null, diem_goc: so(c.loyalty_point), tong_chi_goc: so(ct.total_paid_amount), so_lan_den_goc: so(ct.number_visited), lan_den_cuoi: vnNgay(ct.last_visited),
    };
  };
  const COT_MO_TA = ["ho_ten", "zalo", "email", "gioi_tinh", "ngay_sinh", "dia_chi", "nghe_nghiep", "cong_ty", "facebook", "website", "chieu_cao_cm", "can_nang_kg", "ma_so_thue", "tinh_thanh", "quan_huyen", "quoc_gia", "sdt_phu", "ma_the_giay", "co_so_goc"];
  const COT_COALESCE = new Set(["zalo", "email", "gioi_tinh", "ngay_sinh", "dia_chi"]);
  const COT_CHI_SO = ["hang_goc", "diem_goc", "tong_chi_goc", "so_lan_den_goc", "lan_den_cuoi"];
  const capNhatK = [], khMoiNguon = [];
  for (const c of dsKhach) {
    const id = Number(c.id);
    if (!shKhachAm.has(id)) { khMoiNguon.push(c); continue; }
    if (!chiTiet.has(id)) continue; // không lấy chi tiết = danh sách không báo đổi gì → giữ nguyên
    const am = hienCo.get(id);
    const d = dongKhach(c);
    const p = sdt(c.mobile) || sdt(chiTiet.get(id)?.chi_tiet?.mobile);
    if (p && p !== am.dien_thoai && !String(am.dien_thoai).includes("TRUNG") && !String(am.dien_thoai).startsWith("KHONG-SDT")) baoK.sdt_doi_bo_qua++;
    const dMoTa = COT_MO_TA.filter((k) => (COT_COALESCE.has(k) ? d[k] != null && khacNhau(d[k], am[k]) : khacNhau(d[k], am[k])));
    const dChiSo = COT_CHI_SO.filter((k) => (k === "hang_goc" || k === "lan_den_cuoi" ? d[k] != null && khacNhau(d[k], am[k]) : khacNhau(d[k], am[k])));
    if (!dMoTa.length && !dChiSo.length) continue;
    const appSua0 = am.cap_nhat_luc && new Date(am.cap_nhat_luc) > new Date(cdMoc);
    if (appSua0 && GHI_DE && dMoTa.length) daGhiDe.khach++;
    const appSua = appSua0 && !GHI_DE;
    if (dMoTa.length && appSua) xungDot.khach.push({ sh_id: id, cot: dMoTa });
    const dung = appSua ? { ...d, ...Object.fromEntries(COT_MO_TA.map((k) => [k, am[k] ?? null])) } : d; // đã bị sửa trong app: giữ nguyên phần mô tả, chỉ cập nhật chỉ số gốc
    if (dMoTa.length && !appSua) baoK.doi_thong_tin++;
    if (dChiSo.length) baoK.doi_chi_so++;
    capNhatK.push(dung);
  }
  let nCapNhatK = 0;
  await theoLo(capNhatK, 1000, async (l) => {
    nCapNhatK += (await q(`update public.khach_hang k set ho_ten = x.ho_ten, zalo = coalesce(x.zalo, k.zalo), email = coalesce(x.email, k.email), gioi_tinh = coalesce(x.gioi_tinh, k.gioi_tinh), ngay_sinh = coalesce(x.ngay_sinh, k.ngay_sinh),
         dia_chi = coalesce(x.dia_chi, k.dia_chi), nghe_nghiep = x.nghe_nghiep, cong_ty = x.cong_ty, facebook = x.facebook, website = x.website, chieu_cao_cm = x.chieu_cao_cm, can_nang_kg = x.can_nang_kg, ma_so_thue = x.ma_so_thue,
         tinh_thanh = x.tinh_thanh, quan_huyen = x.quan_huyen, quoc_gia = x.quoc_gia, sdt_phu = x.sdt_phu, ma_the_giay = x.ma_the_giay, co_so_goc = x.co_so_goc,
         hang_goc = coalesce(x.hang_goc, k.hang_goc), diem_goc = x.diem_goc, tong_chi_goc = x.tong_chi_goc, so_lan_den_goc = x.so_lan_den_goc, lan_den_cuoi = coalesce(x.lan_den_cuoi, k.lan_den_cuoi), cap_nhat_luc = now()
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ho_ten text, zalo text, email text, gioi_tinh text, ngay_sinh date, dia_chi text, nghe_nghiep text, cong_ty text, facebook text, website text, chieu_cao_cm numeric, can_nang_kg numeric,
            ma_so_thue text, tinh_thanh text, quan_huyen text, quoc_gia text, sdt_phu text, ma_the_giay text, co_so_goc text, hang_goc text, diem_goc int, tong_chi_goc bigint, so_lan_den_goc int, lan_den_cuoi date)
       where k.sh_id = x.sh_id returning 1`, [JSON.stringify(l)])).length;
  });
  const khMoi = khMoiNguon.map((c) => {
    const d = dongKhach(c); const ct = chiTiet.get(d.sh_id)?.chi_tiet ?? {};
    if (!chiTiet.has(d.sh_id)) baoK.thieu_chi_tiet_moi++;
    let p = sdt(c.mobile) || sdt(ct.mobile); let ghiMa = "";
    if (!p) { p = `KHONG-SDT-${c.id}`; baoK.sdt_trong++; } else if (sdtDaCo.has(p)) { if (sdtApp.has(p)) xungDot.khach_trung_app.push({ sh_id: Number(c.id), sdt: p, ghi: "trùng SĐT với khách tạo trong app" }); p = `${p}-TRUNG${c.id}`; baoK.sdt_trung++; ghiMa = "SĐT trùng với một khách khác ở SalonHero, cần gộp hoặc sửa tay."; }
    sdtDaCo.add(p);
    const loc = ct.init_location_id ?? null;
    const cnK = loc ? cnTheoLoc(loc) : /Đà Lạt/.test(c.location_names ?? "") && !/Vinh/.test(c.location_names ?? "") ? "DALAT" : "VINH";
    const s = sach(ct.refer_source).toLowerCase();
    const nguon = Number(ct.refer_by_cust_id) > 0 || /bạn bè|giới thiệu|người quen/.test(s) ? "khach_cu_gioi_thieu" : /page|facebook|fb|voucher|tiktok|zalo|google|website|quảng cáo|ads/.test(s) ? "mkt" : "khac";
    return { ...d, ma: dedupe(sach(c.code) || `SH${c.id}`, maDaCo, c.id), dien_thoai: p, cn: cnK, nguon, nguon_chi_tiet: sach(ct.refer_source) || null, tao_luc: ct.createdAt ?? null, ghi_chu: ghiMa || null };
  });
  let nMoiK = 0;
  await theoLo(khMoi, 1000, async (l) => {
    nMoiK += (await q(`insert into public.khach_hang (sh_id, ma, ho_ten, dien_thoai, zalo, email, gioi_tinh, ngay_sinh, dia_chi, chi_nhanh_id, nguon, nguon_chi_tiet, nguoi_phu_trach_id, ghi_chu, tao_luc,
         hang_goc, diem_goc, tong_chi_goc, so_lan_den_goc, lan_den_cuoi, nghe_nghiep, cong_ty, facebook, website, chieu_cao_cm, can_nang_kg, ma_so_thue, tinh_thanh, quan_huyen, quoc_gia, sdt_phu, ma_the_giay, co_so_goc, nhap_dot)
       select x.sh_id, x.ma, x.ho_ten, x.dien_thoai, x.zalo, x.email, x.gioi_tinh, x.ngay_sinh, x.dia_chi, (select id from public.chi_nhanh where ma = x.cn), x.nguon, x.nguon_chi_tiet, $2::uuid, x.ghi_chu, coalesce(x.tao_luc, now()),
         x.hang_goc, x.diem_goc, x.tong_chi_goc, x.so_lan_den_goc, x.lan_den_cuoi, x.nghe_nghiep, x.cong_ty, x.facebook, x.website, x.chieu_cao_cm, x.can_nang_kg, x.ma_so_thue, x.tinh_thanh, x.quan_huyen, x.quoc_gia, x.sdt_phu, x.ma_the_giay, x.co_so_goc, $3
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, ho_ten text, dien_thoai text, zalo text, email text, gioi_tinh text, ngay_sinh date, dia_chi text, cn text, nguon text, nguon_chi_tiet text, ghi_chu text, tao_luc timestamptz,
            hang_goc text, diem_goc int, tong_chi_goc bigint, so_lan_den_goc int, lan_den_cuoi date, nghe_nghiep text, cong_ty text, facebook text, website text, chieu_cao_cm numeric, can_nang_kg numeric, ma_so_thue text, tinh_thanh text, quan_huyen text,
            quoc_gia text, sdt_phu text, ma_the_giay text, co_so_goc text)
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(l), chu.id, dot])).length;
  });
  // ghi chú riêng (CS######) của các khách đã lấy chi tiết
  const khachId = await mapIds("khach_hang", [...chiTiet.keys()]);
  const ghiChu = [];
  for (const [shId, rt] of chiTiet) for (const n of rt.ghi_chu?.notes ?? []) {
    if (n.is_deleted || !khachId.has(shId)) continue;
    const noiDung = vanBanGhiChuSh(n); // giữ xuống dòng trong từng ô (07/11/2026)
    if (!noiDung) continue;
    ghiChu.push({ sh_id: Number(n.id), khach_id: khachId.get(shId), noi_dung: noiDung, tao_luc: n.createdAt ?? null });
  }
  // ghi chú sửa trên SalonHero → cập nhật dòng SH-% (KHÔNG đè dòng sửa trong app: APP-SUA / không có nhap_dot SH-)
  let nGhiChu = 0, nSuaGhiChu = 0;
  await theoLo(ghiChu, 1000, async (l) => {
    for (const r of await q(`insert into public.khach_ghi_chu as g (sh_id, khach_id, tinh_trang, tao_luc, loai, nhap_dot) select x.sh_id, x.khach_id, x.noi_dung, coalesce(x.tao_luc, now()), 'cskh', $2 from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, noi_dung text, tao_luc timestamptz)
         on conflict (sh_id) do update set tinh_trang = excluded.tinh_trang, nhap_dot = excluded.nhap_dot
         where g.nhap_dot like 'SH-%' and g.tinh_trang is distinct from excluded.tinh_trang returning (xmax = 0) moi`, [JSON.stringify(l), dot])) r.moi ? nGhiChu++ : nSuaGhiChu++;
  });
  tom.khach = { moi: nMoiK, cap_nhat: nCapNhatK, ghi_chu_moi: nGhiChu, ghi_chu_sua: nSuaGhiChu, ...baoK };

  tik('khách xong');
  // ════ B. THẺ ════
  const goi = await mapMa(db, "goi_the");
  const sauMocS = (r) => String(r.updated_at ?? r.updatedAt ?? "") >= mocIso || String(r.created_at ?? r.createdAt ?? "") >= mocIso;
  const theCoIds = new Set((await q(`select sh_id from public.the_khach where sh_id is not null`)).map((r) => Number(r.sh_id)));
  const chiTietThe = new Set(theCt.map((c) => Number(c.id)));
  const theCan = [...theSh.values()].filter((c) => !c.is_deleted && (!theCoIds.has(Number(c.id)) || sauMocS(c) || chiTietThe.has(Number(c.id)))); // thẻ mới / vừa đổi / vừa lấy chi tiết
  const khachTheMap = await mapIds("khach_hang", theCan.map((c) => c.customer_id));
  const theCo = new Map((await q(`select t.sh_id, t.id, t.loai, t.trang_thai, coalesce(s.b,0)::int buoi, coalesce(s.t,0)::bigint tien, coalesce(s.app,0)::int app
      from public.the_khach t left join lateral (select sum(so_buoi) b, sum(so_tien) t, count(*) filter (where nhap_dot is null or nhap_dot not like 'SH-%') app from public.the_so_cai where the_id = t.id) s on true where t.sh_id = any($1::bigint[])`,
    [theCan.map((c) => Number(c.id))])).map((r) => [Number(r.sh_id), r]));
  const moiThe = theCan.some((c) => !theCoIds.has(Number(c.id)));
  const maThe = new Set(moiThe ? (await q(`select ma from public.the_khach`)).map((r) => r.ma) : []);
  const dieuChinh = [], theMoi = [], dichTrangThai = [], baoT = { khong_co_khach: 0, khong_co_goi: 0, khong_nap_cu: 0, khong_nap_moi: 0, mau_khong_nap_moi: [], trang_thai_doi: 0, da_xoa_bo_qua: 0, can_xem: theCan.length };
  const tuMoc = (c) => String(c.created_at ?? c.createdAt ?? "") >= mocIso; // thẻ tạo sau mốc mà không nạp được = danh mục SalonHero mới → phải xử lý; thẻ cũ thiếu gói/khách = ngoại lệ đã biết từ 28–29/10
  const tinhDich = (c) => { const lan = c.card_type === "USING"; const limit = Math.max(1, Math.round(Number(c.use_limit) || 1)); const da = Math.min(limit, Math.max(0, Math.round(Number(c.use_count) || 0))); return { lan, limit, da, buoi: lan ? limit - da : 0, tien: lan ? 0 : Math.max(0, so(c.account_balance)) }; };
  for (const c of theCan) {
    const t = tinhDich(c); const tt = c.is_revoked ? "thu_hoi" : c.is_locked ? "khoa" : "hoat_dong";
    const cu = theCo.get(Number(c.id));
    if (cu) {
      const lechSoDu = t.buoi !== cu.buoi || t.tien !== Number(cu.tien);
      const lechTT = cu.trang_thai !== tt && cu.trang_thai !== "thu_hoi";
      if ((lechSoDu || lechTT) && cu.app > 0 && GHI_DE) daGhiDe.the++;
      else if ((lechSoDu || lechTT) && cu.app > 0) { xungDot.the.push({ sh_id: Number(c.id), ma: c.code, ghi: "thẻ đã có dòng sổ cái tạo trong app" }); continue; }
      if (lechSoDu) dieuChinh.push({ the_id: cu.id, so_buoi: t.buoi - cu.buoi, so_tien: t.tien - Number(cu.tien) });
      if (lechTT) { dichTrangThai.push({ id: cu.id, trang_thai: tt }); baoT.trang_thai_doi++; }
      continue;
    }
    if (!khachTheMap.has(Number(c.customer_id)) || !goi.has(Number(c.card_id))) {
      if (!khachTheMap.has(Number(c.customer_id))) baoT.khong_co_khach++; else baoT.khong_co_goi++;
      if (tuMoc(c)) { baoT.khong_nap_moi++; baoT.mau_khong_nap_moi.push({ id: Number(c.id), ma: c.code, goi: Number(c.card_id), khach: Number(c.customer_id) }); } else baoT.khong_nap_cu++;
      continue;
    }
    theMoi.push({ sh_id: Number(c.id), ma: dedupe(sach(c.code) || `TSH${c.id}`, maThe, c.id), khach_sh: Number(c.customer_id), goi_sh: Number(c.card_id), cn: cnTheoLoc(c.init_location_id), loai: t.lan ? "lan" : "tien",
      so_buoi_tong: t.lan ? t.limit : null, tong_tien: t.lan ? so(c.card_sale_price) : so(c.card_default_account_balance) || so(c.account_balance),
      gia_tri_buoi: t.lan ? (t.limit < 999999 ? Math.round((Number(c.card_sale_price) || 0) / t.limit) : so(c.card_use_price)) : 0, ngay_cap: vnNgay(c.created_at ?? c.createdAt), han_dung: vnNgay(c.expiry_date), trang_thai: tt,
      ghi_chu: `Chuyển từ SalonHero (mã thẻ ${sach(c.code)}) — đồng bộ ${denNgay}${c.note ? ` — ${sach(c.note)}` : ""}${t.lan && t.limit >= 999999 ? " — thẻ không giới hạn số buổi" : ""}`, so_buoi_cap: t.lan ? t.limit : 0, so_buoi_da_dung: t.lan ? t.da : 0, so_du_tien: t.tien,
      // Giá trị 1 lần tính hoa hồng (0205, như nap-the.mjs của agent hoa hồng): card_use_price của thẻ khách; thẻ "tự tính" có card_use_price 0 → trống (AMIA tự tính giá bán ÷ số lần); thẻ tiền trống.
      gia_tri_1_lan_hh: t.lan ? (Number(c.is_dynamic_use_price) === 1 && !so(c.card_use_price) ? null : so(c.card_use_price)) : null });
  }
  if (dieuChinh.length) await theoLo(dieuChinh, 1000, (l) => q(`insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu, nhap_dot)
      select x.the_id, 'dieu_chinh', x.so_buoi, x.so_tien, $2::uuid, 'Đồng bộ số dư với SalonHero (đợt ' || $3 || ')', $3 from jsonb_to_recordset($1::jsonb) as x(the_id uuid, so_buoi int, so_tien bigint)`, [JSON.stringify(l), he, dot]));
  if (dichTrangThai.length) await theoLo(dichTrangThai, 1000, (l) => q(`update public.the_khach t set trang_thai = x.trang_thai from jsonb_to_recordset($1::jsonb) as x(id uuid, trang_thai text) where t.id = x.id`, [JSON.stringify(l)]));
  let nTheMoi = 0;
  await theoLo(theMoi, 1000, async (l) => {
    const them = await q(`with ins as (insert into public.the_khach (sh_id, ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, tong_tien, gia_tri_buoi, cap_tay, ngay_cap, han_dung, trang_thai, ghi_chu, nhap_dot, gia_tri_1_lan_hh)
         select x.sh_id, x.ma, k.id, g.id, (select id from public.chi_nhanh where ma = x.cn), x.loai, x.so_buoi_tong, x.tong_tien, x.gia_tri_buoi, true, coalesce(x.ngay_cap, current_date), x.han_dung, x.trang_thai, x.ghi_chu, $2, x.gia_tri_1_lan_hh
           from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, khach_sh bigint, goi_sh bigint, cn text, loai text, so_buoi_tong int, tong_tien bigint, gia_tri_buoi bigint, ngay_cap date, han_dung date, trang_thai text, ghi_chu text, gia_tri_1_lan_hh bigint)
           join public.khach_hang k on k.sh_id = x.khach_sh join public.goi_the g on g.sh_id = x.goi_sh on conflict (sh_id) do nothing returning id, sh_id) select id, sh_id from ins`, [JSON.stringify(l), dot]);
    nTheMoi += them.length;
    const idTheoSh = new Map(them.map((r) => [Number(r.sh_id), r.id])); const sc = [];
    for (const t of l) { const id = idTheoSh.get(t.sh_id); if (!id) continue;
      if (t.loai === "lan") { sc.push({ the_id: id, loai: "cap", so_buoi: t.so_buoi_cap, so_tien: 0, ghi_chu: "Số buổi gốc chuyển từ SalonHero" }); if (t.so_buoi_da_dung > 0) sc.push({ the_id: id, loai: "dieu_chinh", so_buoi: -t.so_buoi_da_dung, so_tien: 0, ghi_chu: "Số buổi đã dùng trước khi chuyển từ SalonHero" }); }
      else sc.push({ the_id: id, loai: "cap", so_buoi: 0, so_tien: t.so_du_tien, ghi_chu: "Số dư còn lại chuyển từ SalonHero" }); }
    if (sc.length) await q(`insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu, nhap_dot) select x.the_id, x.loai, x.so_buoi, x.so_tien, $2::uuid, x.ghi_chu, $3 from jsonb_to_recordset($1::jsonb) as x(the_id uuid, loai text, so_buoi int, so_tien bigint, ghi_chu text)`, [JSON.stringify(sc), he, dot]);
  });
  tom.the = { moi: nTheMoi, moi_ids: theMoi.slice(0, 10).map((t) => ({ sh_id: t.sh_id, ma: t.ma, ngay_cap: t.ngay_cap })), dieu_chinh: dieuChinh.length, ...baoT };

  tik('thẻ xong');
  // ════ C. HOÁ ĐƠN ════
  const nv = await mapMa(db, "nhan_vien"), dv = await mapMa(db, "dich_vu"), sp = await mapMa(db, "san_pham");
  const khach = await mapIds("khach_hang", [...dsDon.map((l) => l.customer_id), ...donCt.map((r) => r.d?.customer_id), ...lichSh.map((r) => r.customer_id), ...nhacSh.map((r) => r.customer_id)].filter(Boolean)); // sau khi thêm khách mới
  const idsDon = donCt.map((r) => Number(r.id));
  const hdRows = await q(`select sh_id, id, la_so_du_dau, la_lich_su, trang_thai, nhap_dot, khach_id, to_char(ngay_hd,'YYYY-MM-DD') ngay_hd, tong_phai_thu, da_thu, con_no, tien_tru_the, tong_hang, giam_gia_don from public.hoa_don where sh_id = any($1::bigint[])`, [idsDon]);
  const idHdArr = hdRows.map((r) => r.id);
  const ttAgg = new Map((await q(`select hoa_don_id, count(*)::int n, count(*) filter (where nhap_dot is null or nhap_dot not like 'SH-%')::int app from public.thanh_toan where hoa_don_id = any($1::uuid[]) group by 1`, [idHdArr])).map((r) => [r.hoa_don_id, r]));
  const dongAgg = new Map((await q(`select hoa_don_id, count(*)::int n, count(*) filter (where nhap_dot is null or nhap_dot not like 'SH-%')::int app, coalesce(sum(thanh_tien),0)::bigint tt from public.hoa_don_dong where hoa_don_id = any($1::uuid[]) group by 1`, [idHdArr])).map((r) => [r.hoa_don_id, r]));
  const dongCoThe = idHdArr.length ? new Set((await q(`select distinct d.hoa_don_id from public.hoa_don_dong d where d.hoa_don_id = any($1::uuid[]) and d.id in (select hoa_don_dong_id from public.the_khach where hoa_don_dong_id is not null)`, [idHdArr])).map((r) => r.hoa_don_id)) : new Set();
  const hdCo = new Map(hdRows.map((r) => [Number(r.sh_id), { ...r, tt: ttAgg.get(r.id)?.n ?? 0, tt_app: ttAgg.get(r.id)?.app ?? 0, n_dong: dongAgg.get(r.id)?.n ?? 0, dong_app: dongAgg.get(r.id)?.app ?? 0, thanh_tien: dongAgg.get(r.id)?.tt ?? 0, the_tu_dong: dongCoThe.has(r.id) ? 1 : 0 }]));
  const hdApp = new Set((await q(`select khach_id || '|' || to_char(ngay_hd,'YYYY-MM-DD') || '|' || tong_phai_thu k from public.hoa_don where sh_id is null and trang_thai <> 'huy' and khach_id is not null and ngay_hd >= $1::date`, [tuDon])).map((r) => r.k)); // hoá đơn tạo trong app
  const maUng = donCt.map((r) => `SH-${sach(r.d?.order_id)}`);
  const maDung = new Map((await q(`select ma, sh_id from public.hoa_don where ma = any($1::text[])`, [maUng])).map((r) => [r.ma, Number(r.sh_id)]));
  const baoH = { moi: 0, doi: 0, nang_cap_no_dau: 0, khong_doi: 0, huy_moi: 0, nhap_bo_qua: 0, khong_co_khach_o_amia: 0, dong_khong_co_danh_muc: 0, tong_hang_lech: [], khach_dong_du: [], ma_trung_them_duoi: 0, no_dau_bo_qua_vi_co_thanh_toan: [], khac_bo_qua: 0 };
  const hd = [], dong = [], nvDong = [], hhGoc = [], tt = [];
  const goiMap = goi;
  for (const r of donCt) {
    const d = r.d; const shId = Number(r.id); const l = donDs.get(shId) ?? { id: shId, created_at: d.createdAt };
    if (!d || d.status === "DRAFT") { baoH.nhap_bo_qua++; continue; }
    const huy = d.status === "VOID";
    const items = (d.orderItems ?? []).filter((it) => !it.is_delete);
    const tongHang = items.reduce((s, it) => s + so(it.subtotal) - so(it.discount), 0);
    if (!huy && tongHang !== so(d.subtotal)) baoH.tong_hang_lech.push(shId);
    const phuPhi = so(d.total_service_charge) + so(d.delivery_fee);
    const phai = so(d.subtotal) - so(d.discount) + so(d.tax_amount) + so(d.total_tip) + phuPhi;
    const daThuNguon = huy ? 0 : so(d.amount_paid) + so(d.total_amount_card);
    const khId = khach.get(Number(d.customer_id)) ?? null;
    if (d.customer_id && !khId) baoH.khong_co_khach_o_amia++;
    const ngay = vnNgay(l.created_at ?? d.createdAt);
    let ma = `SH-${sach(d.order_id)}`;
    const c = hdCo.get(shId);
    if (!c) { if (maDung.has(ma) && maDung.get(ma) !== shId) { ma = `${ma}-${shId}`; baoH.ma_trung_them_duoi++; } maDung.set(ma, shId); }
    if (c && !c.la_lich_su && !c.la_so_du_dau) { baoH.khac_bo_qua++; continue; } // có sh_id nhưng không phải dòng chuyển: không đụng
    if (c?.la_so_du_dau && c.tt > 0) { baoH.no_dau_bo_qua_vi_co_thanh_toan.push(shId); continue; }
    const dongC = [], nvC = [], hhC = [], ttC = [];
    for (const it of items) {
      const mc = it.member_card_id ? Number(it.member_card_id) : null;
      const laThe = !mc && Number(it.product_card_id) > 0 && it.product_type === "SERVICE";
      const loai = it.product_type === "PRODUCT" ? "san_pham" : laThe ? "goi_the" : "dich_vu";
      const ref = loai === "san_pham" ? sp.get(Number(it.product_id)) : loai === "goi_the" ? goiMap.get(Number(it.product_card_id)) : dv.get(Number(it.product_id));
      if (!ref) baoH.dong_khong_co_danh_muc++;
      const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
      dongC.push({ sh_id: Number(it.id), don_sh: shId, loai, ref: ref ?? null, ten: sach(it.product_name) || "(không tên)", so_luong: qty, don_gia: Math.max(0, so(it.product_price)), giam_gia: Math.max(0, so(it.discount)),
        loai_goc: `${it.product_type}${it.product_card_type ? ":" + it.product_card_type : ""}`, the_khach_sh_id: mc });
      for (const [vai, tien] of [["phuc_vu", "operator_id_"], ["tu_van", "presale_operator_id_"], ["ban", "sale_operator_id_"]]) {
        const ids = []; for (let k = 1; k <= 5; k++) { const id = it[`${tien}${k}`] ? Number(it[`${tien}${k}`]) : null; if (id && nv.has(id) && !ids.includes(id)) ids.push(id); }
        ids.forEach((id, i) => { const chia = Math.floor(10000 / ids.length) / 100; nvC.push({ dong_sh: Number(it.id), nv: nv.get(id), vai, ti_le: i === 0 ? +(100 - chia * (ids.length - 1)).toFixed(2) : chia }); });
      }
      try {
        const lg = it.comission_log ? JSON.parse(it.comission_log) : {};
        for (const [pid, v] of Object.entries(lg)) for (const [vai, truong] of [["phuc_vu", "commission"], ["ban", "sale_commission"], ["tu_van", "presale_commission"]]) {
          const gt = Number(v[truong]); if (!gt) continue;
          hhC.push({ dong_sh: Number(it.id), vai, sh_nv: Number(pid), nv: nv.get(Number(pid)) ?? null, gia_tri: gt, kieu: v[`${truong}_type`] ?? null });
        }
        if (it.referral_commission && Number(it.referral_commission)) hhC.push({ dong_sh: Number(it.id), vai: "gioi_thieu", sh_nv: Number(it.referral_id) || null, nv: null, gia_tri: Number(it.referral_commission), kieu: it.referral_commission_type ?? null });
      } catch { /* log hỏng: bỏ qua */ }
    }
    if (!huy) {
      const ev = (d.paymentHistory ?? []).filter((x) => !x.is_deleted && so(x.amount_paid) > 0);
      const chNh = chuanBiNganHangSh({ l, d }), nh = (pt, tien) => nganHangKhoan(chNh, pt, tien).ten; // ngân hàng nhận (migration 0179)
      let tong = 0;
      for (const x of ev) { ttC.push({ don_sh: shId, pt: ptDich(x.payment_type), vi: viDich(ptDich(x.payment_type), x.wallet_type ?? d.wallet_type), nh: nh(ptDich(x.payment_type), so(x.amount_paid)), so_tien: so(x.amount_paid), ngay: vnNgay(x.action_date) ?? ngay, ghi: `SalonHero ${x.actions}${x.user_name ? " · " + sach(x.user_name) : ""}` }); tong += so(x.amount_paid); }
      const thieu = Math.max(0, phai - so(d.total_amount_card) - tong);
      if (daThuNguon > phai) baoH.khach_dong_du.push([shId, daThuNguon - phai]);
      if (tong !== so(d.amount_paid)) { const bu = Math.min(so(d.amount_paid) - tong, thieu); if (bu > 0) ttC.push({ don_sh: shId, pt: ptDich(d.payment_type), vi: viDich(ptDich(d.payment_type), d.wallet_type), nh: nh(ptDich(d.payment_type), bu), so_tien: bu, ngay, ghi: "Chênh lệch lịch sử thanh toán SalonHero (bù để khớp số đã thu)" }); }
      if (so(d.total_amount_card) > 0) ttC.push({ don_sh: shId, pt: "the_tien", so_tien: so(d.total_amount_card), ngay, ghi: "Trừ thẻ (lịch sử SalonHero, không ghi sổ thẻ)" });
    }
    const dau = {
      sh_id: shId, ma, chi_nhanh: cnTheoLoc(d.location_id), khach_id: khId, trang_thai: huy ? "huy" : "hoan_thanh", ngay, giam_gia_don: so(d.discount), vat_pct: Number(d.tax_percent) || 0,
      phu_phi: phuPhi, tip: so(d.total_tip), tong_hang: tongHang, vat_tien: so(d.tax_amount), tong_phai_thu: huy ? 0 : phai, da_thu: daThuNguon, con_no: huy ? 0 : so(d.debt),
      sh_ma: sach(d.order_id), sh_trang_thai: d.status, tien_tru_the: so(d.total_amount_card), giam_voucher: so(d.total_voucher), giam_diem: so(d.point2money),
      thu_ngan_sh_id: d.completed_by ?? d.created_by ?? null, thu_ngan_ten: sach(d.completed_by_name ?? d.created_by_name) || null,
      ghi_chu: [sach(d.note), d.created_by_name ? `Người lập (SalonHero): ${sach(d.created_by_name)}` : "", d.customer_id && !khId ? `Khách gốc không còn trong AMIA: ${sach(d.customer_fullname)} ${sach(d.customer_phone)}` : ""].filter(Boolean).join(" · ") || null,
      ly_do_huy: huy ? sach(d.reason_to_void) || "Huỷ ở SalonHero" : null, tao_luc: l.created_at ?? d.createdAt, chot_luc: d.completed_at ?? null, huy_luc: d.void_at ?? null, dot: c && !c.la_so_du_dau ? c.nhap_dot ?? dot : dot,
      khach_moi: d.is_new_customer == null || d.is_new_customer === "" ? null : Number(d.is_new_customer) === 1, // cờ gốc SalonHero (0212), chỉ ghi khi chèn đơn mới
    };
    const tienTt = ttC.reduce((s, x) => s + x.so_tien, 0), thanhTien = dongC.reduce((s, x) => s + x.so_luong * x.don_gia - x.giam_gia, 0);
    if (c?.la_lich_su) { // đã có: so sánh để biết có đổi không
      const giong = c.trang_thai === dau.trang_thai && Number(c.tong_phai_thu) === dau.tong_phai_thu && Number(c.da_thu) === tienTt && Number(c.con_no) === dau.tong_phai_thu - tienTt && Number(c.tien_tru_the) === dau.tien_tru_the
        && Number(c.tong_hang) === dau.tong_hang && Number(c.giam_gia_don) === dau.giam_gia_don && c.ngay_hd === dau.ngay && c.n_dong === dongC.length && Number(c.thanh_tien) === thanhTien && (!khId || c.khach_id === khId);
      if (giong) { baoH.khong_doi++; continue; }
      if (c.tt_app > 0 || c.dong_app > 0 || c.the_tu_dong > 0) { xungDot.hoa_don.push({ sh_id: shId, ma: dau.ma, ghi: "hoá đơn có thanh toán/dòng/thẻ tạo trong app" }); continue; }
      dau.doi = true; baoH.doi++; if (dau.trang_thai === "huy" && c.trang_thai !== "huy") baoH.huy_moi++;
    } else if (c?.la_so_du_dau) baoH.nang_cap_no_dau++; else {
      baoH.moi++;
      if (dau.khach_id && hdApp.has(`${dau.khach_id}|${dau.ngay}|${dau.tong_phai_thu}`)) xungDot.hoa_don_trung_app.push({ sh_id: shId, ma: dau.ma, ghi: "cùng khách/ngày/số tiền với hoá đơn tạo trong app (nghi nhập đúp)" });
    }
    hd.push(dau); dong.push(...dongC); nvDong.push(...nvC); hhGoc.push(...hhC); tt.push(...ttC);
  }
  const doi = hd.filter((h) => h.doi), nangCap = hd.filter((h) => hdCo.get(h.sh_id)?.la_so_du_dau), moi = hd.filter((h) => !hdCo.get(h.sh_id));
  // 1) xoá con của hoá đơn đổi (chỉ dòng/thanh toán lịch sử; đã kiểm không có dòng app)
  if (doi.length) {
    const ids = doi.map((h) => hdCo.get(h.sh_id).id);
    await db.query("select set_config('amia.go_dot','on',true)");
    await q(`delete from public.thanh_toan where hoa_don_id = any($1::uuid[]) and nhap_dot like 'SH-%'`, [ids]);
    await q(`delete from public.hoa_don_dong where hoa_don_id = any($1::uuid[]) and nhap_dot like 'SH-%'`, [ids]);
    await db.query("select set_config('amia.go_dot','off',true)");
  }
  const SQL_CAP_NHAT = `update public.hoa_don h set la_so_du_dau = false, la_lich_su = true, trang_thai = x.trang_thai, ngay_hd = x.ngay, khach_id = coalesce(x.khach_id, h.khach_id), giam_gia_don = x.giam_gia_don,
      vat_pct = x.vat_pct, phu_phi = x.phu_phi, tip = x.tip, tong_hang = x.tong_hang, vat_tien = x.vat_tien, tong_phai_thu = x.tong_phai_thu, sh_ma = x.sh_ma, sh_trang_thai = x.sh_trang_thai, tien_tru_the = x.tien_tru_the,
      giam_voucher = x.giam_voucher, giam_diem = x.giam_diem, thu_ngan_sh_id = x.thu_ngan_sh_id, thu_ngan_ten = x.thu_ngan_ten, ghi_chu = coalesce(x.ghi_chu, h.ghi_chu), ly_do_huy = x.ly_do_huy, huy_luc = x.huy_luc, chot_luc = coalesce(x.chot_luc, h.chot_luc), nhap_dot = case when h.la_so_du_dau then x.dot else h.nhap_dot end
     from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, trang_thai text, ngay date, khach_id uuid, giam_gia_don bigint, vat_pct numeric, phu_phi bigint, tip bigint, tong_hang bigint, vat_tien bigint, tong_phai_thu bigint, sh_ma text, sh_trang_thai text,
       tien_tru_the bigint, giam_voucher bigint, giam_diem bigint, thu_ngan_sh_id bigint, thu_ngan_ten text, ghi_chu text, ly_do_huy text, huy_luc timestamptz, chot_luc timestamptz, dot text) where h.sh_id = x.sh_id`;
  await theoLo(nangCap, 500, (l) => q(SQL_CAP_NHAT, [JSON.stringify(l)]));
  const sangHuy = doi.filter((h) => h.trang_thai === "huy" && hdCo.get(h.sh_id).trang_thai !== "huy"), doiKhac = doi.filter((h) => !sangHuy.includes(h));
  await theoLo(doiKhac, 500, (l) => q(SQL_CAP_NHAT, [JSON.stringify(l)]));
  if (sangHuy.length) { // SalonHero đã huỷ đơn từng chuyển sang: trigger chặn huỷ đơn lịch sử → bỏ qua trigger trong đúng câu lệnh này (không hoàn điểm/voucher/thông báo vì là dữ liệu lịch sử)
    await db.query("set local session_replication_role = replica");
    await theoLo(sangHuy, 500, (l) => q(SQL_CAP_NHAT, [JSON.stringify(l)]));
    await db.query("set local session_replication_role = origin");
  }
  let nHd = 0;
  await theoLo(moi, 500, async (l) => {
    nHd += (await q(`insert into public.hoa_don (sh_id, ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, giam_gia_don, vat_pct, phu_phi, tip, tong_hang, vat_tien, tong_phai_thu, da_thu, con_no, nguoi_lap_id, ghi_chu, ly_do_huy,
          tao_luc, chot_luc, huy_luc, la_lich_su, sh_ma, sh_trang_thai, tien_tru_the, giam_voucher, giam_diem, thu_ngan_sh_id, thu_ngan_ten, nhap_dot, khach_moi)
       select x.sh_id, x.ma, (select id from public.chi_nhanh where ma = x.chi_nhanh), x.khach_id, x.trang_thai, x.ngay, x.giam_gia_don, x.vat_pct, x.phu_phi, x.tip, x.tong_hang, x.vat_tien, x.tong_phai_thu, x.da_thu, x.con_no, $2::uuid, x.ghi_chu, x.ly_do_huy,
          coalesce(x.tao_luc, now()), x.chot_luc, x.huy_luc, true, x.sh_ma, x.sh_trang_thai, x.tien_tru_the, x.giam_voucher, x.giam_diem, x.thu_ngan_sh_id, x.thu_ngan_ten, $3, x.khach_moi
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, chi_nhanh text, khach_id uuid, trang_thai text, ngay date, giam_gia_don bigint, vat_pct numeric, phu_phi bigint, tip bigint, tong_hang bigint, vat_tien bigint, tong_phai_thu bigint, da_thu bigint,
          con_no bigint, ghi_chu text, ly_do_huy text, tao_luc timestamptz, chot_luc timestamptz, huy_luc timestamptz, sh_ma text, sh_trang_thai text, tien_tru_the bigint, giam_voucher bigint, giam_diem bigint, thu_ngan_sh_id bigint, thu_ngan_ten text, khach_moi boolean)
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(l), he, dot])).length;
  });
  const dsHd = new Set(hd.map((h) => h.sh_id));
  const dotHd = new Map(hd.map((h) => [h.sh_id, h.dot]));
  const dongCan = dong.filter((x) => dsHd.has(x.don_sh)).map((x) => ({ ...x, dot: dotHd.get(x.don_sh) }));
  let nDong = 0; const dongMoiSh = new Set();
  await theoLo(dongCan, 1000, async (l) => {
    const ra = (await q(`insert into public.hoa_don_dong (sh_id, hoa_don_id, loai, dich_vu_id, san_pham_id, goi_id, ten, so_luong, don_gia, giam_gia, la_lich_su, loai_goc, the_khach_sh_id, nhap_dot)
       select x.sh_id, h.id, x.loai, case when x.loai = 'dich_vu' then x.ref end, case when x.loai = 'san_pham' then x.ref end, case when x.loai = 'goi_the' then x.ref end, x.ten, x.so_luong, x.don_gia, x.giam_gia, true, x.loai_goc, x.the_khach_sh_id, x.dot
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, don_sh bigint, loai text, ref uuid, ten text, so_luong int, don_gia bigint, giam_gia bigint, loai_goc text, the_khach_sh_id bigint, dot text) join public.hoa_don h on h.sh_id = x.don_sh
       on conflict (sh_id) do nothing returning sh_id`, [JSON.stringify(l)]));
    nDong += ra.length; for (const r of ra) dongMoiSh.add(Number(r.sh_id));
  });
  const nvC = nvDong.filter((x) => dongMoiSh.has(x.dong_sh));
  await theoLo(nvC, 2000, (l) => q(`insert into public.dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le, nhap_dot)
     select d.id, x.nv, x.vai, x.ti_le, d.nhap_dot from jsonb_to_recordset($1::jsonb) as x(dong_sh bigint, nv uuid, vai text, ti_le numeric) join public.hoa_don_dong d on d.sh_id = x.dong_sh on conflict do nothing`, [JSON.stringify(l)]));
  const hhC = hhGoc.filter((x) => dongMoiSh.has(x.dong_sh));
  if (hhC.length) await theoLo(hhC, 2000, (l) => q(`insert into public.dong_hoa_hong_goc (dong_id, vai, nhan_vien_id, sh_nhan_vien_id, gia_tri, kieu, nhap_dot)
     select d.id, x.vai, x.nv, x.sh_nv, x.gia_tri, x.kieu, d.nhap_dot from jsonb_to_recordset($1::jsonb) as x(dong_sh bigint, vai text, sh_nv bigint, nv uuid, gia_tri numeric, kieu text) join public.hoa_don_dong d on d.sh_id = x.dong_sh`, [JSON.stringify(l)]));
  const ttCan = tt.filter((x) => dsHd.has(x.don_sh)).map((x) => ({ ...x, dot: dotHd.get(x.don_sh) }));
  let nTt = 0;
  await theoLo(ttCan, 2000, async (l) => {
    nTt += (await q(`insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, ghi_chu, la_lich_su, nhap_dot, ngan_hang, loai_vi)
       select h.id, 'thu', x.pt, x.so_tien, x.ngay, $2::uuid, x.ghi, true, x.dot, x.nh, x.vi from jsonb_to_recordset($1::jsonb) as x(don_sh bigint, pt text, nh text, vi text, so_tien bigint, ngay date, ghi text, dot text) join public.hoa_don h on h.sh_id = x.don_sh returning 1`, [JSON.stringify(l), he])).length;
  });
  await q(`select public.tinh_lai_hoa_don(h.id) from public.hoa_don h where h.sh_id = any($1::bigint[])`, [[...dsHd]]);
  tom.hoa_don = { moi: nHd, doi: doi.length, huy_moi_trong_doi: baoH.huy_moi, nang_cap_no_dau: baoH.nang_cap_no_dau, khong_doi: baoH.khong_doi, dong: nDong, thanh_toan: nTt, nhap_bo_qua: baoH.nhap_bo_qua, khong_co_khach_o_amia: baoH.khong_co_khach_o_amia,
    dong_khong_co_danh_muc: baoH.dong_khong_co_danh_muc, tong_hang_lech: baoH.tong_hang_lech.length, khach_dong_du: baoH.khach_dong_du.length, ma_trung_them_duoi: baoH.ma_trung_them_duoi, khac_bo_qua: baoH.khac_bo_qua, no_dau_co_thanh_toan_bo_qua: baoH.no_dau_bo_qua_vi_co_thanh_toan.length };

  tik('hoá đơn xong');
  // ════ D. LỊCH HẸN ════
  const dvLich = await mapMa(db, "dich_vu");
  const lichCoRows = await q(`select sh_id, id, trang_thai, bat_dau, ket_thuc, nhan_vien_id, ghi_chu, so_khach, hoa_don_sh_id, cap_nhat_luc, nhap_dot from public.lich_hen where sh_id = any($1::bigint[])`, [lichSh.map((r) => Number(r.id))]);
  const dvAgg = new Map((await q(`select lich_id, string_agg(dich_vu_id::text || ':' || so_luong, ',' order by dich_vu_id) s from public.lich_hen_dich_vu where lich_id = any($1::uuid[]) group by 1`, [lichCoRows.map((r) => r.id)])).map((r) => [r.lich_id, r.s]));
  for (const r of lichCoRows) r.dv = dvAgg.get(r.id) ?? "";
  const lichCo = new Map(lichCoRows.map((r) => [Number(r.sh_id), r]));
  const baoL = { moi: 0, doi: 0, khong_doi: 0, khong_co_khach: 0, dv_khong_khop: 0, nv_khong_khop: 0, khac_bo_qua: 0 };
  const boQuaLich = new Map(); // tháng|trạng thái → số lịch của khách không còn ở AMIA (trừ khỏi đối chiếu)
  const lichMoi = [], lichDoi = [], dvRows = [];
  for (const r of lichSh) {
    const shId = Number(r.id); const kh = khach.get(Number(r.customer_id));
    const bd = new Date(r.booked_at), phut = Number(r.estimated_duration) > 0 ? Number(r.estimated_duration) : 30;
    const ops = mang(r.operator_id), nvId = ops.length ? nv.get(ops[0]) ?? null : null;
    if (ops.length && !nvId) baoL.nv_khong_khop++;
    const trangThai = TT[r.status] ?? "chua_xac_nhan";
    const cu = lichCo.get(shId);
    if (!kh) { if (!cu) { baoL.khong_co_khach++; const k = vnNgay(r.booked_at).slice(0, 7) + "|" + trangThai; boQuaLich.set(k, (boQuaLich.get(k) ?? 0) + 1); } continue; }
    const dem = new Map();
    for (const p of mang(r.product_id)) { const d = dvLich.get(p); if (d) dem.set(d, (dem.get(d) ?? 0) + 1); else baoL.dv_khong_khop++; }
    const dvKey = [...dem.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([d, n]) => `${d}:${n}`).join(",");
    const dong = {
      sh_id: shId, khach_id: kh, chi_nhanh: cnTheoLoc(r.location_id), bat_dau: bd.toISOString(), ket_thuc: new Date(bd.getTime() + phut * 60000).toISOString(), trang_thai: trangThai,
      nhan_vien_id: nvId, nguon: sach(r.booking_source) || null, ghi_chu: sach(r.note) || null, ly_do_huy: trangThai === "huy" ? `Huỷ bởi ${r.canceled_by ?? "không rõ"} (SalonHero)` : null,
      tao_luc: iso(r.createdAt) ?? bd.toISOString(), ma_dat_lich: iso(r.booking_code), nguon_dat: sach(r.booking_source) || null,
      xac_nhan_luc: iso(r.confirmed_at), checkin_luc: iso(r.checkin_at), bat_dau_lam_luc: iso(r.process_at), hoan_thanh_luc: iso(r.finished_at), huy_luc: iso(r.canceled_at),
      nhan_vien_ten: sach(r.operator_names) || null, dich_vu_ten: sach(r.product_names) || null, so_khach: Number(r.number_of_guests) || 1,
      kieu_lap: iso(r.repeat_type), nguoi_tao_ten: sach(r.created_by_user_fullname) || null, hoa_don_sh_id: iso(r.order_id) ? Number(r.order_id) : null,
      khach_moi: r.is_new_customer == null || r.is_new_customer === "" ? null : Number(r.is_new_customer) === 1, // cờ gốc SalonHero (0202); trống thì trigger tự tính
    };
    if (!cu) { lichMoi.push(dong); baoL.moi++; for (const [d, n] of dem) dvRows.push({ sh: shId, dv: d, n, dot }); continue; }
    const giong = cu.trang_thai === dong.trang_thai && new Date(cu.bat_dau).getTime() === bd.getTime() && new Date(cu.ket_thuc).getTime() === new Date(dong.ket_thuc).getTime() && (cu.nhan_vien_id ?? null) === (dong.nhan_vien_id ?? null)
      && (cu.ghi_chu ?? null) === (dong.ghi_chu ?? null) && Number(cu.so_khach) === dong.so_khach && (cu.hoa_don_sh_id == null ? null : Number(cu.hoa_don_sh_id)) === dong.hoa_don_sh_id && cu.dv === dvKey;
    if (giong) { baoL.khong_doi++; continue; }
    if (cu.cap_nhat_luc && new Date(cu.cap_nhat_luc) > new Date(cdMoc) && GHI_DE) daGhiDe.lich++;
    else if (cu.cap_nhat_luc && new Date(cu.cap_nhat_luc) > new Date(cdMoc)) { xungDot.lich.push({ sh_id: shId, ghi: "lịch bị sửa trong app sau lần đồng bộ trước", amia: cu.trang_thai, salonhero: dong.trang_thai }); continue; }
    baoL.doi++; lichDoi.push({ ...dong, dv: dem });
  }
  let nLichMoi = 0;
  await theoLo(lichMoi, 2000, async (l) => {
    nLichMoi += (await q(`insert into public.lich_hen (sh_id, khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nhan_vien_id, nguon, ghi_chu, ly_do_huy, tao_boi, tao_luc, cap_nhat_luc, ma_dat_lich, nguon_dat,
         xac_nhan_luc, checkin_luc, bat_dau_lam_luc, hoan_thanh_luc, huy_luc, nhan_vien_ten, dich_vu_ten, so_khach, kieu_lap, nguoi_tao_ten, hoa_don_sh_id, la_lich_su, nhap_dot, khach_moi)
       select x.sh_id, x.khach_id, (select id from public.chi_nhanh where ma = x.chi_nhanh), x.bat_dau, x.ket_thuc, x.trang_thai, x.nhan_vien_id, x.nguon, x.ghi_chu, x.ly_do_huy, $2::uuid, x.tao_luc, x.tao_luc, x.ma_dat_lich, x.nguon_dat,
         x.xac_nhan_luc, x.checkin_luc, x.bat_dau_lam_luc, x.hoan_thanh_luc, x.huy_luc, x.nhan_vien_ten, x.dich_vu_ten, x.so_khach, x.kieu_lap, x.nguoi_tao_ten, x.hoa_don_sh_id, true, $3, x.khach_moi
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, chi_nhanh text, bat_dau timestamptz, ket_thuc timestamptz, trang_thai text, nhan_vien_id uuid, nguon text, ghi_chu text, ly_do_huy text, tao_luc timestamptz,
         ma_dat_lich text, nguon_dat text, xac_nhan_luc timestamptz, checkin_luc timestamptz, bat_dau_lam_luc timestamptz, hoan_thanh_luc timestamptz, huy_luc timestamptz, nhan_vien_ten text, dich_vu_ten text, so_khach int,
         kieu_lap text, nguoi_tao_ten text, hoa_don_sh_id bigint, khach_moi boolean)
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(l), he, dot])).length;
  });
  let nLichDoi = 0;
  if (lichDoi.length) { // lịch lịch sử đổi theo SalonHero: bỏ trigger (khoá ca/thông báo) trong đúng câu lệnh, tự đặt cap_nhat_luc
    await db.query("set local session_replication_role = replica");
    await theoLo(lichDoi, 1000, async (l) => {
      nLichDoi += (await q(`update public.lich_hen h set bat_dau = x.bat_dau, ket_thuc = x.ket_thuc, trang_thai = x.trang_thai, nhan_vien_id = x.nhan_vien_id, ghi_chu = x.ghi_chu, ly_do_huy = x.ly_do_huy, xac_nhan_luc = x.xac_nhan_luc, checkin_luc = x.checkin_luc,
          bat_dau_lam_luc = x.bat_dau_lam_luc, hoan_thanh_luc = x.hoan_thanh_luc, huy_luc = x.huy_luc, nhan_vien_ten = x.nhan_vien_ten, dich_vu_ten = x.dich_vu_ten, so_khach = x.so_khach, hoa_don_sh_id = x.hoa_don_sh_id, cap_nhat_luc = now()
        from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, bat_dau timestamptz, ket_thuc timestamptz, trang_thai text, nhan_vien_id uuid, ghi_chu text, ly_do_huy text, xac_nhan_luc timestamptz, checkin_luc timestamptz, bat_dau_lam_luc timestamptz,
          hoan_thanh_luc timestamptz, huy_luc timestamptz, nhan_vien_ten text, dich_vu_ten text, so_khach int, hoa_don_sh_id bigint) where h.sh_id = x.sh_id and h.la_lich_su returning 1`, [JSON.stringify(l, (k, v) => (k === "dv" ? undefined : v))])).length;
      for (const r of l) { const id = lichCo.get(r.sh_id).id; await q(`delete from public.lich_hen_dich_vu where lich_id = $1`, [id]); for (const [d, n] of r.dv) dvRows.push({ sh: r.sh_id, dv: d, n, dot }); }
    });
    await db.query("set local session_replication_role = origin");
  }
  let nDv = 0;
  await theoLo(dvRows, 4000, async (l) => {
    nDv += (await q(`insert into public.lich_hen_dich_vu (lich_id, dich_vu_id, so_luong, nhap_dot) select l.id, x.dv, x.n, x.dot from jsonb_to_recordset($1::jsonb) as x(sh bigint, dv uuid, n int, dot text) join public.lich_hen l on l.sh_id = x.sh on conflict do nothing returning 1`, [JSON.stringify(l)])).length;
  });
  tom.lich = { moi: nLichMoi, doi: nLichDoi, dich_vu_ghi: nDv, ...baoL };

  tik('lịch xong');
  // ════ E. NHẮC CHĂM SÓC ════
  const nhacCo = new Map((await q(`select sh_id, id, sh_trang_thai, trang_thai from public.khach_nhac where sh_id = any($1::bigint[])`, [nhacSh.map((r) => Number(r.id))])).map((r) => [Number(r.sh_id), r]));
  const nhacMoi = [], nhacDoi = []; let nhacKhongKhach = 0;
  for (const r of nhacSh) {
    const kh = khach.get(Number(r.customer_id)); const cu = nhacCo.get(Number(r.id));
    if (cu) {
      if (cu.sh_trang_thai !== r.status) { if (cu.trang_thai !== (TTN[cu.sh_trang_thai] ?? "dang_nhac") && GHI_DE) daGhiDe.nhac++; else if (cu.trang_thai !== (TTN[cu.sh_trang_thai] ?? "dang_nhac")) { xungDot.nhac.push({ sh_id: Number(r.id), ghi: "nhắc đã đổi trạng thái trong app" }); continue; } nhacDoi.push({ sh_id: Number(r.id), trang_thai: TTN[r.status] ?? "dang_nhac", sh_trang_thai: r.status, hoan_thanh_luc: iso(r.finish_at), ngay_nhac: iso(r.reminded_date) }); }
      continue;
    }
    if (!kh) { nhacKhongKhach++; continue; }
    let cac = null; try { cac = r.all_reminded_dates ? JSON.parse(r.all_reminded_dates) : null; } catch { /* giữ null */ }
    nhacMoi.push({ sh_id: Number(r.id), khach_id: kh, noi_dung: sach(r.content) || null, ghi_chu: sach(r.note) || null, trang_thai: TTN[r.status] ?? "dang_nhac", sh_trang_thai: r.status, ngay_nhac: iso(r.reminded_date), hoan_thanh_luc: iso(r.finish_at),
      kieu_lap: iso(r.repeat_type), so_lan_lap: r.total_repeat == null ? null : Number(r.total_repeat), cac, so_cuoc_goi: Number(r.call_quantity) || 0, dich_vu_ten: sach(r.service_name) || null, nguoi_tao_ten: sach(r.creator_name) || null,
      nguoi_pt_ten: sach(r.user_name) || null, cn: cnTheoLoc(r.location_id), tao_luc: iso(r.createdAt) ?? new Date().toISOString() });
  }
  let nNhacMoi = 0, nNhacDoi = 0;
  await theoLo(nhacMoi, 1000, async (l) => {
    nNhacMoi += (await q(`insert into public.khach_nhac (sh_id, khach_id, noi_dung, ghi_chu, trang_thai, sh_trang_thai, ngay_nhac, hoan_thanh_luc, kieu_lap, so_lan_lap, cac_ngay_nhac, so_cuoc_goi, dich_vu_ten, nguoi_tao_ten, nguoi_phu_trach_ten, chi_nhanh_id, tao_luc, la_lich_su, nhap_dot)
      select x.sh_id, x.khach_id, x.noi_dung, x.ghi_chu, x.trang_thai, x.sh_trang_thai, x.ngay_nhac, x.hoan_thanh_luc, x.kieu_lap, x.so_lan_lap, x.cac, x.so_cuoc_goi, x.dich_vu_ten, x.nguoi_tao_ten, x.nguoi_pt_ten, (select id from public.chi_nhanh where ma = x.cn), x.tao_luc, true, $2
      from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, noi_dung text, ghi_chu text, trang_thai text, sh_trang_thai text, ngay_nhac timestamptz, hoan_thanh_luc timestamptz, kieu_lap text, so_lan_lap int, cac jsonb, so_cuoc_goi int, dich_vu_ten text, nguoi_tao_ten text, nguoi_pt_ten text, cn text, tao_luc timestamptz)
      on conflict (sh_id) do nothing returning 1`, [JSON.stringify(l), dot])).length;
  });
  await theoLo(nhacDoi, 1000, async (l) => { nNhacDoi += (await q(`update public.khach_nhac n set trang_thai = x.trang_thai, sh_trang_thai = x.sh_trang_thai, hoan_thanh_luc = x.hoan_thanh_luc, ngay_nhac = coalesce(x.ngay_nhac, n.ngay_nhac) from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, trang_thai text, sh_trang_thai text, hoan_thanh_luc timestamptz, ngay_nhac timestamptz) where n.sh_id = x.sh_id returning 1`, [JSON.stringify(l)])).length; });
  tom.nhac = { moi: nNhacMoi, doi: nNhacDoi, khong_co_khach: nhacKhongKhach };

  tik('nhắc xong');
  // ── SỔ QUỸ (câu 16): phiếu tay SalonHero mới/sửa/xoá trong cửa sổ [tuDon, denNgay] → so_quy (hàm so_quy_nhap_sh / so_quy_dao_sh, không sửa sổ cái) ──
  let bangQuy = [];
  if (existsSync(`${D}/so_quy.ndjson`)) {
    const loiSq = loiXuat.filter((x) => x[0] === "so_quy").length;
    tom.so_quy = await napSoQuySh(db, chuanHoaSoQuySh(await docMang(`${D}/so_quy.ndjson`)), { nguoiId: he, cuaSo: loiSq ? null : { tu: tuDon, den: denNgay } });
    if (loiSq) tom.so_quy.ghi = "xuất sổ quỹ có lỗi → không dò phiếu bị xoá lần này";
    // Đối chiếu tồn quỹ hiện tại 4 quỹ (CHỈ ĐỂ XEM, không chặn ghi: dòng tạo trong app và tiền khách trả sau lúc xuất làm lệch hợp lệ)
    const shTon = new Map((await docMang(`${D}/ton_quy.ndjson`)).map((r) => [cnTheoLoc(r.loc), r]));
    const am = await tonQuyAmia(db);
    for (const cn of ["VINH", "DALAT"]) for (const [l, k] of [["tien_mat", "cash"], ["ngan_hang", "bank"]]) {
      const sh = shTon.get(cn)?.[k]; const a = am[cn]?.[l] ?? { ton: 0, tu_app: 0 };
      bangQuy.push({ quy: `${cn} ${l}`, SalonHero: sh ?? "?", AMIA: a.ton, tu_app: a.tu_app, lech_tru_app: sh == null ? "?" : a.ton - a.tu_app - Number(sh) });
    }
    tom.ton_quy = bangQuy;
    tik('sổ quỹ xong');
  } else console.log("  (bản xuất không có so_quy.ndjson → bỏ qua sổ quỹ)");
  // ════ ĐỐI CHIẾU VỚI SALONHERO (cùng giao dịch) ════
  const kq = []; const them = (muc, sh, am, ghi = "") => kq.push({ muc, salonhero: Number(sh), amia: Number(am), lech: Number(am) - Number(sh), khop: Number(sh) === Number(am) ? "KHỚP" : "LỆCH", ghi });
  const bo = new Set(xungDot.hoa_don.map((x) => x.sh_id));
  // 1) khách
  const khSh = new Set(dsKhach.map((c) => Number(c.id)));
  const khAmNow = new Set((await q(`select sh_id from public.khach_hang where sh_id is not null`)).map((r) => Number(r.sh_id)));
  them("Khách có ở SalonHero mà thiếu ở AMIA", 0, [...khSh].filter((id) => !khAmNow.has(id)).length);
  // 2) hoá đơn theo ngày (VN)
  const shNgay = new Map();
  for (const l of dsDon) { if (bo.has(Number(l.id))) continue; const ng = vnNgay(l.created_at); if (ng <= tuDon || ng > denNgay) continue; const o = shNgay.get(ng) ?? { ht: 0, huy: 0, tien: 0, no: 0 }; if (l.status === "COMPLETED") { o.ht++; o.tien += Number(l.total) || 0; o.no += Number(l.debt) || 0; } else if (l.status === "VOID") o.huy++; shNgay.set(ng, o); }
  const amNgay = new Map((await q(`select to_char(ngay_hd,'YYYY-MM-DD') ng, count(*) filter (where trang_thai='hoan_thanh')::int ht, count(*) filter (where trang_thai='huy')::int huy,
      coalesce(sum(tong_phai_thu - tien_tru_the) filter (where trang_thai='hoan_thanh'),0)::bigint tien, coalesce(sum(con_no) filter (where trang_thai='hoan_thanh'),0)::bigint "no"
      from public.hoa_don where sh_id is not null and la_lich_su and not la_so_du_dau and ngay_hd > $1::date and ngay_hd <= $2::date and not (sh_id = any($3::bigint[])) group by 1`, [tuDon, denNgay, [...bo]])).map((r) => [r.ng, r]));
  const appNgay = new Map((await q(`select to_char(ngay_hd,'YYYY-MM-DD') ng, count(*)::int n, coalesce(sum(tong_phai_thu - tien_tru_the),0)::bigint tien from public.hoa_don where sh_id is null and trang_thai = 'hoan_thanh' and ngay_hd > $1::date group by 1`, [tuDon])).map((r) => [r.ng, r]));
  let ngayLech = 0; const bangNgay = []; let tongShTien = 0, tongAmTien = 0, tongShHt = 0, tongAmHt = 0;
  for (const ng of [...new Set([...shNgay.keys(), ...amNgay.keys()])].sort()) {
    const s = shNgay.get(ng) ?? { ht: 0, huy: 0, tien: 0, no: 0 }, a = amNgay.get(ng) ?? { ht: 0, huy: 0, tien: 0, no: 0 };
    tongShTien += s.tien; tongAmTien += Number(a.tien); tongShHt += s.ht; tongAmHt += a.ht;
    const lech = s.ht !== a.ht || s.huy !== a.huy || s.tien !== Number(a.tien) || s.no !== Number(a.no); if (lech) ngayLech++;
    bangNgay.push({ ngay: ng, SH_hd: s.ht, AM_hd: a.ht, SH_huy: s.huy, AM_huy: a.huy, SH_doanh_thu: s.tien, AM_doanh_thu: Number(a.tien), SH_no: s.no, AM_no: Number(a.no), APP_hd: appNgay.get(ng)?.n ?? 0, APP_doanh_thu: Number(appNgay.get(ng)?.tien ?? 0), khop: lech ? "LỆCH" : "KHỚP" });
  }
  them(`Số hoá đơn hoàn thành ${tuDon} → ${denNgay}`, tongShHt, tongAmHt);
  them(`Tổng tiền hoá đơn hoàn thành (sau trừ thẻ) ${tuDon} → ${denNgay}`, tongShTien, tongAmTien);
  them("Số ngày lệch (HĐ/huỷ/tiền/nợ)", 0, ngayLech, "chi tiết từng ngày ở bảng doanh thu ngày");
  // 3) lịch theo tháng × trạng thái
  const boLich = new Set(xungDot.lich.map((x) => x.sh_id));
  const shLich = new Map(); const thangCan = new Set(thangLich.map(([s]) => s.slice(0, 7)));
  for (const r of lichSh) { if (boLich.has(Number(r.id))) continue; const m = vnNgay(r.booked_at).slice(0, 7); const k = m + "|" + (TT[r.status] ?? "chua_xac_nhan"); shLich.set(k, (shLich.get(k) ?? 0) + 1); }
  const amLich = new Map((await q(`select to_char(bat_dau at time zone 'Asia/Ho_Chi_Minh','YYYY-MM') m, trang_thai t, count(*)::int n from public.lich_hen where la_lich_su and sh_id is not null and bat_dau >= $1::timestamptz and not (sh_id = any($2::bigint[])) group by 1,2`, [`${thangLich[0][0]}T00:00:00+07:00`, [...boLich]])).map((r) => [r.m + "|" + r.t, r.n]));
  let lichLech = 0; const bangLich = [];
  for (const k of [...new Set([...shLich.keys(), ...amLich.keys()])].sort()) { const s = (shLich.get(k) ?? 0) - (boQuaLich.get(k) ?? 0) - 0, a = amLich.get(k) ?? 0; if (!thangCan.has(k.slice(0, 7))) continue; if (s !== a) { lichLech++; bangLich.push({ thang_trangthai: k, SH: s, AMIA: a }); } }
  them("Ô (tháng × trạng thái) lịch hẹn lệch", 0, lichLech, bangLich.slice(0, 6).map((x) => `${x.thang_trangthai} SH${x.SH}/AM${x.AMIA}`).join("; "));
  // 4) thẻ: mọi thẻ SalonHero vừa lấy so số dư với AMIA
  const biXung = new Set(xungDot.the.map((x) => x.sh_id));
  const sd = new Map((await q(`select t.sh_id, coalesce(sum(c.so_buoi),0)::int b, coalesce(sum(c.so_tien),0)::bigint tien from public.the_khach t left join public.the_so_cai c on c.the_id = t.id where t.sh_id = any($1::bigint[]) group by t.sh_id`, [theCan.map((c) => Number(c.id))])).map((r) => [Number(r.sh_id), r]));
  const theLech = [];
  for (const c of theCan) { if (c.is_deleted || biXung.has(Number(c.id))) continue; const a = sd.get(Number(c.id)); if (!a) continue; const t = tinhDich(c); const co2 = t.lan ? a.b : Number(a.tien); if ((t.lan ? t.buoi : t.tien) !== co2) theLech.push(Number(c.id)); }
  const THE_LECH_DA_BIET = new Set(); // 03/11 tối: 6 thẻ lệch từ 28/10 (1659933, 1657443, 2714250, 2713923, 2714416, 2714248) đã khớp SalonHero (cùng còn 0 buổi) → bỏ khỏi danh sách loại trừ
  const theLechMoi = theLech.filter((id) => !THE_LECH_DA_BIET.has(id));
  them("Thẻ lệch số dư (trừ 6 thẻ lệch đã biết 28/10)", 0, theLechMoi.length, JSON.stringify(theLechMoi.slice(0, 12)) + (theLech.length !== theLechMoi.length ? ` (+${theLech.length - theLechMoi.length} thẻ đã biết)` : ""));
  them("Thẻ MỚI (tạo sau mốc) thiếu gói/khách ở AMIA — cần bổ sung danh mục", 0, baoT.khong_nap_moi, JSON.stringify(baoT.mau_khong_nap_moi.slice(0, 5)));
  console.log(`  (thẻ cũ thiếu gói/khách = ngoại lệ đã biết, không chặn: ${baoT.khong_nap_cu})`);
  them("Khách còn thiếu chi tiết (khách mới)", 0, baoK.thieu_chi_tiet_moi);
  them("Mục xuất lỗi từ SalonHero", 0, loiChan.length);
  them("Thẻ AMIA không còn trên SalonHero (có thể đã xoá — xem tay, không chặn)", theDaXoaSh.length, theDaXoaSh.length, JSON.stringify(theDaXoaSh.slice(0, 8)));
  const soXungDot = Object.values(xungDot).reduce((s, a) => s + a.length, 0);
  // --bo-qua-xung-dot (chạy tự động hằng đêm): xung đột chỉ bị BỎ QUA + liệt kê trong báo cáo/nhật ký, không chặn --that; người xử lý đọc danh sách sáng hôm sau.
  them("Xung đột với dữ liệu tạo trong app (bỏ qua, không ghi đè)", co("--bo-qua-xung-dot") ? soXungDot : 0, soXungDot, Object.entries(xungDot).filter(([, a]) => a.length).map(([k, a]) => `${k}:${a.length}`).join(" "));
  console.log("\n── ĐỐI CHIẾU VỚI SALONHERO ──"); inBang(kq);
  console.log("── DOANH THU / HOÁ ĐƠN THEO NGÀY (SalonHero | AMIA) ──"); inBang(bangNgay.slice(-14));
  if (bangLich.length) { console.log("── LỊCH LỆCH ──"); inBang(bangLich.slice(0, 20)); }
  if (bangQuy.length) { console.log("── TỒN QUỸ HIỆN TẠI (để xem; lệch hợp lệ = tiền khách trả sau lúc xuất / dòng tạo trong app) ──"); inBang(bangQuy); }
  tom.ghi_de_theo_salonhero = GHI_DE ? daGhiDe : "tắt";
  console.log(`  Ghi đè theo SalonHero (--ghi-de): ${GHI_DE ? JSON.stringify(daGhiDe) : "tắt"}`);
  tom.xung_dot = Object.fromEntries(Object.entries(xungDot).map(([k, a]) => [k, a.length]));
  tom.doi_chieu_lech = kq.filter((x) => x.khop === "LỆCH").map((x) => x.muc);
  console.log(JSON.stringify(tom, null, 1));
  const baoCao = { tom, doi_chieu: kq, bang_ngay: bangNgay, bang_lich_lech: bangLich, xung_dot: xungDot, hoa_don_khach_dong_du: baoH.khach_dong_du.slice(0, 20) };
  writeFileSync(`${D}/_dong-bo-${that ? "that" : tuKiem ? "tu-kiem" : "thu"}.json`, JSON.stringify(baoCao, null, 1));

  // ── quyết định ──
  const lech = kq.filter((x) => x.khop === "LỆCH" && !(tuKiem && x.muc.startsWith("Khách còn thiếu chi tiết")));
  let sao = null;
  if (that) {
    sao = readdirSync(SAO_LUU).filter((n) => /truoc-dong-bo/.test(n) && Date.now() - statSync(`${SAO_LUU}/${n}`).mtimeMs < 3 * 3600e3).sort().pop() ?? null;
    if (!sao) { await db.query("rollback"); console.log("DỪNG: chưa có bản sao lưu 'truoc-dong-bo' trong 3 giờ qua (chạy sao-luu-db.mjs truoc-dong-bo-<ngày> trước). KHÔNG ghi."); process.exitCode = 3; }
    else if (lech.length) { await db.query("rollback"); console.log("ĐỐI CHIẾU LỆCH → HUỶ, KHÔNG GHI:", lech.map((x) => x.muc).join("; ")); process.exitCode = 2; }
    else { await db.query("commit"); console.log(`ĐÃ GHI THẬT (commit). Bản sao lưu trước đó: ${sao}`);
      const xong = (await dbCuoi()).xong;
      writeFileSync(TEP_MOC, JSON.stringify({ bat_dau_xuat: batDauXuat, den: denNgay, dot, thu_muc: D, sao_luu: sao, xong_luc: xong, tom }, null, 1));
      appendFileSync(`${SAO_LUU}/dong-bo-nhat-ky.ndjson`, JSON.stringify({ luc: xong, dot, tu: tuNgay, den: denNgay, sao_luu: sao, tom }) + "\n"); }
  } else { await db.query("rollback"); console.log(lech.length ? `CHẠY THỬ XONG (đã huỷ, chưa ghi) — CÓ LỆCH: ${lech.map((x) => x.muc).join("; ")}` : "CHẠY THỬ XONG (đã huỷ, chưa ghi) — đối chiếu SẠCH."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message, (e.stack ?? "").split("\n").filter((l) => l.includes("dong-bo-dem")).slice(0, 3).join(" | ")); process.exitCode = 1; }
await db.end();

async function dbCuoi() { const c = await ketNoi(); try { return { xong: (await c.query("select clock_timestamp() t")).rows[0].t.toISOString() }; } finally { await c.end(); } }
