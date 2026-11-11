-- 0329 — "Buổi đã làm" (Tổng quan, Trang chủ, Báo cáo doanh thu, xuất Excel) hiện 0 mọi kỳ (11/11/2026).
-- Gốc: bc_doanh_thu_ngay.so_buoi chỉ đếm buoi_thuc_hien (luồng mới Gửi chuyên viên → Kết thúc), bảng này chưa có dòng nào;
--   các buổi thật đang nằm ở dòng "dùng thẻ" của hoá đơn SalonHero (hoa_don_dong dịch vụ có the_khach_sh_id / thành tiền 0) — vd T10 876, T11 231.
-- Định nghĩa thống nhất với bc_dung_dich_vu (cột luot_the): buổi đã làm = buổi luồng mới (buoi_thuc_hien 'da_lam', huỷ buổi = 'huy' không tính)
--   + số lượng dòng dịch vụ dùng thẻ trên hoá đơn hoàn thành (không phải số dư đầu). Hai nguồn không trùng: luồng mới không ghi hoa_don_dong.
-- doanh_thu_buoi của dòng dùng thẻ = số lượng × giá 1 buổi của thẻ (thẻ có giới hạn buổi), y như gia_tri của bc_dung_dich_vu.
-- Chỉ đổi hàm (không đổi bảng/dữ liệu). Bản tính sẵn trang chủ (so_lieu_tinh_san) tự tính lại ≤ 8 phút.

create or replace function public.bc_doanh_thu_ngay(p_tu date, p_den date, p_cn uuid default null::uuid)
 returns table(ngay date, so_don integer, doanh_thu bigint, thu_don_moi bigint, thu_no_cu bigint, thuc_thu bigint, tien_mat bigint, chuyen_khoan bigint, quet_the bigint, tru_the_tien bigint, no_moi bigint, so_buoi integer, doanh_thu_buoi bigint)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
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
  buoi0 as (
    select b.ngay_lam as d, 1::bigint as sl, coalesce(b.doanh_thu_buoi, 0)::numeric as dt
      from public.buoi_thuc_hien b where b.trang_thai = 'da_lam' and b.ngay_lam between p_tu and p_den and (p_cn is null or b.chi_nhanh_id = p_cn)
    union all
    select h.ngay_hd, d.so_luong::bigint,
           d.so_luong::numeric * coalesce((select t.gia_tri_buoi from public.the_khach t where t.sh_id = d.the_khach_sh_id and t.so_buoi_tong < 999999), 0)
      from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
     where d.loai = 'dich_vu' and (d.the_khach_sh_id is not null or d.thanh_tien = 0)
       and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)),
  buoi as (select b.d, sum(b.sl)::int as so_buoi, round(sum(b.dt))::bigint as dt from buoi0 b group by b.d)
  select n.d, coalesce(don.so_don, 0), coalesce(don.doanh_thu, 0), coalesce(tt.thu_moi, 0), coalesce(tt.thu_no_cu, 0), coalesce(tt.thu_moi, 0) + coalesce(tt.thu_no_cu, 0),
         coalesce(tt.tm, 0), coalesce(tt.ck, 0), coalesce(tt.qt, 0), coalesce(tt.tt, 0), coalesce(nomoi.no_moi, 0), coalesce(buoi.so_buoi, 0), coalesce(buoi.dt, 0)
    from ngay n left join don on don.d = n.d left join tt on tt.d = n.d left join nomoi on nomoi.d = n.d left join buoi on buoi.d = n.d order by n.d
$function$;

-- Ô "Buổi đã thực hiện tháng này" (Trang chủ, theo người đăng nhập) cũng 0 vì cùng lý do: đếm buổi luồng mới mình là người làm
--   + dòng dùng thẻ SalonHero mình là người phục vụ (dong_nhan_vien vai 'phuc_vu'). Trả số buổi + số khách khác nhau.
create or replace function public.buoi_da_lam_nv(p_nv uuid, p_tu date, p_den date)
 returns table(so_buoi integer, so_khach integer)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  with x as (
    select b.khach_id, 1::bigint as sl from public.buoi_thuc_hien b
     where b.nv_thuc_hien_id = p_nv and b.trang_thai = 'da_lam' and b.ngay_lam between p_tu and p_den
    union all
    select h.khach_id, d.so_luong::bigint
      from public.dong_nhan_vien c join public.hoa_don_dong d on d.id = c.dong_id join public.hoa_don h on h.id = d.hoa_don_id
     where c.nhan_vien_id = p_nv and c.vai = 'phuc_vu' and d.loai = 'dich_vu' and (d.the_khach_sh_id is not null or d.thanh_tien = 0)
       and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den)
  select coalesce(sum(x.sl), 0)::int, count(distinct x.khach_id)::int from x
$function$;
revoke all on function public.buoi_da_lam_nv(uuid, date, date) from public, anon, authenticated;

notify pgrst, 'reload schema';
