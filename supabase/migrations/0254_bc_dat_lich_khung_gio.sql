-- 0254 — Thống kê đặt lịch: khách hay đặt vào KHUNG GIỜ nào (biểu đồ theo giờ như SalonHero), đợt 3 03/11/2026.
-- Đếm lịch hẹn theo giờ bắt đầu (giờ Việt Nam), cùng điều kiện lọc ngày / chi nhánh với bc_dat_lich. Chỉ đọc.
create or replace function public.bc_dat_lich_khung_gio(p_tu date, p_den date, p_cn uuid default null)
returns table (gio integer, so_lich integer, hoan_thanh integer, huy integer)
language sql stable set search_path = public, pg_temp as $$
  select extract(hour from l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::int, count(*)::int,
         count(*) filter (where l.trang_thai = 'hoan_thanh')::int, count(*) filter (where l.trang_thai = 'huy')::int
    from public.lich_hen l
   where l.bat_dau >= (p_tu::timestamp at time zone 'Asia/Ho_Chi_Minh') and l.bat_dau < ((p_den + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')
     and (p_cn is null or l.chi_nhanh_id = p_cn)
   group by 1 order by 1
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
