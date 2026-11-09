-- Vai "Chỉ xem (giám sát)": xem mọi màn, không ghi (chị Lâm 9/11/2026, tài khoản anh Tú hcns@mscvn.com). Quyền ở src/lib/quyen.ts.
alter table public.nhan_vien drop constraint if exists nhan_vien_vai_tro_check;
alter table public.nhan_vien add constraint nhan_vien_vai_tro_check
  check (vai_tro in ('chu', 'ky_thuat', 'quan_ly', 'nhan_su', 'le_tan', 'thu_ngan', 'tu_van', 'bac_si', 'ktv', 'thu_kho', 'ke_toan', 'marketing', 'nha_dau_tu', 'nhan_vien', 'chi_xem'));
