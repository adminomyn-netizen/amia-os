-- Chị Lâm 17/11/2026 (ảnh lịch theo nhân viên: mọi lịch nằm ở "Chưa chọn nhân viên"): lịch hẹn không gắn chuyên viên trị liệu.
-- Gốc: 58 lượt thu ngân chuyển 14–16/11 đều gửi từ thẻ/khách nên KHÔNG nối lịch hẹn (lich_hen_id rỗng) dù 54 khách có lịch cùng ngày.
-- Từ nay: lượt chuyển chưa nối lịch → tự nối vào lịch cùng ngày, cùng chi nhánh của khách (gần giờ chuyển nhất, bỏ lịch huỷ/không đến);
-- lịch còn "Chưa phân" thì gắn chuyên viên đầu tiên của lượt làm Người thực hiện (không đè lịch đã có người).
-- Nối lịch rồi thì bấm Bắt đầu làm sẽ chuyển lịch sang Đang phục vụ như luồng gửi từ lịch hẹn.
create or replace function public.trg_buoi_cho_lam_gan_lich() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare ngay date := ((coalesce(new.chuyen_luc, now())) at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if new.lich_hen_id is null and new.khach_id is not null then
    select l.id into new.lich_hen_id from public.lich_hen l
     where l.khach_id = new.khach_id and l.chi_nhanh_id = new.chi_nhanh_id and l.trang_thai not in ('huy', 'khong_den')
       and (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date = ngay
     order by abs(extract(epoch from l.bat_dau - coalesce(new.chuyen_luc, now()))) limit 1;
  end if;
  if new.lich_hen_id is not null and coalesce(array_length(new.nv_ids, 1), 0) > 0 then
    update public.lich_hen set nhan_vien_id = new.nv_ids[1], sua_boi = coalesce(new.chuyen_boi, sua_boi)
     where id = new.lich_hen_id and nhan_vien_id is null;
  end if;
  return new;
end $$;
drop trigger if exists buoi_cho_lam_gan_lich on public.buoi_cho_lam;
create trigger buoi_cho_lam_gan_lich before insert on public.buoi_cho_lam for each row execute function public.trg_buoi_cho_lam_gan_lich();

-- Gắn bù 14/11 trở đi (chạy 17/11 bằng script, sao lưu id trước khi sửa): nối lượt cũ vào lịch cùng ngày + gắn chuyên viên cho lịch "Chưa phân".
-- KHÔNG đổi trạng thái lịch cũ.
update public.buoi_cho_lam b set lich_hen_id = (
  select l.id from public.lich_hen l where l.khach_id = b.khach_id and l.chi_nhanh_id = b.chi_nhanh_id and l.trang_thai not in ('huy', 'khong_den')
     and (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date = (b.chuyen_luc at time zone 'Asia/Ho_Chi_Minh')::date
   order by abs(extract(epoch from l.bat_dau - b.chuyen_luc)) limit 1)
 where b.lich_hen_id is null and b.chuyen_luc >= '2026-11-14' and b.khach_id is not null;
update public.lich_hen l set nhan_vien_id = b.nv, sua_boi = coalesce(b.chuyen_boi, l.sua_boi)
  from (select distinct on (lich_hen_id) lich_hen_id, nv_ids[1] nv, chuyen_boi from public.buoi_cho_lam
         where lich_hen_id is not null and coalesce(array_length(nv_ids, 1), 0) > 0 and trang_thai not in ('huy', 'tra_lai')
         order by lich_hen_id, chuyen_luc) b
 where l.id = b.lich_hen_id and l.nhan_vien_id is null;
