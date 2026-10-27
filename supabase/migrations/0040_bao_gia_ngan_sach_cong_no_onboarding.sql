-- 0040 — BÁO GIÁ ĐƠN MUA, NGÂN SÁCH KỲ, CÔNG NỢ KHÁCH THEO TUỔI NỢ, ONBOARDING THỬ VIỆC, CẢNH BÁO MỚI.
--  * Đơn mua từ 20 triệu cần 2 báo giá, từ 30 triệu cần 3 (ngưỡng ở quy_tac_duyet); thiếu thì phải có lý do ngoại lệ.
--  * Ngân sách theo tháng × chi nhánh × phân loại chi; chỉ cảnh báo khi đã chi vượt (không cảnh báo mốc 80%).
--  * Công nợ khách: 6 nhóm tuổi nợ tính từ ngày kế tiếp ngày đến hạn; khiếu nại thì chuyển "tranh chấp", không tự xoá nợ.
--  * Onboarding: các mốc 0/7/30/60 ngày kể từ ngày vào làm.

alter table public.thong_bao_trang_thai drop constraint thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld'));

-- Báo giá
alter table public.don_mua add column ly_do_ngoai_le_bao_gia text;
create table public.bao_gia_don_mua (
  id uuid primary key default gen_random_uuid(),
  don_mua_id uuid not null references public.don_mua (id) on delete cascade,
  ncc_id uuid not null references public.nha_cung_cap (id),
  tong_tien bigint not null check (tong_tien > 0),
  ghi_chu text,
  link_file text check (link_file is null or link_file ~ '^https?://'),
  duoc_chon boolean not null default false,
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  unique (don_mua_id, ncc_id)
);
create unique index bao_gia_mot_duoc_chon on public.bao_gia_don_mua (don_mua_id) where duoc_chon;

-- Ngân sách kỳ
create table public.ngan_sach_ky (
  id uuid primary key default gen_random_uuid(),
  thang text not null check (thang ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  loai_thu_chi_id uuid not null references public.loai_thu_chi (id),
  so_tien bigint not null check (so_tien >= 0),
  ghi_chu text,
  nguoi_id uuid not null references public.nhan_vien (id),
  cap_nhat_luc timestamptz not null default now()
);
create unique index ngan_sach_ky_duy_nhat on public.ngan_sach_ky (thang, coalesce(chi_nhanh_id, '00000000-0000-0000-0000-000000000000'::uuid), loai_thu_chi_id);

-- Công nợ khách: trạng thái xử lý theo từng hoá đơn còn nợ
create table public.cong_no_khach_xu_ly (
  hoa_don_id uuid primary key references public.hoa_don (id),
  trang_thai text not null check (trang_thai in ('dang_nhac', 'da_cam_ket', 'tranh_chap')),
  nguoi_phu_trach_id uuid references public.nhan_vien (id),
  hen_tra date,
  ghi_chu text,
  nguoi_id uuid not null references public.nhan_vien (id),
  cap_nhat_luc timestamptz not null default now()
);

-- Onboarding
create table public.onboarding_muc (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  sau_ngay int not null check (sau_ngay between 0 and 365),
  thu_tu int not null default 0,
  hoat_dong boolean not null default true
);
insert into public.onboarding_muc (ten, sau_ngay, thu_tu) values
  ('Ký hợp đồng thử việc và nhận hồ sơ', 0, 1),
  ('Cấp tài khoản AMIA OS và phân quyền', 0, 2),
  ('Hướng dẫn nội quy, quy trình, chấm công', 3, 3),
  ('Đánh giá tuần đầu', 7, 4),
  ('Đánh giá 30 ngày', 30, 5),
  ('Đánh giá 60 ngày, quyết định lên chính thức', 60, 6);
create table public.onboarding_tien_do (
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  muc_id uuid not null references public.onboarding_muc (id),
  xong_luc timestamptz not null default now(),
  nguoi_id uuid not null references public.nhan_vien (id),
  ghi_chu text,
  primary key (nhan_vien_id, muc_id)
);

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('no_khach.han_ngay', '20', 'Số ngày từ ngày hoá đơn đến hạn tất toán công nợ khách (theo PL11.0). CHỜ XÁC NHẬN.')
on conflict (khoa) do nothing;

select public.khoa_tat_ca_bang();
