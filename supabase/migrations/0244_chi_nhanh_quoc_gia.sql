-- 0244 — Chi nhánh: ô Quốc gia như SalonHero (đợt 3 nhóm C, 03/11/2026).
-- SalonHero #/locations › Sửa thông tin chi nhánh có ô "Quốc gia" (danh sách 253 nước, mã ISO 2 chữ; AMIA đang là VN).
-- CHỈ THÊM một cột có mặc định 'VN'. Bảng chi_nhanh KHÔNG bị script đồng bộ đêm ghi (đã kiểm scripts/chuyen-salonhero/*.mjs: chỉ đọc chi_nhanh_id).
alter table public.chi_nhanh add column if not exists quoc_gia text not null default 'VN';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chi_nhanh_quoc_gia_check') then
    alter table public.chi_nhanh add constraint chi_nhanh_quoc_gia_check check (quoc_gia ~ '^[A-Z]{2}$');
  end if;
end $$;
comment on column public.chi_nhanh.quoc_gia is 'Mã quốc gia ISO 3166-1 alpha-2 (VN = Việt Nam), như ô Quốc gia của SalonHero.';

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
