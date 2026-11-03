-- 0205 — HOA HỒNG Y SALONHERO (câu 17 + 18, đợt 2, 03/11/2026). CHỈ THÊM cột/bảng/hàm; KHÔNG đổi doanh số (v_doanh_so_dong, bc_nhan_vien_sh giữ nguyên).
--
-- Câu 17 — hoa hồng buổi làm bằng thẻ (SalonHero: "Giá trị 1 lần làm dịch vụ (để tính hoa hồng nhân viên)"):
--   • goi_the.gia_tri_1_lan (đã có từ 0194) = use_price của loại thẻ SalonHero; thêm goi_the.tu_tinh_gia_tri_1_lan (is_dynamic_use_price: = giá bán ÷ số lần),
--     goi_the.giam_hh_theo_giam_gia (auto_adjust_commission_ration), goi_the.ti_le_giam_hh (thẻ tiền: "Tỉ lệ giảm hoa hồng nhân viên", SalonHero chỉ 3/348 loại khác 0: 50, 120, 150 — LƯU, chưa áp vì chưa thấy công thức máy chủ).
--   • the_khach.gia_tri_1_lan_hh = card_use_price của thẻ khách (SalonHero chép từ loại thẻ lúc bán, sửa được ở hộp Sửa thẻ). Nạp bằng script đọc dữ liệu đồng bộ.
--   • Cơ sở hoa hồng dòng dịch vụ làm bằng thẻ = số lượng × giá 1 lần: thẻ khách có số riêng thì dùng; không thì loại thẻ "tự tính" → giá bán thẻ ÷ số lần;
--     không thì giá trị 1 lần của loại thẻ (× giá bán thực ÷ giá niêm yết nếu bật "giảm hoa hồng theo tỉ lệ giảm giá"); không có gì thì giá trị buổi của thẻ.
-- Câu 18 — "Cài đặt nâng cao" theo chi nhánh (bảng hoa_hong_cai_dat), mặc định = đúng lựa chọn SalonHero đang dùng ở cả Vinh và Đà Lạt:
--   dịch vụ GIỮ NGUYÊN, bán sản phẩm/thẻ CHIA ĐỀU, tư vấn CHIA ĐỀU (khi số người nhiều hơn số lượng tiêu chuẩn; SalonHero để trống = 1);
--   tính SAU giảm giá, áp CẢ giảm giá từng dòng và giảm giá tổng hoá đơn; hệ số theo giờ / theo sao trống = 100%.
--   Hoa hồng một người ở một dòng = (cơ sở × tỉ lệ% + số tiền cố định × số lượng) × hệ số chia × hệ số giờ × hệ số sao.
--     hệ số chia: số người cùng vai ở dòng ≤ tiêu chuẩn, hoặc chế độ "giữ nguyên" → 1 (mỗi người nhận đủ); "chia đều" khi vượt → tỉ lệ chia người × tiêu chuẩn
--     (tiêu chuẩn 1 và chia 50/50 → mỗi người một nửa = cách AMIA tính trước đây).
--     hệ số giờ (giờ vào của hoá đơn, giờ VN) và hệ số sao (đánh giá sao của nhân viên đó ở hoá đơn) chỉ áp cho vai Phục vụ, như SalonHero "tăng/giảm hoa hồng làm dịch vụ".
--   Doanh số mọi báo cáo GIỮ NGUYÊN; chỉ cột hoa hồng đổi cách tính. Mức hoa hồng đang 0 (như SalonHero) nên mọi số hoa hồng hiện tại vẫn 0.
-- Câu 19 (phí bác sĩ): SalonHero không có → không làm mục riêng; bác sĩ hưởng "hoa hồng làm dịch vụ" như nhân viên phục vụ (cài riêng theo nhân viên/nhóm).

alter table public.goi_the
  add column if not exists tu_tinh_gia_tri_1_lan boolean not null default false,
  add column if not exists giam_hh_theo_giam_gia boolean not null default false,
  add column if not exists ti_le_giam_hh numeric not null default 0 check (ti_le_giam_hh between 0 and 1000);  -- SalonHero commission_ratio (3 thẻ tiền: 50, 120, 150), chỉ lưu
