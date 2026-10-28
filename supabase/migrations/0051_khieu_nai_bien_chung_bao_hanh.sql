-- 0051 — Khiếu nại (QT-11, BM17), biến chứng (QT-12, BM18), bảo hành (BM19, chính sách 4.4) theo Khung nghiệp vụ KD.
--  · Khiếu nại thường: tiếp nhận → phương án (có chi phí thì Quản lý duyệt, người ghi/đề xuất không tự duyệt) → khách xác nhận mới được đóng.
--  · Loại "y khoa" không đóng như khiếu nại thường: chuyển sang biến chứng (QT-12), bác sĩ chủ trì, 100% ca báo lãnh đạo.
--  · Bảo hành: mốc tính từ buổi cuối của dịch vụ; chỉ ghi một dòng khi thật sự làm lại theo bảo hành.
--  · Tham số chưa có trong khung (SLA tiếp nhận, hạn mức bồi thường) để TRỐNG = "chờ chốt", không tự bịa.

alter table public.thong_bao_trang_thai drop constraint thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam', 'tonam', 'knai', 'bchung'));

-- Nhóm dịch vụ có kiểu bảo hành riêng (triệt lông: 1 năm/lần). Gắn theo nhóm, không dò theo tên dịch vụ.
alter table public.dich_vu_nhom add column kieu_bao_hanh text not null default 'chuan' check (kieu_bao_hanh in ('chuan', 'nam_mot_lan'));
update public.dich_vu_nhom set kieu_bao_hanh = 'nam_mot_lan' where ten = 'Triệt lông';

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('bh_thang_moc_1', '3', 'Bảo hành: mốc đầu (tháng). Nguồn: Khung KD 4.4.2'),
  ('bh_thang_moc_2', '6', 'Bảo hành: mốc hai (tháng). Nguồn: Khung KD 4.4.2'),
  ('bh_thang_moc_3', '12', 'Bảo hành: mốc ba (tháng); sau mốc này làm lại theo giá mới. Nguồn: Khung KD 4.4.2'),
  ('bh_ty_le_moc_1', '50', 'Ưu đãi làm lại (% giảm) từ mốc 1 đến mốc 2 (3–6 tháng). Nguồn: Khung KD 4.4.2'),
  ('bh_ty_le_moc_2', '40', 'Ưu đãi làm lại (% giảm) từ mốc 2 đến mốc 3 (6–12 tháng). Nguồn: Khung KD 4.4.2'),
  ('bh_triet_long_thang', '12', 'Triệt lông: bảo hành 1 năm/lần (ngoại lệ). Nguồn: Khung KD 4.4.2. Cách tính "1 lần" còn chờ chị Lâm chốt'),
  ('kn_sla_tiep_nhan_gio', '', 'CHỜ CHỐT: số giờ tối đa phải tiếp nhận khiếu nại (khung ghi "trong SLA" nhưng chưa nêu số). Trống = chưa áp'),
  ('kn_han_muc_tu_xu_ly', '', 'CHỜ CHỐT: mức chi phí tối đa người tiếp nhận tự xử lý. Trống = mọi phương án có chi phí đều phải Quản lý/Chủ duyệt')
on conflict (khoa) do nothing;

create table public.khieu_nai (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  khach_id uuid not null references public.khach_hang (id),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  kenh text not null default 'truc_tiep' check (kenh in ('truc_tiep', 'dien_thoai', 'zalo', 'facebook', 'khac')),
  loai text not null check (loai in ('dich_vu', 'thai_do', 'tai_chinh', 'y_khoa')),
  noi_dung text not null check (length(btrim(noi_dung)) > 0),
  dich_vu_id uuid references public.dich_vu (id),
  hoa_don_id uuid references public.hoa_don (id),
  buoi_id uuid references public.buoi_thuc_hien (id),
  nguoi_tiep_nhan_id uuid not null references public.nhan_vien (id),
  tiep_nhan_luc timestamptz not null default now(),
  trang_thai text not null default 'moi' check (trang_thai in ('moi', 'cho_duyet', 'da_duyet', 'dong', 'chuyen_bc')),
  nguyen_nhan text,
  phuong_an text,
  co_chi_phi boolean not null default false,
  chi_phi bigint not null default 0 check (chi_phi >= 0),
  -- Phương án vượt thẩm quyền tự xử lý (có chi phí và chưa có hạn mức cho phép) thì phải có người duyệt.
  can_duyet boolean not null default false,
  nguoi_de_xuat_id uuid references public.nhan_vien (id),
  de_xuat_luc timestamptz,
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  ly_do_tra_lai text,
  khach_xac_nhan boolean not null default false,
  cach_xac_nhan text check (cach_xac_nhan in ('ky', 'zalo', 'goi')),
  dong_luc timestamptz,
  nguyen_nhan_goc text,
  phong_ngua text,
  tao_luc timestamptz not null default now(),
  -- Đóng vụ việc: khách phải xác nhận (và nói rõ cách xác nhận); phương án cần duyệt thì phải có người duyệt.
  constraint khieu_nai_dong_can_khach_xac_nhan check (trang_thai <> 'dong' or (khach_xac_nhan and cach_xac_nhan is not null and dong_luc is not null)),
  constraint khieu_nai_dong_can_duyet check (trang_thai <> 'dong' or not can_duyet or nguoi_duyet_id is not null),
  -- Khiếu nại y khoa không đi đường khiếu nại thường: chỉ ở trạng thái mới hoặc đã chuyển biến chứng.
  constraint khieu_nai_y_khoa_di_bien_chung check (loai <> 'y_khoa' or trang_thai in ('moi', 'chuyen_bc'))
);
create index khieu_nai_khach_idx on public.khieu_nai (khach_id, tiep_nhan_luc desc);
create index khieu_nai_tt_idx on public.khieu_nai (trang_thai, tiep_nhan_luc);

