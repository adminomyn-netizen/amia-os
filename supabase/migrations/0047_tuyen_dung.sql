-- 0047 — TUYỂN DỤNG (bê từ Omyn HRM sang, theo Base "Tuyển dụng" của MSC): yêu cầu tuyển dụng → tiếp nhận → tin tuyển → ứng viên theo bước → đăng tin theo kênh + chi phí → báo cáo.
-- Xem: quyền cong.xem; thêm/sửa/chuyển bước: quyền cong.sua (Hành chính nhân sự, quản lý). Chỉ máy chủ (khoá service) đọc/ghi, FORCE RLS như các bảng khác.

create table public.yeu_cau_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  vi_tri text not null check (char_length(vi_tri) between 2 and 120),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  so_luong int not null default 1 check (so_luong between 1 and 99),
  loai_tuyen text not null default 'Trong định biên' check (loai_tuyen in ('Thay thế', 'Trong định biên', 'Ngoài định biên', 'Thời vụ')),
  thay_the_cho text,
  muc_luong text,
  yeu_cau_chinh text,
  han_can_nhan_su date,
  nguoi_yeu_cau_id uuid references public.nhan_vien (id) on delete set null,
  trang_thai text not null default 'Chờ tiếp nhận' check (trang_thai in ('Chờ tiếp nhận', 'Đã tiếp nhận', 'Đang đăng tin', 'Hoàn thành', 'Từ chối', 'Huỷ')),
  nguoi_tiep_nhan_id uuid references public.nhan_vien (id) on delete set null,
  ngay_tiep_nhan timestamptz,
  ly_do_tu_choi text,
  ngay_hoan_thanh timestamptz,
  tao_luc timestamptz not null default now()
);
create index yeu_cau_tuyen_dung_tt_idx on public.yeu_cau_tuyen_dung (trang_thai, tao_luc desc);

create table public.tin_tuyen_dung (
  id uuid primary key default gen_random_uuid(),
  vi_tri text not null check (char_length(vi_tri) between 2 and 120),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  yeu_cau_id uuid references public.yeu_cau_tuyen_dung (id) on delete set null,
  so_luong_can int not null default 1 check (so_luong_can between 1 and 99),
  han_nop date,
  mo_ta text,
  trang_thai text not null default 'Đang tuyển' check (trang_thai in ('Đang tuyển', 'Đang phỏng vấn', 'Đã đóng')),
  tao_luc timestamptz not null default now()
);
create index tin_tuyen_dung_yc_idx on public.tin_tuyen_dung (yeu_cau_id);

create table public.ung_vien (
  id uuid primary key default gen_random_uuid(),
  tin_id uuid not null references public.tin_tuyen_dung (id) on delete cascade,
  ho_ten text not null check (char_length(ho_ten) between 2 and 80),
  dien_thoai text,
  email text,
  nguon text,
  trang_thai text not null default 'Mới nộp' check (trang_thai in ('Mới nộp', 'Hẹn phỏng vấn', 'Vòng 1', 'Vòng 2', 'Đề nghị', 'Nhận việc', 'Không đạt')),
  ngay_nhan_ho_so date not null default current_date,
  ngay_phong_van date,
  ngay_nhan_viec date,
  ly_do_khong_dat text,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index ung_vien_tin_idx on public.ung_vien (tin_id, trang_thai);

create table public.dang_tin_kenh (
  id uuid primary key default gen_random_uuid(),
  tin_id uuid not null references public.tin_tuyen_dung (id) on delete cascade,
  kenh text not null check (kenh in ('Facebook', 'Zalo', 'TopCV', 'Website', 'LinkedIn', 'VietnamWorks', 'Nội bộ', 'Khác')),
  link_bai text,
  ngay_dang date not null default current_date,
  chi_phi bigint not null default 0 check (chi_phi >= 0),
  trang_thai text not null default 'Đang đăng' check (trang_thai in ('Đang đăng', 'Đã gỡ')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index dang_tin_kenh_tin_idx on public.dang_tin_kenh (tin_id);

alter table public.thong_bao_trang_thai drop constraint thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam', 'tonam', 'tdyc', 'tduv', 'tdtin'));

select public.khoa_tat_ca_bang();
