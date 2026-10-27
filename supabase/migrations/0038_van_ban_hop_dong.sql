-- 0038 — VĂN BẢN & HỢP ĐỒNG + HỢP ĐỒNG LAO ĐỘNG (theo COS-MKT-03, SALES-PROC-06, HRM-HRIS-01 của MSC).
--  * Một sổ văn bản chung: loại, vòng đời nháp → chờ duyệt → đã duyệt → đã ký → (huỷ / thay thế), hiệu lực, bản điện tử, vị trí bản giấy.
--  * Ngưỡng Giám đốc chi nhánh ký (100 triệu) là THAM SỐ ở bảng cau_hinh, đang ở trạng thái "chờ xác nhận" theo tài liệu MSC.
--  * Đồng ý dùng ảnh: tách "theo dõi điều trị" và "truyền thông" (truyền thông bắt buộc có hạn và phạm vi kênh, rút lại được).
--  * Hợp đồng lao động: chuỗi thử việc → HĐLĐ lần 1 → lần 2 → không xác định thời hạn, nhắc trước 45 ngày khi sắp hết hạn.

create table public.vb_loai (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  nhom text not null check (nhom in ('khach', 'doi_tac', 'noi_bo', 'chinh_sach')),
  thu_tu int not null default 0,
  hoat_dong boolean not null default true
);
insert into public.vb_loai (ma, ten, nhom, thu_tu) values
  ('hd_mua', 'Hợp đồng mua dịch vụ / gói / thẻ', 'khach', 1),
  ('hd_dieu_tri', 'Hợp đồng điều trị', 'khach', 2),
  ('phieu_dong_y_buoi_le', 'Phiếu đồng ý thực hiện (buổi lẻ)', 'khach', 3),
  ('phieu_dong_y_dieu_tri', 'Phiếu đồng ý thăm khám / điều trị', 'khach', 4),
  ('phieu_cam_ket', 'Phiếu cam kết', 'khach', 5),
  ('hd_doi_tac', 'Hợp đồng / PO agency, freelancer, KOL, KOC', 'doi_tac', 1),
  ('hd_ncc', 'Hợp đồng nhà cung cấp', 'doi_tac', 2),
  ('hd_thue', 'Hợp đồng thuê (mặt bằng, thiết bị)', 'doi_tac', 3),
  ('phieu_lam_ngoai', 'Phiếu làm việc bên ngoài', 'noi_bo', 1),
  ('bien_ban', 'Biên bản / tường trình giải trình', 'noi_bo', 2),
  ('quyet_dinh', 'Quyết định', 'noi_bo', 3),
  ('quy_dinh', 'Quy định / quy chế', 'noi_bo', 4),
  ('phu_luc_chinh_sach', 'Phụ lục chính sách (PL11.x)', 'chinh_sach', 1),
  ('de_xuat_gia', 'Đề xuất giá / chính sách bán theo quý', 'chinh_sach', 2);

create table public.van_ban (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  loai_id uuid not null references public.vb_loai (id),
  tieu_de text not null,
  chi_nhanh_id uuid references public.chi_nhanh (id),
  khach_id uuid references public.khach_hang (id),
  ncc_id uuid references public.nha_cung_cap (id),
  nhan_vien_id uuid references public.nhan_vien (id),
  hoa_don_id uuid references public.hoa_don (id),
  gia_tri bigint check (gia_tri is null or gia_tri >= 0),
  nguoi_soan_id uuid not null references public.nhan_vien (id),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  nguoi_ky text,
  ngay_ky date,
  hieu_luc_tu date,
  hieu_luc_den date,
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap', 'cho_duyet', 'da_duyet', 'da_ky', 'huy', 'thay_the')),
  phien_ban int not null default 1,
  thay_the_id uuid references public.van_ban (id),
  link_ban_dien_tu text check (link_ban_dien_tu is null or link_ban_dien_tu ~ '^https?://'),
  vi_tri_ban_giay text,
  dung_tam boolean not null default false,
  ly_do text,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (hieu_luc_tu is null or hieu_luc_den is null or hieu_luc_den >= hieu_luc_tu)
);
create index van_ban_tt_idx on public.van_ban (trang_thai, tao_luc desc);
create index van_ban_khach_idx on public.van_ban (khach_id) where khach_id is not null;

create table public.van_ban_nhat_ky (
  id bigint generated always as identity primary key,
  van_ban_id uuid not null references public.van_ban (id) on delete cascade,
  hanh_dong text not null,
  nguoi_id uuid not null references public.nhan_vien (id),
  ghi_chu text,
  luc timestamptz not null default now()
);
create index van_ban_nhat_ky_idx on public.van_ban_nhat_ky (van_ban_id, id);
create trigger van_ban_nhat_ky_chi_them before update or delete on public.van_ban_nhat_ky for each row execute function public.chi_them_dong();

create table public.consent_anh (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id),
  loai text not null check (loai in ('theo_doi_dieu_tri', 'truyen_thong')),
  pham_vi_kenh text,
  ngay_ky date not null,
  hieu_luc_den date,
  van_ban_id uuid references public.van_ban (id),
  da_rut boolean not null default false,
  rut_luc timestamptz,
  ghi_chu text,
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  check (loai = 'theo_doi_dieu_tri' or (hieu_luc_den is not null and coalesce(btrim(pham_vi_kenh), '') <> '')),
  check (hieu_luc_den is null or hieu_luc_den >= ngay_ky)
);
create index consent_anh_khach_idx on public.consent_anh (khach_id);

-- Hợp đồng lao động: mỗi giai đoạn tối đa một dòng cho mỗi người.
create table public.hd_lao_dong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id),
  giai_doan text not null check (giai_doan in ('thu_viec', 'hdld_1', 'hdld_2', 'kxd')),
  so_hd text,
  tu_ngay date not null,
  den_ngay date,
  link_ban_dien_tu text check (link_ban_dien_tu is null or link_ban_dien_tu ~ '^https?://'),
  ghi_chu text,
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  unique (nhan_vien_id, giai_doan),
  check (giai_doan = 'kxd' and den_ngay is null or giai_doan <> 'kxd' and den_ngay is not null and den_ngay >= tu_ngay)
);

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('van_ban.nguong_gd_chi_nhanh', '100000000', 'Giá trị văn bản trên mức này do Ban Giám đốc duyệt, người gắn với một chi nhánh không duyệt được. CHỜ XÁC NHẬN (tài liệu MSC ghi chưa phải quy định đã chốt).'),
  ('van_ban.nhac_truoc_ngay', '30', 'Nhắc văn bản sắp hết hạn trước bao nhiêu ngày.'),
  ('hd.nhac_truoc_ngay', '45', 'Nhắc hợp đồng lao động sắp hết hạn trước bao nhiêu ngày (theo HRM-HRIS-01).')
on conflict (khoa) do nothing;

select public.khoa_tat_ca_bang();
