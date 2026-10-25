-- 0003 — DANH MỤC: sản phẩm/vật tư, gói thẻ (liệu trình / thẻ tiền).
create table public.san_pham (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  nhom text,
  -- Nhóm cấp vật tư (quy trình cấp trước ca): A đắt/đếm được · B chai dùng chung · C rẻ/khó đếm.
  nhom_cap text check (nhom_cap in ('A','B','C')),
  don_vi text not null,               -- đơn vị DÙNG/CẤP (ml, shot, cái, ...)
  don_vi_mua text,                    -- đơn vị MUA (chai, hộp, ...)
  he_so_quy_doi numeric(14,4) not null default 1 check (he_so_quy_doi > 0),   -- 1 đơn vị mua = ? đơn vị dùng
  gia_nhap_don_vi numeric(18,4) check (gia_nhap_don_vi is null or gia_nhap_don_vi >= 0), -- giá vốn / 1 đơn vị DÙNG
  gia_ban bigint not null default 0 check (gia_ban >= 0),
  ban_le boolean not null default false,
  tieu_hao boolean not null default false,
  theo_doi_kho boolean not null default true,
  ton_toi_thieu numeric(14,3) not null default 0,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.goi_the (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  loai text not null check (loai in ('lan','tien')),
  gia bigint not null check (gia >= 0),               -- giá bán
  so_buoi int,                                          -- thẻ LẦN: BẮT BUỘC có số buổi
  gia_tri_the bigint,                                   -- thẻ TIỀN: số dư được nạp (có thể > giá khi khuyến mãi)
  han_dung_ngay int check (han_dung_ngay is null or han_dung_ngay > 0),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now(),
  constraint goi_the_lan_can_so_buoi check (loai <> 'lan' or (so_buoi is not null and so_buoi > 0)),
  constraint goi_the_tien_can_gia_tri check (loai <> 'tien' or (gia_tri_the is not null and gia_tri_the > 0))
);

create table public.goi_the_dich_vu (
  goi_id uuid not null references public.goi_the (id) on delete cascade,
  dich_vu_id uuid not null references public.dich_vu (id),
  la_tang boolean not null default false,
  primary key (goi_id, dich_vu_id)
);

-- Hạng khách TỰ TÍNH theo tổng chi 12 tháng (không còn gõ tay như tag).
create table public.hang_khach (
  ten text primary key,
  tu_so_tien bigint not null unique check (tu_so_tien >= 0),
  thu_tu int not null unique
);
insert into public.hang_khach (ten, tu_so_tien, thu_tu) values
  ('Thường', 0, 1), ('Bạc', 10000000, 2), ('Vàng', 30000000, 3), ('Bạch kim', 100000000, 4), ('Kim cương', 300000000, 5);
