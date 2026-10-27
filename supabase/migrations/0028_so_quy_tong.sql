-- 0028 — Tổng hợp sổ quỹ cho trang Sổ quỹ: tồn đầu kỳ, thu/chi/nạp/rút trong kỳ, tồn hiện tại.
-- Phiếu đã đảo và chính dòng đảo bù trừ nhau nên không tính vào thu/chi/nạp/rút (số dư không đổi).
create function public.so_quy_tong(p_quy uuid[], p_tu date, p_den date)
returns table (dau bigint, thu bigint, chi bigint, nap bigint, rut bigint, hien_tai bigint)
language sql stable as $$
  select
    (select coalesce(sum(q.so_du_dau), 0) from public.quy q where q.id = any (p_quy)) + coalesce(sum(v.bien_dong) filter (where v.ngay < p_tu), 0),
    coalesce(sum(v.so_tien) filter (where v.ngay between p_tu and p_den and v.loai = 'thu' and not v.da_dao and v.nguon <> 'dao_phieu'), 0),
    coalesce(sum(v.so_tien) filter (where v.ngay between p_tu and p_den and v.loai = 'chi' and not v.da_dao and v.nguon <> 'dao_phieu'), 0),
    coalesce(sum(v.so_tien) filter (where v.ngay between p_tu and p_den and v.loai = 'nap' and not v.da_dao and v.nguon <> 'dao_phieu'), 0),
    coalesce(sum(v.so_tien) filter (where v.ngay between p_tu and p_den and v.loai = 'rut' and not v.da_dao and v.nguon <> 'dao_phieu'), 0),
    (select coalesce(sum(q.so_du_dau), 0) from public.quy q where q.id = any (p_quy)) + coalesce(sum(v.bien_dong), 0)
  from public.v_so_quy v where v.quy_id = any (p_quy)
$$;
revoke all on function public.so_quy_tong(uuid[], date, date) from public, anon, authenticated;
