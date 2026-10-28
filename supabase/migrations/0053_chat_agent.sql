-- 0053 — Chat nổi với Tula (trợ lý AI) ở góc dưới mọi trang.
--  · Người dùng gõ → ghi một dòng "chat_tin" (trạng thái 'cho'); máy chạy Tula nhận, trả lời, ghi lại dòng của agent.
--  · Quyền được kiểm trong ứng dụng cho từng lời gọi công cụ (thông qua mã thông hành sinh lúc gửi tin), không để mô hình tự khai người hỏi là ai.
--  · Chỉ Chủ và Kỹ thuật được gửi loại 'sua' (nhờ Tula sửa ứng dụng): khoá cả ở cơ sở dữ liệu theo vai trò chụp lúc gửi.
--  · chat_nhip: nhịp tim của worker để widget báo "Tula đang offline" thay vì quay mãi.

create table public.chat_cuoc (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null unique references public.nhan_vien (id) on delete cascade,
  tao_luc timestamptz not null default now()
);

create table public.chat_tin (
  id uuid primary key default gen_random_uuid(),
  cuoc_id uuid not null references public.chat_cuoc (id) on delete cascade,
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  vai text not null check (vai in ('nguoi', 'agent')),
  loai text not null default 'hoi' check (loai in ('hoi', 'sua')),
  vai_tro_chup text,
  noi_dung text not null check (length(btrim(noi_dung)) > 0 and length(noi_dung) <= 6000),
  trang_thai text not null default 'xong' check (trang_thai in ('cho', 'dang_xu_ly', 'xong', 'loi')),
  hoi_tin_id uuid references public.chat_tin (id) on delete set null,
  tep_duong_dan text,
  tep_ten text,
  thong_hanh text,
  han_thong_hanh timestamptz,
  tao_luc timestamptz not null default now(),
  xong_luc timestamptz,
  constraint chat_tin_sua_chi_chu_va_ky_thuat check (loai <> 'sua' or vai = 'agent' or vai_tro_chup in ('chu', 'ky_thuat'))
);
create index chat_tin_cuoc_idx on public.chat_tin (cuoc_id, tao_luc desc);
create index chat_tin_cho_idx on public.chat_tin (trang_thai, tao_luc) where trang_thai in ('cho', 'dang_xu_ly');
create index chat_tin_thong_hanh_idx on public.chat_tin (thong_hanh) where thong_hanh is not null;

create table public.chat_nhip (
  id int primary key check (id = 1),
  luc timestamptz not null default now()
);
insert into public.chat_nhip (id, luc) values (1, 'epoch');

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('chat_gioi_han_ngay', '60', 'Số tin chat tối đa mỗi người mỗi ngày gửi cho Tula')
on conflict (khoa) do nothing;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('chat-agent', 'chat-agent', false, 20971520)
    on conflict (id) do update set public = false, file_size_limit = 20971520;
  end if;
end $$;

select public.khoa_tat_ca_bang();
