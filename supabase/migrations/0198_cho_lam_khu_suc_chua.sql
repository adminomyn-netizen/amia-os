-- 0198 — Chỗ làm theo SalonHero (#/booking/seat-map): mỗi chỗ thuộc một KHU (vd "Tầng 2") và có SỨC CHỨA (số giường).
-- Sức chứa chi nhánh = tổng sức chứa các chỗ đang dùng (trước đây = số dòng chỗ). Chị Lâm 03/11: "SalonHero làm sao thì làm y vậy".
alter table public.cho_lam
  add column if not exists khu text check (khu is null or char_length(khu) <= 40),
  add column if not exists suc_chua int not null default 1 check (suc_chua between 1 and 50);

create or replace function public.con_cho_online(p_cn uuid, p_bd timestamptz, p_kt timestamptz) returns boolean language sql stable as $$
  with cap as (select coalesce(sum(suc_chua), 0)::int n from public.cho_lam where chi_nhanh_id = p_cn and hoat_dong),
  ls as (
    select bat_dau, ket_thuc from public.lich_hen
     where chi_nhanh_id = p_cn and trang_thai not in ('huy', 'khong_den') and bat_dau < p_kt and ket_thuc > p_bd
  ),
  diem as (select p_bd as t union select bat_dau from ls where bat_dau > p_bd)
  select (select n from cap) > 0
     and not exists (select 1 from diem d where (select count(*) from ls where ls.bat_dau <= d.t and ls.ket_thuc > d.t) >= (select n from cap));
$$;
revoke all on function public.con_cho_online(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.con_cho_online(uuid, timestamptz, timestamptz) to service_role;

update public.cho_lam set khu = 'Tầng 2', suc_chua = case ten when 'Phòng 3 giường' then 3 when 'Phòng 5 giường' then 5 when 'Phòng laser' then 2 else suc_chua end
 where chi_nhanh_id = (select id from public.chi_nhanh where ma = 'VINH') and ten in ('Phòng 3 giường', 'Phòng 5 giường', 'Phòng laser');

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
