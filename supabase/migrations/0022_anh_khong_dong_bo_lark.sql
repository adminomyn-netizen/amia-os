-- Ảnh chuyển hàng loạt từ SalonHero (hàng trăm nghìn ảnh) không đẩy sang Base Lark: thêm trạng thái 'khong_dong_bo' để tiến trình đồng bộ bỏ qua.
alter table public.khach_anh drop constraint khach_anh_lark_trang_thai_check;
alter table public.khach_anh add constraint khach_anh_lark_trang_thai_check check (lark_trang_thai in ('cho','dang_gui','xong','loi','khong_dong_bo'));
select public.khoa_tat_ca_bang();
