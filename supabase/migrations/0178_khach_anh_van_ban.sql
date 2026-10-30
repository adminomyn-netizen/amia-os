-- Chữ đọc được trong ảnh khách (phiếu, phác đồ, giấy ghi tay) bằng OCR trên máy: scripts/nhap-salonhero/anh-doc-chu.mjs.
-- van_ban_luc có giá trị = đã quét (dù ảnh không có chữ thì van_ban để null); chưa quét thì van_ban_luc null.
alter table public.khach_anh add column if not exists van_ban text;
alter table public.khach_anh add column if not exists van_ban_luc timestamptz;
create index if not exists khach_anh_chua_quet_idx on public.khach_anh (id) where van_ban_luc is null;
create index if not exists khach_anh_co_chu_idx on public.khach_anh (khach_id) where van_ban is not null;
select public.khoa_tat_ca_bang();
