// Pancake → Hộp thư AMIA OS (chị Lâm 18/11/2026: "kết nối tới facebook meta suite để lấy tin nhắn về đây cho dễ theo dõi").
// Kéo hội thoại Messenger của fanpage AMIA cập nhật trong N phút gần nhất (API công khai Pancake, page_access_token) và các tin của hội thoại đó
// vào hop_thu_hoi_thoai / hop_thu_tin (nguon 'pancake'). CHỈ ĐỌC Pancake: không nhắn khách, không gắn thẻ — trả lời vẫn làm trên Pancake.
// Chạy lại nhiều lần không trùng (mã tin ma_ngoai). Không tiền, không thẻ, không kho.
// Dùng: PW=… node scripts/pancake/dong-bo-hop-thu.mjs [phút=15] [--ghi] [--lap=<giây>]   (không có --ghi = chạy thử; --lap = chạy liền, cứ N giây kéo một lượt)
import { execFileSync } from "node:child_process";
import { ketNoi } from "../chuyen-salonhero/lib.mjs";

const PAGE = "125397971450402", API = `https://pages.fm/api/public_api/v1/pages/${PAGE}`;
const args = process.argv.slice(2);
const PHUT = Number(args.find((a) => !a.startsWith("--")) ?? 15);
const GHI = args.includes("--ghi");
const LAP = Number((args.find((a) => a.startsWith("--lap=")) ?? "").slice(6)) || 0;
const token = process.env.PANCAKE_PAGE_TOKEN || execFileSync("security", ["find-generic-password", "-s", "amia-pancake-page-token", "-w"], { encoding: "utf8" }).trim();

