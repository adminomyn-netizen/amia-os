-- 0333 thêm buoi_cho_lam.hoa_don_id không có on delete → huỷ nháp hoá đơn (ban-hang huyNhap) và đồng bộ đêm xoá hoá đơn sẽ lỗi khoá ngoại.
-- Lượt chờ làm của hoá đơn không trừ buổi, không ghi sổ cái thẻ → xoá hoá đơn thì xoá kèm (15/11/2026).
do $$ declare c text; begin
  select conname into c from pg_constraint where conrelid = 'public.buoi_cho_lam'::regclass and contype = 'f'
    and conkey = array[(select attnum from pg_attribute where attrelid = 'public.buoi_cho_lam'::regclass and attname = 'hoa_don_id')];
  if c is not null then execute format('alter table public.buoi_cho_lam drop constraint %I', c); end if;
end $$;
alter table public.buoi_cho_lam add constraint buoi_cho_lam_hoa_don_id_fkey foreign key (hoa_don_id) references public.hoa_don (id) on delete cascade;
