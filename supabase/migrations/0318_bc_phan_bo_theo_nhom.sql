-- Trang chủ: mỗi tab chỉ tính nhóm số liệu nó cần (tab Thẻ/Kho không phải chờ quét v_khach_hang ~1,4s).
-- Hạng + trạng thái khách gộp một lần quét (grouping sets). Hàm cũ bc_phan_bo giữ nguyên.
create or replace function public.bc_phan_bo_nhom(p_cn uuid default null, p_nhom text[] default null)
returns table (nhom text, nhan text, so bigint, tien bigint)
language plpgsql stable as $$
declare
  co boolean;
begin
  co := p_nhom is null;
  if co or p_nhom && array['hang','trang_thai'] then
    return query
      select case when grouping(v.hang) = 0 then 'hang' else 'trang_thai' end,
             case when grouping(v.hang) = 0 then coalesce(v.hang::text, 'Chưa xếp') else v.trang_thai::text end,
             count(*), 0::bigint
        from public.v_khach_hang v where (p_cn is null or v.chi_nhanh_id = p_cn)
       group by grouping sets ((v.hang), (v.trang_thai));
  end if;
  if co or 'nguon' = any(p_nhom) then
    return query select 'nguon'::text, k.nguon::text, count(*), 0::bigint from public.khach_hang k where (p_cn is null or k.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or 'khach_moi' = any(p_nhom) then
    return query select 'khach_moi'::text, to_char(date_trunc('month', k.tao_luc), 'YYYY-MM'), count(*), 0::bigint from public.khach_hang k
      where k.tao_luc >= date_trunc('month', public.hom_nay()::timestamp) - interval '5 months' and (p_cn is null or k.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or p_nhom && array['the_lan','the_tien'] then
    return query select case when t.loai = 'lan' then 'the_lan' else 'the_tien' end, t.tinh_trang::text, count(*),
        case when t.loai = 'lan' then 0::bigint else coalesce(sum(t.so_du_tien), 0)::bigint end
      from public.v_the_khach t where t.loai in ('lan', 'tien') and (p_cn is null or t.chi_nhanh_id = p_cn) group by t.loai, t.tinh_trang;
  end if;
  if co or 'no_tuoi' = any(p_nhom) then
    return query select 'no_tuoi'::text,
         case when public.hom_nay() - h.ngay_hd <= 30 then '0-30 ngày' when public.hom_nay() - h.ngay_hd <= 90 then '31-90 ngày' else 'Trên 90 ngày' end,
         count(*), coalesce(sum(h.con_no), 0)::bigint
      from public.hoa_don h where h.trang_thai = 'hoan_thanh' and h.con_no > 0 and (p_cn is null or h.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or 'phieu' = any(p_nhom) then
    return query select 'phieu'::text, p.trang_thai::text, count(*), 0::bigint from public.phieu_cap p where (p_cn is null or p.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or 'phu_trach' = any(p_nhom) then
    return query select 'phu_trach'::text, x.ten::text, x.so, 0::bigint from (
      select coalesce(n.ho_ten, 'Chưa gán') as ten, count(*) as so
        from public.khach_hang k left join public.nhan_vien n on n.id = k.nguoi_phu_trach_id
       where (p_cn is null or k.chi_nhanh_id = p_cn) group by 1 order by 2 desc limit 8) x;
  end if;
end $$;

grant execute on function public.bc_phan_bo_nhom(uuid, text[]) to authenticated, service_role;