const chuanSdt = (s) => { let d = String(s ?? "").replace(/\D/g, ""); if (d.startsWith("84") && d.length >= 11) d = "0" + d.slice(2); return /^0[0-9]{9,10}$/.test(d) ? d : null; };
const lucUtc = (s) => (s ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + "Z") : null); // Pancake trả giờ UTC không kèm múi
const boThe = (s) => String(s ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
function noiDungTin(m) {
  const chu = boThe(m.original_message ?? m.message);
  if (chu) return chu.slice(0, 4000);
  const tep = m.attachments ?? [];
  if (!tep.length) return null; // tin rỗng (thả tim, đã xem…) thì bỏ
  const loai = tep.map((a) => (a.type === "photo" || a.type === "image" ? "Ảnh" : a.type === "video" ? "Video" : a.type === "sticker" ? "Nhãn dán" : a.type === "audio" ? "Ghi âm" : "Tệp đính kèm"));
  return `[${[...new Set(loai)].join(", ")}]`;
}

async function goi(duong) {
  const r = await fetch(`${API}${duong}${duong.includes("?") ? "&" : "?"}page_access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(30_000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error(`Pancake ${r.status}: ${String(j.message ?? "").slice(0, 120)}`);
  return j;
}

let db = null;
async function motLuot() {
const dem = { hoiThoai: 0, boQua: 0, moi: 0, tinMoi: 0, loi: 0 };
try {
  const until = Math.floor(Date.now() / 1000), since = until - PHUT * 60, hts = [], co = new Set();
  for (let trang = 1; trang <= 30; trang++) {
    const moi = ((await goi(`/conversations?since=${since}&until=${until}&page_number=${trang}`)).conversations ?? []).filter((c) => !co.has(c.id));
    if (!moi.length) break;
    for (const c of moi) { co.add(c.id); if (c.type === "INBOX") hts.push(c); }
  }
  const { rows: [cn] } = await db.query("select id from public.chi_nhanh where ma = 'VINH' and hoat_dong");
  for (const c of hts) {
    dem.hoiThoai++;
    const capNhat = lucUtc(c.updated_at);
    const { rows: [cu] } = await db.query("select id, tin_cuoi_luc, chua_doc from public.hop_thu_hoi_thoai where kenh = 'messenger' and ma_ngoai = $1", [c.id]);
    const kh0 = (c.customers ?? [])[0] ?? {};
    const ten = String(kh0.name ?? c.from?.name ?? "").trim().slice(0, 200) || null;
    const sdts = (c.recent_phone_numbers ?? []).map((p) => chuanSdt(p.phone_number ?? p.captured)).filter(Boolean);
    const sdt = sdts.length ? sdts[sdts.length - 1] : null;
    if (cu && cu.tin_cuoi_luc && capNhat && new Date(cu.tin_cuoi_luc) >= capNhat) { dem.boQua++; continue; }
    let ms;
    try { ms = ((await goi(`/conversations/${c.id}/messages?customer_id=${encodeURIComponent(kh0.id ?? "")}`)).messages ?? []); }
    catch (e) { dem.loi++; console.error(`  LỖI đọc tin ${c.id.slice(-6)}: ${e.message}`); continue; }
    const tin = ms.map((m) => ({ ma: String(m.id), di: m.from?.id === PAGE, nd: noiDungTin(m), luc: lucUtc(m.inserted_at) }))
      .filter((t) => t.nd && t.luc).sort((a, b) => a.luc - b.luc);
    if (!cu) dem.moi++;
    if (!GHI) { dem.tinMoi += tin.length; continue; }
    try {
      await db.query("begin");
      const { rows: [kh] } = sdt ? await db.query("select id from public.khach_hang where dien_thoai = $1 limit 1", [sdt]) : { rows: [] };
      const { rows: [ht] } = await db.query(`insert into public.hop_thu_hoi_thoai (kenh, ma_ngoai, nguon, ten_khach, chi_nhanh_id, sdt, khach_id)
          values ('messenger', $1, 'pancake', $2, $3, $4, $5)
          on conflict (kenh, ma_ngoai) do update set ten_khach = coalesce(excluded.ten_khach, hop_thu_hoi_thoai.ten_khach), nguon = 'pancake',
            sdt = coalesce(excluded.sdt, hop_thu_hoi_thoai.sdt), khach_id = coalesce(hop_thu_hoi_thoai.khach_id, excluded.khach_id)
          returning id`, [c.id, ten, cn?.id ?? null, sdt, kh?.id ?? null]);
      let den = 0, them = 0;
      for (const t of tin) {
        const r = await db.query(`insert into public.hop_thu_tin (hoi_thoai_id, huong, noi_dung, trang_thai, tao_luc, ma_ngoai) values ($1,$2,$3,$4,$5,$6)
            on conflict (hoi_thoai_id, ma_ngoai) where ma_ngoai is not null do nothing`, [ht.id, t.di ? "di" : "den", t.nd, t.di ? "da_gui" : "da_nhan", t.luc, t.ma]);
        if (r.rowCount) { them++; if (!t.di) den++; }
      }
      const cuoi = tin[tin.length - 1];
      // Chưa đọc: hội thoại mới → số tin khách nhắn liền cuối khi Pancake còn báo chưa xem; hội thoại cũ → cộng tin khách mới, page đã trả lời sau cùng thì về 0.
      let chuaDoc = cu?.chua_doc ?? 0;
      if (!cu) { chuaDoc = 0; if (!c.seen) for (let i = tin.length - 1; i >= 0 && !tin[i].di; i--) chuaDoc++; }
      else if (them) chuaDoc = cuoi?.di ? 0 : chuaDoc + den;
      await db.query("update public.hop_thu_hoi_thoai set tin_cuoi = $2, tin_cuoi_luc = $3, chua_doc = $4 where id = $1",
        [ht.id, cuoi ? cuoi.nd.slice(0, 200) : null, capNhat ?? cuoi?.luc ?? null, chuaDoc]);
      await db.query("commit");
      dem.tinMoi += them;
    } catch (e) { await db.query("rollback").catch(() => {}); dem.loi++; console.error(`  LỖI ghi ${c.id.slice(-6)}: ${e.message}`); }
  }
  if (!LAP || dem.tinMoi || dem.loi) console.log(`${new Date().toISOString()} hop-thu ${GHI ? "GHI" : "THỬ"} ${PHUT}p ${JSON.stringify(dem)}`);
} catch (e) { console.error(new Date().toISOString(), "LỖI:", e.message); process.exitCode = 1; throw e; }
}

if (!LAP) { db = await ketNoi(); try { await motLuot(); } catch { /* đã in */ } finally { await db.end(); } }
else {
  // Chạy liền: giữ một kết nối DB, lỗi (mất mạng, DB chậm) thì đóng, chờ 30 giây rồi nối lại. launchd KeepAlive dựng lại nếu tiến trình chết.
  for (;;) {
    try { if (!db) db = await ketNoi(); await motLuot(); await new Promise((r) => setTimeout(r, LAP * 1000)); }
    catch { try { await db?.end(); } catch { /* bỏ */ } db = null; await new Promise((r) => setTimeout(r, 30_000)); }
  }
}
