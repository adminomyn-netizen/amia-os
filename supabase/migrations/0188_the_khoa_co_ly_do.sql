-- 0188 — Khoá / mở khoá thẻ phải có lý do và để lại dấu vết trong sổ cái thẻ.
-- Trước đây khoá thẻ chỉ đổi trạng thái, không ai biết vì sao, ai khoá, lúc nào. Nay mỗi lần khoá / mở khoá ghi một dòng sổ cái (0 buổi, 0 tiền) kèm lý do và người làm.
-- Chỉ thêm hai loại dòng mới; số dư và số buổi (Σ so_buoi, Σ so_tien) không đổi vì cả hai dòng đều bằng 0.
do $$
declare c text;
begin
  select conname into c from pg_constraint where conrelid = 'public.the_so_cai'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%dung_buoi%';
  if c is not null then execute format('alter table public.the_so_cai drop constraint %I', c); end if;
end $$;
alter table public.the_so_cai add constraint the_so_cai_loai_check
  check (loai in ('cap','dung_buoi','hoan_buoi','dieu_chinh','nap','tru_tien','hoan_tien','thu_hoi','khoa','mo_khoa'));
alter table public.the_so_cai add constraint the_so_cai_khoa_khong_doi_so check (loai not in ('khoa','mo_khoa') or (so_buoi = 0 and so_tien = 0));

select public.khoa_tat_ca_bang();
