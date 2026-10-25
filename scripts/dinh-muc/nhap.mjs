// Nhập định mức vật tư nhóm A (file Flora 25/10/2026) vào AMIA OS. Chạy lại an toàn (unique dịch vụ + vật tư; vật tư nhận diện theo mã VT-…).
// Làm sạch theo đúng ghi chú "Cần sửa" của Flora; chỗ nào không đoán được thì BỎ và liệt kê vào `can_xac_nhan` (không nhập số đoán).
import { createHash } from "node:crypto";

const CHON_THEO_CHI_DINH = /^(Đầu MFU|Đầu Mfu|Ultherapy|Exion bikini)/i;   // bác sĩ chọn đầu / vùng khi chỉ định
const TIP_DUNG = { ten: "Đầu típ Thermage FLX TOTAL TIP 3.0 CM, 1200 REP", gia: 22270000 };   // Flora: mặt+cổ phải dùng TOTAL TIP 3.0cm 1200REP (22,27tr)

export const maVatTu = (ten) => "VT-" + createHash("sha1").update(ten.trim().toLowerCase()).digest("hex").slice(0, 8).toUpperCase();

/** Làm sạch: trả { dong: [...đã sửa], bo: [{dich_vu, vat_tu, ly_do}], da_sua: [...] } */
export function lamSach(rows) {
  const dong = [], bo = [], daSua = [], thay = new Set();
  const da = new Set();
  for (const r0 of rows) {
    const r = { ...r0 };
    const khoa = `${r.dich_vu}|${r.vat_tu}`;
    if (/TRÙNG DÒNG/i.test(r.flora_ghi) ) { if (da.has(khoa)) { bo.push({ dich_vu: r.dich_vu, vat_tu: r.vat_tu, ly_do: "dòng trùng (Flora đánh dấu tính 2 lần) — giữ dòng đầu" }); continue; } }
    da.add(khoa);
    if (/SAI ĐẦU TIP/i.test(r.flora_ghi)) {
      daSua.push(`${r.dich_vu}: đổi "${r.vat_tu}" (11 triệu) → "${TIP_DUNG.ten}" (22,27 triệu) theo ghi chú của Flora`);
      r.vat_tu = TIP_DUNG.ten; r.don_gia = TIP_DUNG.gia; thay.add(khoa);
    }
    if (r.dinh_muc === "" || r.dinh_muc === null || Number(r.dinh_muc) <= 0) { bo.push({ dich_vu: r.dich_vu, vat_tu: r.vat_tu, ly_do: "định mức trống — cần Flora/bác sĩ cho số" }); continue; }
    if (r.don_vi_b2 === "B" && /Gas Thermage/i.test(r.vat_tu) && Number(r.dinh_muc) === 0.5) { bo.push({ dich_vu: r.dich_vu, vat_tu: r.vat_tu, ly_do: "định mức 0,5 đơn vị 'B' mâu thuẫn với mặt+cổ (250 g) — cần thống nhất" }); continue; }
    r.don_vi = (r.don_vi_dung || r.don_vi_b2 || "cái").toLowerCase();
    r.chon = CHON_THEO_CHI_DINH.test(r.vat_tu);
    r.dinh_muc = Number(r.dinh_muc);
    r.don_gia = r.don_gia === "" || r.don_gia === null ? null : Number(r.don_gia);
    dong.push(r);
  }
  return { dong, bo, da_sua: daSua };
}

