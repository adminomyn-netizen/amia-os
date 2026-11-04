-- Chính sách hoa hồng & phí trị liệu áp dụng từ 01/11/2026 (PL05 nhân viên, PL06 quản lý, Quy định phí trị liệu + PL01 bác sĩ + PL02 trị liệu viên).
-- Tháng 10/2026 trở về trước vẫn dùng bảng tỉ lệ cũ (hoa_hong_ti_le). Tỉ lệ để trong cs_hoa_hong.cau_hinh (sửa được trên màn Cài đặt), không viết cứng trong code.

-- 1. Bộ tỉ lệ theo ngày hiệu lực
create table public.cs_hoa_hong (
  id uuid primary key default gen_random_uuid(),
  hieu_luc_tu date not null unique,
  ten text not null,
  cau_hinh jsonb not null,
  sua_boi uuid references public.nhan_vien(id),
  sua_luc timestamptz not null default now()
);
insert into public.cs_hoa_hong (hieu_luc_tu, ten, cau_hinh) values ('2026-11-01', 'PL05, PL06 và Quy định phí trị liệu tháng 11/2026', $j${
  "tv": {"km": 0.015, "san": 0.007, "goi_km": 0.02, "goi_duoi_km": 0.01, "my_pham": 0.03, "khach_moi_tu_khai_thac": 0.03, "vuot_chi_tieu": 0.03},
  "telesale": {"bac": [[1800000000, 0.005], [2800000000, 0.008], [null, 0.01]], "so_ngay": 30},
  "gian_tiep": {"moc": [{"tu": 2000000000, "nv": 300000, "ql": 500000}, {"tu": 2800000000, "nv": 500000, "ql": 1000000}]},
  "gd": {"bac": [[1800000000, 0.008], [2800000000, 0.02], [null, 0.03]], "tru_gia_san": 0.5},
  "mkt": {"bac": [[1800000000, 0.005], [2800000000, 0.01], [null, 0.015]], "tran_qc": 0.15},
  "phi_tl": {"tran_bs": 0.03, "tran_tlv": 0.01, "phu_bs": 15000}
}$j$::jsonb);

-- 2. Giá khuyến mại / giá tối thiểu (giá sàn nằm giữa hai mức). Để trống = chưa có, báo cáo đánh dấu "chưa có giá KM".
alter table public.dich_vu add column gia_khuyen_mai numeric, add column gia_toi_thieu numeric;
alter table public.goi_the add column gia_khuyen_mai numeric, add column gia_toi_thieu numeric;

-- 3. Danh mục gói, thẻ hưởng 2% / 1% (PL05 mục A)
create table public.cs_hh_danh_muc (
  id uuid primary key default gen_random_uuid(),
  thu_tu int not null default 0,
  ten text not null,
  gia_khuyen_mai numeric not null,
  goi_id uuid references public.goi_the(id) on delete set null,
  dich_vu_id uuid references public.dich_vu(id) on delete set null
);
insert into public.cs_hh_danh_muc (thu_tu, ten, gia_khuyen_mai, goi_id, dich_vu_id) values
  (1, 'Gói Haru (Hạnh phúc)', 80000000, (select id from public.goi_the where ma = 'SH159834'), (select id from public.dich_vu where ten = 'Gói Haru (Hạnh phúc)' and hoat_dong limit 1)),
  (2, 'Gói Yume (Thăng hoa) - Nhau thai cuống rốn UPA', 150000000, (select id from public.goi_the where ma = 'SH159836'), (select id from public.dich_vu where ten = 'Gói Yume (Thăng hoa)' and hoat_dong limit 1)),
  (3, 'Miyabi Collagen Therapy - Căng chỉ Collagen sợi tơ tằm UPA toàn mặt', 35000000, null, null),
  (4, 'Ichi Lift Therapy - Nâng cơ bán phần độc quyền Amia', 50000000, (select id from public.goi_the where ma = 'SH62629'), (select id from public.dich_vu where ten = 'Ichi Lift Therapy Nâng cơ độc quyền Amia' and hoat_dong limit 1)),
  (5, 'Amia Ichi Lift Therapy - Nâng cơ độc quyền Amia VIP', 60000000, (select id from public.goi_the where ma = 'SH114384'), (select id from public.dich_vu where ten = 'Amia Ichi Lift Therapy - Nâng cơ độc quyền Amia VIP' and hoat_dong limit 1)),
  (6, 'Amia Ichi Lift Therapy luxury - Nâng cơ toàn diện, sợi dưỡng RH collagen', 120000000, null, null),
  (7, 'Thẻ Amia Gold', 100000000, (select id from public.goi_the where ma = 'SH82961'), null),
  (8, 'Thẻ Amia Diamond', 200000000, (select id from public.goi_the where ma = 'SH102596'), null),
  (9, 'Thẻ Amia Limited', 300000000, (select id from public.goi_the where ma = 'SH114386'), null);

