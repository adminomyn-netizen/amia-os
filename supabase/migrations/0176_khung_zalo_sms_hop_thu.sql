-- 0176 — Khung Zalo OA / SMS (nhắn nhắc lịch, chăm sóc, sinh nhật) và Hộp thư đa kênh (Zalo OA, Messenger).
-- Chưa gọi API thật: khoá nhà cung cấp lưu mã hoá (AES-256-GCM, khoá suy ra từ khoá máy chủ), tin chỉ xếp hàng đợi / lưu hội thoại.
-- Chỉ máy chủ (khoá service) đọc/ghi, FORCE RLS như các bảng khác (cuối tệp).

-- Kết nối bên thứ ba: mỗi kênh một dòng. cau_hinh_ma_hoa là JSON các khoá đã mã hoá, không bao giờ trả về trình duyệt.
create table public.ket_noi_ben_thu_ba (
  kenh text primary key check (kenh in ('zalo_oa', 'sms', 'messenger')),
  cau_hinh_ma_hoa text not null,
  ten_hien_thi text,
  trang_thai text not null default 'chua_noi' check (trang_thai in ('chua_noi', 'da_noi')),
  nguoi_id uuid references public.nhan_vien (id) on delete set null,
  sua_luc timestamptz not null default now()
);

-- Mẫu tin: biến {{ten}} {{ngay_hen}} {{gio_hen}} {{co_so}}. Mới cài đều TẮT.
create table public.tin_nhan_mau (
  ma text primary key,
  kenh text not null default 'zalo_oa' check (kenh in ('zalo_oa', 'sms')),
  ten text not null check (char_length(ten) between 2 and 100),
  noi_dung text not null check (char_length(noi_dung) between 2 and 1000),
  bat boolean not null default false,
  sua_luc timestamptz not null default now()
);
insert into public.tin_nhan_mau (ma, kenh, ten, noi_dung, bat) values
  ('nhac_lich', 'zalo_oa', 'Nhắc lịch trước 1 ngày', 'AMIA xin chào anh/chị {{ten}}. Ngày mai, {{ngay_hen}} lúc {{gio_hen}}, anh/chị có lịch hẹn tại AMIA {{co_so}}. Nếu cần đổi giờ, anh/chị nhắn lại để AMIA sắp xếp giúp anh/chị nhé.', false),
  ('cam_on', 'zalo_oa', 'Cảm ơn sau buổi hẹn', 'AMIA cảm ơn anh/chị {{ten}} đã đến với AMIA {{co_so}} hôm nay. Nếu anh/chị có điều gì chưa rõ sau buổi hẹn, anh/chị cứ nhắn lại, AMIA luôn sẵn lòng giải đáp.', false),
  ('sinh_nhat', 'zalo_oa', 'Chúc mừng sinh nhật', 'AMIA chúc anh/chị {{ten}} một sinh nhật nhiều sức khoẻ và niềm vui. Cảm ơn anh/chị đã đồng hành cùng AMIA {{co_so}}.', false),
  ('tai_kham', 'zalo_oa', 'Nhắc tái khám', 'AMIA xin chào anh/chị {{ten}}. Đã đến lúc anh/chị nên tái khám để theo dõi kết quả. Anh/chị muốn hẹn vào ngày nào, anh/chị nhắn lại để AMIA giữ lịch giúp anh/chị tại {{co_so}}.', false);

-- Hàng đợi tin: chỉ xếp hàng, chưa có bộ gửi tự động. Khách có khong_gui_zns thì không bao giờ được xếp.
create table public.tin_nhan_hang_doi (
  id uuid primary key default gen_random_uuid(),
  kenh text not null check (kenh in ('zalo_oa', 'sms')),
  den_so_dien_thoai text not null check (char_length(den_so_dien_thoai) between 9 and 15),
  khach_id uuid references public.khach_hang (id) on delete set null,
  chi_nhanh_id uuid references public.chi_nhanh (id) on delete set null,
  mau_ma text references public.tin_nhan_mau (ma) on delete set null,
  noi_dung text not null check (char_length(noi_dung) between 1 and 2000),
  trang_thai text not null default 'cho_gui' check (trang_thai in ('cho_gui', 'da_gui', 'loi', 'huy')),
  loi text,
  nguoi_tao_id uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now(),
  gui_luc timestamptz
);
create index tin_nhan_hang_doi_tt_idx on public.tin_nhan_hang_doi (trang_thai, tao_luc desc);
create index tin_nhan_hang_doi_khach_idx on public.tin_nhan_hang_doi (khach_id);
create index tin_nhan_hang_doi_cn_idx on public.tin_nhan_hang_doi (chi_nhanh_id);

-- Hộp thư đa kênh.
create table public.hop_thu_hoi_thoai (
  id uuid primary key default gen_random_uuid(),
  kenh text not null check (kenh in ('zalo_oa', 'messenger')),
  ma_ngoai text not null check (char_length(ma_ngoai) between 1 and 200),
  ten_khach text,
  khach_id uuid references public.khach_hang (id) on delete set null,
  chi_nhanh_id uuid references public.chi_nhanh (id) on delete set null,
  tin_cuoi text,
  tin_cuoi_luc timestamptz,
  chua_doc int not null default 0 check (chua_doc >= 0),
  tao_luc timestamptz not null default now(),
  unique (kenh, ma_ngoai)
);
create index hop_thu_hoi_thoai_moi_idx on public.hop_thu_hoi_thoai (tin_cuoi_luc desc nulls last);
create index hop_thu_hoi_thoai_cn_idx on public.hop_thu_hoi_thoai (chi_nhanh_id);

create table public.hop_thu_tin (
  id uuid primary key default gen_random_uuid(),
  hoi_thoai_id uuid not null references public.hop_thu_hoi_thoai (id) on delete cascade,
  huong text not null check (huong in ('den', 'di')),
  noi_dung text not null check (char_length(noi_dung) between 1 and 4000),
  trang_thai text not null default 'da_nhan' check (trang_thai in ('da_nhan', 'cho_gui', 'da_gui', 'loi')),
  nguoi_id uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index hop_thu_tin_ht_idx on public.hop_thu_tin (hoi_thoai_id, tao_luc);

select public.khoa_tat_ca_bang();
