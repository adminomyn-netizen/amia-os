-- 0031 — YÊU CẦU TẠO TÀI KHOẢN (trang /dang-ky công khai). Người chưa có tài khoản gửi họ tên, email, SĐT, chi nhánh;
-- KHÔNG tạo tài khoản và KHÔNG cấp quyền gì cho tới khi Kỹ thuật duyệt (chọn vai trò) trong Nhân viên. Không lưu mật khẩu.
create table public.yeu_cau_tai_khoan (
  id uuid primary key default gen_random_uuid(),
  ho_ten text not null check (char_length(ho_ten) between 2 and 100),
  email text not null check (char_length(email) between 5 and 160),
  dien_thoai text check (dien_thoai is null or char_length(dien_thoai) between 9 and 15),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  vi_tri text check (vi_tri is null or char_length(vi_tri) <= 100),
  trang_thai text not null default 'cho_duyet' check (trang_thai in ('cho_duyet', 'da_duyet', 'tu_choi')),
  nguoi_xu_ly_id uuid references public.nhan_vien (id),
  xu_ly_luc timestamptz,
  ly_do text,
  tao_luc timestamptz not null default now()
);
create unique index yeu_cau_tk_cho_duyet_email on public.yeu_cau_tai_khoan (lower(email)) where trang_thai = 'cho_duyet';
create index yeu_cau_tk_tt_idx on public.yeu_cau_tai_khoan (trang_thai, tao_luc desc);

select public.khoa_tat_ca_bang();
