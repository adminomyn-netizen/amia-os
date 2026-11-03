-- 0290 — Ô "Tổng khoản chi" của Báo cáo doanh thu theo ngày, y SalonHero (đợt 4 mục 9, 03/11/2026).
-- SalonHero (OrderService.getOrderReportList → totalExpense = totalExpenseCash + totalExpenseBank) cộng các phiếu CHI tay ở Sổ quỹ
-- (loại EXPENSE_CASH = 2 và EXPENSE_BANK = 6) trong kỳ, theo chi nhánh; KHÔNG tính chuyển quỹ, nạp, rút, hay tiền hoàn của hoá đơn.
-- Đối chiếu 01–31/10/2024: SalonHero Vinh 6.597.000 (tiền mặt 6.597.000, ngân hàng 0), Đà Lạt 2.596.000 — khớp so_quy loai='chi' của AMIA.
-- Phiếu đã đảo (và chính dòng đảo) không tính, cùng quy ước với so_quy_tong (0250) — SalonHero xoá phiếu thì phiếu biến mất khỏi tổng.
create or replace function public.bc_tong_khoan_chi(p_tu date, p_den date, p_cn uuid default null)
returns table (tong bigint, tien_mat bigint, ngan_hang bigint)
language sql stable set search_path = public, pg_temp as $$
  select coalesce(sum(s.so_tien), 0)::bigint,
         coalesce(sum(s.so_tien) filter (where q.loai = 'tien_mat'), 0)::bigint,
         coalesce(sum(s.so_tien) filter (where q.loai = 'ngan_hang'), 0)::bigint
    from public.so_quy s
    join public.quy q on q.id = s.quy_id
   where s.loai = 'chi'
     and s.ngay between p_tu and p_den
     and (p_cn is null or q.chi_nhanh_id = p_cn)
     and s.nguon <> 'dao_phieu'
     and not exists (select 1 from public.so_quy g where g.phieu_goc_id = s.id)
$$;

revoke all on function public.bc_tong_khoan_chi(date, date, uuid) from public, anon, authenticated;
grant execute on function public.bc_tong_khoan_chi(date, date, uuid) to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