-- 4. Nhóm hưởng theo chính sách của từng nhân viên (gợi ý theo chức danh, sửa được trên màn Cài đặt)
alter table public.nhan_vien add column nhom_hh text check (nhom_hh in ('tu_van', 'tri_lieu', 'bac_si', 'telesale', 'gian_tiep_nv', 'gian_tiep_ql', 'gd_chi_nhanh', 'tp_marketing', 'khong'));
update public.nhan_vien set nhom_hh = case
  when chuc_danh ilike '%bác sĩ%' then 'bac_si'
  when chuc_danh ilike '%trị liệu%' then 'tri_lieu'
  when chuc_danh ilike '%tư vấn%' then 'tu_van'
  when chuc_danh ilike '%telesale%' then 'telesale'
  when chuc_danh ilike 'trưởng phòng tiếp thị%' or chuc_danh ilike 'trưởng phòng marketing%' then 'tp_marketing'
  when chuc_danh ilike '%quản lý chi nhánh%' or chuc_danh ilike 'giám đốc chi nhánh%' then 'gd_chi_nhanh'
  when chuc_danh ilike 'kế toán trưởng%' or chuc_danh ilike 'trưởng phòng nhân lực%' then 'gian_tiep_ql'
  when chuc_danh ilike 'kế toán%' or chuc_danh ilike 'hành chính nhân sự%' or chuc_danh ilike '%sáng tạo nội dung%' or chuc_danh ilike '%thiết kế%' then 'gian_tiep_nv'
  else null end
 where hoat_dong;

-- 5. Số liệu tháng nhập tay (theo số Kế toán chốt; để trống thì dùng số phần mềm tính)
create table public.cs_hh_thang_cn (
  chi_nhanh_id uuid not null references public.chi_nhanh(id),
  nam int not null, thang int not null check (thang between 1 and 12),
  doanh_so_chot numeric, doanh_so_dv_chot numeric, chi_phi_qc numeric, ghi_chu text,
  sua_boi uuid references public.nhan_vien(id), sua_luc timestamptz not null default now(),
  primary key (chi_nhanh_id, nam, thang)
);
create table public.cs_hh_thang_nv (
  nhan_vien_id uuid not null references public.nhan_vien(id) on delete cascade,
  nam int not null, thang int not null check (thang between 1 and 12),
  chi_tieu numeric,
  dat_dieu_kien boolean not null default true,
  ghi_chu text,
  sua_boi uuid references public.nhan_vien(id), sua_luc timestamptz not null default now(),
  primary key (nhan_vien_id, nam, thang)
);

