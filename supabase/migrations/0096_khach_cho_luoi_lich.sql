-- 0096 — TỐI ƯU TỐC ĐỘ LỊCH HẸN (29/10/2026). Chỉ thêm 1 hàm ĐỌC, không đổi bảng/dữ liệu/cách tính.
-- khach_cho_lich(mảng mã khách): trả đúng 6 cột lưới Lịch hẹn cần (id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, hang) cho các khách có lịch trong khoảng đang xem.
-- Trước đây đọc từ view v_khach_hang (4 phép nối cho mỗi khách, tuần 114 lịch ~1,2 giây); hàm này chỉ tính chi tiêu 12 tháng để xếp hạng (cùng luật v_khach_hang.hang): ~12 ms.
set lock_timeout = '4s';

create or replace function public.khach_cho_lich(p_ids uuid[])
returns table (id uuid, ma text, ho_ten text, dien_thoai text, nguoi_phu_trach_id uuid, hang text) language sql stable as $$
  select k.id, k.ma, k.ho_ten, k.dien_thoai, k.nguoi_phu_trach_id,
         (select h.ten from public.hang_khach h
           where h.tu_so_tien::numeric <= greatest(coalesce(c.chi, 0), coalesce((select g.tu_so_tien from public.hang_khach g where g.ten = k.hang_goc), 0)::numeric)
           order by h.tu_so_tien desc limit 1) hang
    from public.khach_hang k
    left join lateral (select sum(greatest(d.tong_hang - d.giam_gia_don, 0)) filter (where d.ngay_hd >= public.hom_nay() - 365) chi
                         from public.hoa_don d
                        where d.khach_id = k.id and d.trang_thai = 'hoan_thanh' and not d.la_so_du_dau) c on true
   where k.id = any(p_ids);
$$;

revoke all on function public.khach_cho_lich(uuid[]) from public, anon, authenticated;
grant execute on function public.khach_cho_lich(uuid[]) to service_role;
