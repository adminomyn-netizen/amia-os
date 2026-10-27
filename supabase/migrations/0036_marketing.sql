-- 0036 — MARKETING (theo MAR-CAMP-01 + SALES-PROC-01/02 của MSC, docs/msc-lark/marketing-dich-vu-van-ban.md): nguồn lead, lead + phễu, chiến dịch, quảng cáo theo ngày,
-- nội dung, đối tác giới thiệu (CTV/KOL), link theo dõi + mã QR.
-- Quy tắc lấy từ SOP: không xoá lead (đổi trạng thái + lý do); kiểm trùng theo số điện thoại; owner phải xác nhận trong 5 phút (quá hạn vào danh sách cảnh báo);
-- không dùng nhãn Hot/Warm/Cold; "khách đến" và doanh thu lấy từ lịch hẹn/hoá đơn do chi nhánh và thu ngân ghi, Marketing không tự xác nhận.
-- Danh sách trạng thái là bản SOP nháp (v0.3) nên để ở check có thể đổi bằng migration; nguồn lead là bảng cấu hình.
create table public.nguon_lead (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  nhom text not null default 'khac',
  thu_tu int not null default 0,
  hoat_dong boolean not null default true
);
insert into public.nguon_lead (ma, ten, nhom, thu_tu) values
  ('fanpage', 'Fanpage', 'online', 1), ('zalo', 'Zalo', 'online', 2), ('website', 'Website', 'online', 3), ('google', 'Google', 'online', 4), ('tiktok', 'TikTok', 'online', 5),
  ('truc_tiep', 'Trực tiếp tại cơ sở', 'offline', 6), ('gioi_thieu', 'Khách cũ giới thiệu', 'gioi_thieu', 7), ('ctv', 'Cộng tác viên / đối tác', 'gioi_thieu', 8),
  ('tai_kich_hoat', 'Tái kích hoạt khách cũ', 'khach_cu', 9), ('khac', 'Nguồn khác được duyệt', 'khac', 10);

create table public.doi_tac_gt (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  loai text not null default 'ctv' check (loai in ('ctv', 'khach_cu', 'kol', 'khac')),
  dien_thoai text,
  ma_gioi_thieu text not null unique,
  ghi_chu text,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now()
);

create table public.chien_dich (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  muc_tieu text not null check (muc_tieu in ('branding', 'slogan', 'khuyen_mai', 'thong_diep')),
  kenh text,
  chi_nhanh_id uuid references public.chi_nhanh (id),
  nguon_id uuid references public.nguon_lead (id),
  ngan_sach bigint not null default 0 check (ngan_sach >= 0),
  bat_dau date,
  ket_thuc date,
  owner_id uuid references public.nhan_vien (id),
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap', 'cho_duyet', 'da_duyet', 'dang_chay', 'tam_dung', 'ket_thuc')),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  check (ket_thuc is null or bat_dau is null or ket_thuc >= bat_dau)
);

create table public.chi_phi_qc_ngay (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  chien_dich_id uuid not null references public.chien_dich (id),
  chi_phi bigint not null default 0 check (chi_phi >= 0),
  hien_thi int not null default 0 check (hien_thi >= 0),
  tiep_can int not null default 0 check (tiep_can >= 0),
  click int not null default 0 check (click >= 0),
  tin_nhan_moi int not null default 0 check (tin_nhan_moi >= 0),
  lead_so int not null default 0 check (lead_so >= 0),
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  unique (ngay, chien_dich_id)
);

create table public.link_theo_doi (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique check (ma ~ '^[a-z0-9-]{3,40}$'),
  ten text not null,
  dich_den text not null check (dich_den ~ '^(https?://|/)'),
  nguon_id uuid references public.nguon_lead (id),
  chien_dich_id uuid references public.chien_dich (id),
  doi_tac_id uuid references public.doi_tac_gt (id),
  luot_click int not null default 0,
  hoat_dong boolean not null default true,
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);

create table public.lead (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ho_ten text not null,
  sdt text not null check (sdt ~ '^0[0-9]{9,10}$'),
  nguon_id uuid not null references public.nguon_lead (id),
  chien_dich_id uuid references public.chien_dich (id),
  doi_tac_id uuid references public.doi_tac_gt (id),
  link_id uuid references public.link_theo_doi (id),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  dich_vu_quan_tam text,
  nhu_cau text,
  owner_id uuid references public.nhan_vien (id),
  trang_thai_phan_bo text not null default 'cho_tiep_nhan' check (trang_thai_phan_bo in
    ('cho_tiep_nhan', 'cho_kiem_tra', 'cho_phan_bo', 'da_phan_bo', 'da_xac_nhan', 'cho_bo_sung', 'lead_trung', 'khong_hop_le')),
  trang_thai_lien_he text not null default 'lead_moi' check (trang_thai_lien_he in
    ('lead_moi', 'da_lien_he', 'da_xac_nhan_nhu_cau', 'hen_goi_lai', 'da_dat_lich', 'khong_nghe_may', 'sai_sdt', 'khong_co_nhu_cau', 'khong_phu_hop', 'trung_lead', 'da_chuyen_chi_nhanh', 'da_ket_thuc')),
  ly_do text,
  thoi_diem_phat_sinh timestamptz not null default now(),
  owner_xac_nhan_luc timestamptz,
  khach_id uuid references public.khach_hang (id),
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);
-- Một số điện thoại chỉ có một lead đang mở (lead đã kết thúc/sai số/trùng thì tạo lại được).
create unique index lead_sdt_dang_mo on public.lead (sdt) where trang_thai_phan_bo not in ('lead_trung', 'khong_hop_le')
  and trang_thai_lien_he not in ('da_ket_thuc', 'sai_sdt', 'khong_co_nhu_cau', 'khong_phu_hop', 'trung_lead');