-- 6. Đơn giá phí trị liệu (PL01 bác sĩ, PL02 trị liệu viên) + dịch vụ ghép vào từng dòng
create table public.phi_tl_don_gia (
  id uuid primary key default gen_random_uuid(),
  doi_tuong text not null check (doi_tuong in ('bac_si', 'tri_lieu')),
  nhom text not null,
  stt int not null,
  ten text not null,
  dvt text not null,
  don_gia numeric not null default 0,
  dich_vu_ids uuid[] not null default '{}',
  -- Ca dùng thẻ / liệu trình đồng bộ từ SalonHero chỉ có TÊN dòng (không có mã dịch vụ) nên ghép thêm theo tên dòng (chữ thường, bỏ khoảng trắng đầu cuối).
  ten_ghep text[] not null default '{}',
  unique (doi_tuong, stt)
);
insert into public.phi_tl_don_gia (doi_tuong, nhom, stt, ten, dvt, don_gia) values
  ('bac_si', 'I. Căng chỉ COG', 1, 'Ichi Lift các loại (toàn mặt)', 'Lần', 1500000),
  ('bac_si', 'I. Căng chỉ COG', 2, 'Ichi Lift các loại (theo vùng)', 'Lần', 1000000),
  ('bac_si', 'II. Chỉ Mono', 3, 'Miyabi Collagen 1/2 căng chỉ', 'Lần', 500000),
  ('bac_si', 'II. Chỉ Mono', 4, 'Miyabi Collagen căng chỉ, chỉ Mono giảm béo bụng', 'Lần', 1000000),
  ('bac_si', 'II. Chỉ Mono', 5, 'Chỉ Mono trẻ hóa âm đạo', 'Lần', 750000),
  ('bac_si', 'III. Filler, Peeling', 6, 'HA Volumax các loại', 'cc', 500000),
  ('bac_si', 'III. Filler, Peeling', 7, 'HA Clear (tiêm tan)', 'Vùng', 100000),
  ('bac_si', 'III. Filler, Peeling', 8, 'Peeling (Luminus FCR, Reborn Glow, PUU, TCA)', 'Lần', 200000),
  ('bac_si', 'IV. Tiêm, cấy', 9, 'Bio Collagen, B.A.P các loại', 'Lần', 250000),
  ('bac_si', 'IV. Tiêm, cấy', 10, 'Toxin các loại', 'Vùng', 300000),
  ('bac_si', 'IV. Tiêm, cấy', 11, 'PRP Therapy', 'Lần', 500000),
  ('bac_si', 'IV. Tiêm, cấy', 12, 'Meso (Radiant Booster, Procell UPA++, Mesotox)', 'Lần', 200000),
  ('bac_si', 'IV. Tiêm, cấy', 13, 'Meso mắt, nám (Phoenix Eye, Melasma Inject)', 'Lần', 100000),
  ('bac_si', 'IV. Tiêm, cấy', 14, 'Body Lipo, Cooltech Smart Lipo Combo', 'Vùng', 400000),
  ('bac_si', 'IV. Tiêm, cấy', 15, 'Gói Haru, Gói Yume', 'Lần', 100000),
  ('bac_si', 'V. Laser CO2', 16, 'Micro Treatment, Nipple White, Burning Therapy các loại', 'Lần', 200000),
  ('bac_si', 'VI. Pico Laser', 17, 'Pico trị nám, tàn nhang (Removal, Hori, Full)', 'Lần', 120000),
  ('bac_si', 'VI. Pico Laser', 18, 'Pico còn lại (xóa mày, xóa xăm, thâm môi, body)', 'Lần / vùng / cm²', 100000),
  ('bac_si', 'VII. Xóa mao mạch', 19, 'Mao mạch mũi', 'Vùng', 100000),
  ('bac_si', 'VII. Xóa mao mạch', 20, 'Mao mạch vùng mặt', 'Vùng', 150000),
  ('bac_si', 'VII. Xóa mao mạch', 21, 'Mao mạch toàn mặt', 'Lần', 200000),
  ('bac_si', 'VII. Xóa mao mạch', 22, 'Mao mạch vùng body', 'Vùng', 250000),
  ('bac_si', 'VIII. Máy nâng cơ, trẻ hóa', 23, 'Ultherapy, Micro Define Pro', 'Lần', 400000),
  ('bac_si', 'VIII. Máy nâng cơ, trẻ hóa', 24, 'Mfu, Micro Define', 'Lần', 300000),
  ('bac_si', 'VIII. Máy nâng cơ, trẻ hóa', 25, 'Mfu, Ultherapy 1 vùng hoặc vùng mắt', 'Lần / vùng', 150000),
  ('bac_si', 'VIII. Máy nâng cơ, trẻ hóa', 26, 'Thermage FLX mặt (900, 1200 shot)', 'Lần', 500000),
  ('bac_si', 'VIII. Máy nâng cơ, trẻ hóa', 27, 'Thermage FLX mắt', 'Lần', 200000),
  ('bac_si', 'IX. Điều trị sẹo', 28, 'Layer Therapy', 'Lần', 250000),
  ('bac_si', 'IX. Điều trị sẹo', 29, 'Cắt đáy sẹo, FlatScar', 'Lần / điểm', 100000),
  ('bac_si', 'X. Exion', 30, 'Exion 1 vùng', 'Vùng', 80000),
  ('bac_si', 'X. Exion', 31, 'Exion full face, bikini trong hoặc ngoài', 'Lần', 100000),
  ('bac_si', 'X. Exion', 32, 'Exion bikini full', 'Lần', 150000),
  ('bac_si', 'XI. Không tính phí', 33, 'Laser CO2 đồi mồi, nốt ruồi (chỉ làm tặng, không bán)', 'Nốt', 0),
  ('bac_si', 'XI. Không tính phí', 34, 'Dịch vụ phục vụ Marketing (KOL, KOC, quay chụp)', 'Ca', 0),
  ('bac_si', 'XI. Không tính phí', 35, 'Ca bảo hành, ca làm lại, dịch vụ tặng kèm', 'Ca', 0),
  ('tri_lieu', 'I. Chăm sóc da', 1, 'Facial các loại, thẻ Amia Basic, Bio-Intech Basic', 'Buổi', 15000),
  ('tri_lieu', 'I. Chăm sóc da', 2, 'Thẻ Amia Premium, Bio-Intech Premium, chăm sóc da công nghệ cao, ủ trắng, peel nhẹ, Vita BioLight, Body SmartLux, SEATOX', 'Buổi', 20000),
  ('tri_lieu', 'I. Chăm sóc da', 3, 'Luminous FCR, PUU, Reborn Glow, Nano White', 'Buổi', 40000),
  ('tri_lieu', 'I. Chăm sóc da', 4, 'RF+ Queen (mắt)', 'Lần', 10000),
  ('tri_lieu', 'II. Triệt lông', 5, 'Nhũ hoa, mép, ria, cằm, nách, viền trán', 'Buổi', 10000),
  ('tri_lieu', 'II. Triệt lông', 6, 'Mặt, bụng, nửa tay, nửa chân', 'Buổi', 15000),
  ('tri_lieu', 'II. Triệt lông', 7, 'Cả tay, bikini, cả chân, lưng', 'Buổi', 20000),
  ('tri_lieu', 'II. Triệt lông', 8, 'Toàn thân', 'Buổi', 40000),
  ('tri_lieu', 'III. Exion - trị liệu viên tự thực hiện', 9, 'Exion 1 vùng (KTV tự làm)', 'Vùng', 20000),
  ('tri_lieu', 'III. Exion - trị liệu viên tự thực hiện', 10, 'Exion full face (KTV tự làm)', 'Lần', 30000),
  ('tri_lieu', 'III. Exion - trị liệu viên tự thực hiện', 11, 'Exion bikini trong hoặc ngoài (KTV tự làm)', 'Lần', 50000),
  ('tri_lieu', 'III. Exion - trị liệu viên tự thực hiện', 12, 'Exion bikini full (KTV tự làm)', 'Lần', 80000),
  ('tri_lieu', 'IV. Phụ bác sĩ, không tính phí', 13, 'Phụ bác sĩ (ca bác sĩ thực hiện chính)', 'Ca', 15000),
  ('tri_lieu', 'IV. Phụ bác sĩ, không tính phí', 14, 'Ca bảo hành, ca làm lại, dịch vụ tặng kèm (Plasma, Oxygen Clear, Smartlux)', 'Ca', 0);

