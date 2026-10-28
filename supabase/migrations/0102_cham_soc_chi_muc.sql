-- 0102 — TĂNG TỐC danh sách chăm sóc (29/10/2026): lần gọi đầu tiên trên DB thật đọc nguội mất 7–12 giây, vượt giới hạn 8 giây của API.
-- • khach_hang (lan_den_cuoi): gọi định kỳ 1/3/6/12 tháng.
-- • khach_hang (tháng*100+ngày sinh): sinh nhật, so theo số thay cho to_char (to_char không đặt được trong chỉ mục). Sinh nhật 29/02 chỉ hiện ở năm nhuận.
-- Hai chỉ mục nhỏ (lich_hen.bat_dau đã có từ 0067) (vài MB), hàm cham_soc_ung_vien được tạo lại với cách so ngày sinh mới (kết quả không đổi).
set lock_timeout = '4s';

create index khach_hang_lan_den_cuoi_idx on public.khach_hang (lan_den_cuoi) where lan_den_cuoi is not null;
create index khach_hang_sinh_nhat_idx on public.khach_hang (((extract(month from ngay_sinh)::int * 100 + extract(day from ngay_sinh)::int))) where ngay_sinh is not null;

create or replace function public.cham_soc_ung_vien(p_cn uuid default null, p_loai text default null, p_sau_dt int default null)
returns table (loai text, khach_id uuid, ngay_goc date, lich_id uuid, moc int, chi_nhanh_id uuid)
language sql stable as $$
  with cfg as (
    select public.hom_nay() hn,
           greatest(coalesce(p_sau_dt, public.cau_hinh_so('cs_sau_dt_ngay', 3)), 0) n_sdt,
           greatest(public.cau_hinh_so('cs_sau_dt_cua_so', 3), 1) w_sdt,
           greatest(public.cau_hinh_so('cs_khong_den_ngay', 14), 1) n_kd,
           greatest(public.cau_hinh_so('cs_den_khong_mua_ngay', 7), 1) n_dkm,
           greatest(public.cau_hinh_so('cs_sinh_nhat_truoc', 3), 0) n_sn,
           greatest(public.cau_hinh_so('cs_dinh_ky_cua_so', 7), 1) w_dk),
  moc as (select m.m, (cfg.hn - make_interval(months => m.m))::date den from cfg cross join unnest(array[1, 3, 6, 12]) m (m))
  -- 1) Nhắc lịch NGÀY MAI
  (select distinct on (l.khach_id) 'nhac_lich'::text, l.khach_id, (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date, l.id, null::int, l.chi_nhanh_id
     from public.lich_hen l cross join cfg
    where (p_loai is null or p_loai = 'nhac_lich') and l.trang_thai in ('chua_xac_nhan', 'da_xac_nhan')
      and l.bat_dau >= (cfg.hn + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh' and l.bat_dau < (cfg.hn + 2)::timestamp at time zone 'Asia/Ho_Chi_Minh'
      and (p_cn is null or l.chi_nhanh_id = p_cn)
    order by l.khach_id, l.bat_dau)
  union all
  -- 2) Hẹn KHÔNG ĐẾN và 3) HUỶ lịch: lịch mới nhất của khách trong cửa sổ, sau đó khách chưa có lịch/lần đến nào khác
  (select distinct on (l.khach_id) case l.trang_thai when 'khong_den' then 'khong_den' else 'huy_lich' end, l.khach_id, (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date, l.id, null::int, l.chi_nhanh_id
     from public.lich_hen l cross join cfg
    where l.trang_thai in ('khong_den', 'huy')
      and (p_loai is null or p_loai = case l.trang_thai when 'khong_den' then 'khong_den' else 'huy_lich' end)
      and l.bat_dau >= (cfg.hn - cfg.n_kd)::timestamp at time zone 'Asia/Ho_Chi_Minh' and l.bat_dau < (cfg.hn + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh'
      and (p_cn is null or l.chi_nhanh_id = p_cn)
      and not exists (select 1 from public.lich_hen l2 where l2.khach_id = l.khach_id and l2.bat_dau > l.bat_dau and l2.trang_thai not in ('huy', 'khong_den'))
    order by l.khach_id, l.bat_dau desc)
  union all
  -- 4) SAU ĐIỀU TRỊ: lần hoàn thành mới nhất của khách, cách đây N..N+w-1 ngày
  (select distinct on (l.khach_id) 'sau_dieu_tri'::text, l.khach_id, (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date, l.id, null::int, l.chi_nhanh_id
     from public.lich_hen l cross join cfg
    where (p_loai is null or p_loai = 'sau_dieu_tri') and l.trang_thai = 'hoan_thanh'
      and l.bat_dau >= (cfg.hn - cfg.n_sdt - cfg.w_sdt + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh' and l.bat_dau < (cfg.hn - cfg.n_sdt + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh'
      and (p_cn is null or l.chi_nhanh_id = p_cn)
      and not exists (select 1 from public.lich_hen l2 where l2.khach_id = l.khach_id and l2.trang_thai = 'hoan_thanh' and l2.bat_dau > l.bat_dau)
    order by l.khach_id, l.bat_dau desc)
  union all
  -- 5) ĐỊNH KỲ 1/3/6/12 tháng sau lần đến cuối (lần đến cuối = muộn nhất của lan_den_cuoi SalonHero và lịch hoàn thành, như ds_tai_kham)
  (select 'dinh_ky'::text, t.khach_id, t.lc, null::uuid, moc.m, t.chi_nhanh_id
     from (
       select u.khach_id, u.chi_nhanh_id,
              greatest(k.lan_den_cuoi, (select max((l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date) from public.lich_hen l where l.khach_id = u.khach_id and l.trang_thai = 'hoan_thanh')) lc
         from (
           select k0.id khach_id, k0.chi_nhanh_id from public.khach_hang k0 cross join cfg join moc on k0.lan_den_cuoi between moc.den - (cfg.w_dk - 1) and moc.den
            where (p_loai is null or p_loai = 'dinh_ky') and not k0.danh_dau_mat and (p_cn is null or k0.chi_nhanh_id = p_cn)
           union
           select l0.khach_id, k1.chi_nhanh_id from public.lich_hen l0 join public.khach_hang k1 on k1.id = l0.khach_id cross join cfg
             join moc on l0.bat_dau >= (moc.den - (cfg.w_dk - 1))::timestamp at time zone 'Asia/Ho_Chi_Minh' and l0.bat_dau < (moc.den + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh'
            where (p_loai is null or p_loai = 'dinh_ky') and l0.trang_thai = 'hoan_thanh' and not k1.danh_dau_mat and (p_cn is null or k1.chi_nhanh_id = p_cn)) u
         join public.khach_hang k on k.id = u.khach_id
     ) t
     cross join cfg
     join moc on t.lc between moc.den - (cfg.w_dk - 1) and moc.den
    where not exists (select 1 from public.lich_hen l3 where l3.khach_id = t.khach_id and l3.bat_dau >= now() and l3.trang_thai in ('chua_xac_nhan', 'da_xac_nhan', 'cho_phuc_vu', 'dang_phuc_vu')))
  union all
  -- 6) SINH NHẬT hôm nay → +N ngày (so theo tháng-ngày, ngày gốc = sinh nhật năm nay)
  (select 'sinh_nhat'::text, k.id, s.d, null::uuid, null::int, k.chi_nhanh_id
     from cfg
     cross join lateral (select (cfg.hn + i)::date d from generate_series(0, cfg.n_sn) i) s
     join public.khach_hang k on (extract(month from k.ngay_sinh)::int * 100 + extract(day from k.ngay_sinh)::int) = (extract(month from s.d)::int * 100 + extract(day from s.d)::int)
    where (p_loai is null or p_loai = 'sinh_nhat') and not k.danh_dau_mat and k.ngay_sinh is not null and (p_cn is null or k.chi_nhanh_id = p_cn))
  union all
  -- 7) ĐẾN MÀ KHÔNG MUA: lịch hoàn thành 1..N ngày qua, không hoá đơn (cùng lịch hoặc cùng ngày), không buổi trừ thẻ
  (select distinct on (l.khach_id) 'den_khong_mua'::text, l.khach_id, (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date, l.id, null::int, l.chi_nhanh_id
     from public.lich_hen l cross join cfg
    where (p_loai is null or p_loai = 'den_khong_mua') and l.trang_thai = 'hoan_thanh'
      and l.bat_dau >= (cfg.hn - cfg.n_dkm)::timestamp at time zone 'Asia/Ho_Chi_Minh' and l.bat_dau < cfg.hn::timestamp at time zone 'Asia/Ho_Chi_Minh'
      and (p_cn is null or l.chi_nhanh_id = p_cn)
      and not exists (select 1 from public.hoa_don h where h.khach_id = l.khach_id and h.ngay_hd = (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date and h.trang_thai in ('hoan_thanh', 'nhap'))
      and not exists (select 1 from public.hoa_don h where h.lich_hen_id = l.id and h.trang_thai in ('hoan_thanh', 'nhap'))
      and not exists (select 1 from public.buoi_thuc_hien b where b.khach_id = l.khach_id and b.ngay_lam = (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date and b.trang_thai = 'da_lam')
      and not exists (select 1 from public.buoi_thuc_hien b where b.lich_hen_id = l.id and b.trang_thai = 'da_lam')
    order by l.khach_id, l.bat_dau desc);
$$;

revoke all on function public.cham_soc_ung_vien(uuid, text, int) from public, anon, authenticated;

reset lock_timeout;
