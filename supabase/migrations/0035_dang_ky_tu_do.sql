-- 0035 — ĐĂNG KÝ TỰ DO (chị Lâm 27/10/2026): đăng ký xong có tài khoản dùng được ngay, không qua bước duyệt, vai trò mặc định "Nhân viên"; Kỹ thuật chỉnh vai trò/vị trí sau.
-- Vai trò nhan_vien chỉ có quyền dùng Nơi làm việc (việc, chấm công, đề xuất, phiếu của mình) — không đọc được khách, doanh thu, kho, sổ quỹ.
-- Có công tắc cau_hinh 'dang_ky.mo' ('1' bật, '0' tắt) để Kỹ thuật tắt đăng ký tự do khi cần. Bỏ bảng yêu cầu chờ duyệt của 0031 (chưa có dữ liệu).
alter table public.nhan_vien drop constraint nhan_vien_vai_tro_check;
alter table public.nhan_vien add constraint nhan_vien_vai_tro_check check (vai_tro in ('ky_thuat', 'quan_ly', 'le_tan', 'thu_ngan', 'tu_van', 'bac_si', 'ktv', 'thu_kho', 'ke_toan', 'marketing', 'nha_dau_tu', 'nhan_vien'));
drop table public.yeu_cau_tai_khoan;
insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values ('dang_ky.mo', '1', 'Cho phép người mới tự đăng ký tại /dang-ky (vai trò Nhân viên, dùng được ngay). 0 = tắt.') on conflict (khoa) do nothing;
select public.khoa_tat_ca_bang();
