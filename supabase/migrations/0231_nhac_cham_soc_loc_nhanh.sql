-- 0231 — Lịch nhắc chăm sóc tải chắc + lọc theo khách (đợt 3, 03/11/2026).
-- Bản 0203 bung mảng ngày của CẢ 60 nghìn nhắc rồi mới lọc khoảng ngày (~1,4s, lúc trưa quá giờ → "Chưa tải được lịch nhắc (hệ thống đang chậm)").
-- Bản này: nhắc không lặp (≈51 nghìn) lọc thẳng ngay_nhac theo chỉ mục; chỉ nhắc lặp (≈9 nghìn) mới bung mảng, và bỏ sớm nhắc có lần đầu sau khoảng xem
-- (ngay_nhac = lần nhắc sớm nhất, đã kiểm 0 ngoại lệ). Thêm p_q: tìm khách theo tên (không dấu) / SĐT / mã như ô "Khách hàng" của SalonHero.
drop function if exists public.nhac_cham_soc_loc(uuid, date, date, text, uuid, integer, integer);
create or replace function public.nhac_cham_soc_loc(
  p_cn uuid default null, p_tu date default null, p_den date default null, p_tt text default null,
  p_phu_trach uuid default null, p_lim integer default 50, p_off integer default 0, p_q text default null
) returns table (id uuid, khach_id uuid, ngay timestamptz, so_lan integer, tong bigint)
language sql stable set search_path = public as $$
  with mien as (
    select case when p_tu is null then '-infinity'::timestamptz else (p_tu::timestamp at time zone 'Asia/Ho_Chi_Minh') end as tu,
           case when p_den is null then 'infinity'::timestamptz else ((p_den + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') end as den,
           nullif(trim(coalesce(p_q, '')), '') as q
  ), khach as (
    select k.id from public.khach_hang k, mien m
     where m.q is not null
       and (k.ho_ten_khong_dau like '%' || public.bo_dau(m.q) || '%' or k.ma ilike '%' || m.q || '%'
            or (length(regexp_replace(m.q, '\D', '', 'g')) >= 3 and k.dien_thoai like '%' || regexp_replace(m.q, '\D', '', 'g') || '%'))
  ), goc as (
    select n.* from public.khach_nhac n, mien m
     where (p_cn is null or n.chi_nhanh_id = p_cn)
       and (p_tt is null or p_tt = '' or n.trang_thai = p_tt)
       and (p_phu_trach is null or n.nguoi_phu_trach_id = p_phu_trach)
       and (m.q is null or n.khach_id in (select id from khach))
       and n.ngay_nhac < m.den
  ), khop as (
    select g.id, g.khach_id, g.ngay_nhac as ngay, 1 as so_lan
      from goc g, mien m
     where (coalesce(g.kieu_lap, 'SINGLE') = 'SINGLE' or jsonb_typeof(g.cac_ngay_nhac) is distinct from 'array')
       and g.ngay_nhac >= m.tu
    union all
    select g.id, g.khach_id, min(t.t) as ngay, jsonb_array_length(g.cac_ngay_nhac) as so_lan
      from goc g cross join mien m
      cross join lateral (select (x #>> '{}')::timestamptz as t from jsonb_array_elements(g.cac_ngay_nhac) x) t
     where coalesce(g.kieu_lap, 'SINGLE') <> 'SINGLE' and jsonb_typeof(g.cac_ngay_nhac) = 'array'
       and t.t >= m.tu and t.t < m.den
     group by g.id, g.khach_id, g.cac_ngay_nhac
  )
  select k.id, k.khach_id, k.ngay, k.so_lan, count(*) over () as tong
  from khop k order by k.ngay, k.id
  limit greatest(1, least(coalesce(p_lim, 50), 200)) offset greatest(0, coalesce(p_off, 0));
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
