-- 0239 (đợt 3, nhóm B): Sản phẩm như SalonHero #/product
--  • "Mức thuế VAT (nếu có)": 10% / 8% / 5% / 0% / Không chịu thuế / Không kê khai (tax_percent_code). Cùng quy ước với dich_vu:
--    vat_pct (10/8/5/0) + vat_loai ('khong_chiu_thue' | 'khong_ke_khai', khi đó vat_pct = 0). Giá bán là giá sau thuế.
--  • Địa điểm bán ("Tất cả các địa điểm" / từng chi nhánh) để lọc chi nhánh trên danh sách: chi_nhanh_ids null = mọi chi nhánh
--    (cùng hợp đồng với dich_vu.chi_nhanh_ids).
-- Chỉ THÊM cột có default/null. san_pham không bị script đồng bộ đêm chèn (scripts/chuyen-salonhero/* không có insert san_pham).
alter table public.san_pham
  add column if not exists vat_pct numeric not null default 0 check (vat_pct in (0, 5, 8, 10)),
  add column if not exists vat_loai text check (vat_loai is null or vat_loai in ('khong_chiu_thue', 'khong_ke_khai')),
  add column if not exists chi_nhanh_ids uuid[];

comment on column public.san_pham.vat_pct is 'Mức VAT của sản phẩm (0/5/8/10), như SalonHero tax_percent_code. Giá bán là giá sau thuế.';
comment on column public.san_pham.vat_loai is 'Mã VAT đặc biệt: khong_chiu_thue | khong_ke_khai (vat_pct = 0). Null = theo vat_pct.';
comment on column public.san_pham.chi_nhanh_ids is 'Chi nhánh bán/có sản phẩm. Null = mọi chi nhánh.';

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