alter table public.the_khach add column if not exists gia_tri_1_lan_hh bigint check (gia_tri_1_lan_hh is null or gia_tri_1_lan_hh >= 0);
comment on column public.the_khach.gia_tri_1_lan_hh is 'Giá trị 1 lần làm dịch vụ để tính hoa hồng (SalonHero card_use_price). Trống = theo loại thẻ.';

-- Nạp từ 348 loại thẻ SalonHero (sao-luu/salonhero/loai_the.json): (sh_id, use_price, is_dynamic_use_price, auto_adjust_commission_ration, commission_ratio).
update public.goi_the g set gia_tri_1_lan = case when g.loai = 'lan' then nullif(x.up, 0) else g.gia_tri_1_lan end,
       tu_tinh_gia_tri_1_lan = x.dyn, giam_hh_theo_giam_gia = x.adj, ti_le_giam_hh = x.cr
  from (values
(55171,0,false,false,0.0),
(55174,1153846,true,true,0.0),
(55175,99000,false,false,0.0),
(56122,0,false,false,50.0),
(56135,1500000,false,false,0.0),
(56136,200000,false,false,0.0),
(56138,199000,false,false,0.0),
(56140,100000,false,false,0.0),
(56141,249000,false,false,0.0),
(56142,199000,false,false,0.0),
(56143,120000,false,false,0.0),
(56144,120000,false,false,0.0),
(56145,80000,false,false,0.0),
(56146,100000,false,false,0.0),
(56149,1080000,true,true,0.0),
(56276,1153846,true,true,0.0),
(56300,1500000,true,true,0.0),
(56301,1500000,true,true,0.0),
(56302,1500000,true,true,0.0),
(56303,1500000,true,true,0.0),
(56306,2000000,true,true,0.0),
(56307,4000000,true,true,0.0),
(56308,2000000,true,true,0.0),
(56310,2000000,true,true,0.0),
(56314,3000000,true,true,0.0),
(56323,3000000,true,true,0.0),
(56324,3000000,true,true,0.0),
(56416,2500000,true,true,0.0),
(56469,1200000,true,true,0.0),
(56472,2000000,true,true,0.0),
(56513,4000000,true,true,0.0),
(56566,800000,true,true,0.0),
(56609,2000000,true,true,0.0),
(56648,6000000,true,true,0.0),
(56652,2500000,true,true,0.0),
(56686,6000000,true,true,0.0),
(56687,6000000,true,false,0.0),
(56688,6000000,true,false,0.0),
(56689,6000000,true,true,0.0),
(56805,6000000,true,true,0.0),
(56839,600000,true,true,0.0),
(56852,30000000,true,true,0.0),
(56853,750000,true,true,0.0),
(56915,3000000,true,true,0.0),
(56940,6000000,true,false,0.0),
(57171,3000000,true,true,0.0),
(57518,2000000,true,true,0.0),
(57726,62500,true,true,0.0),
(57853,12000000,true,true,0.0),
(58530,4000000,true,true,0.0),
(58535,2000000,true,true,0.0),
(59542,5000000,true,true,0.0),
(60528,6000000,true,true,0.0),
(60842,8000000,true,true,0.0),
(60980,0,false,false,0.0),
(62574,200000,true,true,0.0),
(62578,80000,true,true,0.0),
(62580,299000,true,true,0.0),
(62581,299000,true,true,0.0),
(62582,349000,true,true,0.0),
(62583,349000,true,true,0.0),
(62584,799000,true,true,0.0),
(62586,99000,false,false,0.0),
(62625,70000000,true,true,0.0),
(62629,90000000,true,true,0.0),
(62695,6000000,true,true,0.0),
(62697,4000000,true,true,0.0),
(62837,2307692,true,true,0.0),
(62838,1923077,true,true,0.0),
(64271,2000000,true,true,0.0),
(64656,0,false,true,0.0),
(67164,4000000,true,true,0.0),
(67165,6000000,true,true,0.0),
(67172,7000000,true,true,0.0),
(67174,6000000,true,false,0.0),
(67177,1300000,true,true,0.0),
(67250,6000000,true,true,0.0),
(68076,8000000,true,true,0.0),
(68652,40000000,true,true,0.0),
(69519,1200000,true,true,0.0),
(70076,0,false,false,0.0),
(70077,36000000,true,true,0.0),
(79207,2500000,true,true,0.0),
(81943,15000000,true,true,0.0),
(82415,4000000,true,true,0.0),
(82961,0,false,false,120.0),
(83834,7000000,true,true,0.0),
(83882,2500000,true,true,0.0),
(83917,2500000,true,true,0.0),
(89736,0,true,true,0.0),
(90120,2500000,true,true,0.0),
(94482,5000000,true,true,0.0),
(95038,18000000,true,true,0.0),
(97786,60000000,false,false,0.0),
(100657,1000000,false,false,0.0),
(101033,0,false,false,0.0),
(102245,500000,false,false,0.0),
(102565,5000000,true,true,0.0),
(102566,4000000,true,true,0.0),
(102571,15000000,true,true,0.0),
(102572,3000000,true,true,0.0),
(102573,12000000,true,true,0.0),
(102574,10000000,true,true,0.0),
(102575,12000000,true,true,0.0),
(102576,8000000,true,true,0.0),
(102577,40000000,true,true,0.0),
(102578,35000000,true,true,0.0),
(102581,10000000,true,true,0.0),
(102582,2000000,true,true,0.0),
(102583,1200000,true,true,0.0),
(102584,15600000,true,true,0.0),
(102585,6000000,true,false,0.0),
(102586,4000000,true,true,0.0),
(102589,2000000,true,true,0.0),
(102593,12000000,true,true,0.0),
(102596,0,false,false,150.0),
(102950,2800000,true,true,0.0),
(107430,30000000,true,false,0.0),
(110284,25000000,false,false,0.0),
(111019,0,false,false,0.0),
(111022,249000,false,false,0.0),
(112056,40000000,true,false,0.0),
(112711,6000000,false,false,0.0),
(112712,2000000,false,false,0.0),
(112731,8000000,false,false,0.0),
(112732,12000000,false,false,0.0),
(112792,1500000,false,false,0.0),
(113259,10000000,false,false,0.0),
(113750,4000000,false,false,0.0),
(114023,0,false,false,0.0),
(114181,22000000,true,false,0.0),
(114321,8000000,true,false,0.0),
(114322,10000000,false,false,0.0),
(114323,6000000,false,false,0.0),
(114328,5000000,false,false,0.0),
(114336,90000000,false,false,0.0),
(114338,48000,false,false,0.0),
(114340,48000,false,false,0.0),
(114341,60000,false,false,0.0),
(114343,60000,false,false,0.0),
(114344,80000,false,false,0.0),
(114345,80000,false,false,0.0),
(114350,2000000,false,false,0.0),
(114354,4000000,false,false,0.0),
(114356,2000000,false,false,0.0),
(114357,4000000,false,false,0.0),
(114358,2000000,false,false,0.0),
(114364,10000000,false,false,0.0),
(114365,3000000,false,false,0.0),
(114367,4000000,false,false,0.0),
(114369,6000000,false,false,0.0),
(114370,6000000,false,false,0.0),
(114371,10000000,false,false,0.0),
(114372,10000000,false,false,0.0),
(114374,8000000,false,false,0.0),
(114375,10000000,false,false,0.0),
(114376,20000000,false,false,0.0),
(114377,12000000,false,false,0.0),
(114378,12000000,false,false,0.0),
(114379,12000000,false,false,0.0),
(114380,12000000,false,false,0.0),
(114381,12000000,false,false,0.0),
(114382,20000000,false,false,0.0),
(114384,120000000,false,false,0.0),
(114386,0,false,false,0.0),
(114388,4000000,false,false,0.0),
(114953,10000000,false,false,0.0),
(114954,4950000,false,false,0.0),
(114955,4966667,false,false,0.0),
(114956,6450000,false,false,0.0),
(114957,10000000,false,false,0.0),
(114958,12500000,false,false,0.0),
(114959,6950000,false,false,0.0),
(114960,5966667,false,false,0.0),
(114961,6950000,false,false,0.0),
(114962,15000000,false,false,0.0),
(114963,12500000,false,false,0.0),
(114964,6450000,false,false,0.0),
(114965,6450000,false,false,0.0),
(114966,5950000,false,false,0.0),
(114967,90000000,false,false,0.0),
(114991,100000000,false,false,0.0),
(115460,5000000,false,false,0.0),
(115567,15000000,true,true,0.0),
(115601,80000000,false,false,0.0),
(117287,1495000,false,false,0.0),
(119165,0,false,false,0.0),
(120095,0,false,false,0.0),
(121308,0,false,false,0.0),
(123441,0,false,false,0.0),
(123444,0,false,false,0.0),
(123446,10000000,true,false,0.0),
(123447,0,false,false,0.0),
(123451,0,false,false,0.0),
(123452,2000000,false,false,0.0),
(123455,250000,false,false,0.0),
(123457,12000000,false,false,0.0),
(123458,15000000,false,false,0.0),
(123459,15000000,false,false,0.0),
(123460,3000000,false,false,0.0),
(123461,10000000,false,false,0.0),
(123463,6450000,false,false,0.0),
(123464,6450000,false,false,0.0),
(123467,15000000,false,false,0.0),
(123468,25000000,false,false,0.0),
(123469,30000000,false,false,0.0),
(123470,35000000,false,false,0.0),
(123471,45000000,false,false,0.0),
(123472,30000000,false,false,0.0),
(123473,40000000,false,false,0.0),
(123484,1300000,false,false,0.0),
(123551,30000000,false,false,0.0),
(123584,2000000,false,false,0.0),
(123927,1400000,false,false,0.0),
(124223,2500000,false,false,0.0),
(126699,8000000,false,false,0.0),
(127273,15000000,true,false,0.0),
(127791,3000000,false,false,0.0),
(128025,0,false,false,0.0),
(128196,5000000,false,false,0.0),
(128437,5000000,false,false,0.0),
(130896,1333333,false,false,0.0),
(134344,10000000,true,false,0.0),
(134345,10000000,false,false,0.0),
(134346,10000000,false,false,0.0),
(134347,1000000,false,false,0.0),
(134348,1500000,false,false,0.0),
(134349,2000000,false,false,0.0),
(139098,8000000,false,false,0.0),
(142810,20000000,true,false,0.0),
(146467,1153846,false,false,0.0),
(146470,1923077,false,false,0.0),
(149409,0,false,false,0.0),
(149835,5000000,false,false,0.0),
(149836,5000000,false,false,0.0),
(149837,5000000,false,false,0.0),
(149838,5000000,false,false,0.0),
(149839,5000000,false,false,0.0),
(149840,10000000,false,false,0.0),
(149842,10000000,false,false,0.0),
(151078,150000000,false,false,0.0),
(151322,2500000,false,false,0.0),
(151374,7500000,false,false,0.0),
(151375,4000000,false,false,0.0),
(152447,15000000,false,false,0.0),
(152450,50000000,false,false,0.0),
(152477,20000000,false,false,0.0),
(153994,4000000,false,false,0.0),
(153997,1500000,false,false,0.0),
(159834,120000000,true,false,0.0),
(159835,99000000,false,false,0.0),
(159836,180000000,true,false,0.0),
(159837,179000000,false,false,0.0),
(159838,174500000,false,false,0.0),
(159996,0,false,false,0.0),
(160264,3000000,false,false,0.0),
(166339,99000,false,false,0.0),
(166357,25000000,false,false,0.0),
(166413,1800000,false,false,0.0),
(166414,600000,false,false,0.0),
(166415,600000,false,false,0.0),
(166423,8000000,true,true,0.0),
(166424,7000000,true,false,0.0),
(166438,10000000,false,false,0.0),
(166439,12000000,false,false,0.0),
(166440,5300000,false,false,0.0),
(166441,530000,false,false,0.0),
(166442,6300000,false,false,0.0),
(166443,6300000,false,false,0.0),
(166444,5966667,false,false,0.0),
(166445,5966667,false,false,0.0),
(166446,6450000,false,false,0.0),
(166447,5966667,false,false,0.0),
(166448,5966667,false,false,0.0),
(166449,1500000,false,false,0.0),
(166451,15000000,false,false,0.0),
(166452,25000000,false,false,0.0),
(166454,200000,false,false,0.0),
(166455,200000,false,false,0.0),
(166456,400000,false,false,0.0),
(166457,400000,false,false,0.0),
(166458,500000,false,false,0.0),
(166461,500000,false,false,0.0),
(166462,600000,false,false,0.0),
(166463,600000,false,false,0.0),
(166464,700000,false,false,0.0),
(166466,1000000,false,false,0.0),
(166470,3000000,false,false,0.0),
(166472,99000,false,false,0.0),
(166473,700000,false,false,0.0),
(173162,8000000,true,false,0.0),
(174505,7000000,false,false,0.0),
(174661,3000000,false,false,0.0),
(174662,7000000,false,false,0.0),
(174663,7000000,false,false,0.0),
(174665,25000000,true,false,0.0),
(176861,8000000,false,false,0.0),
(178527,1300000,true,true,0.0),
(179334,0,false,false,0.0),
(179336,600000,false,false,0.0),
(179338,0,false,false,0.0),
(180387,0,false,false,0.0),
(180634,0,true,true,0.0),
(180635,0,true,true,0.0),
(180649,360000,false,false,0.0),
(180650,600000,false,false,0.0),
(180862,2000000,true,true,0.0),
(180911,1200000,true,true,0.0),
(181079,360000,false,false,0.0),
(181080,360000,true,false,0.0),
(182135,300000,false,false,0.0),
(182541,12000000,true,true,0.0),
(183926,4000000,true,true,0.0),
(186838,6900000,true,true,0.0),
(187225,4000000,true,true,0.0),
(188695,20000000,true,true,0.0),
(197912,12000000,false,false,0.0),
(197913,18000000,false,false,0.0),
(198973,30000000,true,true,0.0),
(198974,12000000,true,false,0.0),
(198975,1000000,true,true,0.0),
(198976,40000000,true,true,0.0),
(198977,100000000,true,true,0.0),
(198978,40000000,true,true,0.0),
(200578,12000000,false,false,0.0),
(200979,15000000,false,false,0.0),
(203045,2666667,false,false,0.0),
(203046,1666667,false,false,0.0),
(203047,5000000,false,false,0.0),
(203048,3000000,false,false,0.0),
(203049,6000000,false,false,0.0),
(214899,8000000,false,false,0.0),
(216115,10000000,true,true,0.0),
(216116,15000000,true,true,0.0),
(216117,4500000,true,false,0.0),
(216118,2500000,true,false,0.0),
(216119,2500000,true,true,0.0),
(216120,6000000,true,false,0.0),
(216122,6000000,true,false,0.0),
(216123,6000000,true,false,0.0),
(216124,6000000,true,false,0.0),
(216125,48000000,true,false,0.0),
(216126,2500000,true,false,0.0),
(216127,45000000,false,false,0.0),
(216449,9000000,false,false,0.0),
(217643,18000000,false,false,0.0),
(218541,12000000,false,false,0.0),
(219437,0,false,false,0.0)  ) as x(sh, up, dyn, adj, cr)
 where g.sh_id = x.sh;

