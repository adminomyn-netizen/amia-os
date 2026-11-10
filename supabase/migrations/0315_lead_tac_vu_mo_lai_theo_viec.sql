-- 0315 (10/11/2026, QA Hộp Lead): việc ở Nơi làm việc › Việc cần làm được MỞ LẠI (nút "Mở lại" hoặc chấm "Chưa đạt" → dang_lam)
-- thì tác vụ lead gắn với nó cũng mở lại; trước đây chỉ khớp chiều đóng nên tác vụ lead vẫn "Đã xong" trong khi việc đang làm.
-- Đóng / mở lại xuất phát từ Nơi làm việc nay ghi thêm một dòng vào dòng thời gian lead (đóng từ khung lead đã do máy chủ ghi,
-- khi đó dòng tác vụ đã đóng sẵn nên lệnh cập nhật dưới đây không trúng dòng nào → không ghi trùng).
-- Không lặp vô hạn: trigger lead_tac_vu_khop_viec chỉ chạy khi tác vụ chuyển sang xong/huy.
create or replace function public.trg_cong_viec_khop_lead() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare r record;
begin
  if new.trang_thai is distinct from old.trang_thai and new.trang_thai in ('xong', 'huy') then
    for r in
      update public.lead_tac_vu set trang_thai = new.trang_thai, dong_luc = now(), dong_boi = coalesce(dong_boi, new.nguoi_nhan_id)
      where cong_viec_id = new.id and trang_thai = 'mo' returning lead_id, ten
    loop
      insert into public.lead_hoat_dong (lead_id, loai, noi_dung, nguoi_id)
      values (r.lead_id, 'tac_vu', case when new.trang_thai = 'xong' then 'Hoàn thành' else 'Hủy' end || ' tác vụ (ở Việc cần làm): ' || r.ten, case when new.trang_thai = 'xong' then new.nguoi_nhan_id else new.nguoi_giao_id end); -- huỷ do người giao / quản lý
    end loop;
  elsif new.trang_thai is distinct from old.trang_thai and old.trang_thai in ('xong', 'huy') and new.trang_thai in ('moi', 'dang_lam') then
    for r in
      update public.lead_tac_vu set trang_thai = 'mo', dong_luc = null, dong_boi = null
      where cong_viec_id = new.id and trang_thai in ('xong', 'huy') returning lead_id, ten
    loop
      insert into public.lead_hoat_dong (lead_id, loai, noi_dung, nguoi_id)
      values (r.lead_id, 'tac_vu', 'Mở lại tác vụ (ở Việc cần làm): ' || r.ten, new.nguoi_giao_id);
    end loop;
  end if;
  return null;
end $$;
