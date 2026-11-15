-- ĐÓNG HẲN CHI NHÁNH ĐÀ LẠT (chị Lâm 15/11/2026: "Giờ tất cả đẩy về Vinh hết em nha không còn Đà Lạt nữa khoá Đà Lạt luôn ko cho sử dụng gắn nữa vì đã dừng hoạt động nhưng giữ lại để khớp số liệu").
-- • Khách, nhân viên, nhắc chăm sóc CÒN CHỜ → Vinh. Hoá đơn, lịch hẹn, thẻ, sổ quỹ, kho cũ GIỮ NGUYÊN Đà Lạt (khớp số liệu báo cáo).
-- • Bỏ gán thêm chi nhánh Đà Lạt; Đà Lạt ngừng hoạt động + tắt đặt lịch online.
-- • Chặn ở DB: không tạo mới / không đổi sang một chi nhánh đã ngừng hoạt động (sửa dòng cũ giữ nguyên chi nhánh vẫn được).
-- Sao lưu trước: sao-luu/db-20261115-1429-bang-dong-cua-da-lat-15-11 + …-nhac-15-11.
do $$ declare d uuid; v uuid; begin
  select id into d from public.chi_nhanh where ma = 'DALAT';
  select id into v from public.chi_nhanh where ma = 'VINH';
  if d is null or v is null then return; end if;
  update public.khach_hang set chi_nhanh_id = v where chi_nhanh_id = d;
  update public.nhan_vien set chi_nhanh_id = v where chi_nhanh_id = d;
  delete from public.nhan_vien_chi_nhanh where chi_nhanh_id = d;
  update public.khach_nhac set chi_nhanh_id = v where chi_nhanh_id = d and hoan_thanh_luc is null and ngay_nhac >= current_date;
  update public.chi_nhanh set hoat_dong = false, hien_dat_lich = false where id = d;
end $$;

create or replace function public.chan_chi_nhanh_ngung() returns trigger language plpgsql as $$
begin
  if new.chi_nhanh_id is not null and (tg_op = 'INSERT' or new.chi_nhanh_id is distinct from old.chi_nhanh_id)
     and exists (select 1 from public.chi_nhanh c where c.id = new.chi_nhanh_id and not c.hoat_dong) then
    raise exception 'Chi nhánh này đã ngừng hoạt động, không gắn thêm được. Chọn chi nhánh đang hoạt động.' using errcode = 'P0001';
  end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['khach_hang','nhan_vien','nhan_vien_chi_nhanh','lich_hen','hoa_don','the_khach','buoi_cho_lam','khach_nhac','phieu_tu_van','lead'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists trg_chan_chi_nhanh_ngung on public.%I', t);
      execute format('create trigger trg_chan_chi_nhanh_ngung before insert or update of chi_nhanh_id on public.%I for each row execute function public.chan_chi_nhanh_ngung()', t);
    end if;
  end loop;
end $$;