-- ───── Cài đặt nâng cao theo chi nhánh ─────
create table public.hoa_hong_cai_dat (
  chi_nhanh_id uuid primary key references public.chi_nhanh (id) on delete cascade,
  chia_deu_dich_vu boolean not null default false,   -- SalonHero share_commission_to_group = 0 (giữ nguyên)
  chia_deu_ban boolean not null default true,        -- share_selling_commission_to_group = 1
  chia_deu_tu_van boolean not null default true,     -- share_presale_commission_to_group = 1
  so_nv_tieu_chuan int not null default 1 check (so_nv_tieu_chuan between 1 and 20),  -- operator_level_limit (SalonHero để trống = 1)
  tinh_sau_giam_gia boolean not null default true,   -- calculate_after_discount_applied = 1
  ap_giam_gia_tong_don boolean not null default true, -- apply_for_item_discount_only = 0
  he_so_gio jsonb not null default '{}'::jsonb,      -- {"8":100,...,"23":100}; trống = 100%
  he_so_sao jsonb not null default '{}'::jsonb,      -- {"1":100,...,"5":100}; trống = 100%
  sua_luc timestamptz not null default now(),
  sua_boi uuid references public.nhan_vien (id),
  check (jsonb_typeof(he_so_gio) = 'object' and jsonb_typeof(he_so_sao) = 'object')
);
insert into public.hoa_hong_cai_dat (chi_nhanh_id) select id from public.chi_nhanh on conflict do nothing;

