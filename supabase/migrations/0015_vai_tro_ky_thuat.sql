-- 0015 — Vai trò Kỹ thuật: nắm toàn hệ thống, kể cả tài khoản và phân quyền.
alter table public.nhan_vien drop constraint if exists nhan_vien_vai_tro_check;
alter table public.nhan_vien add constraint nhan_vien_vai_tro_check
  check (vai_tro in ('ky_thuat','chu','quan_ly','le_tan','thu_ngan','tu_van','bac_si','ktv','thu_kho','ke_toan','marketing','nha_dau_tu'));
select public.khoa_tat_ca_bang();
