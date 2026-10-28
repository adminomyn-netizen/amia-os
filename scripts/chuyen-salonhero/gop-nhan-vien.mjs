// Gộp hồ sơ nhân viên trùng + ngừng hoạt động người nghỉ/không phải nhân viên (chị Lâm chốt 28/10, danh sách 33).
// Dùng: PW=… node scripts/chuyen-salonhero/gop-nhan-vien.mjs [--that]. Mặc định chạy thử rồi rollback. Gộp = chuyển MỌI dòng tham chiếu từ hồ sơ trùng sang hồ sơ chính, rồi xoá hồ sơ trùng (trống).
import { ketNoi } from "./lib.mjs";
const that = process.argv.includes("--that");
const db = await ketNoi(); const q = async (s, p) => (await db.query(s, p)).rows;
const GOP = [["NV0003", ["NV0077"]], ["NV0013", ["NV0071", "NV0152"]]]; // [mã chính, [mã trùng...]]
const NGHI = ["NV0004", "NV0012", "NV0016"], KHONG_PHAI_NV = ["NV0150", "NV0147"];
const COT_BO_SUNG = ["lark_open_id", "ma_lark", "email", "dien_thoai", "don_vi", "phong_ban_id", "phong_ban_goc", "ngay_vao_lam", "ngay_vao_chinh_thuc", "ngay_nghi_viec", "chi_nhanh_id"];
const id = async (ma) => (await q(`select id from public.nhan_vien where ma_nv=$1`, [ma]))[0]?.id;
const fks = await q(`select conrelid::regclass::text t, a.attname c from pg_constraint k join pg_attribute a on a.attrelid=k.conrelid and a.attnum=k.conkey[1] where k.contype='f' and k.confrelid='public.nhan_vien'::regclass and array_length(k.conkey,1)=1 order by 1,2`);
const dem = async (nv) => { const o = {}; for (const f of fks) { const n = (await q(`select count(*)::int n from ${f.t} where "${f.c}"=$1`, [nv]))[0].n; if (n) o[`${f.t}.${f.c}`] = n; } return o; };
const cong = (...os) => { const r = {}; for (const o of os) for (const [k, v] of Object.entries(o)) r[k] = (r[k] ?? 0) + v; return r; };
const loi = [], bao = [];
try {
  await db.query("begin");
  const truocActive = (await q(`select count(*)::int n from public.nhan_vien where hoat_dong`))[0].n;
  for (const [chinh, trungs] of GOP) {
    const idC = await id(chinh); if (!idC) throw new Error("Không có " + chinh);
    for (const t of trungs) {
      const idT = await id(t); if (!idT) { bao.push(`${t}: không còn`); continue; }
      const truocC = await dem(idC), truocT = await dem(idT), ky = JSON.stringify(cong(truocC, truocT));
      // 1. chuyển trường còn thiếu (giá trị duy nhất phải rời hồ sơ trùng trước)
      const T = (await q(`select * from public.nhan_vien where id=$1`, [idT]))[0];
      await db.query(`update public.nhan_vien set user_id=null, lark_open_id=null, ma_lark=null, sh_id=null where id=$1`, [idT]);
      for (const c of COT_BO_SUNG) if (T[c] != null) await db.query(`update public.nhan_vien set "${c}" = coalesce("${c}", $2) where id=$1`, [idC, T[c]]);
      // 2. chuyển mọi dòng tham chiếu
      for (const f of fks) {
        if (f.t === "nhan_vien_ghep_lark") { await db.query(`delete from public.nhan_vien_ghep_lark where nhan_vien_id=$1`, [idT]); continue; }
        await db.query("savepoint s");
        try { await db.query(`update ${f.t} set "${f.c}"=$1 where "${f.c}"=$2`, [idC, idT]); await db.query("release savepoint s"); }
        catch (e) { await db.query("rollback to savepoint s"); loi.push(`${t} → ${chinh}: ${f.t}.${f.c}: ${e.message.slice(0, 90)}`); }
      }
      const conLai = await dem(idT);
      if (Object.keys(conLai).length) loi.push(`${t}: còn tham chiếu ${JSON.stringify(conLai)}`);
      else { await db.query(`delete from public.nhan_vien where id=$1`, [idT]); }
      const sauC = await dem(idC);
      bao.push(`${t} → ${chinh}: trước (chính+trùng) ${ky} | sau (chính) ${JSON.stringify(sauC)} ${JSON.stringify(sauC) === ky ? "KHỚP" : "LỆCH"}`);
    }
  }
  for (const ma of NGHI) await db.query(`update public.nhan_vien set hoat_dong=false, trang_thai_lam='nghi_viec' where ma_nv=$1`, [ma]);
  for (const ma of KHONG_PHAI_NV) {
    const i = await id(ma); if (!i) continue; const d = await dem(i);
    if (Object.keys(d).length) { await db.query(`update public.nhan_vien set hoat_dong=false, trang_thai_lam='khoa', user_id=null where id=$1`, [i]); bao.push(`${ma}: có tham chiếu ${JSON.stringify(d)} → chỉ ngừng hoạt động`); }
    else { await db.query(`delete from public.nhan_vien where id=$1`, [i]); bao.push(`${ma}: không tham chiếu → đã gỡ khỏi danh sách (xoá hồ sơ)`); }
  }
  const sauActive = (await q(`select count(*)::int n from public.nhan_vien where hoat_dong`))[0].n;
  console.log(bao.join("\n")); console.log("LỖI/TỒN:", loi.length ? loi.join("\n") : "không"); console.log({ dang_lam_truoc: truocActive, dang_lam_sau: sauActive });
  if (loi.length || !that) { await db.query("rollback"); console.log(loi.length ? "CÓ LỖI → đã huỷ" : "Chạy thử xong (rollback)."); } else { await db.query("commit"); console.log("ĐÃ GHI THẬT."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI:", e.message); process.exitCode = 1; }
await db.end();
