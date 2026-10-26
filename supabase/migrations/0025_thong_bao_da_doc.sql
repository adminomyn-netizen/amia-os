-- 0025 — Chuông thông báo: mỗi nhân viên tự đánh dấu "đã đọc" / "xoá" từng việc đang chờ.
-- Việc đang chờ là số liệu tính sống (vd "151 hoá đơn còn nợ"), không phải bản ghi riêng, nên trạng thái gắn với (nhân viên, loại việc) + nội dung lúc đó (dau_van):
-- khi nội dung đổi (số lượng tăng/giảm) thì việc hiện lại như chưa đọc, tránh giấu mất việc mới phát sinh.
create table public.thong_bao_trang_thai (
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ma text not null check (ma in ('lich', 'phieu', 'the', 'no', 'kho')),
  dau_van text not null,
  trang_thai text not null check (trang_thai in ('da_doc', 'da_xoa')),
  cap_nhat_luc timestamptz not null default now(),
  primary key (nhan_vien_id, ma)
);

select public.khoa_tat_ca_bang();
