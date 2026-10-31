-- 0186 — Đơn nháp ở Thu ngân (như SalonHero DRAFT): lưu đơn đang dựng lên máy chủ để tải lại trang hay đổi máy không mất.
-- Chỉ lưu khách + các dòng hàng (kèm người hưởng); KHÔNG đụng sổ cái, doanh thu, kho. Chốt đơn thật vẫn đi qua chot_hoa_don.
-- Mỗi người lập tối đa 30 đơn nháp (kiểm ở máy chủ). Chốt xong hoặc xoá thì dòng nháp bị xoá.
create table public.don_nhap (
  id uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  nguoi_lap_id uuid not null references public.nhan_vien (id),
  khach_id uuid references public.khach_hang (id) on delete set null,
  tieu_de text,
  dong jsonb not null default '[]'::jsonb check (jsonb_typeof(dong) = 'array'),
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);
create index don_nhap_nguoi_idx on public.don_nhap (nguoi_lap_id, cap_nhat_luc desc);

select public.khoa_tat_ca_bang();
