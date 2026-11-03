-- 0204 — (câu 14) Một lịch hẹn nhiều khách như SalonHero (booking_group_members): Khách 1 là khách chính của lịch (lich_hen.khach_id + lich_hen_dich_vu + nhan_vien_id + phong),
--        Khách 2, 3… lưu ở bảng này: tên gọi, (tuỳ chọn) khách hàng, dịch vụ, người thực hiện, chỗ, thời lượng.
-- Thanh toán: MỘT hoá đơn cho cả nhóm, gắn khách chính (SalonHero createOrderBooking; 476/481 lịch nhiều khách có đúng 1 hoá đơn). lich_hen.so_khach = 1 + số dòng ở đây.
-- Chỉ thêm bảng mới.
create table if not exists public.lich_hen_khach (
  id uuid primary key default gen_random_uuid(),
  lich_id uuid not null references public.lich_hen (id) on delete cascade,
  thu_tu integer not null check (thu_tu between 2 and 50),
  ten text not null check (length(trim(ten)) between 1 and 80),
  khach_id uuid references public.khach_hang (id) on delete set null,
  dich_vu_ids uuid[] not null default '{}',
  nhan_vien_id uuid references public.nhan_vien (id) on delete set null,
  phong text check (phong is null or length(phong) <= 80),
  thoi_luong_phut integer check (thoi_luong_phut is null or thoi_luong_phut between 5 and 600),
  tao_luc timestamptz not null default now(),
  unique (lich_id, thu_tu)
);
comment on table public.lich_hen_khach is 'Khách 2, 3… của một lịch hẹn nhiều khách (SalonHero booking_group_members). Khách 1 = khách chính của lịch. Hoá đơn: một hoá đơn cho cả nhóm, gắn khách chính.';
create index if not exists idx_fk_lich_hen_khach_lich_id on public.lich_hen_khach (lich_id);
create index if not exists idx_fk_lich_hen_khach_khach_id on public.lich_hen_khach (khach_id);
create index if not exists idx_fk_lich_hen_khach_nhan_vien_id on public.lich_hen_khach (nhan_vien_id);

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
