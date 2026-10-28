-- 0070 — THỐNG KÊ KHÁCH (như mục "Thống kê khách" của SalonHero), 28/10/2026. Chỉ thêm 1 hàm đọc, không đổi dữ liệu.
-- Một lượt trả mọi con số cho trang /khach-hang/thong-ke: giới tính, nguồn, chi nhánh, tỉnh (10 tỉnh nhiều nhất), nhóm tuổi,
-- khách mới 12 tháng gần nhất (giờ Việt Nam), trạng thái + hạng (theo v_khach_hang), có thẻ đang dùng, đang nợ, có điểm thưởng.

create function public.thong_ke_khach() returns jsonb language sql stable as $$
  with k as (
    select x.id, x.gioi_tinh, x.nguon, x.chi_nhanh_id, x.tinh_thanh, x.ngay_sinh, x.diem_so_du,
           (x.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date as ngay_tao,
           extract(year from age(public.hom_nay(), x.ngay_sinh))::int as tuoi
      from public.khach_hang x),
  v as (select trang_thai, hang, so_the_dang_dung from public.v_khach_hang)
  select jsonb_build_object(
    'tong', (select count(*) from k),
    'gioi_tinh', (select jsonb_object_agg(coalesce(gioi_tinh, 'chua_ro'), n) from (select gioi_tinh, count(*) n from k group by 1) a),
    'nguon', (select jsonb_object_agg(coalesce(nguon, 'chua_ro'), n) from (select nguon, count(*) n from k group by 1) a),
    'chi_nhanh', (select jsonb_object_agg(coalesce(chi_nhanh_id::text, 'chua_ro'), n) from (select chi_nhanh_id, count(*) n from k group by 1) a),
    'tinh', (select jsonb_agg(jsonb_build_object('ten', tinh_thanh, 'so', n) order by n desc) from (select tinh_thanh, count(*) n from k where tinh_thanh is not null group by 1 order by 2 desc limit 10) a),
    'chua_co_tinh', (select count(*) from k where tinh_thanh is null),
    'tuoi', (select jsonb_object_agg(nhom, n) from (
        select case when tuoi is null then 'chua_ro' when tuoi < 18 then 'duoi_18' when tuoi < 25 then '18_24' when tuoi < 35 then '25_34'
                    when tuoi < 45 then '35_44' when tuoi < 55 then '45_54' else 'tu_55' end nhom, count(*) n from k group by 1) a),
    'moi_theo_thang', (select jsonb_agg(jsonb_build_object('thang', to_char(t, 'YYYY-MM'), 'so', (select count(*) from k where date_trunc('month', k.ngay_tao) = t)) order by t)
        from generate_series(date_trunc('month', public.hom_nay()::timestamp) - interval '11 months', date_trunc('month', public.hom_nay()::timestamp), interval '1 month') t),
    'trang_thai', (select jsonb_object_agg(coalesce(trang_thai, 'lead'), n) from (select trang_thai, count(*) n from v group by 1) a),
    'hang', (select jsonb_object_agg(coalesce(hang, 'Chưa xếp'), n) from (select hang, count(*) n from v group by 1) a),
    'co_the', (select count(*) from v where so_the_dang_dung > 0),
    'dang_no', (select count(distinct h.khach_id) from public.hoa_don h where h.trang_thai = 'hoan_thanh' and h.con_no > 0),
    'co_diem', (select count(*) from k where diem_so_du > 0),
    'tong_diem', (select coalesce(sum(diem_so_du), 0) from k where diem_so_du > 0))
$$;

revoke all on function public.thong_ke_khach() from public, anon, authenticated;
grant execute on function public.thong_ke_khach() to service_role;
