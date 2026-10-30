-- 0182 — Danh sách tài khoản nhận tiền sửa được (chị Dung, kế toán, 30/10/2026, việc 61477): tiền khách chuyển về 3 tài khoản OCB, Techcombank, VCB.
-- Dùng bảng tai_khoan_ngan_hang có sẵn (Cài đặt › Tài khoản Ngân Hàng): thêm / sửa / ẩn (hoat_dong) / xoá ở đó; Thu ngân và bộ lọc Hoá đơn điện tử đọc từ đây, không cố định trong mã.
-- Seed 3 tài khoản chỉ khi bảng đang TRỐNG (chưa biết số tài khoản và chủ tài khoản: để trống, kế toán điền sau). Chạy lại không tạo thêm.
alter table public.tai_khoan_ngan_hang alter column so_tai_khoan set default '', alter column chu_tai_khoan set default '';

insert into public.tai_khoan_ngan_hang (ngan_hang, so_tai_khoan, chu_tai_khoan, ghi_chu, tao_luc)
select v.ngan_hang, '', '', v.ghi_chu, now() - (4 - v.thu_tu) * interval '1 minute'
from (values
  ('Ngân hàng OCB', 'Chủ yếu thu dịch vụ tiêm, cấy', 1),
  ('Ngân hàng Techcombank', null, 2),
  ('Ngân hàng Vietcombank', null, 3)
) as v(ngan_hang, ghi_chu, thu_tu)
where not exists (select 1 from public.tai_khoan_ngan_hang);

select public.khoa_tat_ca_bang();
