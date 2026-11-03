-- 0208 — Tồn quỹ KHÔNG tính tiền Ship COD, y SalonHero (câu 16, 03/11/2026). Chỉ đổi điều kiện lọc của view v_so_quy (giữ nguyên cột).
-- Bằng chứng (đọc SalonHero 03/11): HĐ 21020660 (Vinh) trả nợ 1.120.000 bằng COD ngày 19/02/2021. getCashBook liệt kê dòng đó trong sổ ngân hàng,
-- nhưng getOpeningAndClosingBalanceAmount (Vinh, 19/02/2021) cho tồn ngân hàng cuối ngày 3.742.976.750 = tổng sổ ngân hàng − 1.120.000,
-- và getTotalRevenueByCashAndBank hôm nay (98.066.860.581) cũng = tổng sổ ngân hàng − 1.120.000. Tức SalonHero KHÔNG cộng COD vào quỹ nào
-- (tiền còn ở bên giao hàng; kế toán Amia tự xử lý bằng phiếu chi tay CHI2105280333). AMIA làm y vậy: phuong_thuc 'ship_cod' (thêm ở 0199) không vào quỹ.
create or replace view public.v_so_quy with (security_invoker = true) as
  select s.id::text as id, s.ma, s.ngay, s.quy_id, q.chi_nhanh_id, q.loai as loai_quy, s.loai, s.so_tien,
         case when s.loai in ('thu', 'nap') then s.so_tien else -s.so_tien end as bien_dong,
         lt.ten as loai_thu_chi, s.noi_dung, s.doi_tuong, s.nguon, s.nguoi_id, s.tao_luc, s.phieu_goc_id,
         exists (select 1 from public.so_quy d where d.phieu_goc_id = s.id) as da_dao, true as sua_duoc,
         s.sh_id, s.sh_nguoi_tao as nguoi_ten
    from public.so_quy s
    join public.quy q on q.id = s.quy_id
    left join public.loai_thu_chi lt on lt.id = s.loai_thu_chi_id
  union all
  select t.id::text, h.ma, t.ngay, q.id, h.chi_nhanh_id, q.loai,
         case t.loai when 'thu' then 'thu' else 'chi' end, t.so_tien,
         case t.loai when 'thu' then t.so_tien else -t.so_tien end,
         case t.loai when 'thu' then 'Bán hàng' else 'Hoàn tiền khách' end,
         case t.loai when 'thu' then 'Thu tiền hoá đơn ' else 'Hoàn tiền hoá đơn ' end || h.ma, null, 'ban_hang', t.nguoi_id, t.tao_luc, null, false, false,
         null::bigint, null::text
    from public.thanh_toan t
    join public.hoa_don h on h.id = t.hoa_don_id
    join public.quy q on q.chi_nhanh_id = h.chi_nhanh_id
     and q.loai = case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end
   where t.phuong_thuc not in ('the_tien', 'ship_cod');

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