-- Giá 1 lần làm dịch vụ của thẻ khách (để tính hoa hồng), theo thứ tự ở đầu tệp.
create or replace function public.hh_gia_1_lan_the(p_the_sh_id bigint) returns numeric
language sql stable as $$
  select coalesce(t.gia_tri_1_lan_hh::numeric,
                  case when g.tu_tinh_gia_tri_1_lan and t.so_buoi_tong between 1 and 999998 then t.tong_tien::numeric / t.so_buoi_tong end,
                  g.gia_tri_1_lan::numeric * (case when g.giam_hh_theo_giam_gia and g.gia > 0 and t.tong_tien < g.gia then t.tong_tien::numeric / g.gia else 1 end),
                  t.gia_tri_buoi::numeric)
    from public.the_khach t left join public.goi_the g on g.id = t.goi_id
   where t.sh_id = p_the_sh_id
$$;

-- Hoa hồng của MỘT người ở MỘT dòng hàng (đã gồm phần chia). Chưa có tỉ lệ nào áp được → 0 ngay, không đọc thêm gì.
create or replace function public.hh_nguoi(p_dong uuid, p_vai text, p_nv uuid, p_ti_le_chia numeric) returns numeric
language plpgsql stable as $$
declare
  d record; c record; s record; v_co_so numeric; v_k int; v_chia boolean; v_he_so numeric; v_gio int; v_sao int; v_x numeric := 1;
