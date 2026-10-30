-- 0184 — Số hội thoại Pancake theo ngày × thẻ dịch vụ / giai đoạn / nguồn / nhân viên (phiên Trợ Lý MKT chốt cột 30/10/2026, việc 61902).
-- Phiên Trợ Lý đổ vào bằng upsert theo (ngay, loai, khoa); chỉ đếm, KHÔNG chứa số điện thoại. Ngày theo giờ Việt Nam.
-- khoa = tên thẻ (the_dich_vu, giai_doan, nguon) hoặc mã nhân viên Pancake (nhan_vien).
create table public.mkt_chat_ngay (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  loai text not null check (loai in ('the_dich_vu', 'giai_doan', 'nguon', 'nhan_vien')),
  khoa text not null,
  hoi_thoai int not null default 0 check (hoi_thoai >= 0),
  co_sdt int not null default 0 check (co_sdt >= 0),
  phan_hoi_trung_vi_giay int check (phan_hoi_trung_vi_giay is null or phan_hoi_trung_vi_giay >= 0),
  bo_lo int check (bo_lo is null or bo_lo >= 0),
  tao_luc timestamptz not null default now(),
  unique (ngay, loai, khoa)
);

create index mkt_chat_ngay_ngay_idx on public.mkt_chat_ngay (ngay desc);

select public.khoa_tat_ca_bang();
