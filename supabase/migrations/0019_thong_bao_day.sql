-- 0019 — Thông báo đẩy (Web Push): mỗi thiết bị/trình duyệt của một nhân viên là một "đăng ký".
-- endpoint là địa chỉ riêng do trình duyệt cấp (duy nhất); p256dh + auth là khoá mã hoá của thiết bị đó. Chỉ máy chủ đọc/ghi.
create table public.dang_ky_thong_bao (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  thiet_bi text,
  tao_luc timestamptz not null default now(),
  gui_cuoi_luc timestamptz
);
create index dang_ky_thong_bao_nv_idx on public.dang_ky_thong_bao (nhan_vien_id);
select public.khoa_tat_ca_bang();