begin
  select dd.id, dd.loai, coalesce(dd.dich_vu_id, dd.san_pham_id, dd.goi_id) as muc_id, dd.so_luong, dd.don_gia, dd.thanh_tien, dd.the_khach_sh_id,
         h.id as hoa_don_id, h.chi_nhanh_id, h.tong_hang, h.giam_gia_don, coalesce(h.gio_vao, h.chot_luc, h.tao_luc) as luc
    into d from public.hoa_don_dong dd join public.hoa_don h on h.id = dd.hoa_don_id where dd.id = p_dong;
  if not found then return 0; end if;
  select * into c from public.hh_cai(d.loai, p_vai, d.muc_id, p_nv);
  if not found then return 0; end if;
  select * into s from public.hoa_hong_cai_dat where chi_nhanh_id = d.chi_nhanh_id;
  -- cơ sở tính hoa hồng của cả dòng
  if d.the_khach_sh_id is not null and d.loai = 'dich_vu' then
    v_co_so := d.so_luong * coalesce(public.hh_gia_1_lan_the(d.the_khach_sh_id), 0);
  elsif not coalesce(s.tinh_sau_giam_gia, true) then
    v_co_so := d.don_gia::numeric * d.so_luong;
  elsif not coalesce(s.ap_giam_gia_tong_don, true) then
    v_co_so := d.thanh_tien;
  else
    v_co_so := d.thanh_tien * (case when d.tong_hang > 0 then (d.tong_hang - d.giam_gia_don)::numeric / d.tong_hang else 0 end);
  end if;
  -- chia giữa nhiều người cùng vai
  select count(*) into v_k from public.dong_nhan_vien x where x.dong_id = p_dong and x.vai = p_vai;
  v_chia := case p_vai when 'phuc_vu' then coalesce(s.chia_deu_dich_vu, false) when 'ban' then coalesce(s.chia_deu_ban, true) when 'tu_van' then coalesce(s.chia_deu_tu_van, true) else true end;
  v_he_so := case when not v_chia or v_k <= coalesce(s.so_nv_tieu_chuan, 1) then 1 else coalesce(p_ti_le_chia, 100) / 100 * coalesce(s.so_nv_tieu_chuan, 1) end;
  -- tăng/giảm theo giờ phục vụ và theo sao (chỉ vai Phục vụ)
  if p_vai = 'phuc_vu' and s.chi_nhanh_id is not null then
    if s.he_so_gio <> '{}'::jsonb and d.luc is not null then
      v_gio := extract(hour from d.luc at time zone 'Asia/Ho_Chi_Minh')::int;
      v_x := v_x * coalesce((s.he_so_gio ->> v_gio::text)::numeric, 100) / 100;
    end if;
    if s.he_so_sao <> '{}'::jsonb then
      select g.diem into v_sao from public.danh_gia_nhan_vien g where g.hoa_don_id = d.hoa_don_id and g.nhan_vien_id = p_nv;
      if v_sao is not null then v_x := v_x * coalesce((s.he_so_sao ->> v_sao::text)::numeric, 100) / 100; end if;
    end if;
  end if;
  return (v_co_so * c.ti_le / 100 + coalesce(c.so_tien, 0) * d.so_luong) * v_he_so * v_x;