-- Ghép sẵn những dịch vụ trùng tên rõ ràng; dịch vụ còn lại hiện ở danh sách "chưa ghép" để kế toán ghép tay.
create temp table _ghep (doi_tuong text, stt int, mau text) on commit drop;
insert into _ghep values
  ('bac_si', 1, 'ichi lift therapy%'), ('bac_si', 1, 'amia ichi lift therapy%'),
  ('bac_si', 7, 'tiêm tan ha%'),
  ('bac_si', 8, 'luminous fcr%'), ('bac_si', 8, 'reborn glow%'), ('bac_si', 8, 'puu peeling%'),
  ('bac_si', 9, 'bio+ collagen%'), ('bac_si', 9, 'b.a.p%'), ('bac_si', 9, 'cấy b.a.p%'),
  ('bac_si', 10, '%toxin%'), ('bac_si', 10, 'trị mồ hôi nách%'),
  ('bac_si', 11, 'prp therapy%'),
  ('bac_si', 12, 'radiant booster%'), ('bac_si', 12, 'procell upa++%'), ('bac_si', 12, 'mesotox%'),
  ('bac_si', 13, 'phoenix eye%'), ('bac_si', 13, 'melasma inj%'),
  ('bac_si', 14, 'combo cooltech%'), ('bac_si', 14, 'cấy phân h%'),
  ('bac_si', 15, 'gói haru%'), ('bac_si', 15, 'gói yume%'),
  ('bac_si', 16, 'micro treatment%'), ('bac_si', 16, 'nipple white%'), ('bac_si', 16, 'burning therapy%'),
  ('bac_si', 17, 'pico plus full%'), ('bac_si', 17, 'pico plus hori%'), ('bac_si', 17, 'pico plus removal%'),
  ('bac_si', 18, 'xoá mày pico%'), ('bac_si', 18, 'xóa mày pico%'), ('bac_si', 18, 'khử môi thâm man pico%'),
  ('bac_si', 20, 'trị giãn mao mạch/giảm viêm đỏ/vùng mặt%'), ('bac_si', 21, 'trị giãn mao mạch/giảm viêm đỏ toàn mặt%'), ('bac_si', 22, 'trị giãn mao mạch/giảm viêm đỏ vùng body%'),
  ('bac_si', 23, 'ultherapy%'), ('bac_si', 23, 'micro define pro%'),
  ('bac_si', 24, 'micro define'), ('bac_si', 24, 'mfu pro basic%'), ('bac_si', 24, 'mfu hybrid%'), ('bac_si', 24, 'mfu youth lift%'),
  ('bac_si', 26, 'thermage flx mặt%'), ('bac_si', 26, 'thermage flx pro plus%'), ('bac_si', 27, 'thermage flx mắt%'),
  ('bac_si', 28, 'layer therapy%'),
  ('bac_si', 29, 'flatscar%'), ('bac_si', 29, '%tách đáy sẹo%'),
  ('tri_lieu', 1, '%facial%'), ('tri_lieu', 1, 'amia basic%'), ('tri_lieu', 1, 'bio - intech basic%'), ('tri_lieu', 1, 'thẻ chăm sóc da chuyên sâu%'),
  ('tri_lieu', 2, 'amia premium%'), ('tri_lieu', 2, 'bio - intech premium%'), ('tri_lieu', 2, 'thẻ csd%cao cấp%'), ('tri_lieu', 2, 'vita biolight%'), ('tri_lieu', 2, 'body smartlux%'), ('tri_lieu', 2, 'ủ muse%'), ('tri_lieu', 2, 'active peel%'),
  ('tri_lieu', 3, 'luminous fcr%'), ('tri_lieu', 3, 'puu peeling%'), ('tri_lieu', 3, 'reborn glow%'), ('tri_lieu', 3, 'nano white%'),
  ('tri_lieu', 4, 'rf + queen%'),
  ('tri_lieu', 5, 'triệt lông nhũ hoa%'), ('tri_lieu', 5, 'triệt lông nách%'),
  ('tri_lieu', 6, 'triệt lông mặt%'), ('tri_lieu', 6, 'triệt lông bụng%'), ('tri_lieu', 6, 'triệt lông nửa%'),
  ('tri_lieu', 7, 'triệt lông cả%'), ('tri_lieu', 7, 'triệt lông bikini%'), ('tri_lieu', 7, 'triệt lông lưng%'),
  ('tri_lieu', 8, 'triệt lông toàn thân%');
