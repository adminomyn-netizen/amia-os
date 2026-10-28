-- 0122 — Báo cáo bán sản phẩm: cột Thời gian lấy theo giờ LẬP đơn (tao_luc) như SalonHero (đối chiếu hoá đơn 26100731: SalonHero 26/10/2026 14:38 = giờ lập, giờ chốt 14:49).
-- Chỉ thay thân hàm đọc bc_ban_san_pham (cùng chữ ký), không đổi dữ liệu.
create or replace function public.bc_ban_san_pham(p_tu date, p_den date, p_cn uuid default null, p_tim text default null, p_tong boolean default false, p_so int default 10, p_tu_dong int default 0)
returns table (khoa text, san_pham_id uuid, ma text, ten text, ma_hd text, hoa_don_id uuid, thoi_gian timestamptz, gia_1sp numeric, so_luong numeric, gia_sau numeric, doanh_thu numeric, gia_von numeric, loi_nhuan numeric,
               tong_dong bigint, tong_doanh_thu numeric, tong_nhap numeric)
language sql stable as $$
  with l as (
    select d.id as did, d.san_pham_id, p.ma, btrim(coalesce(p.ten, d.ten)) as ten, coalesce(h.sh_ma, h.ma) as ma_hd, h.id as hd, h.tao_luc as luc,
           d.don_gia::numeric as gia_1sp, d.so_luong::numeric as so_luong, round(v.doanh_so) as doanh_thu, coalesce(p.gia_nhap_don_vi, 0) as von_1sp
      from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id join public.v_doanh_so_dong v on v.dong_id = d.id
      left join public.san_pham p on p.id = d.san_pham_id
     where d.loai = 'san_pham' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(coalesce(p.ten, d.ten)) ilike '%' || public.bo_dau(btrim(p_tim)) || '%' or h.sh_ma ilike '%' || btrim(p_tim) || '%' or h.ma ilike '%' || btrim(p_tim) || '%')
  ), r as (
    select l.did::text as khoa, l.san_pham_id, l.ma, l.ten, l.ma_hd, l.hd as hoa_don_id, l.luc as thoi_gian, l.gia_1sp, l.so_luong, round(l.doanh_thu / nullif(l.so_luong, 0)) as gia_sau, l.doanh_thu, l.von_1sp as gia_von, l.doanh_thu - l.von_1sp * l.so_luong as loi_nhuan
      from l where not p_tong
    union all
    select coalesce(l.san_pham_id::text, l.ten), l.san_pham_id, min(l.ma), l.ten, null, null, null, null, sum(l.so_luong), null, sum(l.doanh_thu), null, sum(l.doanh_thu - l.von_1sp * l.so_luong)
      from l where p_tong group by l.san_pham_id, l.ten
  ), t as (select r.*, count(*) over () as tong_dong, (select coalesce(sum(l.doanh_thu), 0) from l) as tong_doanh_thu, (select coalesce(sum(l.von_1sp * l.so_luong), 0) from l) as tong_nhap from r)
  select t.khoa, t.san_pham_id, t.ma, t.ten, t.ma_hd, t.hoa_don_id, t.thoi_gian, t.gia_1sp, t.so_luong, t.gia_sau, t.doanh_thu, t.gia_von, t.loi_nhuan, t.tong_dong, t.tong_doanh_thu, t.tong_nhap
    from t order by t.thoi_gian desc nulls last, t.doanh_thu desc nulls last, t.ten, t.khoa limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

select public.khoa_tat_ca_bang();