end $$;

-- Dòng dịch vụ làm bằng thẻ (để báo cáo thực thu tách riêng: không có khoản tiền thu, ghi vào cột trừ thẻ theo ngày hoá đơn).
create or replace function public.hh_la_dong_the(p_dong uuid) returns boolean
language sql stable as $$ select exists (select 1 from public.hoa_don_dong d where d.id = p_dong and d.the_khach_sh_id is not null and d.loai = 'dich_vu') $$;

-- ───── Trỏ mọi báo cáo hoa hồng về hh_nguoi (doanh số giữ nguyên từng chữ) ─────
create or replace function public.bc_nhan_vien(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, vai text, so_dong int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  select c.nhan_vien_id, c.vai, count(*)::int, round(sum(v.doanh_so * c.ti_le / 100))::bigint,
         round(sum(public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le)))::bigint
    from public.dong_nhan_vien c join public.v_doanh_so_dong v on v.dong_id = c.dong_id
   where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
   group by c.nhan_vien_id, c.vai
$$;

create or replace function public.bc_hoa_hong_thuc_thu(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, vai text, chi_nhanh_id uuid, nguon text, so_hd int, doanh_so_tien bigint, hoa_hong_tien bigint, doanh_so_the bigint, hoa_hong_the bigint)
language sql stable as $$
  with tt as (
    select t.hoa_don_id,
           sum(case when t.phuong_thuc <> 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as tien,
           sum(case when t.phuong_thuc = 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as the
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn)
     group by t.hoa_don_id),
  l as (
    select c.nhan_vien_id, c.vai, h.chi_nhanh_id, case when h.ngay_hd < p_tu then 'cu' else 'moi' end as nguon, h.id as hd,
           v.doanh_so * c.ti_le / 100 * tt.tien / h.tong_phai_thu as ds_tien,
           tt.tien / h.tong_phai_thu * public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le) as hh_tien,
           v.doanh_so * c.ti_le / 100 * tt.the / h.tong_phai_thu as ds_the,
           tt.the / h.tong_phai_thu * public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le) as hh_the
      from tt join public.hoa_don h on h.id = tt.hoa_don_id
      join public.v_doanh_so_dong v on v.hoa_don_id = h.id
      join public.dong_nhan_vien c on c.dong_id = v.dong_id
     where not public.hh_la_dong_the(v.dong_id)
    union all
    -- buổi làm bằng thẻ: không có khoản tiền thu riêng → hoa hồng vào cột trừ thẻ, theo ngày hoá đơn
    select c.nhan_vien_id, c.vai, v.chi_nhanh_id, 'moi', v.hoa_don_id, 0, 0, 0, public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le)
      from public.v_doanh_so_dong v join public.dong_nhan_vien c on c.dong_id = v.dong_id join public.hoa_don h on h.id = v.hoa_don_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn) and not h.la_so_du_dau and public.hh_la_dong_the(v.dong_id)
       and public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le) <> 0)
  select l.nhan_vien_id, l.vai, l.chi_nhanh_id, l.nguon, count(distinct l.hd)::int,
         round(sum(l.ds_tien))::bigint, round(sum(l.hh_tien))::bigint, round(sum(l.ds_the))::bigint, round(sum(l.hh_the))::bigint
    from l group by 1, 2, 3, 4
