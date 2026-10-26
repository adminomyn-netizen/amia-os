-- 0018 — Số liệu phân bổ cho dashboard (biểu đồ tròn/cột): khách theo hạng/trạng thái/nguồn/người phụ trách/tháng,
-- thẻ theo tình trạng, công nợ theo tuổi nợ, phiếu cấp theo trạng thái. Gom ở DB vì API cắt 1.000 dòng.
-- Dạng dài: (nhom, nhan, so, tien). p_cn = null → mọi chi nhánh.
create function public.bc_phan_bo(p_cn uuid default null)
returns table (nhom text, nhan text, so bigint, tien bigint)
language sql stable as $$
  select 'hang', coalesce(hang, 'Chưa xếp'), count(*), 0::bigint from public.v_khach_hang where (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'trang_thai', trang_thai, count(*), 0 from public.v_khach_hang where (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'nguon', nguon, count(*), 0 from public.khach_hang where (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'khach_moi', to_char(date_trunc('month', tao_luc), 'YYYY-MM'), count(*), 0 from public.khach_hang
   where tao_luc >= date_trunc('month', public.hom_nay()::timestamp) - interval '5 months' and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'the_lan', tinh_trang, count(*), 0 from public.v_the_khach where loai = 'lan' and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'the_tien', tinh_trang, count(*), coalesce(sum(so_du_tien), 0)::bigint from public.v_the_khach where loai = 'tien' and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'no_tuoi',
         case when public.hom_nay() - ngay_hd <= 30 then '0-30 ngày' when public.hom_nay() - ngay_hd <= 90 then '31-90 ngày' else 'Trên 90 ngày' end,
         count(*), coalesce(sum(con_no), 0)::bigint
    from public.hoa_don where trang_thai = 'hoan_thanh' and con_no > 0 and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'phieu', trang_thai, count(*), 0 from public.phieu_cap where (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'phu_trach', ten, so, 0 from (
    select coalesce(n.ho_ten, 'Chưa gán') as ten, count(*) as so
      from public.khach_hang k left join public.nhan_vien n on n.id = k.nguoi_phu_trach_id
     where (p_cn is null or k.chi_nhanh_id = p_cn) group by 1 order by 2 desc limit 8) x
$$;
select public.khoa_tat_ca_bang();
