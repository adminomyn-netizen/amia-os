-- 0171: Supabase Advisors (Security) — chuyển pg_net khỏi schema public (extension_in_public).
-- pg_net không relocatable nên gỡ rồi tạo lại trong schema extensions; hàm net.http_* vẫn ở schema net
-- (job cron nhac-cham-cong gọi net.http_get không đổi). Không có dữ liệu trong pg_net cần giữ; chạy lúc ít cuộc gọi cron.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_net' and extnamespace = 'public'::regnamespace) then
    create schema if not exists extensions;
    drop extension pg_net;
    create extension pg_net with schema extensions;
  end if;
end $$;
