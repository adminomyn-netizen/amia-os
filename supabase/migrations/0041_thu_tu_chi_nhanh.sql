-- Thứ tự hiển thị chi nhánh: AMIA Vinh đứng đầu (chị Lâm 27/10), các chi nhánh khác sau; sửa được ở Danh mục > Chi nhánh.
alter table public.chi_nhanh add column if not exists thu_tu int not null default 100;
update public.chi_nhanh set thu_tu = 1 where ma = 'VINH';
update public.chi_nhanh set thu_tu = 2 where ma = 'DALAT';
