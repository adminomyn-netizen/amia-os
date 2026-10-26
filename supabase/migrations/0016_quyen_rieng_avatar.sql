-- 0016 — Vai trò Giám đốc; phân quyền theo từng người (Kỹ thuật chỉnh); ảnh đại diện; buộc đổi mật khẩu mặc định.
alter table public.nhan_vien drop constraint if exists nhan_vien_vai_tro_check;
alter table public.nhan_vien add constraint nhan_vien_vai_tro_check
  check (vai_tro in ('ky_thuat','chu','giam_doc','quan_ly','le_tan','thu_ngan','tu_van','bac_si','ktv','thu_kho','ke_toan','marketing','nha_dau_tu'));

-- null = theo quyền mặc định của vai trò; có giá trị = đúng danh sách này (Kỹ thuật đặt).
alter table public.nhan_vien add column if not exists quyen_rieng text[];
-- Ảnh đại diện nhỏ (JPEG ≤ 256px, dạng data URL) do chính người dùng tải lên.
alter table public.nhan_vien add column if not exists anh_dai_dien text check (anh_dai_dien is null or length(anh_dai_dien) <= 120000);
-- Tài khoản dùng mật khẩu do người khác đặt (VD 12345678) phải đổi ở lần đăng nhập đầu.
alter table public.nhan_vien add column if not exists phai_doi_mat_khau boolean not null default false;
select public.khoa_tat_ca_bang();
