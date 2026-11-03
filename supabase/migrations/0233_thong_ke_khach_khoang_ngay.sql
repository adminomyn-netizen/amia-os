-- 0233 — Thống kê khách: chọn khoảng ngày cho biểu đồ lượng khách hằng ngày như SalonHero (đợt 3, 03/11/2026).
-- thong_ke_khach_ngay = bản 0193 + p_den (ngày cuối khoảng, mặc định hôm nay) và tối đa 92 ngày; thêm moi_khoang (hồ sơ tạo trong khoảng).
drop function if exists public.thong_ke_khach_ngay(int);
create function public.thong_ke_khach_ngay(p_so_ngay int default 30, p_den date default null) returns jsonb language sql stable as $$
  with p as (select least(coalesce(p_den, public.hom_nay()), public.hom_nay()) as hom, greatest(least(p_so_ngay, 92), 1) as n),
  ngay as (select (p.hom - g)::date as d from p, generate_series(0, (select n from p) - 1) g),
  v as (
    select h.ngay_hd, h.khach_id from public.hoa_don h, p
    where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd > p.hom - p.n and h.ngay_hd <= p.hom
  ),
  le as (select ngay_hd as d, count(*) as so from v where khach_id is null group by ngay_hd),
  co as (select ngay_hd as d, khach_id from v where khach_id is not null group by ngay_hd, khach_id),
  den as (select d, count(*) as so from co group by d),
  moi as (
    select c.d, count(*) as so from co c
    where not exists (select 1 from public.hoa_don h2 where h2.khach_id = c.khach_id and h2.trang_thai = 'hoan_thanh' and not h2.la_so_du_dau and h2.ngay_hd < c.d)
    group by c.d
  )
  select jsonb_build_object(
    'ngay', coalesce((select jsonb_agg(jsonb_build_object(
        'ngay', n.d, 'le', coalesce(l.so, 0), 'moi', coalesce(m.so, 0), 'cu', greatest(coalesce(e.so, 0) - coalesce(m.so, 0), 0), 'tong', coalesce(l.so, 0) + coalesce(e.so, 0)) order by n.d)
      from ngay n left join le l on l.d = n.d left join den e on e.d = n.d left join moi m on m.d = n.d), '[]'::jsonb),
    -- Khách mới trong tuần: hồ sơ khách tạo trong 7 ngày gần nhất (hôm nay trừ 6 ngày), cùng cách tính với ô "Khách hàng mới hôm nay".
    'moi_tuan', (select count(*) from public.khach_hang k, p where k.tao_luc >= ((p.hom - 6)::timestamp at time zone 'Asia/Ho_Chi_Minh') and k.tao_luc < ((p.hom + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')),
    -- Khách mới trong khoảng ngày đang xem (hồ sơ tạo trong khoảng).
    'moi_khoang', (select count(*) from public.khach_hang k, p where k.tao_luc >= ((p.hom - p.n + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') and k.tao_luc < ((p.hom + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')));
$$;
revoke all on function public.thong_ke_khach_ngay(int, date) from public, anon, authenticated;
grant execute on function public.thong_ke_khach_ngay(int, date) to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
