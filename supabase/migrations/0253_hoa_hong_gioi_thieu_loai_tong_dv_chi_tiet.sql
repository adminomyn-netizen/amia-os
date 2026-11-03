-- 0253 — Báo cáo Hoa hồng giới thiệu y SalonHero (đợt 3, 03/11/2026): thêm cột Loại nguồn, Tổng DV khách dùng, mã nguồn (để Sửa ngay trên báo cáo),
-- và hàm chi tiết theo nguồn (từng hoá đơn). Công thức doanh số / hoa hồng GIỮ NGUYÊN như 0206 (chỉ thêm cột cuối).
-- • loai_nguon: nhãn như SalonHero — Khách hàng / Nhân viên / Đối tác / KOL / Khác (theo doi_tac_gt.loai_sh, loai; người giới thiệu là khách chưa thành nguồn → Khách hàng).
-- • so_dv: tổng số lượng dòng DỊCH VỤ trên các hoá đơn được giới thiệu (Tổng DV khách dùng).

create or replace function public.nhan_loai_nguon_gt(p_loai text, p_loai_sh text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select case when p_loai_sh = 'CUSTOMER' or p_loai = 'khach_cu' then 'Khách hàng' when p_loai_sh = 'OPERATOR' then 'Nhân viên'
              when p_loai_sh = 'PARTNER' or p_loai = 'ctv' then 'Đối tác' when p_loai = 'kol' then 'KOL' else 'Khác' end
$$;

drop function if exists public.bc_hoa_hong_gioi_thieu(date, date, uuid);
create function public.bc_hoa_hong_gioi_thieu(p_tu date, p_den date, p_cn uuid default null)
returns table (nguon text, nguoi_khoa text, nguoi_ten text, nguoi_ma text, nguoi_dt text, so_hd integer, doanh_so bigint, hoa_hong bigint, nguon_id uuid, loai_nguon text, so_dv bigint)
language sql stable set search_path = public, pg_temp as $$
  with goc as (
    select k.id::text khoa, k.ho_ten ten, k.ma, k.dien_thoai dt, h.id hd, v.doanh_so,
           case when dt.id is null then public.hh_tinh(v.doanh_so, v.so_luong, v.loai, 'gioi_thieu', v.muc_id, null)
                when dt.hh_kieu = 'phan_tram' then v.doanh_so * dt.hh_gia_tri / 100
                when dt.hh_kieu = 'tien' then dt.hh_gia_tri * v.so_luong
                else 0 end hh,
           dt.id nguon_id, coalesce(public.nhan_loai_nguon_gt(dt.loai, dt.loai_sh), 'Khách hàng') loai_nguon, case when v.loai = 'dich_vu' then v.so_luong else 0 end so_dv
      from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.hoa_don_dong d on d.id = v.dong_id
      join public.khach_hang k on k.id = h.nguoi_gioi_thieu_id
      left join lateral (select x.id, x.hh_kieu, x.hh_gia_tri, x.loai, x.loai_sh from public.doi_tac_gt x where x.khach_id = k.id order by x.hoat_dong desc, x.tao_luc limit 1) dt on true
     where d.gt_doi_tac_id is null and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
    union all
    select coalesce(k.id::text, 'gt:' || g.id), coalesce(k.ho_ten, g.ten), coalesce(k.ma, g.ma_gioi_thieu, g.ma), coalesce(k.dien_thoai, g.dien_thoai), v.hoa_don_id, v.doanh_so,
           case when d.gt_kieu = 'phan_tram' then v.doanh_so * d.gt_gia_tri / 100 when d.gt_kieu = 'tien' then d.gt_gia_tri * v.so_luong else 0 end,
           g.id, public.nhan_loai_nguon_gt(g.loai, g.loai_sh), case when v.loai = 'dich_vu' then v.so_luong else 0 end
      from public.v_doanh_so_dong v join public.hoa_don_dong d on d.id = v.dong_id join public.doi_tac_gt g on g.id = d.gt_doi_tac_id
      left join public.khach_hang k on k.id = g.khach_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
  )
  select 'khach', khoa, min(ten), min(ma), min(dt), count(distinct hd)::int, round(sum(doanh_so))::bigint, round(sum(hh))::bigint,
         (array_agg(nguon_id) filter (where nguon_id is not null))[1], min(loai_nguon), sum(so_dv)::bigint
    from goc group by khoa
  union all
  select 'salonhero', coalesce(n.id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')),
         coalesce(n.ho_ten, dt.ten, g.ten_nguoi, 'SalonHero #' || coalesce(g.sh_nhan_vien_id::text, '?') || ' (chưa ghép)'),
         coalesce(n.ma_nv, dt.ma_gioi_thieu), dt.dien_thoai, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint, round(sum(g.gia_tri))::bigint,
         dt.id, case when n.id is not null then 'Nhân viên' else coalesce(public.nhan_loai_nguon_gt(dt.loai, dt.loai_sh), 'Khác') end,
         sum(case when v.loai = 'dich_vu' then v.so_luong else 0 end)::bigint
    from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id join public.hoa_don h on h.id = v.hoa_don_id left join public.nhan_vien n on n.id = g.nhan_vien_id
    left join public.doi_tac_gt dt on dt.sh_id = g.sh_nhan_vien_id and n.id is null
   where g.vai = 'gioi_thieu' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by 2, 3, 4, 5, dt.id, n.id, dt.loai, dt.loai_sh
$$;

-- Chi tiết một nguồn: từng hoá đơn (ngày, mã, khách mua, số DV, doanh số, hoa hồng). p_khoa = nguoi_khoa của bảng trên.
drop function if exists public.bc_hoa_hong_gioi_thieu_ct(date, date, uuid, text, text);
create or replace function public.bc_hoa_hong_gioi_thieu_ct(p_tu date, p_den date, p_nguon text, p_khoa text, p_cn uuid default null)
returns table (hoa_don_id uuid, ma_hd text, ngay date, khach_id uuid, khach text, so_dv bigint, doanh_so bigint, hoa_hong bigint)
language sql stable set search_path = public, pg_temp as $$
  with goc as (
    select h.id hd, v.doanh_so, case when v.loai = 'dich_vu' then v.so_luong else 0 end so_dv,
           case when dt.id is null then public.hh_tinh(v.doanh_so, v.so_luong, v.loai, 'gioi_thieu', v.muc_id, null)
                when dt.hh_kieu = 'phan_tram' then v.doanh_so * dt.hh_gia_tri / 100
                when dt.hh_kieu = 'tien' then dt.hh_gia_tri * v.so_luong else 0 end hh
      from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.hoa_don_dong d on d.id = v.dong_id
      left join lateral (select x.id, x.hh_kieu, x.hh_gia_tri from public.doi_tac_gt x where x.khach_id = h.nguoi_gioi_thieu_id order by x.hoat_dong desc, x.tao_luc limit 1) dt on true
     where p_nguon = 'khach' and h.nguoi_gioi_thieu_id::text = p_khoa and d.gt_doi_tac_id is null and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
    union all
    select v.hoa_don_id, v.doanh_so, case when v.loai = 'dich_vu' then v.so_luong else 0 end,
           case when d.gt_kieu = 'phan_tram' then v.doanh_so * d.gt_gia_tri / 100 when d.gt_kieu = 'tien' then d.gt_gia_tri * v.so_luong else 0 end
      from public.v_doanh_so_dong v join public.hoa_don_dong d on d.id = v.dong_id join public.doi_tac_gt g on g.id = d.gt_doi_tac_id
     where p_nguon = 'khach' and coalesce(g.khach_id::text, 'gt:' || g.id) = p_khoa and v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
    union all
    select v.hoa_don_id, v.doanh_so, case when v.loai = 'dich_vu' then v.so_luong else 0 end, g.gia_tri
      from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id
     where p_nguon = 'salonhero' and g.vai = 'gioi_thieu' and v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
       and coalesce(g.nhan_vien_id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')) = p_khoa
  )
  select h.id, coalesce(h.sh_ma, h.ma), h.ngay_hd, h.khach_id, k.ho_ten, sum(g.so_dv)::bigint, round(sum(g.doanh_so))::bigint, round(sum(g.hh))::bigint
    from goc g join public.hoa_don h on h.id = g.hd left join public.khach_hang k on k.id = h.khach_id
   group by h.id, k.ho_ten order by h.ngay_hd desc, 2 desc
   limit 500
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
