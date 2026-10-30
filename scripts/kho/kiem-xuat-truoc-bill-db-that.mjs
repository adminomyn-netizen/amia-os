// KIỂM CHỨNG TRÊN DB THẬT, TRONG MỘT GIAO DỊCH LUÔN HOÀN TÁC (không để lại gì): xuất vật tư theo phiếu cấp trước bill, rồi chốt hoá đơn có dịch vụ đó
// và chứng minh tồn vật tư tiêu hao KHÔNG bị trừ thêm lần nữa (chỉ hàng bán bị trừ). Dùng dịch vụ + vật tư thật đã có định mức nhóm A.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/kho/kiem-xuat-truoc-bill-db-that.mjs
import { ketNoi } from "../chuyen-salonhero/lib.mjs";

const db = await ketNoi();
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const one = async (sql, p = []) => (await q(sql, p))[0];
const ket = [];
const ghi = (ten, dat, chiTiet) => { ket.push({ ten, dat, chiTiet }); console.log(dat ? "ĐẠT " : "SAI  ", ten, chiTiet ?? ""); };
try {
  await db.query("begin");
  const cn = (await one(`select id from public.chi_nhanh where ma='VINH'`)).id;
  const nv = (await one(`select id from public.nhan_vien where hoat_dong order by tao_luc limit 1`)).id;
  const kh = (await one(`select id from public.khach_hang where chi_nhanh_id = $1 limit 1`, [cn]))?.id ?? (await one(`select id from public.khach_hang limit 1`)).id;
  const dv = await one(`select d.dich_vu_id, v.ten from public.dinh_muc d join public.dich_vu v on v.id=d.dich_vu_id join public.san_pham s on s.id=d.san_pham_id
                         where s.nhom_cap='A' and not d.chon_theo_chi_dinh group by 1,2 order by count(*) desc limit 1`);
  const dm = await q(`select d.san_pham_id, d.so_luong::float sl, s.ten, s.ban_le from public.dinh_muc d join public.san_pham s on s.id=d.san_pham_id where d.dich_vu_id=$1 and not d.chon_theo_chi_dinh and s.nhom_cap='A'`, [dv.dich_vu_id]);
  console.log(`Dịch vụ thật: ${dv.ten}; vật tư cố định: ${dm.map((d) => `${d.ten} x${d.sl}`).join("; ")}`);
  const ton = async (sp) => Number((await one(`select coalesce(sum(so_luong),0)::float t from public.kho_so_cai where chi_nhanh_id=$1 and san_pham_id=$2`, [cn, sp])).t);
  const dsId = dm.map((d) => d.san_pham_id);
  // 1. tồn đầu giả định trong giao dịch (sẽ hoàn tác)
  for (const d of dm) await db.query(`insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, ghi_chu, nguoi_id) values ($1,$2,'nhap',1000,'KIỂM THỬ - hoàn tác',$3)`, [cn, d.san_pham_id, nv]);
  const t0 = await Promise.all(dsId.map(ton));
  // 2. phiếu cấp: ra phiếu, kho cấp, nhận, hoàn tất (trả 0)
  const ph = (await one(`select public.tao_phieu_cap($1,null,$2,$3,$4,$4,'[]'::jsonb,$4) id`, [cn, kh, dv.dich_vu_id, nv])).id;
  await db.query(`select public.cap_phieu($1,$2)`, [ph, nv]);
  const t1 = await Promise.all(dsId.map(ton));
  ghi("Kho cấp theo phiếu: tồn mỗi vật tư giảm đúng định mức", dm.every((d, i) => Math.abs(t0[i] - t1[i] - d.sl) < 1e-9), dm.map((d, i) => `${d.ten}: ${t0[i]} -> ${t1[i]}`).join("; "));
  await db.query(`select public.nhan_phieu($1,$2,null)`, [ph, nv]);
  const dong = await q(`select id from public.phieu_cap_dong where phieu_id=$1`, [ph]);
  await db.query(`select public.hoan_tat_phieu($1,$2::jsonb,null,$3)`, [ph, JSON.stringify(dong.map((d) => ({ dong_id: d.id, so_tra: 0 }))), nv]);
  // 3. chốt hoá đơn chỉ có dịch vụ đó
  const hd = (await one(`insert into public.hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id) values ('KT'||lpad(public.so_tiep_theo('kiem_thu_kho')::text,6,'0'), $1,$2,$3) returning id`, [cn, kh, nv])).id;
  const dg = (await one(`insert into public.hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia, giam_gia) values ($1,'dich_vu',$2,$3,1,1000000,0) returning id`, [hd, dv.dich_vu_id, dv.ten])).id;
  await db.query(`insert into public.dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'ban',100)`, [dg, nv]);
  await db.query(`select public.tinh_lai_hoa_don($1)`, [hd]);
  const pt = (await one(`select tong_phai_thu::text t from public.hoa_don where id=$1`, [hd])).t;
  await db.query(`insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, nguoi_id) values ($1,'thu','tien_mat',$2,$3)`, [hd, pt, nv]);
  await db.query(`select public.chot_hoa_don($1,$2)`, [hd, nv]);
  const t2 = await Promise.all(dsId.map(ton));
  ghi("Sau khi chốt hoá đơn: tồn vật tư tiêu hao KHÔNG đổi (không trừ đôi)", t1.every((x, i) => Math.abs(x - t2[i]) < 1e-9), dm.map((d, i) => `${d.ten}: ${t1[i]} -> ${t2[i]}`).join("; "));
  const n = (await one(`select count(*)::int n from public.kho_so_cai where hoa_don_id=$1`, [hd])).n;
  ghi("Hoá đơn chốt không sinh dòng sổ kho nào cho vật tư của dịch vụ", n === 0, `${n} dòng`);
  await db.query(`select public.huy_hoa_don($1,'Kiểm thử',$2)`, [hd, nv]);
  const t3 = await Promise.all(dsId.map(ton));
  ghi("Huỷ hoá đơn không hoàn kho vật tư đã cấp theo phiếu", t2.every((x, i) => Math.abs(x - t3[i]) < 1e-9));
  // 4. chốt chặn sổ kho
  const tieuHaoKhongBan = await one(`select id, ten from public.san_pham where tieu_hao and not ban_le limit 1`);
  let chan = "";
  await db.query("savepoint s1");
  try { await db.query(`insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong) values ($1,$2,'xuat_ban',-1)`, [cn, tieuHaoKhongBan.id]); } catch (e) { chan = e.message; }
  await db.query("rollback to savepoint s1");
  ghi("Chốt chặn: dòng bán của vật tư tiêu hao không bán lẻ bị từ chối", /vật tư tiêu hao dùng trong ca/.test(chan), chan.slice(0, 80));
} catch (e) { console.error("LỖI:", e.message); process.exitCode = 1; }
finally {
  await db.query("rollback").catch(() => {});
  const du = (await db.query(`select count(*)::int n from public.kho_so_cai where ghi_chu = 'KIỂM THỬ - hoàn tác'`)).rows[0].n;
  console.log(`Đã hoàn tác toàn bộ. Dòng kiểm thử còn lại trong sổ kho: ${du}`);
  console.log(ket.every((k) => k.dat) && ket.length >= 5 ? "KẾT LUẬN: ĐẠT" : "KẾT LUẬN: CÓ CHỖ SAI");
  await db.end();
}
