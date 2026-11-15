-- 0332 — DỊCH VỤ EXION HIỆN Ở ĐẶT LỊCH (quản lý cơ sở 15/11/2026: "đặt lịch không thấy dịch vụ Exion, tất cả các loại").
-- Gốc: EXION chỉ có trong danh mục THẺ (9 gói liệu trình goi_the loai 'lan', chưa gắn dịch vụ); bảng dich_vu không có dòng EXION nào,
-- mà ô chọn dịch vụ của Đặt lịch chỉ đọc dich_vu → không bao giờ thấy EXION.
-- Sửa: mỗi gói EXION một dịch vụ MANG ĐÚNG TÊN GÓI, y như dichVuCuaGoi (src/lib/dich-vu-theo-the.ts) tự tạo khi làm buổi thẻ:
--   nhóm "DỊCH VỤ THEO THẺ", đơn vị "buổi", giá 0 (doanh thu buổi vẫn lấy theo thẻ), thời lượng = thời gian 1 lần của gói.
--   Khác duy nhất: noi_hien_thi = 'dat_lich' (hiện ở Đặt lịch nội bộ, KHÔNG hiện ở Thu ngân → không bán lẻ được với giá 0);
--   dat_online = false → không lên trang đặt lịch công khai /dat-lich.
--   Thu ngân làm buổi "chính thẻ" EXION sẽ tìm thấy đúng dịch vụ này theo tên (không tạo trùng).
--   KHÔNG thêm goi_the_dich_vu (thêm vào thì dịch vụ khác thu ngân chọn tay cho thẻ đó bị chặn khi Kết thúc — xem ghi chú dich-vu-theo-the.ts).
-- Chỉ thêm dòng danh mục: không đụng thẻ, buổi, sổ cái, hoá đơn, tiền. Chạy lại nhiều lần không tạo trùng (bỏ qua gói đã có dịch vụ cùng tên).
set lock_timeout = '4s';

do $$
declare g record; v_nhom uuid; v_ma text; v_so bigint; v_phut int;
begin
  select id into v_nhom from public.dich_vu_nhom where ten = 'DỊCH VỤ THEO THẺ' order by thu_tu limit 1;
  if v_nhom is null then
    insert into public.dich_vu_nhom (ten, thu_tu)
    values ('DỊCH VỤ THEO THẺ', coalesce((select max(thu_tu) from public.dich_vu_nhom where thu_tu < 900), 0) + 1)
    returning id into v_nhom;
  end if;
  for g in
    select x.id, btrim(x.ten) as ten, x.thoi_gian_1_lan_phut from public.goi_the x
     where x.loai = 'lan' and x.hoat_dong and x.ten ~* 'exion'
       and not exists (select 1 from public.goi_the_dich_vu l where l.goi_id = x.id)
       and not exists (select 1 from public.dich_vu d where d.ten = btrim(x.ten))
     order by x.ten
  loop
    loop
      v_so := public.so_tiep_theo('dich_vu');
      v_ma := 'DV' || lpad(v_so::text, 6, '0');
      exit when not exists (select 1 from public.dich_vu where ma = v_ma);
    end loop;
    v_phut := case when coalesce(g.thoi_gian_1_lan_phut, 0) between 1 and 1440 then g.thoi_gian_1_lan_phut else 60 end;
    insert into public.dich_vu (ma, nhom_id, ten, don_vi_tinh, thoi_luong_phut, gia, hoat_dong, noi_hien_thi, dat_online, mo_ta)
    values (v_ma, v_nhom, g.ten, 'buổi', v_phut, 0, true, 'dat_lich', false,
            'Tạo 15/11/2026 để đặt lịch được thẻ "' || g.ten || '" (gói chưa gắn dịch vụ). Giá 0, chỉ hiện ở Đặt lịch; doanh thu buổi lấy theo thẻ.');
  end loop;
end $$;

reset lock_timeout;
