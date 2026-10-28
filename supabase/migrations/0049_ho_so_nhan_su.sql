-- 0049 — HỒ SƠ NHÂN SỰ ĐẦY ĐỦ (chị Lâm 28/10/2026: "HR phải ngang hoặc hơn Lark"). Theo bitable HRM-HRIS-01 của MSC (docs/msc-lark/nhan-su-ho-so-cong-luong.md mục 2) và hồ sơ cá nhân bên Omyn.
--  * Hồ sơ riêng tư (CCCD, MST, BHXH/BHYT, ngân hàng, người thân, giấy tờ scan) nằm bảng riêng, chỉ máy chủ đọc; ứng dụng kiểm quyền "hr.hoso" hoặc chính chủ.
--  * Danh mục phòng ban + chức danh; lịch sử điều kiện lương mang thêm chức danh/phòng ban/vị trí/loại thay đổi (lộ trình thăng tiến, Lark 1.6).
--  * Nghỉ việc (Lark 1.8/1.9): phiếu → duyệt → bàn giao → hoàn tất (khoá tài khoản); mỗi người chỉ một phiếu đang chạy.
--  * Vai trò "Nhân sự" (HCNS).
alter table public.nhan_vien drop constraint nhan_vien_vai_tro_check;
alter table public.nhan_vien add constraint nhan_vien_vai_tro_check
  check (vai_tro in ('chu', 'ky_thuat', 'quan_ly', 'nhan_su', 'le_tan', 'thu_ngan', 'tu_van', 'bac_si', 'ktv', 'thu_kho', 'ke_toan', 'marketing', 'nha_dau_tu', 'nhan_vien'));

create table public.phong_ban (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique,
  truong_phong_id uuid references public.nhan_vien (id) on delete set null,
  thu_tu int not null default 0,
  hoat_dong boolean not null default true
);
insert into public.phong_ban (ten, thu_tu) values
  ('Ban Giám đốc', 1), ('Hành chính - Nhân sự', 2), ('Tài chính - Kế toán - Cung ứng', 3), ('Tiếp thị', 4), ('Kinh doanh', 5),
  ('Tư vấn', 6), ('Chuyên môn - Trị liệu', 7), ('Dịch vụ khách hàng', 8), ('Công nghệ thông tin', 9);

create table public.chuc_danh_dm (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique,
  thu_tu int not null default 0,
  hoat_dong boolean not null default true
);
insert into public.chuc_danh_dm (ten, thu_tu) values
  ('Giám đốc', 1), ('Trợ lý Giám đốc', 2), ('Giám đốc chi nhánh', 3), ('Trưởng phòng', 4), ('Trưởng bộ phận', 5), ('Kế toán trưởng', 6), ('Kế toán viên', 7),
  ('Hành chính nhân sự', 8), ('Thủ quỹ', 9), ('Thủ kho', 10), ('Chuyên viên Tuyển dụng', 11), ('Chuyên viên Tiếp thị', 12), ('Nhân viên Sáng tạo nội dung', 13),
  ('Nhân viên Biên tập video', 14), ('Nhân viên Thiết kế', 15), ('Chuyên viên Công nghệ thông tin', 16), ('Trưởng nhóm Telesales', 17), ('Nhân viên Telesales', 18),
  ('Nhân viên CSKH', 19), ('Chuyên viên Tư vấn', 20), ('Nhân viên Tư vấn', 21), ('Bác sĩ da liễu', 22), ('Chuyên viên Trị liệu', 23), ('Kỹ thuật viên', 24),
  ('Lễ tân', 25), ('Thu ngân', 26);

alter table public.nhan_vien
  add column phong_ban_id uuid references public.phong_ban (id) on delete set null,
  add column ngay_nghi_viec date;

alter table public.dieu_kien_luong
  add column chuc_danh text,
  add column phong_ban_id uuid references public.phong_ban (id) on delete set null,
  add column vi_tri text check (vi_tri is null or vi_tri in ('giam_doc', 'truong_phong', 'truong_bo_phan', 'nhan_vien')),
  add column loai_thay_doi text check (loai_thay_doi is null or loai_thay_doi in ('tuyen_moi', 'len_chinh_thuc', 'thang_chuc', 'tang_luong', 'luan_chuyen', 'dieu_chinh', 'khac')),
  add column so_quyet_dinh text;

