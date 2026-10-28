-- 0056 — Ghi chú khách có loại: 'dieu_tri' (ghi chú điều trị, cần quyền hồ sơ) và 'cskh' (ghi chú chăm sóc/gọi điện chuyển từ SalonHero, 141 nghìn dòng).
alter table public.khach_ghi_chu add column loai text not null default 'dieu_tri' check (loai in ('dieu_tri', 'cskh'));
create index khach_ghi_chu_loai_idx on public.khach_ghi_chu (khach_id, loai, tao_luc desc);
select public.khoa_tat_ca_bang();
