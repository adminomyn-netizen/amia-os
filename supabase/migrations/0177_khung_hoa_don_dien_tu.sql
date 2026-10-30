-- 0177 — KHUNG hoá đơn điện tử (trang /tai-chinh/hoa-don-dien-tu). Chưa nối nhà cung cấp thật: chỉ ghi tay số hoá đơn đã xuất ở phần mềm ngoài
-- và lưu sẵn thông tin kết nối (Viettel S-Invoice / MISA meInvoice / VNPT Invoice) để sau này chỉ cần cắm khoá.
-- • hoa_don: tái dùng vat_hd_so / vat_hd_ky_hieu / vat_hd_luc / vat_hd_nguoi_id có sẵn (0067); thêm ngày xuất, mẫu số, mã/đường dẫn tra cứu.
-- • ket_noi_hoa_don_dien_tu: MỘT dòng duy nhất; khoá/mật khẩu lưu dạng đã mã hoá (AES-256-GCM, khoá suy ra từ khoá máy chủ), không trả về trình duyệt.

alter table public.hoa_don
  add column vat_hd_ngay date,                                   -- ngày ghi trên hoá đơn điện tử (khác vat_hd_luc = lúc nhân viên ghi vào hệ thống)
  add column vat_hd_mau_so text check (vat_hd_mau_so is null or char_length(vat_hd_mau_so) <= 20),
  add column vat_hd_tra_cuu text check (vat_hd_tra_cuu is null or char_length(vat_hd_tra_cuu) <= 300);

-- Bản ghi đã có từ trước (ghi ở trang hoá đơn): lấy ngày ghi nhận theo giờ Việt Nam làm ngày xuất tạm.
update public.hoa_don set vat_hd_ngay = (vat_hd_luc at time zone 'Asia/Ho_Chi_Minh')::date where vat_hd_luc is not null and vat_hd_ngay is null;

create table public.ket_noi_hoa_don_dien_tu (
  id boolean primary key default true check (id),
  nha_cung_cap text not null check (nha_cung_cap in ('viettel', 'misa', 'vnpt', 'khac')),
  ma_so_thue text not null check (ma_so_thue ~ '^[0-9]{10}(-[0-9]{3})?$'),
  ten_dang_nhap text check (ten_dang_nhap is null or char_length(ten_dang_nhap) <= 100),
  khoa_ma_hoa text,                                              -- mật khẩu / khoá API đã mã hoá; null = chưa có
  khoa_cuoi4 text check (khoa_cuoi4 is null or char_length(khoa_cuoi4) <= 4),   -- 4 ký tự cuối để hiện "đã lưu", không giải mã khi xem
  mau_so_mac_dinh text check (mau_so_mac_dinh is null or char_length(mau_so_mac_dinh) <= 20),
  ky_hieu_mac_dinh text check (ky_hieu_mac_dinh is null or char_length(ky_hieu_mac_dinh) <= 20),
  dia_chi_may_chu text check (dia_chi_may_chu is null or (dia_chi_may_chu ~ '^https://' and char_length(dia_chi_may_chu) <= 300)),
  nguoi_id uuid references public.nhan_vien (id) on delete set null,
  sua_luc timestamptz not null default now()
);

select public.khoa_tat_ca_bang();
