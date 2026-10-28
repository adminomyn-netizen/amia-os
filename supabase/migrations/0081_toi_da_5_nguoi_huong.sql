-- 0081 — Mỗi dòng hàng tối đa 5 người hưởng cho MỖI vai (phục vụ / tư vấn / bán), như SalonHero.
-- dong_nhan_vien đã cho nhiều người mỗi vai (khoá chính dong_id + nhan_vien_id + vai, chia tỉ lệ cộng đủ 100 khi chốt). Thêm trần 5 ở DB để máy chủ khác hay nhập tay cũng không vượt.
-- Chỉ chặn thêm dòng mới (đơn nháp): dữ liệu lịch sử chuyển từ SalonHero không bị đụng tới.
create function public.trg_dong_nv_toi_da_5() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.dong_nhan_vien where dong_id = new.dong_id and vai = new.vai) >= 5 then
    raise exception 'Mỗi dòng hàng chỉ có tối đa 5 người hưởng cho mỗi vai' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger dong_nhan_vien_toi_da_5 before insert on public.dong_nhan_vien
  for each row execute function public.trg_dong_nv_toi_da_5();

select public.khoa_tat_ca_bang();
