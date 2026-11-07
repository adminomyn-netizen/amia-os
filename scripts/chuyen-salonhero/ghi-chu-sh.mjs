// LÀM MỚI TOÀN BỘ GHI CHÚ KHÁCH SalonHero → khach_ghi_chu (07/11/2026). Bù chỗ hở của dong-bo-dem.mjs: nó chỉ lấy ghi chú của khách có chi tiết đổi,
// nên ghi chú mới/sửa trên khách "không đổi" bị sót (07/11 đã sót 127 ghi chú). Chạy đêm trong dong-bo-hang-dem.sh (LUOT=dem) sau khi ghi thật thành công.
// AN TOÀN:
//   • SalonHero CHỈ ĐỌC: tab ABA MỚI, chỉ gọi CustomerService.getCustomerList / getNoteByCustomerId (3 yêu cầu cùng lúc), đóng tab khi xong.
//   • Chỉ thêm ghi chú thiếu + sửa nội dung dòng nhap_dot 'SH-%' khi khác. KHÔNG xoá gì; KHÔNG đụng dòng sửa trong app (APP-SUA) hay dòng không có sh_id.
//   • Mặc định CHẠY THỬ (chỉ in). --that mới ghi, 1 giao dịch, cần bản sao lưu có bảng khach_ghi_chu trong 3 giờ qua; tự DỪNG nếu số thay đổi > --toi-da
//     (mặc định 5% số ghi chú SalonHero) hoặc có khách lấy lỗi; kiểm lại trong giao dịch rồi mới commit.
//   • Dòng cuối luôn là 1 dòng tóm tắt (dong-bo-hang-dem.sh nối vào báo cáo).
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/ghi-chu-sh.mjs [--that] [--tep <ghi_chu.ndjson có sẵn>] [--tab <id>] [--toi-da N] [--dot SH-GC-yyyymmdd]
import { ketNoi, docNdjson, taoDot, theoLo, vnNgay, vanBanGhiChuSh } from "./lib.mjs";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, appendFileSync, writeFileSync } from "node:fs";
import { spawnSync, execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ABA = "/Applications/AGS.app/Contents/MacOS/ags";
const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const THAT = process.argv.includes("--that");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const goc = (() => { try { return dirname(execSync("git rev-parse --path-format=absolute --git-common-dir", { cwd: dirname(fileURLToPath(import.meta.url)), encoding: "utf8" }).trim()); } catch { return resolve(dirname(fileURLToPath(import.meta.url)), "../.."); } })();
const SAO_LUU = process.env.SAO_LUU || `${goc}/sao-luu`;
const DOT = arg("--dot", `SH-GC-${vnNgay(new Date().toISOString()).replace(/-/g, "")}`);
const tomTat = (s) => { console.log(`- ghi chú SH: ${s}`); };

// ══════════ 1. LẤY TỪ SALONHERO (chỉ đọc) — cùng mẫu dong-bo-dem.mjs ══════════
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
    try { if (js(id, "(()=>{try{const rs=angular.element(document.body).injector().get('$rootScope');return !!(rs.currentUser&&rs.currentUser.merchant_id)}catch(e){return false}})()") === true) return { tab: id, dongSau: true }; } catch { /* trang chưa sẵn sàng */ }
  }
  try { aba({ action: "tab_close", args: { tab_id: id } }); } catch { /* bỏ qua */ }
  throw new Error("Tab SalonHero chưa đăng nhập/sẵn sàng sau 2 phút");
}
async function keo(tab, thuMuc) {
  let ack = "false"; let sauCuoi = 0;
  for (;;) {
    const v = js(tab, `window.__E ? window.__E.take2(${ack}) : '__NOE__'`);
    if (v === "__NOE__") throw new Error("Trang mất biến __E (tải lại?)");
    if (!v) {
      ack = "false";
      const st = JSON.parse(js(tab, "JSON.stringify({p:__E.phase,e:__E.err.length,q:__E.q.length,run:__E.running,fatal:__E.fatal||null,s:__E.stat})"));
      if (Date.now() - sauCuoi > 60000) { console.log("  …lấy:", st.p, JSON.stringify(st.s), `(lỗi ${st.e})`); sauCuoi = Date.now(); }
      if (st.fatal) throw new Error("Lấy lỗi nặng: " + st.p);
      if (!st.run && st.q === 0) return;
      await sleep(1500); continue;
    }
    const i1 = v.indexOf("\n"), i2 = v.indexOf("\n", i1 + 1);
    appendFileSync(`${thuMuc}/${v.slice(0, i1)}.ndjson`, v.slice(i2 + 1), "utf8"); ack = "true";
  }
}
// chạy trong tab: danh sách khách SalonHero ∪ id khách AMIA → ghi chú từng khách (chỉ giữ trường cần, bỏ 'orders' nặng)
const TRANG = String.raw`((P) => {
  if (window.__E && window.__E.running) return 'dang chay';
  const inj = angular.element(document.body).injector(), rs = inj.get('$rootScope'); const g = (n) => inj.get(n); const MID = rs.currentUser.merchant_id;
  try { Object.defineProperty(window, 'localDbIsReady', { get: () => false, set: () => {}, configurable: true }); } catch { window.localDbIsReady = false; }
  const E = window.__E = { q: [], pos: 0, running: true, done: false, stat: {}, err: [], phase: 'khoi dong',
    take2(ack, step = 900000) { if (ack && E.q.length) { const h = E.q[0][1]; E.pos += step; if (E.pos >= h.length) { E.q.shift(); E.pos = 0; } } if (!E.q.length) return ''; const [name, text] = E.q[0]; const piece = text.slice(E.pos, E.pos + step); const last = E.pos + step >= text.length; return name + '\n' + (E.pos === 0 ? 'S' : 'C') + (last ? 'E' : '-') + '\n' + piece; } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const withTO = (p, ms = 90000) => Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), ms))]);
  const retry = async (f, n = 4) => { for (let i = 0; i < n; i++) { try { return await withTO(f()); } catch (e) { if (i === n - 1) throw e; await sleep(400 * (i + 1)); } } };
  const unwrap = (r) => (r && r.data !== undefined && r.status !== undefined) ? r.data : (r && r.data !== undefined && !Array.isArray(r) ? r.data : r);
  const asArr = (r) => { const d = unwrap(r); if (Array.isArray(d)) return d; if (d && Array.isArray(d.customers)) return d.customers; if (d && Array.isArray(d.data)) return d.data; return []; };
  const waitq = async () => { while (E.q.length > 120) await sleep(150); };
  const B = {};
  const put = (name, line) => { B[name] = (B[name] || '') + line + '\n'; E.stat[name] = (E.stat[name] || 0) + 1; if (B[name].length > 450000) { E.q.push([name, B[name]]); B[name] = ''; } };
  const flushAll = () => { for (const k of Object.keys(B)) if (B[k]) { E.q.push([k, B[k]]); B[k] = ''; } };
  const pool = async (name, items, conc, fn) => { let i = 0;
    await Promise.all(Array.from({ length: conc }, async () => { while (i < items.length) { if (E.q.length > 120) await waitq(); const k = i++; try { await fn(items[k], k); } catch (e) { const m = String((e && e.message) || JSON.stringify(e)).slice(0, 200); E.err.push([name, String(items[k]), m]); put('loi', JSON.stringify({ id: items[k], e: m })); } } }));
    flushAll(); };
  const F = ['id', 'customer_id', 'creator_name', 'content', 'content_1', 'content_2', 'content_3', 'content_4', 'content_5', 'content_6', 'is_deleted', 'order_code', 'createdAt', 'updatedAt'];
  (async () => {
    try {
      E.phase = 'khach_ds'; const ids = new Set(P.ids);
      for (let off = 0; ; off += 500) {
        const a = asArr(await retry(() => g('CustomerService').getCustomerList({ limit: 500, offset: off, search: '', merchant_id: MID })));
        if (!a.length) break; for (const c of a) ids.add(Number(c.id)); E.stat.khach_ds = ids.size; if (a.length < 500) break;
      }
      E.phase = 'ghi_chu';
      await pool('ghi_chu', [...ids], 3, async (id) => {
        const n = unwrap(await retry(() => g('CustomerService').getNoteByCustomerId({ customer_id: id })));
        const notes = (n && Array.isArray(n.notes) ? n.notes : []).map((x) => { const o = {}; for (const k of F) o[k] = x[k]; return o; });
        put('ghi_chu', JSON.stringify({ id, n: { notes } }));
      });
      flushAll(); E.phase = 'xong'; E.done = true;
    } catch (e) { E.phase = 'LOI ' + String((e && e.message) || JSON.stringify(e)).slice(0, 200); E.fatal = true; }
    E.running = false;
  })();
  return 'started';
})(__THAM_SO__)`;

