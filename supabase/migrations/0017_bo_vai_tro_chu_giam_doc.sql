-- 0017 — Bỏ vai trò Chủ và Giám đốc: cao nhất là Quản lý / Leader (Kỹ thuật vẫn nắm riêng phân quyền hệ thống).
-- Tài khoản đang là Chủ/Giám đốc chuyển thành Quản lý (cùng bộ quyền nghiệp vụ). Danh sách quyền riêng (nếu có) giữ nguyên.
update public.nhan_vien set vai_tro = 'quan_ly' where vai_tro in ('chu', 'giam_doc');
alter table public.nhan_vien drop constraint if exists nhan_vien_vai_tro_check;
alter table public.nhan_vien add constraint nhan_vien_vai_tro_check
  check (vai_tro in ('ky_thuat','quan_ly','le_tan','thu_ngan','tu_van','bac_si','ktv','thu_kho','ke_toan','marketing','nha_dau_tu'));
select public.khoa_tat_ca_bang();
