-- 0067 — LỊCH LẶP + HOÁ ĐƠN VAT + ĐỔI ĐIỂM THƯỞNG Ở THU NGÂN (giống SalonHero, 28/10/2026).
-- • lich_hen: chuỗi lịch lặp (lap_nhom, lap_khoang, lap_tong, lap_thu_tu). kieu_lap giữ đúng mã SalonHero: DAILY / WEEKLY / MONTHLY.
--   Lịch cũ từ SalonHero chỉ có kieu_lap (khoảng lặp và tổng số buổi không có trong bản xuất) nên chỉ hiện nhãn "Lặp".
-- • hoa_don: ghi nhận đã xuất hoá đơn VAT (SalonHero: "HĐ VAT" — Đã có hoá đơn / Chưa có hoá đơn). Toàn bộ 45.653 hoá đơn cũ: chưa có.
-- • Đổi điểm thưởng thành giảm giá: tỉ lệ lấy đúng SalonHero (convert2money: 1 điểm = 10.000đ). SalonHero đang TẮT đổi điểm
--   (convert2money_apply = 0) nên công tắc cau_hinh 'diem.doi_bat' mặc định '0'; Chủ bật ở Cài đặt khi muốn dùng.
--   Tiền đổi điểm được cộng vào giam_gia_don (để tinh_lai_hoa_don/VAT/báo cáo không phải đổi) và ghi riêng ở giam_diem để hiển thị.
--   Trừ điểm và chốt đơn trong CÙNG một giao dịch (chot_hoa_don_doi_diem); huỷ hoá đơn thì hoàn điểm đúng một lần (trigger).

-- ───────── Lịch lặp ─────────
alter table public.lich_hen
  add column lap_nhom uuid,          -- cùng một chuỗi lặp
  add column lap_khoang int,         -- mỗi N ngày/tuần/tháng
  add column lap_tong int,           -- tổng số buổi của chuỗi
  add column lap_thu_tu int;         -- buổi thứ mấy trong chuỗi (1..lap_tong)
alter table public.lich_hen add constraint lich_hen_kieu_lap_hop_le check (kieu_lap is null or kieu_lap in ('DAILY', 'WEEKLY', 'MONTHLY'));
create index lich_hen_lap_nhom_idx on public.lich_hen (lap_nhom, bat_dau) where lap_nhom is not null;
-- Xuất Excel lịch của mọi chi nhánh (người không gắn chi nhánh): lọc theo khoảng giờ hẹn.
create index lich_hen_bat_dau_idx on public.lich_hen (bat_dau);

-- ───────── Hoá đơn VAT ─────────
alter table public.hoa_don
  add column vat_hd_so text,                                     -- số hoá đơn VAT
  add column vat_hd_ky_hieu text,                                -- ký hiệu hoá đơn
  add column vat_hd_luc timestamptz,                             -- lúc ghi nhận đã xuất (khác NULL = "Đã có hoá đơn")
  add column vat_hd_nguoi_id uuid references public.nhan_vien (id);
create index hoa_don_vat_chua_idx on public.hoa_don (ngay_hd) where vat_hd_luc is null and trang_thai = 'hoan_thanh';
-- Danh sách / xuất Excel hoá đơn của mọi chi nhánh: lọc theo ngày rồi xếp mới nhất trước.
create index hoa_don_ngay_tao_idx on public.hoa_don (ngay_hd desc, tao_luc desc);

-- ───────── Sổ điểm: gắn hoá đơn của AMIA OS ─────────
alter table public.khach_diem_so add column hoa_don_id uuid;   -- không khoá ngoại (như hoa_don_sh_id) để xoá nháp/gỡ đợt không bị chặn
create index khach_diem_so_hd_idx on public.khach_diem_so (hoa_don_id) where hoa_don_id is not null;

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('diem.doi_tien', '10000', 'Số đồng được giảm cho 1 điểm thưởng (SalonHero: convert2money 1 điểm = 10.000đ)'),
  ('diem.doi_bat', '0', 'Cho đổi điểm thưởng thành giảm giá ở Thu ngân: 1 = bật, 0 = tắt (SalonHero đang tắt)')
on conflict (khoa) do nothing;

-- Chốt hoá đơn có đổi điểm: khoá khách, kiểm số dư, ghi trừ điểm, ghi giam_diem, rồi chốt. Lỗi ở bất kỳ bước nào → không trừ điểm.
create function public.chot_hoa_don_doi_diem(p_id uuid, p_nguoi uuid, p_diem int, p_tien bigint) returns void language plpgsql as $$
declare h public.hoa_don; v_du int;
begin
  if p_diem is null or p_diem <= 0 then
    perform public.chot_hoa_don(p_id, p_nguoi);
    return;
  end if;
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.khach_id is null then raise exception 'Đổi điểm phải chọn khách hàng' using errcode = 'P0001'; end if;
  if p_tien is null or p_tien < 0 or p_tien > h.giam_gia_don then raise exception 'Tiền đổi điểm không khớp giảm giá của đơn' using errcode = 'P0001'; end if;
  select diem_so_du into v_du from public.khach_hang where id = h.khach_id for update;
  if coalesce(v_du, 0) < p_diem then
    raise exception 'Khách chỉ còn % điểm, không đủ % điểm để đổi', coalesce(v_du, 0), p_diem using errcode = 'P0001';
  end if;
  insert into public.khach_diem_so (khach_id, loai, so_diem, ly_do, hoa_don_id, ma_hoa_don_sh, chi_nhanh_id, nguoi_id)
    values (h.khach_id, 'doi_diem', -p_diem, 'Đổi điểm giảm giá hoá đơn ' || h.ma, h.id, null, h.chi_nhanh_id, p_nguoi);
  update public.hoa_don set giam_diem = p_tien where id = p_id;
  perform public.chot_hoa_don(p_id, p_nguoi);
end $$;

-- Huỷ hoá đơn (bằng tay hay tự huỷ khi lỗi) → hoàn lại điểm đã đổi, đúng một lần.
create function public.trg_hoan_diem_khi_huy() returns trigger language plpgsql as $$
declare v_net int;
begin
  if new.trang_thai = 'huy' and old.trang_thai <> 'huy' and new.khach_id is not null then
    select coalesce(sum(so_diem), 0) into v_net from public.khach_diem_so where hoa_don_id = new.id;
    if v_net < 0 then
      insert into public.khach_diem_so (khach_id, loai, so_diem, ly_do, hoa_don_id, chi_nhanh_id, nguoi_id)
        values (new.khach_id, 'hoan_hoa_don', -v_net, 'Hoàn điểm do huỷ hoá đơn ' || new.ma, new.id, new.chi_nhanh_id, null);
    end if;
  end if;
  return null;
end $$;
create trigger hoa_don_hoan_diem after update of trang_thai on public.hoa_don
  for each row execute function public.trg_hoan_diem_khi_huy();

select public.khoa_tat_ca_bang();
