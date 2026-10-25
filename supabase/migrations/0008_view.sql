-- 0008 — VIEW: hạng khách + trạng thái khách TỰ TÍNH, số dư thẻ, tồn kho, lệch phiếu cấp.
create view public.v_the_khach with (security_invoker = true) as
select t.*,
  coalesce(s.so_buoi, 0)::int as so_buoi_con,
  coalesce(s.so_tien, 0)::bigint as so_du_tien,
  case
    when t.trang_thai = 'thu_hoi' then 'thu_hoi'
    when t.trang_thai = 'khoa' then 'khoa'
    when t.han_dung is not null and t.han_dung < public.hom_nay() then 'het_han'
    when t.loai = 'lan' and coalesce(s.so_buoi, 0) <= 0 then 'hoan_thanh'
    when t.loai = 'tien' and coalesce(s.so_tien, 0) <= 0 then 'hoan_thanh'
    when t.loai = 'lan' and coalesce(s.so_buoi, 0) <= (select coalesce(gia_tri::int, 2) from public.cau_hinh where khoa = 'the_sap_het_buoi') then 'sap_het'
    else 'hoat_dong'
  end as tinh_trang
from public.the_khach t
left join lateral (select sum(so_buoi) as so_buoi, sum(so_tien) as so_tien from public.the_so_cai where the_id = t.id) s on true;

create view public.v_khach_hang with (security_invoker = true) as
select k.*,
  coalesce(c.chi_12_thang, 0)::bigint as chi_12_thang,
  (select h.ten from public.hang_khach h where h.tu_so_tien <= coalesce(c.chi_12_thang, 0) order by h.tu_so_tien desc limit 1) as hang,
  coalesce(th.dang_dung, 0)::int as so_the_dang_dung,
  case
    when k.danh_dau_mat then 'mat'
    when coalesce(th.dang_dung, 0) > 0 then 'dang_lieu_trinh'
    when greatest(k.tao_luc::date, coalesce(hd.cuoi, k.tao_luc::date), coalesce(lh.cuoi, k.tao_luc::date))
         < public.hom_nay() - (select coalesce(gia_tri::int, 180) from public.cau_hinh where khoa = 'ngay_mat_khach') then 'mat'
    when coalesce(th.da_tung, 0) > 0 then 'het_lieu_trinh'
    when hd.cuoi is not null or lh.cuoi is not null then 'da_den'
    else 'lead'
  end as trang_thai
from public.khach_hang k
left join lateral (
  select sum(greatest(d.tong_hang - d.giam_gia_don, 0)) filter (where d.ngay_hd >= public.hom_nay() - 365) as chi_12_thang, max(d.ngay_hd) as cuoi
    from public.hoa_don d where d.khach_id = k.id and d.trang_thai = 'hoan_thanh') c on true
left join lateral (
  select max(d.ngay_hd) as cuoi from public.hoa_don d where d.khach_id = k.id and d.trang_thai = 'hoan_thanh') hd on true
left join lateral (
  select max(l.bat_dau::date) as cuoi from public.lich_hen l where l.khach_id = k.id and l.trang_thai = 'hoan_thanh') lh on true
left join lateral (
  select count(*) filter (where v.loai = 'lan' and v.tinh_trang in ('hoat_dong','sap_het')) as dang_dung,
         count(*) filter (where v.loai = 'lan') as da_tung
    from public.v_the_khach v where v.khach_id = k.id) th on true;

create view public.v_ton_kho with (security_invoker = true) as
select s.chi_nhanh_id, s.san_pham_id, p.ma, p.ten, p.nhom_cap, p.don_vi, p.ton_toi_thieu,
       sum(s.so_luong)::numeric(14,3) as ton,
       (sum(s.so_luong) < p.ton_toi_thieu) as duoi_muc_toi_thieu
from public.kho_so_cai s join public.san_pham p on p.id = s.san_pham_id
group by s.chi_nhanh_id, s.san_pham_id, p.ma, p.ten, p.nhom_cap, p.don_vi, p.ton_toi_thieu;

-- Mỗi dòng phiếu đã làm: dùng thật = cấp − trả; so với định mức.
create view public.v_phieu_cap_lech with (security_invoker = true) as
select d.id as dong_id, d.phieu_id, p.ma as ma_phieu, p.chi_nhanh_id, p.dich_vu_id, p.ktv_id, p.bac_si_id, p.trang_thai, p.lam_xong_luc,
       d.san_pham_id, sp.ten as ten_vat_tu, d.nhom_cap, d.dinh_muc, d.so_cap, d.so_tra,
       (d.so_cap - d.so_tra) as dung_that,
       case when d.dinh_muc > 0 then round(((d.so_cap - d.so_tra) - d.dinh_muc) / d.dinh_muc * 100, 1) end as lech_pct,
       d.ly_do_vuot, d.bac_si_xac_nhan_id,
       (d.so_cap - d.so_tra) * coalesce(d.don_gia, 0) as gia_tri_dung
from public.phieu_cap_dong d join public.phieu_cap p on p.id = d.phieu_id join public.san_pham sp on sp.id = d.san_pham_id
where d.so_tra is not null;