$$;

create or replace function public.bc_hoa_hong_doi_chieu(p_tu date, p_den date, p_cn uuid default null)
returns table (theo_hoa_don bigint, thuc_thu_don_moi bigint, tru_the_don_moi bigint, con_no_cuoi_ky bigint, thu_no_cu bigint, tru_the_no_cu bigint, khac bigint)
language sql stable as $$
  with a as (select coalesce(sum(x.hoa_hong), 0)::bigint as v from public.bc_nhan_vien(p_tu, p_den, p_cn) x),
  b as (select coalesce(sum(x.hoa_hong_tien) filter (where x.nguon = 'moi'), 0)::bigint as moi_tien, coalesce(sum(x.hoa_hong_the) filter (where x.nguon = 'moi'), 0)::bigint as moi_the,
               coalesce(sum(x.hoa_hong_tien) filter (where x.nguon = 'cu'), 0)::bigint as cu_tien, coalesce(sum(x.hoa_hong_the) filter (where x.nguon = 'cu'), 0)::bigint as cu_the
          from public.bc_hoa_hong_thuc_thu(p_tu, p_den, p_cn) x),
  n as (
    select coalesce(round(sum(public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le)
                              * greatest(h.tong_phai_thu - coalesce(p.da, 0), 0)::numeric / h.tong_phai_thu)), 0)::bigint as v
      from public.hoa_don h
      join public.v_doanh_so_dong v on v.hoa_don_id = h.id
      join public.dong_nhan_vien c on c.dong_id = v.dong_id
      left join lateral (select sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) as da from public.thanh_toan t where t.hoa_don_id = h.id and t.ngay <= p_den) p on true
     where h.ngay_hd between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn)
       and not public.hh_la_dong_the(v.dong_id))
  select a.v, b.moi_tien, b.moi_the, n.v, b.cu_tien, b.cu_the, a.v - b.moi_tien - b.moi_the - n.v from a, b, n
