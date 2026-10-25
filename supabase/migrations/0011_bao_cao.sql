-- 0011 — BÁO CÁO + HOA HỒNG (hàm tổng hợp chạy trong DB để không bị giới hạn 1.000 dòng của API).
-- Doanh thu hoá đơn = tong_hang − giam_gia_don. "Thực thu" = tiền mặt + chuyển khoản + quẹt thẻ (trừ thẻ tiền không phải tiền vào quỹ: tiền đã vào lúc bán thẻ).

create table public.hoa_hong_ti_le (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('dich_vu','san_pham','goi_the')),
  muc_id uuid,                                      -- null = tỉ lệ mặc định của cả loại; có giá trị = riêng cho dịch vụ / sản phẩm / gói đó
  vai text not null check (vai in ('phuc_vu','tu_van','ban')),
  ti_le numeric(5,2) not null check (ti_le >= 0 and ti_le <= 100),
  unique nulls not distinct (loai, muc_id, vai)
);

create function public.bc_doanh_thu_ngay(p_tu date, p_den date, p_cn uuid default null)
returns table (ngay date, so_don int, doanh_thu bigint, thu_don_moi bigint, thu_no_cu bigint, thuc_thu bigint, tien_mat bigint, chuyen_khoan bigint, quet_the bigint, tru_the_tien bigint, no_moi bigint, so_buoi int, doanh_thu_buoi bigint)
language sql stable as $$
  with ngay as (select generate_series(p_tu, p_den, interval '1 day')::date as d),
  don as (
    select h.ngay_hd as d, count(*)::int as so_don, coalesce(sum(greatest(h.tong_hang - h.giam_gia_don, 0)), 0)::bigint as doanh_thu
      from public.hoa_don h where h.trang_thai = 'hoan_thanh' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by h.ngay_hd),
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
      from public.hoa_don h where h.trang_thai = 'hoan_thanh' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by h.ngay_hd),
  buoi as (
    select b.ngay_lam as d, count(*)::int as so_buoi, coalesce(sum(b.doanh_thu_buoi), 0)::bigint as dt
      from public.buoi_thuc_hien b where b.trang_thai = 'da_lam' and b.ngay_lam between p_tu and p_den and (p_cn is null or b.chi_nhanh_id = p_cn) group by b.ngay_lam)
  select n.d, coalesce(don.so_don, 0), coalesce(don.doanh_thu, 0), coalesce(tt.thu_moi, 0), coalesce(tt.thu_no_cu, 0), coalesce(tt.thu_moi, 0) + coalesce(tt.thu_no_cu, 0),
         coalesce(tt.tm, 0), coalesce(tt.ck, 0), coalesce(tt.qt, 0), coalesce(tt.tt, 0), coalesce(nomoi.no_moi, 0), coalesce(buoi.so_buoi, 0), coalesce(buoi.dt, 0)
    from ngay n left join don on don.d = n.d left join tt on tt.d = n.d left join nomoi on nomoi.d = n.d left join buoi on buoi.d = n.d order by n.d
$$;

-- Doanh số từng dòng theo người hưởng: thành tiền dòng × tỉ lệ chia, đã chia lại phần giảm giá cả đơn.
create view public.v_doanh_so_dong with (security_invoker = true) as
select d.id as dong_id, h.id as hoa_don_id, h.ngay_hd, h.chi_nhanh_id, d.loai, coalesce(d.dich_vu_id, d.san_pham_id, d.goi_id) as muc_id, d.ten, d.so_luong,
       (d.thanh_tien * case when h.tong_hang > 0 then (h.tong_hang - h.giam_gia_don)::numeric / h.tong_hang else 0 end) as doanh_so
  from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id where h.trang_thai = 'hoan_thanh';

create function public.bc_nhan_vien(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, vai text, so_dong int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  select c.nhan_vien_id, c.vai, count(*)::int, round(sum(v.doanh_so * c.ti_le / 100))::bigint,
         round(sum(v.doanh_so * c.ti_le / 100 * coalesce((select r.ti_le from public.hoa_hong_ti_le r where r.loai = v.loai and r.vai = c.vai and r.muc_id = v.muc_id),
                                                         (select r.ti_le from public.hoa_hong_ti_le r where r.loai = v.loai and r.vai = c.vai and r.muc_id is null), 0) / 100))::bigint
    from public.dong_nhan_vien c join public.v_doanh_so_dong v on v.dong_id = c.dong_id
   where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
   group by c.nhan_vien_id, c.vai
$$;

create function public.bc_muc_ban(p_tu date, p_den date, p_cn uuid default null)
returns table (loai text, muc_id uuid, ten text, so_luong bigint, doanh_so bigint)
language sql stable as $$
  select v.loai, v.muc_id, min(v.ten), sum(v.so_luong)::bigint, round(sum(v.doanh_so))::bigint
    from public.v_doanh_so_dong v where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
   group by v.loai, v.muc_id order by 5 desc
$$;

select public.khoa_tat_ca_bang();
