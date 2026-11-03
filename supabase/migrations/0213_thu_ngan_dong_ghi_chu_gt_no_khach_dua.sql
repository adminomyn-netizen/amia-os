-- 0213 — Thu ngân như SalonHero (đợt 3, 03/11/2026). CHỈ THÊM cột null được, không đổi/xoá cột, không ràng buộc làm hỏng lệnh insert của đồng bộ đêm
-- (dong-bo-dem.mjs ghi hoa_don / hoa_don_dong bằng danh sách cột tường minh, không đụng các cột mới này → đơn SalonHero để null).
--   • hoa_don.khach_dua: "Tiền khách đưa" lúc thanh toán (chỉ để hiện "Trả lại khách" trên hoá đơn như SalonHero; KHÔNG phải khoản thu, không vào sổ quỹ).
--   • hoa_don_dong.ghi_chu: ghi chú từng dòng (SalonHero: ghi chú thẻ dịch vụ / liệu trình khi bán thẻ) — dòng bán thẻ thì chép sang the_khach.ghi_chu.
--   • hoa_don_dong.gt_doi_tac_id / gt_kieu / gt_gia_tri: người giới thiệu theo từng dòng (SalonHero edit-order: nguồn giới thiệu + mức hoa hồng % hoặc tiền).
--   • hoa_don_dong.no_dong: phần nợ của từng dòng (SalonHero "Xác nhận các mục còn nợ" chia nợ theo dòng hàng). Tổng các dòng = nợ lúc chốt.

alter table public.hoa_don add column if not exists khach_dua bigint check (khach_dua is null or khach_dua >= 0);

alter table public.hoa_don_dong
  add column if not exists ghi_chu text,
  add column if not exists gt_doi_tac_id uuid references public.doi_tac_gt (id),
  add column if not exists gt_kieu text check (gt_kieu is null or gt_kieu in ('phan_tram', 'tien')),
  add column if not exists gt_gia_tri numeric check (gt_gia_tri is null or gt_gia_tri >= 0),
  add column if not exists no_dong bigint check (no_dong is null or no_dong >= 0);
alter table public.hoa_don_dong add constraint hoa_don_dong_gt_pt check (gt_kieu is distinct from 'phan_tram' or gt_gia_tri <= 100);
create index if not exists hoa_don_dong_gt_idx on public.hoa_don_dong (gt_doi_tac_id) where gt_doi_tac_id is not null;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
