-- 0323 — Hai việc chị Lâm chốt 10/11/2026, làm như SalonHero:
-- (1) "Xác nhận với Kế toán" trên hoá đơn (SalonHero: order.accountant_confirm_date, nút ở chi tiết hoá đơn đã hoàn thành, dấu tích ở danh sách).
--     SalonHero chỉ lưu ngày; AMIA lưu thêm AI xác nhận. Chỉ ghi khi người dùng bấm (Server Action xacNhanKeToan), có nhật ký.
-- (2) Tài khoản ngân hàng nhận tiền của TỪNG khoản thu (SalonHero: paymentHistory.account_number / account_owner).
--     thanh_toan.ngan_hang (0179, tên ngắn) vẫn ghi song song để sổ quỹ / lọc hoá đơn điện tử / báo cáo cũ chạy nguyên;
--     thanh_toan.tai_khoan_id chỉ ra đúng tài khoản (Vietcombank có 3 tài khoản khác chủ, tên ngân hàng không đủ phân biệt).
-- Chỉ THÊM CỘT + chỉ mục nhỏ + view thêm cột cuối. thanh_toan vẫn chỉ-thêm (trigger chặn sửa); dữ liệu SalonHero cũ được bù bằng
-- scripts/chuyen-salonhero/bu-tai-khoan-thanh-toan.mjs (sao lưu trước, tắt trigger đúng giao dịch đó).

alter table public.hoa_don
  add column if not exists ke_toan_xac_nhan_luc timestamptz,
  add column if not exists ke_toan_xac_nhan_nguoi_id uuid references public.nhan_vien(id);

alter table public.thanh_toan
  add column if not exists tai_khoan_id uuid references public.tai_khoan_ngan_hang(id) on delete restrict;
create index if not exists thanh_toan_tai_khoan_idx on public.thanh_toan (tai_khoan_id, ngay) where tai_khoan_id is not null;

-- Danh sách hoá đơn: lọc "Đã / Chưa xác nhận kế toán" (thêm cột ở CUỐI view, giữ nguyên các cột cũ).
create or replace view public.v_hoa_don_loc with (security_invoker = true) as
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
       exists (select 1 from public.hoa_don_dong d where d.hoa_don_id = h.id and d.loai = 'dich_vu' and d.the_khach_sh_id is not null) as dung_the_lan,
       h.ke_toan_xac_nhan_luc
  from public.hoa_don h;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