export async function nhapDinhMuc(db, rows, anhXa) {
  const q = async (sql, p) => (await db.query(sql, p)).rows;
  const { dong, bo, da_sua } = lamSach(rows);
  // 1) vật tư
  const vt = new Map();
  for (const r of dong) if (!vt.has(r.vat_tu)) vt.set(r.vat_tu, { ma: maVatTu(r.vat_tu), ten: r.vat_tu, don_vi: r.don_vi, gia: r.don_gia });
  for (const r of dong) { const v = vt.get(r.vat_tu); if (v.gia == null && r.don_gia != null) v.gia = r.don_gia; }
  const dsVt = [...vt.values()];
  await q(`insert into public.san_pham (ma, ten, nhom, nhom_cap, don_vi, gia_nhap_don_vi, ban_le, tieu_hao, theo_doi_kho)
           select x.ma, x.ten, 'Vật tư tiêu hao', 'A', x.don_vi, x.gia, false, true, true
             from jsonb_to_recordset($1::jsonb) as x(ma text, ten text, don_vi text, gia numeric) on conflict (ma) do nothing`, [JSON.stringify(dsVt)]);
  // thuốc giảm đau efferalgan đã có từ SalonHero (bán kê đơn): dùng lại, gắn nhóm A + tiêu hao
  await q(`update public.san_pham set nhom_cap = 'A', tieu_hao = true, gia_nhap_don_vi = coalesce(gia_nhap_don_vi, 3250) where lower(ten) = lower('Thuốc giảm đau efferalgan codeine 500mg') and nhom_cap is null`);
  // dùng sản phẩm Efferalgan có sẵn thay vì tạo mới: bản VT- tạo ở trên thành thừa nếu đã có bản gốc
  const trung = await q(`select v.id as vt_id, s.id as goc_id from public.san_pham v join public.san_pham s on lower(s.ten) = lower(v.ten) and s.id <> v.id where v.ma like 'VT-%' and s.ma not like 'VT-%'`);
  const ghiDe = new Map(trung.map((t) => [t.vt_id, t.goc_id]));
  // 2) định mức cho các dịch vụ đã xác nhận được tên
  const dichVu = new Map((await q(`select sh_id, id from public.dich_vu where sh_id is not null`)).map((r) => [Number(r.sh_id), r.id]));
  const sp = new Map((await q(`select ma, id, ten from public.san_pham where ma like 'VT-%'`)).map((r) => [r.ma, r.id]));
  const gocTheoTen = new Map((await q(`select lower(ten) as t, id from public.san_pham where ma not like 'VT-%'`)).map((r) => [r.t, r.id]));
  const vaoDm = [], chuaXacNhan = new Set();
  for (const r of dong) {
    const sh = anhXa[r.dich_vu];
    if (!sh || !dichVu.has(sh)) { chuaXacNhan.add(r.dich_vu); continue; }
    const spId = gocTheoTen.get(r.vat_tu.toLowerCase()) ?? sp.get(maVatTu(r.vat_tu));
    vaoDm.push({ dich_vu_id: dichVu.get(sh), san_pham_id: spId, so_luong: r.dinh_muc, chon: r.chon, ghi_chu: `Định mức Flora 25/10/2026${r.flora_ghi && !/TRÙNG|SAI ĐẦU|trống/i.test(r.flora_ghi) ? ` — ${r.flora_ghi}` : ""}` });
  }
  const r = await q(`with ins as (insert into public.dinh_muc (dich_vu_id, san_pham_id, so_luong, chon_theo_chi_dinh, ghi_chu)
                       select x.dich_vu_id, x.san_pham_id, x.so_luong, x.chon, x.ghi_chu from jsonb_to_recordset($1::jsonb) as x(dich_vu_id uuid, san_pham_id uuid, so_luong numeric, chon boolean, ghi_chu text)
                       on conflict (dich_vu_id, san_pham_id) do nothing returning 1) select count(*)::int n from ins`, [JSON.stringify(vaoDm)]);
  // dọn vật tư VT- thừa (trùng tên với sản phẩm gốc) nếu chưa ai dùng
  for (const [thua] of ghiDe) await q(`delete from public.san_pham where id = $1 and not exists (select 1 from public.dinh_muc where san_pham_id = $1)`, [thua]);
  return { dong_sach: dong.length, vat_tu_catalog: dsVt.length, dinh_muc_them_moi: r[0].n, dich_vu_da_nhap: [...new Set(dong.filter((x) => anhXa[x.dich_vu]).map((x) => x.dich_vu))], dich_vu_chua_xac_nhan_ten: [...chuaXacNhan], bo, da_sua };
}