update public.phi_tl_don_gia g set dich_vu_ids = coalesce((
  select array_agg(distinct d.id) from _ghep x join public.dich_vu d on lower(d.ten) like x.mau
   where x.doi_tuong = g.doi_tuong and x.stt = g.stt and d.hoat_dong), '{}'),
  ten_ghep = coalesce((
  select array_agg(distinct t.ten) from _ghep x join (
    select distinct lower(trim(d.ten)) as ten from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
     where d.loai = 'dich_vu' and h.ngay_hd >= date '2026-01-01') t on t.ten like x.mau
   where x.doi_tuong = g.doi_tuong and x.stt = g.stt), '{}');

-- Ca không tính phí (bảo hành, làm lại, tặng, dùng thử...) do Giám đốc chi nhánh đánh dấu khi rà soát
create table public.phi_tl_loai_tru (
  dong_id uuid primary key references public.hoa_don_dong(id) on delete cascade,
  ly_do text not null,
  nguoi_id uuid references public.nhan_vien(id),
  tao_luc timestamptz not null default now()
);

-- Số đã chốt theo tháng (bảng lương lấy từ đây cho tháng 11/2026 trở đi)
create table public.cs_hh_chot (
  nam int not null, thang int not null,
  nhan_vien_id uuid not null references public.nhan_vien(id),
  khoan text not null,
  so_tien bigint not null,
  chi_tiet jsonb,
  nguoi_id uuid references public.nhan_vien(id),
  chot_luc timestamptz not null default now(),
  primary key (nam, thang, nhan_vien_id, khoan)
);

