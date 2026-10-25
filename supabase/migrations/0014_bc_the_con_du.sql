-- 0014 — Báo cáo "thẻ còn dư" tính trong DB (API chỉ trả tối đa 1.000 dòng; có hơn 12.000 thẻ sau khi chuyển từ SalonHero nên cộng ở trang web sẽ sai âm thầm).
-- Thẻ không giới hạn buổi (so_buoi_tong >= 999999, từ SalonHero) tách riêng, không cộng vào "buổi chưa làm".
create function public.bc_the_con_du(p_cn uuid default null)
returns table (so_the_lan int, so_buoi bigint, gia_tri_buoi bigint, so_the_khong_gioi_han int, so_the_tien int, du_tien bigint)
language sql stable as $$
  select count(*) filter (where loai = 'lan' and so_buoi_tong < 999999)::int,
         coalesce(sum(so_buoi_con) filter (where loai = 'lan' and so_buoi_tong < 999999), 0)::bigint,
         coalesce(sum(so_buoi_con::bigint * gia_tri_buoi) filter (where loai = 'lan' and so_buoi_tong < 999999), 0)::bigint,
         count(*) filter (where loai = 'lan' and so_buoi_tong >= 999999)::int,
         count(*) filter (where loai = 'tien')::int,
         coalesce(sum(so_du_tien) filter (where loai = 'tien'), 0)::bigint
    from public.v_the_khach
   where tinh_trang in ('hoat_dong', 'sap_het') and (p_cn is null or chi_nhanh_id = p_cn)
$$;
select public.khoa_tat_ca_bang();
