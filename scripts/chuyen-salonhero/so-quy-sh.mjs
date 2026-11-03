// SỔ QUỸ SalonHero → AMIA (câu 16, 03/11/2026). Dùng chung cho: nhập một lần cả lịch sử (chạy file này) và đồng bộ hằng đêm (dong-bo-dem.mjs import napSoQuySh).
// Nguồn: CostService.getCashBook({startDate, endDate, location_id, merchant_id, account_type: CASH|BANK}) của SalonHero (chỉ đọc).
//   • Dòng id "order_…" = tiền khách trả, AMIA đã có qua thanh_toan → BỎ QUA ở đây.
//   • Dòng còn lại = dòng tay (Thu / Chi / Chuyển quỹ / Nạp / Rút) → so_quy qua hàm so_quy_nhap_sh (migration 0207), khoá nguồn sh_id.
//   • Chuyển quỹ (loại 3/4) hiện ở CẢ 2 sổ với cùng id → gộp theo id.
//   • endDate của getCashBook TÍNH CẢ mốc cuối (khác getAllOrder) → khoảng liền nhau có thể trùng 1 dòng ở biên → gộp theo id.
// Dùng (nhập lịch sử từ tệp đã kéo về):
//   PW=… node scripts/chuyen-salonhero/so-quy-sh.mjs --tep <sq.ndjson> [--muc-tieu '{"VINH":{"tien_mat":..,"ngan_hang":..},"DALAT":{..}}'] [--that]
//   Mặc định CHẠY THỬ (rollback). --that cần bản sao lưu sao-luu/so-quy-truoc-*.json tạo trong 3 giờ qua.
import { ketNoi, docHet, nhanVienHeThong, cnTheoLoc } from "./lib.mjs";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Gộp các dòng getCashBook (mọi sổ, mọi khoảng) thành danh sách phiếu tay duy nhất theo id, đã chuẩn hoá cho so_quy_nhap_sh. */
export function chuanHoaSoQuySh(rows) {
  const m = new Map();
  for (const r of rows) {
    if (String(r.id).startsWith("order")) continue;
    if (r.is_deleted) continue;
    m.set(Number(r.id), {
      sh_id: Number(r.id), type: Number(r.type), cn: cnTheoLoc(r.location_id ?? r.__loc), so_tien: Math.round(Number(r.amount) || 0),
      tao_luc: r.createdAt, cap_nhat: r.updatedAt ?? r.createdAt,
      noi_dung: [String(r.content ?? "").trim(), r.tag_name ? `(nhóm SalonHero: ${String(r.tag_name).trim()})` : ""].filter(Boolean).join(" "),
      doi_tuong: String(r.owner ?? "").trim(), ma_sh: String(r.code ?? "").trim(), nguoi_tao: String(r.created_by_name ?? "").trim(),
    });
  }
  return [...m.values()];
}

/**
 * Ghi phiếu tay SalonHero vào so_quy trong giao dịch đang mở của `db`.
 * - Phiếu mới / phiên bản mới (updatedAt đổi) → nhập; phiên bản cũ của phiếu bị sửa → đảo (dòng ngược chiều cùng ngày).
 * - `cuaSo` = {tu, den} (ngày VN, gồm 2 đầu): phiếu AMIA có sh_id trong cửa sổ mà SalonHero không còn → đảo (SalonHero đã xoá). Không truyền = không dò xoá.
 */
