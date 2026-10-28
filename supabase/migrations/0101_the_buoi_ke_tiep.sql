-- 0101 — HẸN BUỔI KẾ TIẾP khi trừ buổi thẻ (29/10/2026; học từ VTTech, tự thiết kế, chưa đối chiếu SalonHero).
-- Khi thực hiện buổi (trừ 1 buổi thẻ) hoặc ở hồ sơ thẻ, nhân viên có thể ghi "buổi kế tiếp: ngày + nội dung".
-- KHÔNG đổi cách trừ buổi/tiền (thuc_hien_buoi giữ nguyên): ứng dụng chỉ ghi thêm 1 dòng ở đây + 1 nhắc ở khach_nhac sau khi trừ buổi thành công.
-- Không tạo lich_hen (chưa có giờ/nhân viên; có lịch sắp tới sẽ làm khách biến khỏi ds_tai_kham).
-- Mỗi buổi thực hiện tối đa 1 hẹn kế tiếp; muốn đổi thì ghi hẹn khác cho buổi khác (sổ chỉ-thêm, có nhật ký).
set lock_timeout = '4s';

create table public.the_buoi_ke_tiep (
  id uuid primary key default gen_random_uuid(),
  the_id uuid not null references public.the_khach (id),
  khach_id uuid not null references public.khach_hang (id),
  buoi_id uuid unique references public.buoi_thuc_hien (id),
  ngay_hen date not null,
  noi_dung text check (noi_dung is null or char_length(noi_dung) <= 300),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  nhac_id uuid references public.khach_nhac (id),
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index the_buoi_ke_tiep_khach_idx on public.the_buoi_ke_tiep (khach_id, ngay_hen desc);
create index the_buoi_ke_tiep_ngay_idx on public.the_buoi_ke_tiep (ngay_hen);
create index the_buoi_ke_tiep_the_idx on public.the_buoi_ke_tiep (the_id);
create trigger the_buoi_ke_tiep_chi_them before update or delete on public.the_buoi_ke_tiep
  for each row execute function public.chi_them_dong();

alter table public.the_buoi_ke_tiep enable row level security;
alter table public.the_buoi_ke_tiep force row level security;
create policy chan_het on public.the_buoi_ke_tiep for all to anon, authenticated using (false) with check (false);
revoke all on public.the_buoi_ke_tiep from anon, authenticated;

reset lock_timeout;
