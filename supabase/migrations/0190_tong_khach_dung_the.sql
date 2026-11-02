-- 0190 — Ba ô tổng của "Danh sách khách dùng thẻ" (như SalonHero) tính ngay trong DB, không kéo cả nghìn thẻ về máy chủ web.
-- Số khách đang dùng thẻ · tổng số dư thẻ tiền · giá trị các buổi còn lại của thẻ liệu trình (số buổi còn × giá trị buổi).
-- Thẻ liệu trình 'không giới hạn' (so_buoi_tong = 999999) KHÔNG tính vào giá trị buổi còn lại (nhân 999.996 buổi ra số vô nghĩa).
-- Cùng điều kiện lọc với màn hình (chi nhánh, loại thẻ, tình trạng sắp hết / hết hạn 1 tuần / 1 tháng); không gồm ô tìm theo tên.
create or replace function public.tong_khach_dung_the(p_cn uuid, p_loai text, p_tt text, p_hom date) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'so_khach', count(distinct khach_id),
    'tong_tien', coalesce(sum(so_du_tien) filter (where loai = 'tien'), 0),
    'tong_lan', coalesce(sum(coalesce(so_buoi_con, 0) * coalesce(gia_tri_buoi, 0)) filter (where loai <> 'tien' and coalesce(so_buoi_tong, 0) < 999999), 0))
  from public.v_the_khach
  where tinh_trang in ('hoat_dong', 'sap_het', 'khoa')
    and (p_cn is null or chi_nhanh_id = p_cn)
    and (coalesce(p_loai, '') = '' or loai = p_loai)
    and (coalesce(p_tt, '') <> 'sap_het' or tinh_trang = 'sap_het')
    and (coalesce(p_tt, '') not in ('tuan', 'thang') or (han_dung >= p_hom and han_dung <= p_hom + case when p_tt = 'tuan' then 7 else 30 end));
$$;
revoke all on function public.tong_khach_dung_the(uuid, text, text, date) from public, anon, authenticated;
grant execute on function public.tong_khach_dung_the(uuid, text, text, date) to service_role;