const db = await ketNoi();
const q = async (s, p) => (await db.query(s, p)).rows;
try {
  const kh = new Map((await q(`select sh_id, id from public.khach_hang where sh_id is not null`)).map((r) => [Number(r.sh_id), r.id]));
  let D = arg("--tep", null) ? dirname(resolve(arg("--tep"))) : null;
  const tepGhiChu = arg("--tep", null) ? resolve(arg("--tep")) : null;
  if (!D) {
    const gio = new Date(Date.now() + 7 * 3600e3).toISOString();
    D = `${SAO_LUU}/ghi-chu-sh-${gio.slice(0, 10).replace(/-/g, "")}-${gio.slice(11, 16).replace(":", "")}`;
    if (existsSync(D)) { let i = 2; while (existsSync(`${D}-${i}`)) i++; D = `${D}-${i}`; }
    mkdirSync(D, { recursive: true });
    console.log(`LẤY ghi chú SalonHero (chỉ đọc) cho ${kh.size} khách AMIA + danh sách khách SH → ${D}`);
    const { tab, dongSau } = await moTab();
    try {
      const kq = js(tab, TRANG.replace("__THAM_SO__", () => JSON.stringify({ ids: [...kh.keys()] })));
      if (kq !== "started") throw new Error("Không khởi động được: " + kq);
      await keo(tab, D);
    } finally { if (dongSau) { try { aba({ action: "tab_close", args: { tab_id: tab } }); } catch { /* bỏ qua */ } } }
  }
  const TEP = tepGhiChu ?? `${D}/ghi_chu.ndjson`;

  // ══════════ 2. SO SÁNH ══════════
  const sh = new Map(); const khachDaLay = new Set(); let tongNote = 0;
  for await (const r of docNdjson(TEP)) {
    khachDaLay.add(Number(r.id));
    for (const n of r.n?.notes ?? []) { tongNote++; if (n.is_deleted) continue; const t = vanBanGhiChuSh(n); if (t) sh.set(Number(n.id), { cid: Number(r.id), t, tao_luc: n.createdAt ?? null }); }
  }
  const loiKhach = existsSync(`${D}/loi.ndjson`) && !tepGhiChu ? readFileSync(`${D}/loi.ndjson`, "utf8").split("\n").filter(Boolean).length : 0;
  const thieuKhach = [...kh.keys()].filter((x) => !khachDaLay.has(x)).length; // khách AMIA không lấy được ghi chú
  const soSanh = async () => {
    const am = new Map((await q(`select sh_id, khach_id, tinh_trang, nhap_dot from public.khach_ghi_chu where sh_id is not null`)).map((r) => [Number(r.sh_id), r]));
    const them = [], sua = [], k = { ngoai_amia: 0, app_sua: 0, sai_khach: 0, thua: 0 };
    for (const [id, v] of sh) {
      const kid = kh.get(v.cid); if (!kid) { k.ngoai_amia++; continue; }
      const r = am.get(id);
      if (!r) { them.push({ sh_id: id, khach_id: kid, noi_dung: v.t, tao_luc: v.tao_luc }); continue; }
      if (r.khach_id !== kid) k.sai_khach++;
      if (r.tinh_trang !== v.t) { if (String(r.nhap_dot ?? "").startsWith("SH-")) sua.push({ sh_id: id, noi_dung: v.t }); else k.app_sua++; }
    }
    for (const id of am.keys()) if (!sh.has(id)) k.thua++; // có ở AMIA, SalonHero không còn/đã xoá: KHÔNG xoá, chỉ đếm
    return { them, sua, k };
  };
  const s = await soSanh();
  const toiDa = Number(arg("--toi-da", Math.ceil(0.05 * sh.size)));
  const moTa = `SH ${khachDaLay.size} khách/${sh.size} ghi chú có chữ · thiếu ${s.them.length} · lệch ${s.sua.length} · thừa(không xoá) ${s.k.thua} · lệch dòng app ${s.k.app_sua} · khách ngoài AMIA ${s.k.ngoai_amia} · khách lấy lỗi ${loiKhach + thieuKhach}`;
  console.log("SO SÁNH:", moTa);
  if (!THAT) { tomTat(`CHẠY THỬ · ${moTa}`); }
  else if (loiKhach + thieuKhach > 0) { tomTat(`DỪNG (khách lấy lỗi ${loiKhach + thieuKhach}), không ghi · ${moTa}`); process.exitCode = 2; }
  else if (s.them.length + s.sua.length > toiDa) { tomTat(`DỪNG (${s.them.length + s.sua.length} thay đổi > ${toiDa}), không ghi · ${moTa}`); process.exitCode = 2; }
  else if (!s.them.length && !s.sua.length) { tomTat(`khớp, không cần ghi · ${moTa}`); }
  else {
    const sao = readdirSync(SAO_LUU).filter((n) => n.startsWith("db-") && Date.now() - statSync(`${SAO_LUU}/${n}`).mtimeMs < 3 * 3600e3)
      .filter((n) => { try { return !!JSON.parse(readFileSync(`${SAO_LUU}/${n}/_manifest.json`, "utf8")).bang?.khach_ghi_chu; } catch { return false; } }).sort().pop();
    if (!sao) { tomTat(`DỪNG: chưa có bản sao lưu có khach_ghi_chu trong 3 giờ qua, không ghi · ${moTa}`); process.exitCode = 3; }
    else {
      await db.query("begin");
      try {
        await taoDot(db, DOT, `Ghi chú khách SalonHero: làm mới toàn bộ (thêm thiếu + sửa lệch, giữ xuống dòng) ${DOT.slice(6)}`);
        let nThem = 0, nSua = 0;
        await theoLo(s.them, 1000, async (l) => { nThem += (await db.query(`insert into public.khach_ghi_chu (sh_id, khach_id, tinh_trang, tao_luc, loai, nhap_dot) select x.sh_id, x.khach_id, x.noi_dung, coalesce(x.tao_luc, now()), 'cskh', $2 from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, noi_dung text, tao_luc timestamptz) on conflict (sh_id) do nothing`, [JSON.stringify(l), DOT])).rowCount; });
        await theoLo(s.sua, 1000, async (l) => { nSua += (await db.query(`update public.khach_ghi_chu g set tinh_trang = x.noi_dung, nhap_dot = $2 from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, noi_dung text) where g.sh_id = x.sh_id and g.nhap_dot like 'SH-%' and g.tinh_trang is distinct from x.noi_dung`, [JSON.stringify(l), DOT])).rowCount; });
        if (nThem !== s.them.length || nSua !== s.sua.length) throw new Error(`số ghi lệch: thêm ${nThem}/${s.them.length}, sửa ${nSua}/${s.sua.length}`);
        const s2 = await soSanh();
        if (s2.them.length || s2.sua.length) throw new Error(`sau ghi vẫn lệch: thiếu ${s2.them.length}, lệch ${s2.sua.length}`);
        await db.query("commit");
        tomTat(`ĐÃ GHI thêm ${nThem}, sửa ${nSua} (đợt ${DOT}, sao lưu ${sao}) · ${moTa}`);
      } catch (e) { await db.query("rollback"); tomTat(`HUỶ (rollback): ${e.message} · ${moTa}`); process.exitCode = 1; }
    }
  }
  writeFileSync(`${D}/_ket_qua.json`, JSON.stringify({ luc: new Date().toISOString(), that: THAT, them: s.them.length, sua: s.sua.length, ...s.k, tong_note: tongNote }));
} catch (e) { tomTat(`LỖI: ${String(e.message).slice(0, 200)}`); process.exitCode = 1; }
finally { await db.end(); }
