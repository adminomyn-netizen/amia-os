-- 0172: Supabase Advisors (Performance) — chỉ mục phủ cho mọi khoá ngoại schema public chưa có (unindexed_foreign_keys). Đã tạo trước bằng CREATE INDEX CONCURRENTLY ngày 29/10 (280 chỉ mục); file này idempotent (if not exists) để môi trường mới có đủ.
-- Đảo ngược: drop index public.<tên> (tên bắt đầu bằng idx_fk_).
do $$
declare r record; ten text;
begin
  for r in
    select c.conrelid::regclass as bang, c.conrelid as oid, c.conkey as ck,
           (select string_agg(quote_ident(a.attname), ', ' order by array_position(c.conkey, a.attnum))
              from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any (c.conkey)) as cot,
           (select string_agg(a.attname, '_' order by array_position(c.conkey, a.attnum))
              from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any (c.conkey)) as cot_ten,
           c.conrelid::regclass::text as bang_ten
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid and t.relkind = 'r'
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid and i.indisvalid and i.indpred is null
          and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] = c.conkey)
  loop
    ten := left('idx_fk_' || replace(r.bang_ten, 'public.', '') || '_' || r.cot_ten, 63);
    execute format('create index if not exists %I on %s (%s)', ten, r.bang, r.cot);
  end loop;
end $$;
