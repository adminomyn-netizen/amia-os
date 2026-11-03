-- 0302 — TỐC ĐỘ: 4 số đầu trang Khách hàng (so_lieu_khach) tính "hôm nay" MỘT lần thay vì 4 lần cho mỗi khách (03/11/2026).
-- Trước: mỗi dòng khách gọi hom_nay() + to_char ×2 → ~0,3 s lúc ấm, >1 s lúc máy bận. Sau: so sánh số nguyên với hằng tính sẵn.
-- Kết quả y hệt: sinh nhật hôm nay = cùng tháng-ngày (MM-DD ⇔ tháng*100+ngày); khách mới hôm nay = tao_luc trong [0h, 24h) giờ VN.
create or replace function public.so_lieu_khach() returns jsonb
language sql stable set search_path = public, pg_temp as $$
  with h as materialized (  -- materialized: tính "hôm nay" đúng 1 lần (không để bộ lập kế hoạch chép biểu thức vào từng dòng)
    select d, (extract(month from d) * 100 + extract(day from d))::int md, extract(month from d)::int th,
           (d::timestamp at time zone 'Asia/Ho_Chi_Minh') tu, ((d + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') den
    from (select public.hom_nay() d) x
  )
  select jsonb_build_object(
    'tong', count(*),
    'moi_hom_nay', count(*) filter (where k.tao_luc >= h.tu and k.tao_luc < h.den),
    'sinh_nhat_hom_nay', count(*) filter (where (extract(month from k.ngay_sinh) * 100 + extract(day from k.ngay_sinh))::int = h.md),
    'sinh_nhat_thang', count(*) filter (where extract(month from k.ngay_sinh)::int = h.th))
  from public.khach_hang k cross join h
$$;
revoke all on function public.so_lieu_khach() from public, anon, authenticated;
grant execute on function public.so_lieu_khach() to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
