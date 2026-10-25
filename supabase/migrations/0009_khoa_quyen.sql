-- 0009 — KHOÁ QUYỀN: dữ liệu khách + ảnh da là dữ liệu sức khoẻ. Trình duyệt không chạm thẳng DB.
-- Mọi bảng: RLS + FORCE RLS + 1 policy chặn anon/authenticated. Ứng dụng dùng service_role ở server, có hàm bảo vệ theo vai trò.
-- Mỗi migration sau này PHẢI gọi lại public.khoa_tat_ca_bang() ở cuối (bài test cổng cấu trúc bắt nếu quên).
create function public.khoa_tat_ca_bang() returns void language plpgsql as $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('alter table public.%I force row level security', r.tablename);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = r.tablename) then
      execute format('create policy chan_het on public.%I for all to anon, authenticated using (false) with check (false)', r.tablename);
    end if;
  end loop;
  revoke all on all tables in schema public from anon, authenticated;
  revoke all on all sequences in schema public from anon, authenticated;
  revoke execute on all functions in schema public from public, anon, authenticated;
end $$;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

select public.khoa_tat_ca_bang();

-- Kho ảnh riêng tư (Supabase Storage). Không có policy nào cho anon/authenticated → chỉ máy chủ (service_role) cấp link ký tạm thời.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('khach-anh', 'khach-anh', false, 10485760, array['image/jpeg','image/png','image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;
