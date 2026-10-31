-- 0187 — Giờ vào, giờ ra và số khách trên đơn (SalonHero có ở khoảng 40% đơn; đơn không đi qua lịch hẹn thì mất giờ vào/ra).
-- Chỉ thêm cột có mặc định; đơn cũ giữ nguyên (giờ để trống, số khách 1). Không đụng sổ cái hay doanh thu.
alter table public.hoa_don
  add column gio_vao timestamptz,
  add column gio_ra timestamptz,
  add column so_khach int not null default 1 check (so_khach between 1 and 99),
  add constraint hoa_don_gio_ra_sau_gio_vao check (gio_ra is null or gio_vao is null or gio_ra >= gio_vao);

select public.khoa_tat_ca_bang();