create table public.nhan_vien_ho_so (
  nhan_vien_id uuid primary key references public.nhan_vien (id) on delete cascade,
  gioi_tinh text check (gioi_tinh is null or gioi_tinh in ('Nam', 'Nữ')),
  ngay_sinh date,
  noi_sinh text,
  que_quan text,
  dan_toc text,
  ton_giao text,
  quoc_tich text,
  tinh_trang_hon_nhan text check (tinh_trang_hon_nhan is null or tinh_trang_hon_nhan in ('Độc thân', 'Đã lập gia đình', 'Đã lập gia đình, có con', 'Khác')),
  dien_thoai_rieng text,
  cccd text,
  ngay_cap_cccd date,
  noi_cap_cccd text,
  ma_so_thue text,
  so_bhxh text,
  so_bhyt text,
  noi_dk_bhyt text,
  dia_chi_thuong_tru text,
  dia_chi_hien_tai text,
  nguoi_than_ten text,
  nguoi_than_quan_he text,
  nguoi_than_dien_thoai text,
  trinh_do text,
  truong text,
  nganh text,
  hinh_thuc_nhan_luong text check (hinh_thuc_nhan_luong is null or hinh_thuc_nhan_luong in ('chuyen_khoan', 'tien_mat')),
  ngan_hang text,
  so_tai_khoan text,
  chu_tai_khoan text,
  ghi_chu text,
  cap_nhat_luc timestamptz not null default now(),
  cap_nhat_boi uuid references public.nhan_vien (id) on delete set null
);

create table public.nhan_vien_than_nhan (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ho_ten text not null,
  quan_he text not null check (quan_he in ('Vợ', 'Chồng', 'Con', 'Cha', 'Mẹ', 'Anh chị em', 'Người giám hộ')),
  ngay_sinh date,
  cccd text,
  phu_thuoc boolean not null default false,
  tao_luc timestamptz not null default now()
);
create index nhan_vien_than_nhan_idx on public.nhan_vien_than_nhan (nhan_vien_id);

create table public.nhan_vien_tai_lieu (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  loai text not null check (loai in (
    'CCCD mặt trước', 'CCCD mặt sau', 'Sơ yếu lý lịch', 'Bằng cấp', 'Hợp đồng lao động', 'Cam kết bảo mật (NDA)', 'Giấy khám sức khoẻ', 'Sổ BHXH',
    'Giấy tờ người phụ thuộc', 'Quyết định điều chỉnh', 'Biên bản nghỉ việc', 'Khác')),
  ten_tep text not null,
  duong_dan text not null unique,
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png')),
  kich_thuoc int not null check (kich_thuoc > 0 and kich_thuoc <= 10485760),
  trang_thai text not null default 'Chờ xác nhận' check (trang_thai in ('Chờ xác nhận', 'Đã xác nhận', 'Cần bổ sung')),
  ghi_chu text,
  tai_boi uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now(),
  da_go boolean not null default false,
  go_luc timestamptz,
  go_boi uuid references public.nhan_vien (id) on delete set null,
  ly_do_go text
);
create index nhan_vien_tai_lieu_idx on public.nhan_vien_tai_lieu (nhan_vien_id) where not da_go;

create table public.nhan_vien_tai_lieu_xem (
  id bigint generated always as identity primary key,
  tai_lieu_id uuid not null references public.nhan_vien_tai_lieu (id) on delete cascade,
  nguoi_id uuid references public.nhan_vien (id) on delete set null,
  luc timestamptz not null default now()
);
create index nhan_vien_tai_lieu_xem_idx on public.nhan_vien_tai_lieu_xem (tai_lieu_id, luc desc);

create table public.nghi_viec (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  loai text not null check (loai in ('dung_han', 'truoc_han')),
  nhom_ly_do text not null check (nhom_ly_do in ('luong_thuong', 'co_hoi_thang_tien', 'dinh_huong', 'doi_moi_truong', 'ap_luc', 'khoi_luong', 'van_hoa', 'ca_nhan', 'khac')),
  ly_do text,
  ngay_lam_cuoi date not null,
  nguoi_nhan_ban_giao_id uuid references public.nhan_vien (id) on delete set null,
  ban_giao_xong boolean not null default false,
  bien_ban_thoa_thuan boolean not null default false,
  cam_ket_bao_mat boolean not null default false,
  khao_sat text,
  trang_thai text not null default 'cho_duyet' check (trang_thai in ('cho_duyet', 'da_duyet', 'tu_choi', 'huy', 'hoan_tat')),
  nguoi_gui_id uuid references public.nhan_vien (id) on delete set null,
  nguoi_duyet_id uuid references public.nhan_vien (id) on delete set null,
  duyet_luc timestamptz,
  ly_do_duyet text,
  hoan_tat_luc timestamptz,
  tao_luc timestamptz not null default now()
);
create unique index nghi_viec_dang_chay_uq on public.nghi_viec (nhan_vien_id) where trang_thai in ('cho_duyet', 'da_duyet');

-- Kho tệp riêng tư cho giấy tờ nhân sự: chỉ PDF/JPG/PNG, tối đa 10 MB, không link công khai; máy chủ cấp link ký tạm 60 giây.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('ho-so-nhan-vien', 'ho-so-nhan-vien', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
    on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];
  end if;
end $$;

select public.khoa_tat_ca_bang();
