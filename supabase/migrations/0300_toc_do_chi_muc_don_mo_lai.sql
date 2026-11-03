-- 0300 — TỐC ĐỘ: chỉ mục riêng cho ô "Chờ thanh toán" ở Bán hàng (03/11/2026).
-- Trang /ban-hang đếm hoá đơn đã mở lại để sửa (trang_thai='nhap', mo_lai_luc có, không phải lịch sử) theo chi nhánh.
-- Trước: không có chỉ mục khớp → quét chỉ mục (chi_nhanh_id, ngay_hd) cả chục nghìn dòng, đo 1,8–18 s trên gói Free.
-- Sau: chỉ mục từng phần chỉ chứa đúng các đơn đang mở lại (gần như rỗng) → đếm tức thì. Không đổi dữ liệu, không đổi kết quả.
create index if not exists hoa_don_mo_lai_idx on public.hoa_don (chi_nhanh_id)
  where trang_thai = 'nhap' and mo_lai_luc is not null and la_lich_su = false;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
