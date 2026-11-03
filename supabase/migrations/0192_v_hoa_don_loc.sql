-- 0192 — Bộ lọc danh sách hoá đơn như SalonHero (3/11/2026). CHỈ THÊM một view đọc, không đổi bảng, không đổi sổ cái.
-- v_hoa_don_loc = các cột hoá đơn màn Danh sách/Excel cần + 7 cột tra nhanh để lọc mà không kéo hàng nghìn mã về máy chủ web:
--   nv_phuc_vu / nv_tu_van / nv_ban : mã nhân viên đứng từng vai ở BẤT KỲ dòng nào của hoá đơn (lọc "Tên nhân viên" + vai)
--   hinh_thuc                       : các phương thức đã THU của hoá đơn (tien_mat / chuyen_khoan / quet_the / the_tien)
--   mua_the_lan / mua_the_tien      : hoá đơn có dòng bán thẻ liệu trình / thẻ tiền
--   dung_the_lan                    : hoá đơn có dòng dịch vụ dùng buổi của thẻ liệu trình đã có
-- Dòng nhập từ SalonHero có loai_goc (SERVICE:USING = thẻ lần, SERVICE:MONEY = thẻ tiền, đúng như script chuyen-salonhero/buoc2-hoa-don.mjs ghi);
-- dòng tạo ở AMIA (loai_goc trống) lấy loại thẻ theo gói thẻ.
create view public.v_hoa_don_loc with (security_invoker = true) as
select h.id, h.ma, h.sh_ma, h.ngay_hd, h.trang_thai, h.tong_hang, h.giam_gia_don, h.giam_diem, h.giam_voucher, h.vat_pct, h.vat_tien, h.phu_phi, h.tip,
       h.tong_phai_thu, h.da_thu, h.con_no, h.tien_tru_the, h.vat_hd_luc, h.vat_hd_so, h.vat_hd_ky_hieu, h.ghi_chu, h.ly_do_huy, h.la_lich_su, h.la_so_du_dau,
       h.tao_luc, h.chot_luc, h.khach_id, h.nguoi_lap_id, h.chi_nhanh_id, h.thu_ngan_ten,
       coalesce((select array_agg(distinct n.nhan_vien_id) from public.hoa_don_dong d join public.dong_nhan_vien n on n.dong_id = d.id
                  where d.hoa_don_id = h.id and n.vai = 'phuc_vu'), '{}'::uuid[]) as nv_phuc_vu,
       coalesce((select array_agg(distinct n.nhan_vien_id) from public.hoa_don_dong d join public.dong_nhan_vien n on n.dong_id = d.id
                  where d.hoa_don_id = h.id and n.vai = 'tu_van'), '{}'::uuid[]) as nv_tu_van,
       coalesce((select array_agg(distinct n.nhan_vien_id) from public.hoa_don_dong d join public.dong_nhan_vien n on n.dong_id = d.id
                  where d.hoa_don_id = h.id and n.vai = 'ban'), '{}'::uuid[]) as nv_ban,
       coalesce((select array_agg(distinct t.phuong_thuc) from public.thanh_toan t where t.hoa_don_id = h.id and t.loai = 'thu'), '{}'::text[]) as hinh_thuc,
       exists (select 1 from public.hoa_don_dong d left join public.goi_the g on g.id = d.goi_id
                where d.hoa_don_id = h.id and d.loai = 'goi_the' and (d.loai_goc = 'SERVICE:USING' or (d.loai_goc is null and g.loai = 'lan'))) as mua_the_lan,
       exists (select 1 from public.hoa_don_dong d left join public.goi_the g on g.id = d.goi_id
                where d.hoa_don_id = h.id and d.loai = 'goi_the' and (d.loai_goc = 'SERVICE:MONEY' or (d.loai_goc is null and g.loai = 'tien'))) as mua_the_tien,
       exists (select 1 from public.hoa_don_dong d where d.hoa_don_id = h.id and d.loai = 'dich_vu' and d.the_khach_sh_id is not null) as dung_the_lan
  from public.hoa_don h;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
