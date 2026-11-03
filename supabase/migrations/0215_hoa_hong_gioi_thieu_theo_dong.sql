-- 0215 — HOA HỒNG GIỚI THIỆU THEO DÒNG (đợt 3, 03/11/2026, mục 116). Chỉ thay hàm báo cáo bc_hoa_hong_gioi_thieu (0206), không đổi bảng.
-- Thu ngân nay ghi người giới thiệu cho TỪNG DÒNG (hoa_don_dong.gt_doi_tac_id + gt_kieu + gt_gia_tri, 0213) như SalonHero edit-order.
--   Dòng có người giới thiệu riêng → hoa hồng theo mức ghi trên dòng: % × doanh số dòng (sau giảm giá) hoặc tiền × số lượng; người nhận = nguồn đó
--   (nguồn gắn khách thì gộp vào đúng khách đó, cùng hàng với hoa hồng theo người giới thiệu của cả đơn).
--   Dòng không có → như cũ (người giới thiệu của cả đơn hoa_don.nguoi_gioi_thieu_id, mức theo nguồn hoặc tỉ lệ vai Giới thiệu).
--   Số SalonHero đã tính sẵn (dong_hoa_hong_goc) giữ nguyên.

create or replace function public.bc_hoa_hong_gioi_thieu(p_tu date, p_den date, p_cn uuid default null)
returns table (nguon text, nguoi_khoa text, nguoi_ten text, nguoi_ma text, nguoi_dt text, so_hd int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  with goc as (
    -- theo người giới thiệu của cả đơn (dòng không ghi người giới thiệu riêng)
    select k.id::text khoa, k.ho_ten ten, k.ma, k.dien_thoai dt, h.id hd, v.doanh_so,
           case when dt.id is null then public.hh_tinh(v.doanh_so, v.so_luong, v.loai, 'gioi_thieu', v.muc_id, null)
                when dt.hh_kieu = 'phan_tram' then v.doanh_so * dt.hh_gia_tri / 100
                when dt.hh_kieu = 'tien' then dt.hh_gia_tri * v.so_luong
                else 0 end hh
      from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.hoa_don_dong d on d.id = v.dong_id
      join public.khach_hang k on k.id = h.nguoi_gioi_thieu_id
      left join lateral (select x.id, x.hh_kieu, x.hh_gia_tri from public.doi_tac_gt x where x.khach_id = k.id order by x.hoat_dong desc, x.tao_luc limit 1) dt on true
     where d.gt_doi_tac_id is null and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
    union all
    -- theo người giới thiệu ghi trên từng dòng
    select coalesce(k.id::text, 'gt:' || g.id), coalesce(k.ho_ten, g.ten), coalesce(k.ma, g.ma_gioi_thieu, g.ma), coalesce(k.dien_thoai, g.dien_thoai), v.hoa_don_id, v.doanh_so,
           case when d.gt_kieu = 'phan_tram' then v.doanh_so * d.gt_gia_tri / 100 when d.gt_kieu = 'tien' then d.gt_gia_tri * v.so_luong else 0 end
      from public.v_doanh_so_dong v join public.hoa_don_dong d on d.id = v.dong_id join public.doi_tac_gt g on g.id = d.gt_doi_tac_id
      left join public.khach_hang k on k.id = g.khach_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
  )
  select 'khach', khoa, min(ten), min(ma), min(dt), count(distinct hd)::int, round(sum(doanh_so))::bigint, round(sum(hh))::bigint
    from goc group by khoa
  union all
  select 'salonhero', coalesce(n.id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')),
         coalesce(n.ho_ten, dt.ten, g.ten_nguoi, 'SalonHero #' || coalesce(g.sh_nhan_vien_id::text, '?') || ' (chưa ghép)'),
         coalesce(n.ma_nv, dt.ma_gioi_thieu), dt.dien_thoai, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint, round(sum(g.gia_tri))::bigint
    from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id join public.hoa_don h on h.id = v.hoa_don_id left join public.nhan_vien n on n.id = g.nhan_vien_id
    left join public.doi_tac_gt dt on dt.sh_id = g.sh_nhan_vien_id and n.id is null
   where g.vai = 'gioi_thieu' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by 2, 3, 4, 5
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
