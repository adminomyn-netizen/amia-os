-- Chị Lâm 16/11/2026: "check xem còn trường hợp nào chưa gắn bên Vinh nữa". Sau 0335 (khách/nhân viên về Vinh) còn sót:
--   • thẻ còn dùng (hoat_dong, khoa) gắn Đà Lạt → nhân viên Vinh không trừ buổi / khoá / gia hạn được (kiểm phạm vi chi nhánh)
--   • nhắc chăm sóc 'dang_nhac' đã quá ngày nhắc (0335 chỉ chuyển nhắc từ hôm nay trở đi) → Vinh không thấy, không xử lý được
-- Giữ Đà Lạt: hoá đơn, lịch hẹn cũ, thẻ đã thu hồi, nhắc đã xong/huỷ, điểm, kho, quỹ (số liệu lịch sử). Sao lưu: sao-luu/db-20261116-1411-bang-con-lai-da-lat-16-11.
do $$
declare d uuid; v uuid;
begin
  select id into d from public.chi_nhanh where ma = 'DALAT';
  select id into v from public.chi_nhanh where ma = 'VINH';
  update public.the_khach set chi_nhanh_id = v where chi_nhanh_id = d and trang_thai in ('hoat_dong', 'khoa');
  update public.khach_nhac set chi_nhanh_id = v where chi_nhanh_id = d and trang_thai = 'dang_nhac';
end $$;