create function public.khieu_nai_kiem_tra() returns trigger language plpgsql as $$
begin
  if new.nguoi_duyet_id is not null and (new.nguoi_duyet_id = new.nguoi_tiep_nhan_id or new.nguoi_duyet_id = new.nguoi_de_xuat_id) then
    raise exception 'Người ghi nhận hoặc đề xuất phương án không được tự duyệt.';
  end if;
  return new;
end $$;
create trigger khieu_nai_kiem_tra before insert or update on public.khieu_nai for each row execute function public.khieu_nai_kiem_tra();

create table public.bien_chung (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  khach_id uuid not null references public.khach_hang (id),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  dich_vu_id uuid references public.dich_vu (id),
  buoi_id uuid references public.buoi_thuc_hien (id),
  khieu_nai_id uuid references public.khieu_nai (id),
  nguoi_bao_id uuid not null references public.nhan_vien (id),
  bao_luc timestamptz not null default now(),
  dau_hieu text not null check (length(btrim(dau_hieu)) > 0),
  -- 100% ca biến chứng phải báo lãnh đạo: mốc này ghi ngay lúc tạo ca (đồng thời bắn thông báo đẩy).
  bao_lanh_dao_luc timestamptz not null default now(),
  trang_thai text not null default 'moi' check (trang_thai in ('moi', 'dang_xu_ly', 'da_cam_ket', 'dong')),
  bac_si_id uuid references public.nhan_vien (id),
  chan_doan text,
  phuong_an text,
  cam_ket text,
  nguyen_nhan_goc text,
  phong_ngua text,
  dong_luc timestamptz,
  tao_luc timestamptz not null default now(),
  constraint bien_chung_xu_ly_can_bac_si check (trang_thai = 'moi' or (bac_si_id is not null and chan_doan is not null and phuong_an is not null)),
  constraint bien_chung_cam_ket_can_van_ban check (trang_thai not in ('da_cam_ket', 'dong') or cam_ket is not null),
  constraint bien_chung_dong_can_goc check (trang_thai <> 'dong' or (nguyen_nhan_goc is not null and phong_ngua is not null and dong_luc is not null))
);
create index bien_chung_khach_idx on public.bien_chung (khach_id, bao_luc desc);
create index bien_chung_tt_idx on public.bien_chung (trang_thai, bao_luc);
alter table public.khieu_nai add column bien_chung_id uuid references public.bien_chung (id);

-- Ghi nhận một lần làm lại theo bảo hành (BM19). Mốc và % giảm là bản chụp lúc làm lại, không tính lại theo tham số về sau.
create table public.bao_hanh_lan (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id),
  dich_vu_id uuid not null references public.dich_vu (id),
  buoi_cuoi_id uuid references public.buoi_thuc_hien (id),
  ngay_dich_vu_cuoi date not null,
  ngay_lam_lai date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  moc text not null check (moc in ('moc_1', 'moc_2', 'tren_moc_3', 'duoi_moc_1', 'nam_mot_lan')),
  ty_le_giam numeric(5,2) check (ty_le_giam >= 0 and ty_le_giam <= 100),
  khieu_nai_id uuid references public.khieu_nai (id),
  bien_chung_id uuid references public.bien_chung (id),
  ghi_chu text,
  nguoi_ghi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index bao_hanh_lan_khach_idx on public.bao_hanh_lan (khach_id, ngay_lam_lai desc);

select public.khoa_tat_ca_bang();
