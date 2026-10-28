-- 0065 — NHÓM KHÁCH (tag) + SỔ ĐIỂM THƯỞNG + các trường khách SalonHero còn thiếu (chuyển A→Z, đợt 28/10/2026, mã đợt SH-2810-13).
-- • nhom_khach: danh mục nhóm (SalonHero gọi là "tag": SHOPPER, VIP, SUPER VIP, HẾT LIỆU TRÌNH…), giữ sh_id + màu gốc.
-- • khach_nhom: khách ↔ nhóm (1 khách nhiều nhóm).
-- • khach_diem_so: sổ điểm thưởng CHỈ THÊM DÒNG (như the_so_cai): mỗi lần cộng/trừ điểm 1 dòng; sửa sai = thêm dòng điều chỉnh.
--   Không có khoá ngoại sang hoa_don (giữ hoa_don_sh_id + mã hoá đơn gốc) để gỡ một đợt hoá đơn không bị sổ điểm chặn.
-- • khach_hang.diem_so_du: số dư điểm hiện tại = tổng sổ điểm, cập nhật bằng trigger theo câu lệnh (không phải theo dòng).
--   Cột diem_goc (0013) vẫn là ảnh chụp số điểm SalonHero lúc chuyển, không đổi.
-- • Các cột khách mới bên dưới ban đầu đều trống: muốn bỏ phần bộ nạp đã điền thì đặt lại NULL/false (go_dot_nhap không gỡ cột của khách có sẵn).

-- ───────── Khách: trường SalonHero còn thiếu ─────────
alter table public.khach_hang
  add column tong_dat_lich_goc int,          -- total_booking: tổng số lần đặt lịch ở SalonHero
  add column tong_checkin_goc int,           -- total_checkin
  add column tong_huy_lich_goc int,          -- total_cancel
  add column cong_no_goc bigint,             -- debt_amount lúc chuyển (ảnh chụp để đối chiếu; công nợ thật nằm ở hoá đơn)
  add column anh_dai_dien_url text,          -- avatar (link S3 của SalonHero — có thể chết sau khi hết hạn 15/11/2026)
  add column ma_vung_sdt text,               -- phone_country_code
  add column khong_gui_zns boolean not null default false,  -- lock_send_zns: khách đã chặn tin ZNS
  add column diem_so_du int not null default 0;             -- số dư điểm thưởng hiện tại (= tổng khach_diem_so)

-- ───────── Nhóm khách ─────────
create table public.nhom_khach (
  id uuid primary key default gen_random_uuid(),
  sh_id bigint unique,
  ten text not null,
  mau text,
  mo_ta text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now(),
  nhap_dot text references public.nhap_dot (ma)
);

create table public.khach_nhom (
  khach_id uuid not null references public.khach_hang (id) on delete cascade,
  nhom_id uuid not null references public.nhom_khach (id) on delete cascade,
  gan_luc timestamptz not null default now(),
  nhap_dot text references public.nhap_dot (ma),
  primary key (khach_id, nhom_id)
);
create index khach_nhom_nhom_idx on public.khach_nhom (nhom_id);
create index khach_nhom_nhap_dot_idx on public.khach_nhom (nhap_dot) where nhap_dot is not null;

-- ───────── Sổ điểm thưởng ─────────
create table public.khach_diem_so (
  id bigint generated always as identity primary key,
  sh_id bigint unique,
  khach_id uuid not null references public.khach_hang (id),
  loai text not null check (loai in ('cong_hoa_don', 'hoan_hoa_don', 'sua_tay', 'dieu_chinh_dau', 'dieu_chinh', 'doi_diem')),
  sh_loai text,                      -- ORDER_REWARD_POINT / ORDER_REVERT_POINT / USER_EDIT
  so_diem int not null,              -- + cộng, − trừ
  so_du_truoc_sh int,                -- before_action_point của SalonHero (giữ nguyên số gốc)
  so_du_sau_sh int,                  -- after_action_point của SalonHero
  ly_do text,
  hoa_don_sh_id bigint,              -- order_id SalonHero (không khoá ngoại; tra hoa_don.sh_id)
  ma_hoa_don_sh text,                -- order_code SalonHero
  chi_nhanh_id uuid references public.chi_nhanh (id),
  nguoi_id uuid references public.nhan_vien (id),
  nguoi_tao_ten text,
  tao_luc timestamptz not null default now(),
  la_lich_su boolean not null default false,
  nhap_dot text references public.nhap_dot (ma)
);
create index khach_diem_so_khach_idx on public.khach_diem_so (khach_id, tao_luc);
create index khach_diem_so_nhap_dot_idx on public.khach_diem_so (nhap_dot) where nhap_dot is not null;

create trigger khach_diem_so_chi_them before update or delete on public.khach_diem_so
  for each row execute function public.chi_them_dong();

-- Số dư điểm trên khách: cộng theo câu lệnh (1 lần update/khách cho cả lô).
create function public.trg_diem_so_du() returns trigger language plpgsql as $$
begin
  update public.khach_hang k set diem_so_du = k.diem_so_du + x.d
    from (select khach_id, sum(so_diem)::int d from moi group by khach_id) x
   where k.id = x.khach_id and x.d <> 0;
  return null;
end $$;
create trigger khach_diem_so_du after insert on public.khach_diem_so
  referencing new table as moi for each statement execute function public.trg_diem_so_du();

-- ───────── Gỡ cả một đợt nhập: thêm sổ điểm, khách–nhóm, danh mục nhóm (giữ nguyên mọi dòng của 0064) ─────────
create or replace function public.go_dot_nhap(p_dot text) returns jsonb language plpgsql as $$
declare r jsonb := '{}'::jsonb; n int; v_khach uuid[];
begin
  if not exists (select 1 from public.nhap_dot where ma = p_dot) then raise exception 'Không có đợt nhập %', p_dot using errcode = 'P0001'; end if;
  perform set_config('amia.go_dot', 'on', true);
  -- Sổ điểm: xoá dòng của đợt rồi tính lại số dư cho đúng những khách bị ảnh hưởng
  select coalesce(array_agg(distinct khach_id), '{}') into v_khach from public.khach_diem_so where nhap_dot = p_dot;
  delete from public.khach_diem_so where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_diem_so', n);
  update public.khach_hang k set diem_so_du = coalesce((select sum(so_diem) from public.khach_diem_so s where s.khach_id = k.id), 0) where k.id = any(v_khach);
  delete from public.khach_nhom where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_nhom', n);
  delete from public.nhom_khach where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('nhom_khach', n);
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
