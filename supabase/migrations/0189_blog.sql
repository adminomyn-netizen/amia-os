-- 0189 — Blog cho website AMIA (bê từ mục Blog của SalonHero): Chuyên mục (Category) + Bài viết.
-- Chuyên mục: tiêu đề, mô tả, thứ tự (số lớn lên đầu), kích hoạt. Bài viết: chuyên mục, tiêu đề, mô tả ngắn, ảnh, bài tiêu biểu, nội dung, kích hoạt.
-- Chỉ bài và chuyên mục đang kích hoạt mới hiện ở trang công khai /blog. Vai Chủ và Kỹ thuật quản lý trong Cài đặt → Blog.
-- Ảnh blog là ảnh quảng bá công khai (khác ảnh khách là dữ liệu sức khoẻ): bucket riêng 'blog-anh', công khai, chỉ ảnh, tối đa 5 MB.
create table public.blog_chuyen_muc (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null check (char_length(tieu_de) between 1 and 120),
  mo_ta text check (mo_ta is null or char_length(mo_ta) <= 500),
  thu_tu integer not null default 0,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);
create unique index blog_chuyen_muc_ten_uniq on public.blog_chuyen_muc (lower(tieu_de));

create table public.blog_bai_viet (
  id uuid primary key default gen_random_uuid(),
  chuyen_muc_id uuid not null references public.blog_chuyen_muc (id),
  tieu_de text not null check (char_length(tieu_de) between 1 and 200),
  mo_ta_ngan text check (mo_ta_ngan is null or char_length(mo_ta_ngan) <= 600),
  anh text,
  tieu_bieu boolean not null default false,
  noi_dung text not null,
  hoat_dong boolean not null default false,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);
create index blog_bai_viet_cm_idx on public.blog_bai_viet (chuyen_muc_id, hoat_dong, cap_nhat_luc desc);
create index blog_bai_viet_hien_idx on public.blog_bai_viet (hoat_dong, tieu_bieu, cap_nhat_luc desc);

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('blog-anh', 'blog-anh', true, 5242880, array['image/jpeg','image/png','image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;

select public.khoa_tat_ca_bang();