create index lead_tt_idx on public.lead (trang_thai_lien_he, thoi_diem_phat_sinh desc);
create index lead_nguon_idx on public.lead (nguon_id, thoi_diem_phat_sinh);

create table public.lead_lien_he (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.lead (id) on delete restrict,
  kenh text not null check (kenh in ('goi', 'zalo', 'sms', 'truc_tiep', 'khac')),
  ket_qua text not null,
  ghi_chu text,
  han_tiep date,
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create trigger lead_lien_he_chi_them before update or delete on public.lead_lien_he for each row execute function public.chi_them_dong();

create table public.noi_dung_mkt (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  tieu_de text not null,
  loai text not null default 'bai_viet' check (loai in ('video', 'bai_viet', 'anh', 'khac')),
  kenh text,
  chien_dich_id uuid references public.chien_dich (id),
  nguoi_phu_trach_id uuid not null references public.nhan_vien (id),
  han date not null,
  trang_thai_duyet text not null default 'nhap' check (trang_thai_duyet in ('nhap', 'cho_duyet', 'da_duyet', 'chua_dat')),
  so_lan_duyet int not null default 0,
  nguoi_duyet_id uuid references public.nhan_vien (id),
  link_bai text,
  ngay_dang date,
  hoan_thanh_luc timestamptz,
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

-- Ghi một lượt bấm link theo dõi và trả về địa chỉ đích (nguyên tử). Link tắt thì không trả gì.
create function public.ghi_click_link(p_ma text) returns text language sql as $$
  update public.link_theo_doi set luot_click = luot_click + 1 where ma = p_ma and hoat_dong returning dich_den
$$;

-- Phễu theo nguồn: lead → hợp lệ → đã liên hệ → đã đặt lịch → khách đến → có hoá đơn → thực thu. Khách đến và doanh thu đọc từ lịch hẹn/hoá đơn (không do Marketing nhập).
create function public.bc_phieu_marketing(p_tu date, p_den date, p_cn uuid default null)
returns table (nguon_id uuid, so_lead int, hop_le int, da_lien_he int, da_dat_lich int, khach_den int, co_hoa_don int, thuc_thu bigint)
language sql stable as $$
  with l as (
    select * from public.lead
     where (thoi_diem_phat_sinh at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den and (p_cn is null or chi_nhanh_id = p_cn)
  ),
  hop_le as (select * from l where trang_thai_phan_bo not in ('lead_trung', 'khong_hop_le') and trang_thai_lien_he not in ('sai_sdt', 'trung_lead')),
  lh as (
    select h.id, h.nguon_id, h.trang_thai_lien_he, h.khach_id, h.thoi_diem_phat_sinh,
           (h.trang_thai_lien_he in ('da_lien_he', 'da_xac_nhan_nhu_cau', 'hen_goi_lai', 'da_dat_lich', 'da_chuyen_chi_nhanh', 'da_ket_thuc', 'khong_co_nhu_cau', 'khong_phu_hop')) as lien_he,
           (h.trang_thai_lien_he = 'da_dat_lich' or exists (select 1 from public.lich_hen x where x.khach_id = h.khach_id and x.tao_luc >= h.thoi_diem_phat_sinh)) as dat_lich,
           exists (select 1 from public.lich_hen x where x.khach_id = h.khach_id and x.bat_dau >= h.thoi_diem_phat_sinh and x.trang_thai in ('dang_phuc_vu', 'hoan_thanh')) as den,
           exists (select 1 from public.hoa_don d where d.khach_id = h.khach_id and d.trang_thai = 'hoan_thanh' and d.tao_luc >= h.thoi_diem_phat_sinh) as hd,
           coalesce((select sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) from public.hoa_don d join public.thanh_toan t on t.hoa_don_id = d.id
                      where d.khach_id = h.khach_id and d.trang_thai = 'hoan_thanh' and d.tao_luc >= h.thoi_diem_phat_sinh and t.phuong_thuc <> 'the_tien'), 0) as tien
      from hop_le h
  )
  select n.id, (select count(*)::int from l where l.nguon_id = n.id), (select count(*)::int from hop_le where hop_le.nguon_id = n.id),
         count(*) filter (where lh.lien_he)::int, count(*) filter (where lh.dat_lich)::int, count(*) filter (where lh.den)::int, count(*) filter (where lh.hd)::int, coalesce(sum(lh.tien), 0)::bigint
    from public.nguon_lead n left join lh on lh.nguon_id = n.id
   group by n.id
$$;
revoke all on function public.ghi_click_link(text), public.bc_phieu_marketing(date, date, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
