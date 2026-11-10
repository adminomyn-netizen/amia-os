-- 0322 — QUY TRÌNH TỪNG BƯỚC CỦA DỊCH VỤ + CHUYÊN VIÊN TÍCH BƯỚC KHI LÀM (chị Lâm / chị Diệu Thuý 10/11/2026).
-- Quy trình chốt: thu ngân lên đơn → chuyên viên trị liệu xác nhận (Bắt đầu làm) → làm bước nào tích bước đó → Kết thúc khi trả khách.
-- Nguồn bước: sheet Lark "MSC26 - Quy trình dịch vụ Trị Liệu 2026" (BzwPsgvfkhh01dtHtpSjwDc5pLf), nạp bằng scripts/thu/nap-buoc-quy-trinh.mjs.
-- CHỈ THÊM 3 bảng mới: không sửa bảng cũ, không đụng tiền / sổ cái / định mức / phiếu vật tư (phiếu vật tư theo buổi giữ nguyên như cũ).
-- Vật tư từng bước hiện chỉ là GỢI Ý CHỮ chép từ sheet (goi_y_vat_tu), chưa nối san_pham, chưa trừ kho: chờ chị Dung chốt định mức theo bước.
set lock_timeout = '4s';

-- Bước chuẩn (đã gộp tên trùng: "Tẩy trang" / "Tẩy trang sạch mặt" → một bước). dung_chung = bước nhiều dịch vụ dùng (tẩy trang, rửa mặt…).
create table public.buoc_quy_trinh (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (char_length(btrim(ten)) between 1 and 200),
  khoa text not null unique,
  dung_chung boolean not null default false,
  goi_y_vat_tu text check (goi_y_vat_tu is null or char_length(goi_y_vat_tu) <= 1000),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

-- Dịch vụ → các bước theo thứ tự làm. goi_y_vat_tu riêng của dịch vụ (vd mặt nạ khác nhau), không có thì dùng gợi ý của bước chuẩn.
create table public.dich_vu_buoc (
  dich_vu_id uuid not null references public.dich_vu (id) on delete cascade,
  buoc_id uuid not null references public.buoc_quy_trinh (id),
  thu_tu smallint not null check (thu_tu between 1 and 200),
  goi_y_vat_tu text check (goi_y_vat_tu is null or char_length(goi_y_vat_tu) <= 1000),
  nguon text,
  primary key (dich_vu_id, buoc_id)
);
create index dich_vu_buoc_buoc_idx on public.dich_vu_buoc (buoc_id);

-- Bước đã tích của MỘT khách trong MỘT ngày: khách làm nhiều dịch vụ (nhiều thẻ) cùng lúc thì bước chung (tẩy trang…) chỉ tích một lần.
-- luot_ids = các lượt Khách chờ làm (buoi_cho_lam) đang mở lúc tích, để biết bước thuộc lượt nào. Bỏ tích = xoá dòng.
create table public.luot_buoc (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  ngay date not null default public.hom_nay(),
  buoc_id uuid not null references public.buoc_quy_trinh (id),
  luot_ids uuid[] not null default '{}',
  ghi_chu text check (ghi_chu is null or char_length(ghi_chu) <= 300),
  xong_boi uuid references public.nhan_vien (id),
  xong_luc timestamptz not null default now(),
  unique (khach_id, ngay, buoc_id)
);
create index luot_buoc_ngay_idx on public.luot_buoc (chi_nhanh_id, ngay);

reset lock_timeout;
select public.khoa_tat_ca_bang();