-- 7. Dữ liệu cho bảng tính tháng
-- Từng dòng hoá đơn có tiền thực thu trong kỳ (không tính phần trừ thẻ tiền: thẻ tiền đã tính lúc bán thẻ).
create or replace function public.bc_cs_hh_dong(p_tu date, p_den date, p_cn uuid default null)
returns table (dong_id uuid, hoa_don_id uuid, chi_nhanh_id uuid, ngay_hd date, khach_id uuid, khach_nguon text, khach_moi boolean,
               loai text, dich_vu_id uuid, goi_id uuid, san_pham_id uuid, so_luong numeric, gia_rong numeric, tt numeric, nguoi jsonb)
language sql stable set search_path = public, pg_temp as $$
  with tt as (
    select t.hoa_don_id,
           sum(case when t.phuong_thuc <> 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as tien
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn)
     group by t.hoa_don_id)
  select d.id, h.id, h.chi_nhanh_id, h.ngay_hd, h.khach_id, k.nguon,
         (h.khach_id is not null and not exists (
            select 1 from public.hoa_don h2 where h2.khach_id = h.khach_id and h2.trang_thai = 'hoan_thanh' and h2.id <> h.id and not h2.la_so_du_dau
               and (h2.ngay_hd < h.ngay_hd or (h2.ngay_hd = h.ngay_hd and h2.tao_luc < h.tao_luc)) and h2.ngay_hd >= h.ngay_hd - 365)),
         d.loai, d.dich_vu_id, d.goi_id, d.san_pham_id, d.so_luong,
         v.doanh_so / nullif(d.so_luong, 0),
         v.doanh_so * tt.tien / h.tong_phai_thu,
         (select coalesce(jsonb_agg(jsonb_build_object('nv', c.nhan_vien_id, 'vai', c.vai, 'tl', c.ti_le)), '[]'::jsonb)
            from public.dong_nhan_vien c where c.dong_id = d.id and c.vai in ('tu_van', 'ban'))
    from tt join public.hoa_don h on h.id = tt.hoa_don_id
    join public.hoa_don_dong d on d.hoa_don_id = h.id
    join public.v_doanh_so_dong v on v.dong_id = d.id
    left join public.khach_hang k on k.id = h.khach_id
   where tt.tien <> 0 and v.doanh_so <> 0
