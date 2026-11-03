-- 0212 — Cờ "Khách mới" trên hoá đơn như SalonHero (orders.is_new_customer) — nối đợt 2 việc 5, 03/11/2026.
-- • hoa_don.khach_moi gắn 1 lần, không tính lại (giống lich_hen.khach_moi ở 0202):
--   hoá đơn tạo trong AMIA → tính lúc hoá đơn thành "hoàn thành" lần đầu: khách chưa có hoá đơn hoàn thành nào khác;
--   hoá đơn chuyển từ SalonHero → giữ cờ gốc (nạp bằng scripts/chuyen-salonhero/nap-khach-moi-hoa-don.mjs; đồng bộ đêm ghi cho đơn mới).
-- • Sửa hoá đơn (về nháp rồi chốt lại) giữ cờ cũ. Khách vãng lai (không có khách) để trống.

alter table public.hoa_don add column if not exists khach_moi boolean;
comment on column public.hoa_don.khach_moi is 'Khách mới ở hoá đơn này (như SalonHero is_new_customer): gắn 1 lần lúc hoàn thành lần đầu = khách chưa có hoá đơn hoàn thành nào khác. Đơn SalonHero giữ cờ gốc.';

create or replace function public.trg_hoa_don_khach_moi() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.khach_moi is null and new.khach_id is not null and new.trang_thai = 'hoan_thanh' and not coalesce(new.la_lich_su, false)
     and (tg_op = 'INSERT' or old.trang_thai is distinct from 'hoan_thanh') then
    new.khach_moi := not exists (select 1 from public.hoa_don h where h.khach_id = new.khach_id and h.trang_thai = 'hoan_thanh' and h.id is distinct from new.id);
  end if;
  return new;
end $$;
revoke all on function public.trg_hoa_don_khach_moi() from public, anon, authenticated;
drop trigger if exists hoa_don_khach_moi on public.hoa_don;
create trigger hoa_don_khach_moi before insert or update of trang_thai on public.hoa_don for each row execute function public.trg_hoa_don_khach_moi();

-- Hoá đơn tạo trong AMIA đã hoàn thành trước khi có cột: tính theo thứ tự ngày (đơn hoàn thành đầu tiên của khách, kể cả đơn SalonHero trước đó).
update public.hoa_don h set khach_moi = not exists (
    select 1 from public.hoa_don x where x.khach_id = h.khach_id and x.trang_thai = 'hoan_thanh' and x.id <> h.id
       and (x.ngay_hd, coalesce(x.chot_luc, x.tao_luc)) < (h.ngay_hd, coalesce(h.chot_luc, h.tao_luc)))
 where h.khach_moi is null and not h.la_lich_su and h.trang_thai = 'hoan_thanh' and h.khach_id is not null;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
