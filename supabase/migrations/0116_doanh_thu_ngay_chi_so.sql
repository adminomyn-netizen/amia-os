-- 0116 — CHỈ SỐ ĐẦU TRANG "DOANH THU THEO NGÀY" như SalonHero (G1, 29/10/2026). Chỉ thêm 1 hàm đọc, không đổi cách tính doanh thu.
-- Đối chiếu SalonHero 01–29/10/2026 chi nhánh Vinh: đã thu 1.233.594.000 (bán mới 1.187.594.000 + thu nợ 46.000.000), 579 đơn,
-- tiền mặt 173.650.000/8.000.000, quẹt thẻ 7.680.000/0, chuyển khoản 1.006.264.000/38.000.000, nợ mới chưa thu 41.500.000,
-- thu nợ đơn trong kỳ 23.000.000, ngoài kỳ 23.000.000, trừ thẻ tiền 45.000.000, voucher 0, tip 0, VAT 0.
create function public.bc_doanh_thu_chi_so(p_tu date, p_den date, p_cn uuid default null)
returns table (so_don int, ban_moi bigint, thu_no bigint, tm_ban bigint, tm_no bigint, qt_ban bigint, qt_no bigint, ck_ban bigint, ck_no bigint,
               no_moi_chua_thu bigint, thu_no_trong_ky bigint, thu_no_ngoai_ky bigint, tru_the_tien bigint, so_voucher int, tru_voucher bigint, tip bigint, vat bigint)
language sql stable as $$
  with t as (
    select t.phuong_thuc, h.ngay_hd, t.ngay, (case t.loai when 'thu' then t.so_tien else -t.so_tien end) as v
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)),
  p as (
    select coalesce(sum(v) filter (where phuong_thuc <> 'the_tien' and ngay_hd = ngay), 0) as ban_moi,
           coalesce(sum(v) filter (where phuong_thuc <> 'the_tien' and ngay_hd < ngay), 0) as thu_no,
           coalesce(sum(v) filter (where phuong_thuc = 'tien_mat' and ngay_hd = ngay), 0) as tm_ban, coalesce(sum(v) filter (where phuong_thuc = 'tien_mat' and ngay_hd < ngay), 0) as tm_no,
           coalesce(sum(v) filter (where phuong_thuc = 'quet_the' and ngay_hd = ngay), 0) as qt_ban, coalesce(sum(v) filter (where phuong_thuc = 'quet_the' and ngay_hd < ngay), 0) as qt_no,
           coalesce(sum(v) filter (where phuong_thuc = 'chuyen_khoan' and ngay_hd = ngay), 0) as ck_ban, coalesce(sum(v) filter (where phuong_thuc = 'chuyen_khoan' and ngay_hd < ngay), 0) as ck_no,
           coalesce(sum(v) filter (where phuong_thuc <> 'the_tien' and ngay_hd < ngay and ngay_hd >= p_tu), 0) as thu_no_trong_ky
      from t),
  d as (
    select count(*)::int as so_don, coalesce(sum(h.con_no), 0) as no_chua_thu, coalesce(sum(v.tru_the), 0) as tru_the,
           count(*) filter (where h.giam_voucher > 0)::int as so_vc, coalesce(sum(h.giam_voucher), 0) as vc, coalesce(sum(h.tip), 0) as tip, coalesce(sum(h.vat_tien), 0) as vat
      from public.v_hd_doanh_thu v join public.hoa_don h on h.id = v.hoa_don_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn))
  select d.so_don, p.ban_moi::bigint, p.thu_no::bigint, p.tm_ban::bigint, p.tm_no::bigint, p.qt_ban::bigint, p.qt_no::bigint, p.ck_ban::bigint, p.ck_no::bigint,
         d.no_chua_thu::bigint, p.thu_no_trong_ky::bigint, (p.thu_no - p.thu_no_trong_ky)::bigint, d.tru_the::bigint, d.so_vc, d.vc::bigint, d.tip::bigint, d.vat::bigint
    from p, d
$$;

select public.khoa_tat_ca_bang();
