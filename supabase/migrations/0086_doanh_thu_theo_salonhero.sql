-- 0086 — DOANH THU TÍNH ĐÚNG NHƯ SALONHERO (chị Lâm chốt 29/10/2026: "mọi màn y hệt SalonHero, kể cả doanh thu").
-- Trước: doanh thu đơn = tiền hàng − giảm giá cả đơn (không VAT, không trừ thẻ).
-- Nay (SalonHero `total` − phần trả bằng thẻ): doanh thu đơn = TỔNG ĐƠN HOÀN THÀNH (tiền hàng − giảm giá + VAT + phụ phí + tip = tong_phai_thu) − phần thanh toán bằng thẻ tiền.
--   Đối chiếu SalonHero: 10/2025 Nguyễn Thị Vân Anh 709.262.000 (gồm VAT 1.299.000 của hoá đơn 25100220); ngày 28/10/2026 doanh thu 9.000.000 (13.000.000 − 4.000.000 trừ thẻ).
-- Đổi: view v_hd_doanh_thu (một nơi định nghĩa), bc_thu_ngan (cột doanh_so = tổng đơn), bc_doanh_thu_ngay (cột doanh_thu). KHÔNG sửa dữ liệu bảng gốc.
-- Các màn đọc bc_doanh_thu_ngay tự đổi theo (trang chủ, tổng quan, báo cáo doanh thu, chat trợ lý, xuất Excel). bc_muc_ban (doanh số theo dịch vụ/sản phẩm) và
-- doanh số tính hoa hồng (v_doanh_so_dong) giữ nguyên: đó là doanh số từng dòng hàng, không phải doanh thu đơn.

create view public.v_hd_doanh_thu with (security_invoker = true) as
select h.id as hoa_don_id, h.ngay_hd, h.chi_nhanh_id, h.tong_phai_thu as tong_don,
       case when h.la_lich_su then h.tien_tru_the
            else coalesce((select sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) from public.thanh_toan t where t.hoa_don_id = h.id and t.phuong_thuc = 'the_tien'), 0) end as tru_the
  from public.hoa_don h
 where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau;

create or replace function public.bc_thu_ngan(p_tu date, p_den date, p_cn uuid default null, p_nhom text default 'tong')
returns table (ky date, khoa text, thu_ngan text, cac_ten text, so_don int, doanh_so bigint, tru_the_tien bigint, doanh_thu bigint, con_no bigint, da_thu bigint)
language sql stable as $$
  with hd as (
    select h.ngay_hd,
           case when h.thu_ngan_sh_id is not null then 'sh:' || h.thu_ngan_sh_id
                when h.thu_ngan_ten is not null then 'ten:' || h.thu_ngan_ten
                else 'nv:' || h.nguoi_lap_id end as khoa,
           coalesce(h.thu_ngan_ten, n.ho_ten, 'Chưa rõ') as ten,
           v.tong_don as doanh_so, v.tru_the, h.con_no
      from public.v_hd_doanh_thu v join public.hoa_don h on h.id = v.hoa_don_id left join public.nhan_vien n on n.id = h.nguoi_lap_id
     where h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn))
  select case p_nhom when 'ngay' then hd.ngay_hd when 'thang' then date_trunc('month', hd.ngay_hd)::date else p_tu end,
         hd.khoa, (array_agg(hd.ten order by hd.ngay_hd desc))[1], string_agg(distinct hd.ten, ', '),
         count(*)::int, sum(hd.doanh_so)::bigint, sum(hd.tru_the)::bigint, sum(hd.doanh_so - hd.tru_the)::bigint,
         sum(hd.con_no)::bigint, sum(hd.doanh_so - hd.tru_the - hd.con_no)::bigint
    from hd group by 1, 2 order by 1, 8 desc
$$;

create or replace function public.bc_doanh_thu_ngay(p_tu date, p_den date, p_cn uuid default null)
returns table (ngay date, so_don int, doanh_thu bigint, thu_don_moi bigint, thu_no_cu bigint, thuc_thu bigint, tien_mat bigint, chuyen_khoan bigint, quet_the bigint, tru_the_tien bigint, no_moi bigint, so_buoi int, doanh_thu_buoi bigint)
language sql stable as $$
  with ngay as (select generate_series(p_tu, p_den, interval '1 day')::date as d),
  don as (
    select v.ngay_hd as d, count(*)::int as so_don, coalesce(sum(v.tong_don - v.tru_the), 0)::bigint as doanh_thu
      from public.v_hd_doanh_thu v where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn) group by v.ngay_hd),
  tt as (
    select t.ngay as d,
      sum(case when t.phuong_thuc <> 'the_tien' and h.ngay_hd = t.ngay then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as thu_moi,
      sum(case when t.phuong_thuc <> 'the_tien' and h.ngay_hd < t.ngay then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as thu_no_cu,
      sum(case when t.phuong_thuc = 'tien_mat' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as tm,
      sum(case when t.phuong_thuc = 'chuyen_khoan' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as ck,
      sum(case when t.phuong_thuc = 'quet_the' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as qt,
      sum(case when t.phuong_thuc = 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as tt
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by t.ngay),
  nomoi as (
    select h.ngay_hd as d, sum(greatest(h.tong_phai_thu - coalesce((select sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) from public.thanh_toan t where t.hoa_don_id = h.id and t.ngay = h.ngay_hd), 0), 0))::bigint as no_moi
      from public.hoa_don h where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by h.ngay_hd),
  buoi as (
    select b.ngay_lam as d, count(*)::int as so_buoi, coalesce(sum(b.doanh_thu_buoi), 0)::bigint as dt
      from public.buoi_thuc_hien b where b.trang_thai = 'da_lam' and b.ngay_lam between p_tu and p_den and (p_cn is null or b.chi_nhanh_id = p_cn) group by b.ngay_lam)
  select n.d, coalesce(don.so_don, 0), coalesce(don.doanh_thu, 0), coalesce(tt.thu_moi, 0), coalesce(tt.thu_no_cu, 0), coalesce(tt.thu_moi, 0) + coalesce(tt.thu_no_cu, 0),
         coalesce(tt.tm, 0), coalesce(tt.ck, 0), coalesce(tt.qt, 0), coalesce(tt.tt, 0), coalesce(nomoi.no_moi, 0), coalesce(buoi.so_buoi, 0), coalesce(buoi.dt, 0)
    from ngay n left join don on don.d = n.d left join tt on tt.d = n.d left join nomoi on nomoi.d = n.d left join buoi on buoi.d = n.d order by n.d
$$;

select public.khoa_tat_ca_bang();