$$;

create or replace function public.bc_hoa_hong_nv_nhom(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, nhom text, so_dong int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  -- doanh_so: y như 0195 (giá một buổi của thẻ cho dịch vụ làm bằng thẻ); hoa_hong: hh_nguoi (câu 17 + 18).
  select c.nhan_vien_id,
         case when c.vai = 'tu_van' then 'tu_van'
              when c.vai = 'phuc_vu' and v.loai = 'dich_vu' then 'dich_vu'
              when c.vai = 'ban' and v.loai = 'san_pham' then 'san_pham'
              when c.vai = 'ban' and v.loai = 'goi_the' then 'ban_the'
              else 'khac' end,
         count(*)::int,
         round(sum(c.ti_le / 100 * (case when d.the_khach_sh_id is not null and coalesce(t.so_buoi_tong, 0) > 0 and v.loai = 'dich_vu'
                                          then v.so_luong * t.tong_tien::numeric / t.so_buoi_tong else v.doanh_so end)))::bigint,
         round(sum(public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le)))::bigint
    from public.dong_nhan_vien c
    join public.v_doanh_so_dong v on v.dong_id = c.dong_id
    join public.hoa_don_dong d on d.id = v.dong_id
    left join public.the_khach t on t.sh_id = d.the_khach_sh_id
   where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
   group by 1, 2
$$;

create or replace function public.bc_hoa_hong_nv_chi_tiet(p_nv uuid, p_tu date, p_den date, p_cn uuid default null, p_gioi_han int default 2000)
returns table (hoa_don_id uuid, ma_hd text, ngay_hd date, khach text, ten_dong text, loai text, vai text, so_luong int, doanh_so bigint, hoa_hong bigint, tong_dong bigint)
language sql stable as $$
  with l as (
    select h.id as hoa_don_id, coalesce(h.sh_ma, h.ma) as ma_hd, v.ngay_hd, coalesce(k.ho_ten, 'Khách lẻ') as khach, v.ten as ten_dong, v.loai, c.vai, v.so_luong,
           round(c.ti_le / 100 * (case when d.the_khach_sh_id is not null and coalesce(t.so_buoi_tong, 0) > 0 and v.loai = 'dich_vu' then v.so_luong * t.tong_tien::numeric / t.so_buoi_tong else v.doanh_so end))::bigint as doanh_so,
           round(public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le))::bigint as hoa_hong
      from public.dong_nhan_vien c
      join public.v_doanh_so_dong v on v.dong_id = c.dong_id
      join public.hoa_don h on h.id = v.hoa_don_id
      join public.hoa_don_dong d on d.id = v.dong_id
      left join public.the_khach t on t.sh_id = d.the_khach_sh_id
      left join public.khach_hang k on k.id = h.khach_id
     where c.nhan_vien_id = p_nv and v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn))
  select l.*, count(*) over () from l order by l.ngay_hd desc, l.ma_hd, l.ten_dong limit greatest(p_gioi_han, 1)
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