$$;

-- Từng ca dịch vụ thực hiện trong kỳ (theo ngày hoá đơn) và người phục vụ, để tính phí trị liệu. Ca chưa ghi người làm vẫn trả về (nguoi = []) để báo Giám đốc rà soát.
create or replace function public.bc_phi_tl_ca(p_tu date, p_den date, p_cn uuid default null)
returns table (dong_id uuid, hoa_don_id uuid, ma_hd text, chi_nhanh_id uuid, ngay_hd date, khach text, dich_vu_id uuid, ten text, so_luong numeric, thanh_tien numeric, nguoi jsonb, loai_tru text)
language sql stable set search_path = public, pg_temp as $$
  select d.id, h.id, h.ma, h.chi_nhanh_id, h.ngay_hd, k.ho_ten,
         coalesce(d.dich_vu_id, (select dv.id from public.dich_vu dv where lower(trim(dv.ten)) = lower(trim(d.ten)) order by dv.hoat_dong desc limit 1)), d.ten, d.so_luong, d.thanh_tien,
         coalesce((select jsonb_agg(jsonb_build_object('nv', c.nhan_vien_id, 'tl', c.ti_le) order by c.ti_le desc) from public.dong_nhan_vien c where c.dong_id = d.id and c.vai = 'phuc_vu'), '[]'::jsonb),
         x.ly_do
    from public.hoa_don h join public.hoa_don_dong d on d.hoa_don_id = h.id
    left join public.khach_hang k on k.id = h.khach_id
    left join public.phi_tl_loai_tru x on x.dong_id = d.id
   where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
     and d.loai = 'dich_vu'
$$;

revoke all on function public.bc_cs_hh_dong(date, date, uuid), public.bc_phi_tl_ca(date, date, uuid) from public, anon, authenticated;

-- 8. Bảng lương: từ tháng 11/2026, nếu tháng đã chốt hoa hồng theo chính sách mới thì lấy số đã chốt (hoa hồng + phí trị liệu + thưởng).
create or replace function public.hh_ky_luong(p_nv uuid, p_dau date, p_cuoi date) returns bigint
language sql stable set search_path = public, pg_temp as $$
  select case when p_dau >= date '2026-11-01' and exists (select 1 from public.cs_hh_chot c where c.nam = extract(year from p_dau)::int and c.thang = extract(month from p_dau)::int)
    then (select coalesce(sum(c.so_tien), 0) from public.cs_hh_chot c where c.nam = extract(year from p_dau)::int and c.thang = extract(month from p_dau)::int and c.nhan_vien_id = p_nv)::bigint
    else (select coalesce(sum(x.hoa_hong), 0) from public.bc_nhan_vien(p_dau, p_cuoi, null) x where x.nhan_vien_id = p_nv)::bigint end
$$;

do $$
declare src text;
begin
  src := pg_get_functiondef('public.tinh_ky_luong'::regproc);
  if position('select coalesce(sum(x.hoa_hong), 0) into v_hh from public.bc_nhan_vien(dau, cuoi, null) x where x.nhan_vien_id = r.nhan_vien_id;' in src) = 0 then
    raise exception 'tinh_ky_luong đã đổi, không thay được dòng hoa hồng';
  end if;
  src := replace(src, 'select coalesce(sum(x.hoa_hong), 0) into v_hh from public.bc_nhan_vien(dau, cuoi, null) x where x.nhan_vien_id = r.nhan_vien_id;',
                      'v_hh := public.hh_ky_luong(r.nhan_vien_id, dau, cuoi);');
  execute src;
end $$;

select public.khoa_tat_ca_bang();
