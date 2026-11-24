-- 0347: trạng thái "Đã mất" tính lại cho đúng (vụ chị Phan Thị Phương Thảo KHAVI26013315: Hạng Vàng, chi 35tr trong 12 tháng vẫn bị gắn "Đã mất").
-- Trước đây: >180 ngày không có hoá đơn/lịch hoàn thành và không còn thẻ liệu trình đang dùng là tự "mất", kể cả khi khách mới chi lớn.
-- Nay khách chỉ tự "mất" khi ĐỦ cả 4 điều kiện: (1) không chi gì trong 12 tháng (cùng cửa sổ tính Hạng),
-- (2) không còn thẻ nào dùng được (liệu trình HOẶC thẻ tiền/cọc còn số dư), (3) không có lịch hẹn nào còn hiệu lực (kể cả sắp tới),
-- (4) không phát sinh gì quá ngày_mat_khach (mặc định 180 ngày). Nhân viên vẫn bấm "Đánh dấu đã mất" tay như cũ (danh_dau_mat luôn thắng).
drop view if exists public.v_khach_hang;  -- k.* đã nở thêm cột sau 0013 nên không thay tại chỗ được; không view nào phụ thuộc
create view public.v_khach_hang with (security_invoker = true) as
select k.*,
  coalesce(c.chi_12_thang, 0)::bigint as chi_12_thang,
  (select h.ten from public.hang_khach h
    where h.tu_so_tien <= greatest(coalesce(c.chi_12_thang, 0), coalesce((select g.tu_so_tien from public.hang_khach g where g.ten = k.hang_goc), 0))
    order by h.tu_so_tien desc limit 1) as hang,
  coalesce(th.dang_dung, 0)::int as so_the_dang_dung,
  case
    when k.danh_dau_mat then 'mat'
    when coalesce(th.dang_dung, 0) > 0 then 'dang_lieu_trinh'
    when coalesce(c.chi_12_thang, 0) = 0
         and coalesce(th.con_the, 0) = 0
         and greatest(k.tao_luc::date, coalesce(k.lan_den_cuoi, k.tao_luc::date), coalesce(hd.cuoi, k.tao_luc::date), coalesce(lh.cuoi, k.tao_luc::date), coalesce(lc.cuoi, k.tao_luc::date))
             < public.hom_nay() - (select coalesce(gia_tri::int, 180) from public.cau_hinh where khoa = 'ngay_mat_khach') then 'mat'
    when coalesce(th.da_tung, 0) > 0 then 'het_lieu_trinh'
    when hd.cuoi is not null or lh.cuoi is not null or k.lan_den_cuoi is not null then 'da_den'
    else 'lead'
  end as trang_thai
from public.khach_hang k
left join lateral (
  select sum(greatest(d.tong_hang - d.giam_gia_don, 0)) filter (where d.ngay_hd >= public.hom_nay() - 365) as chi_12_thang, max(d.ngay_hd) as cuoi
    from public.hoa_don d where d.khach_id = k.id and d.trang_thai = 'hoan_thanh' and not d.la_so_du_dau) c on true
left join lateral (
  select max(d.ngay_hd) as cuoi from public.hoa_don d where d.khach_id = k.id and d.trang_thai = 'hoan_thanh' and not d.la_so_du_dau) hd on true
left join lateral (
  select max(l.bat_dau::date) as cuoi from public.lich_hen l where l.khach_id = k.id and l.trang_thai = 'hoan_thanh') lh on true
left join lateral (  -- lịch còn hiệu lực (chưa huỷ/không đến), kể cả lịch sắp tới: chỉ dùng để KHÔNG coi là mất, không đổi nhãn Đã đến
  select max(l.bat_dau::date) as cuoi from public.lich_hen l where l.khach_id = k.id and l.trang_thai not in ('huy', 'khong_den')) lc on true
left join lateral (
  select count(*) filter (where v.loai = 'lan' and v.tinh_trang in ('hoat_dong','sap_het')) as dang_dung,
         count(*) filter (where v.tinh_trang in ('hoat_dong','sap_het')) as con_the,
         count(*) filter (where v.loai = 'lan') as da_tung
    from public.v_the_khach v where v.khach_id = k.id) th on true;

select public.khoa_tat_ca_bang();
