-- 0048 — Vai trò "Chủ" trở lại (chị Lâm 28/10/2026): chủ sở hữu, nhìn toàn cảnh điều hành, tự phân quyền và cài đặt hệ thống.
alter table public.nhan_vien drop constraint nhan_vien_vai_tro_check;
alter table public.nhan_vien add constraint nhan_vien_vai_tro_check
  check (vai_tro in ('chu', 'ky_thuat', 'quan_ly', 'le_tan', 'thu_ngan', 'tu_van', 'bac_si', 'ktv', 'thu_kho', 'ke_toan', 'marketing', 'nha_dau_tu', 'nhan_vien'));
