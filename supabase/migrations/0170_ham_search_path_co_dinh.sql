-- 0170: Supabase Advisors (Security) — đặt search_path cố định cho hàm schema public
-- (function_search_path_mutable). Chỉ đổi cấu hình hàm, không đổi thân hàm, không khoá bảng.
-- Đã kiểm 29/10: 126 hàm đều không SECURITY DEFINER, không gọi extension/auth/storage.
-- Đảo ngược: sao-luu/0170-dao-nguoc.sql (alter function … reset search_path).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig, p.prokind as k
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind in ('f', 'p')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%')
  loop
    execute format('alter %s %s set search_path = public, pg_temp', case r.k when 'p' then 'procedure' else 'function' end, r.sig);
  end loop;
end $$;
