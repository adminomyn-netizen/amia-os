-- 0194 — Danh mục: bù các cột còn thiếu so với SalonHero (rà soát 02/11/2026, mục 4). CHỈ THÊM cột/bảng, có thể chạy lại nhiều lần.
-- Mọi cột mới chỉ LƯU + HIỂN THỊ; chưa nối vào logic bán hàng, hoá đơn, kho (việc nối do Tula/Thu ngân quyết).
-- Ngoại lệ duy nhất đụng ràng buộc cũ: dich_vu_don_vi_tinh_check được MỞ RỘNG (6 đơn vị cũ + 17 đơn vị của SalonHero), dữ liệu cũ không đổi.

-- ───── Dịch vụ ─────
alter table public.dich_vu
  add column if not exists ten_en text check (ten_en is null or char_length(ten_en) <= 200),
  add column if not exists mo_ta text check (mo_ta is null or char_length(mo_ta) <= 2000),
  add column if not exists anh text check (anh is null or char_length(anh) <= 300),           -- đường dẫn trong kho ảnh danh-muc-anh (KHÔNG lưu ảnh nhúng)
  add column if not exists doi_tuong text not null default 'ca_hai' check (doi_tuong in ('ca_hai', 'nam', 'nu')),
  add column if not exists cho_sua_gia boolean not null default false,                         -- "Sửa giá khi thanh toán": mặc định tắt = đúng hành vi thu ngân hiện nay (giá cố định, chỉ giảm giá)
  add column if not exists in_gio_phuc_vu boolean not null default false,                      -- in giờ phục vụ trên hoá đơn
  add column if not exists vat_loai text check (vat_loai is null or vat_loai in ('khong_chiu_thue', 'khong_ke_khai')),  -- null = dùng vat_pct (10/8/5/0)
  add column if not exists noi_hien_thi text not null default 'tat_ca' check (noi_hien_thi in ('tat_ca', 'thu_ngan', 'dat_lich', 'an')),
  add column if not exists chi_nhanh_ids uuid[];                                               -- "Địa điểm cung cấp": null = mọi chi nhánh

alter table public.dich_vu drop constraint if exists dich_vu_don_vi_tinh_check;
alter table public.dich_vu add constraint dich_vu_don_vi_tinh_check check (don_vi_tinh = any (array[
  'buổi', 'vùng', 'shot', 'line', 'lần', 'liệu trình',
  'chuyến', 'khách', 'khoá', 'phòng', 'chỗ', 'ghế', 'giờ', 'phút', 'tháng', 'năm', 'món', 'đĩa', 'gói', 'đêm', 'phần'
]));

-- ───── Sản phẩm ─────
alter table public.san_pham
  add column if not exists anh text check (anh is null or char_length(anh) <= 300),
  add column if not exists nhan_hieu text check (nhan_hieu is null or char_length(nhan_hieu) <= 120),
  add column if not exists ten_en text check (ten_en is null or char_length(ten_en) <= 200),
  add column if not exists mo_ta text check (mo_ta is null or char_length(mo_ta) <= 2000),
  add column if not exists dung_tich numeric(14, 3) check (dung_tich is null or dung_tich >= 0),
  add column if not exists dung_tich_dv text check (dung_tich_dv is null or char_length(dung_tich_dv) <= 20),
  add column if not exists uoc_tinh_1_lan numeric(14, 3) check (uoc_tinh_1_lan is null or uoc_tinh_1_lan >= 0),
  add column if not exists uoc_tinh_1_lan_dv text check (uoc_tinh_1_lan_dv is null or char_length(uoc_tinh_1_lan_dv) <= 20),
  add column if not exists hinh_thuc_nhap text not null default 'mua_dut' check (hinh_thuc_nhap in ('mua_dut', 'ky_gui', 'cam_do', 'khac')),
  add column if not exists cho_sua_gia boolean not null default false,
  add column if not exists noi_hien_thi text not null default 'tat_ca' check (noi_hien_thi in ('tat_ca', 'thu_ngan', 'dat_lich', 'an'));

-- ───── Nhóm thẻ + Loại thẻ (goi_the) ─────
create table if not exists public.goi_the_nhom (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (char_length(btrim(ten)) between 1 and 80),
  mac_dinh boolean not null default false,
  thu_tu integer not null default 100,
  tao_luc timestamptz not null default now()
);
create unique index if not exists goi_the_nhom_ten_uniq on public.goi_the_nhom (lower(btrim(ten)));
create unique index if not exists goi_the_nhom_mac_dinh_uniq on public.goi_the_nhom (mac_dinh) where mac_dinh;
insert into public.goi_the_nhom (ten, mac_dinh, thu_tu) values ('Thẻ thành viên', true, 1) on conflict do nothing;

alter table public.goi_the
  add column if not exists ten_en text check (ten_en is null or char_length(ten_en) <= 200),
  add column if not exists mo_ta text check (mo_ta is null or char_length(mo_ta) <= 2000),
  add column if not exists mau_the text check (mau_the is null or mau_the ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists han_tinh_tu text not null default 'ngay_cap' check (han_tinh_tu in ('ngay_cap', 'ngay_tao')),
  add column if not exists nhom_id uuid references public.goi_the_nhom (id) on delete set null,  -- null = nhóm mặc định "Thẻ thành viên"
  add column if not exists cho_sua_gia boolean not null default false,
  add column if not exists che_do_sua_so text not null default 'co_dinh' check (che_do_sua_so in ('tuy_y', 'tu_dong', 'co_dinh')),  -- số lần / số tiền trong thẻ tại thu ngân: tuỳ ý sửa | tự cập nhật theo giá | cố định
  add column if not exists gia_tri_1_lan bigint check (gia_tri_1_lan is null or gia_tri_1_lan >= 0),
  add column if not exists noi_hien_thi text not null default 'tat_ca' check (noi_hien_thi in ('tat_ca', 'thu_ngan', 'dat_lich', 'an'));
create index if not exists goi_the_nhom_id_idx on public.goi_the (nhom_id);

-- ───── Kho ảnh công khai cho dịch vụ / sản phẩm (ảnh quảng bá, không phải ảnh khách) ─────
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('danh-muc-anh', 'danh-muc-anh', true, 2097152, array['image/jpeg'])
    on conflict (id) do nothing;
  end if;
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
