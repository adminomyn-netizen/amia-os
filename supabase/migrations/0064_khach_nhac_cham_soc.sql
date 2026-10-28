-- 0064 — NHẮC CHĂM SÓC KHÁCH (chuyển từ SalonHero, đợt 28/10/2026)
-- SalonHero có mục "Nhắc chăm sóc": mỗi nhắc gắn 1 khách, có nội dung, ngày nhắc, kiểu lặp, trạng thái (đang nhắc / đã xong / huỷ), người tạo.
-- Bảng này giữ các nhắc từ 2023 trở đi (Supabase gói Free nên nhắc 2020–2022 nằm ở Lark Base). Mọi dòng chuyển sang có sh_id (duy nhất) và nhap_dot (gỡ cả đợt được).
create table public.khach_nhac (
  id uuid primary key default gen_random_uuid(),
  sh_id bigint unique,
  khach_id uuid not null references public.khach_hang (id),
  noi_dung text,
  ghi_chu text,
  trang_thai text not null default 'dang_nhac' check (trang_thai in ('dang_nhac', 'da_xong', 'huy')),
  sh_trang_thai text,
  ngay_nhac timestamptz,
  hoan_thanh_luc timestamptz,
  kieu_lap text,
  so_lan_lap int,
  cac_ngay_nhac jsonb,
  so_cuoc_goi int,
  dich_vu_ten text,
  nguoi_tao_ten text,
  nguoi_phu_trach_ten text,
  chi_nhanh_id uuid references public.chi_nhanh (id),
  tao_luc timestamptz not null default now(),
  la_lich_su boolean not null default false,
  nhap_dot text references public.nhap_dot (ma)
);
create index khach_nhac_khach_idx on public.khach_nhac (khach_id, ngay_nhac desc);
create index khach_nhac_ngay_idx on public.khach_nhac (trang_thai, ngay_nhac);
create index khach_nhac_nhap_dot_idx on public.khach_nhac (nhap_dot) where nhap_dot is not null;

-- Gỡ cả một đợt nhập: thêm bảng nhắc (xoá trước khi xoá khách).
create or replace function public.go_dot_nhap(p_dot text) returns jsonb language plpgsql as $$
declare r jsonb := '{}'::jsonb; n int;
begin
  if not exists (select 1 from public.nhap_dot where ma = p_dot) then raise exception 'Không có đợt nhập %', p_dot using errcode = 'P0001'; end if;
  perform set_config('amia.go_dot', 'on', true);
  delete from public.dong_hoa_hong_goc where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('dong_hoa_hong_goc', n);
  delete from public.dong_nhan_vien where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('dong_nhan_vien', n);
  delete from public.thanh_toan where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('thanh_toan', n);
  delete from public.hoa_don_dong where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('hoa_don_dong', n);
  delete from public.hoa_don where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('hoa_don', n);
  delete from public.lich_hen_dich_vu where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('lich_hen_dich_vu', n);
  delete from public.lich_hen where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('lich_hen', n);
  delete from public.khach_nhac where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_nhac', n);
  delete from public.the_so_cai where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('the_so_cai', n);
  delete from public.the_khach where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('the_khach', n);
  delete from public.khach_ghi_chu where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_ghi_chu', n);
  delete from public.khach_nguoi_than where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_nguoi_than', n);
  delete from public.khach_hang where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_hang', n);
  update public.nhap_dot set go_luc = now() where ma = p_dot;
  return r;
end $$;

select public.khoa_tat_ca_bang();
