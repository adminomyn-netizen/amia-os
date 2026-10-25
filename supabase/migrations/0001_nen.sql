-- 0001 — NỀN: chi nhánh, nhân viên, đếm mã, nhật ký truy cập.
-- Nguyên tắc cả hệ thống:
--  * Tiền = số nguyên đồng (bigint). Không dùng số thực cho tiền.
--  * Trình duyệt KHÔNG chạm thẳng DB: anon/authenticated bị thu hồi mọi quyền, mọi bảng bật RLS + FORCE RLS + 1 policy chặn.
--    Ứng dụng đọc/ghi bằng service_role ở server, có hàm bảo vệ theo vai trò ở từng trang/hành động.
--  * Sổ cái (thẻ, kho, thanh toán) chỉ thêm dòng, không sửa/xoá: số dư = tổng các dòng.
create extension if not exists pgcrypto;

create table public.dem_ma (khoa text primary key, so bigint not null default 0);

create function public.so_tiep_theo(p_khoa text) returns bigint language plpgsql as $$
declare v bigint;
begin
  insert into public.dem_ma (khoa, so) values (p_khoa, 1)
  on conflict (khoa) do update set so = public.dem_ma.so + 1
  returning so into v;
  return v;
end $$;

create table public.chi_nhanh (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  dia_chi text,
  dien_thoai text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.nhan_vien (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  ho_ten text not null,
  dien_thoai text,
  email text,
  vai_tro text not null check (vai_tro in ('chu','quan_ly','le_tan','thu_ngan','tu_van','bac_si','ktv','thu_kho','ke_toan','marketing','nha_dau_tu')),
  chuc_danh text,
  chi_nhanh_id uuid references public.chi_nhanh (id),
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);
create index nhan_vien_chi_nhanh_idx on public.nhan_vien (chi_nhanh_id);

-- Mọi lần xem hồ sơ khách / ảnh da (dữ liệu sức khoẻ) đều để lại dấu vết.
create table public.nhat_ky_truy_cap (
  id bigint generated always as identity primary key,
  nguoi_id uuid references public.nhan_vien (id),
  hanh_dong text not null,
  doi_tuong text not null,
  doi_tuong_id uuid,
  chi_tiet jsonb,
  luc timestamptz not null default now()
);
create index nhat_ky_truy_cap_doi_tuong_idx on public.nhat_ky_truy_cap (doi_tuong, doi_tuong_id, luc desc);

-- Bảng chỉ thêm: chặn sửa/xoá ở tầng DB (dùng cho nhật ký và mọi sổ cái).
create function public.chi_them_dong() returns trigger language plpgsql as $$
begin
  raise exception 'Bảng % chỉ được thêm dòng, không sửa hay xoá (sổ cái)', tg_table_name using errcode = 'P0001';
end $$;

create trigger nhat_ky_truy_cap_chi_them before update or delete on public.nhat_ky_truy_cap
  for each row execute function public.chi_them_dong();
