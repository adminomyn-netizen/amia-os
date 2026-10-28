-- 0110 — Chỉ mục nhỏ cho nhắc chăm sóc ĐANG NHẮC (28/10/2026): khối báo cáo ngày ở trang chủ đếm nhắc đến hạn/quá hạn,
-- trước đây quét cả bảng 60 nghìn dòng (có lúc mất 27 giây khi DB bận). Chỉ mục từng phần chỉ chứa các dòng còn đang nhắc.
create index if not exists khach_nhac_dang_nhac_ngay_idx on public.khach_nhac (ngay_nhac) where trang_thai = 'dang_nhac' and not la_lich_su;