export async function napSoQuySh(db, phieu, { nguoiId, cuaSo = null } = {}) {
  const q = async (s, p) => (await db.query(s, p)).rows;
  const nguoi = nguoiId ?? (await nhanVienHeThong(db));
  const coSan = new Map((await q(`select sh_id, max(sh_cap_nhat) cap_nhat from public.so_quy s where sh_id is not null and nguon <> 'dao_phieu'
      and not exists (select 1 from public.so_quy r where r.phieu_goc_id = s.id) group by sh_id`)).map((r) => [Number(r.sh_id), new Date(r.cap_nhat).getTime()]));
  const bao = { tong: phieu.length, moi: 0, sua: 0, xoa: 0, khong_doi: 0, bo_qua_0_dong: phieu.filter((p) => p.so_tien <= 0).length, dao_dong: 0, nhap_dong: 0 };
  const sua = [], can = [];
  for (const p of phieu) {
    if (p.so_tien <= 0) continue;
    const t = coSan.get(p.sh_id);
    if (t === undefined) { bao.moi++; can.push(p); }
    else if (t !== new Date(p.cap_nhat).getTime()) { bao.sua++; sua.push(p.sh_id); can.push(p); }
    else bao.khong_doi++;
  }
  let xoa = [];
  if (cuaSo) {
    const con = new Set(phieu.map((p) => p.sh_id));
    xoa = (await q(`select distinct sh_id from public.so_quy s where sh_id is not null and nguon <> 'dao_phieu' and ngay between $1::date and $2::date
        and not exists (select 1 from public.so_quy r where r.phieu_goc_id = s.id)`, [cuaSo.tu, cuaSo.den])).map((r) => Number(r.sh_id)).filter((id) => !con.has(id));
    bao.xoa = xoa.length;
  }
  if (sua.length) bao.dao_dong += (await q(`select public.so_quy_dao_sh($1::bigint[], $2, $3) n`, [sua, "SalonHero đã sửa phiếu này (đồng bộ)", nguoi]))[0].n;
  if (xoa.length) bao.dao_dong += (await q(`select public.so_quy_dao_sh($1::bigint[], $2, $3) n`, [xoa, "SalonHero đã xoá phiếu này (đồng bộ)", nguoi]))[0].n;
  for (let i = 0; i < can.length; i += 1000) bao.nhap_dong += (await q(`select public.so_quy_nhap_sh($1::jsonb, $2) n`, [JSON.stringify(can.slice(i, i + 1000)), nguoi]))[0].n;
  bao.mau_xoa = xoa.slice(0, 10); bao.mau_sua = sua.slice(0, 10);
  return bao;
}

/** Tồn quỹ hiện tại 4 quỹ của AMIA (cộng dồn từ ngày đầu, như SalonHero) + phần do dòng tạo trong app (không có sh_id, không từ bán hàng). */
export async function tonQuyAmia(db) {
  const r = (await db.query(`select c.ma cn, q.loai, coalesce(sum(v.bien_dong), 0)::bigint ton,
      coalesce(sum(v.bien_dong) filter (where v.nguon <> 'ban_hang' and v.sh_id is null and not exists (select 1 from public.so_quy g where g.id::text = v.id and g.phieu_goc_id is not null and exists (select 1 from public.so_quy o where o.id = g.phieu_goc_id and o.sh_id is not null))), 0)::bigint tu_app
      from public.quy q join public.chi_nhanh c on c.id = q.chi_nhanh_id left join public.v_so_quy v on v.quy_id = q.id group by 1, 2 order by 1, 2`)).rows;
  const o = {}; for (const x of r) (o[x.cn] ??= {})[x.loai] = { ton: Number(x.ton), tu_app: Number(x.tu_app) };
  return o;
}

// ── chạy trực tiếp: nhập cả lịch sử từ tệp ──
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (t) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : null; };
  const that = process.argv.includes("--that");
  const tep = arg("--tep"); if (!tep) throw new Error("Thiếu --tep <tệp ndjson getCashBook>");
  const mucTieu = arg("--muc-tieu") ? JSON.parse(arg("--muc-tieu")) : null;
  const phieu = chuanHoaSoQuySh(await docHet(tep));
  const db = await ketNoi();
  try {
    await db.query("begin");
    const truoc = await tonQuyAmia(db);
    const bao = await napSoQuySh(db, phieu);
    const sau = await tonQuyAmia(db);
    const bang = [];
    for (const cn of ["VINH", "DALAT"]) for (const l of ["tien_mat", "ngan_hang"]) {
      const mt = mucTieu?.[cn]?.[l];
      bang.push({ quy: `${cn} ${l}`, truoc: truoc[cn][l].ton, sau: sau[cn][l].ton, salonhero: mt ?? "", lech: mt == null ? "" : sau[cn][l].ton - mt });
    }
    console.log(JSON.stringify(bao)); console.table(bang);
    if (that) {
      const SL = resolve(dirname(fileURLToPath(import.meta.url)), "../../sao-luu");
      const sao = existsSync(SL) && readdirSync(SL).filter((n) => /^so-quy-truoc-/.test(n) && Date.now() - statSync(`${SL}/${n}`).mtimeMs < 3 * 3600e3).pop();
      if (!sao) { await db.query("rollback"); console.log("DỪNG: chưa có sao-luu/so-quy-truoc-*.json trong 3 giờ qua. KHÔNG ghi."); process.exitCode = 3; }
      else { await db.query("commit"); console.log(`ĐÃ GHI THẬT. Sao lưu trước đó: ${sao}`); }
    } else { await db.query("rollback"); console.log("CHẠY THỬ XONG (đã huỷ, chưa ghi)."); }
  } catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
  await db.end();
}
