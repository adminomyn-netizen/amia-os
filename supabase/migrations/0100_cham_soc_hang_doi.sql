-- 0100 — DANH SÁCH CHĂM SÓC TỰ SINH + GHI KẾT QUẢ GỌI (29/10/2026; học từ phần mềm VTTech, tự thiết kế, chưa đối chiếu SalonHero).
-- Hàng đợi gọi/nhắn của CSKH được TÍNH TỪ DỮ LIỆU CÓ SẴN (lịch hẹn, hoá đơn, buổi thực hiện, khách) bằng hàm — KHÔNG có bảng nhân dữ liệu.
-- Chỉ có MỘT bảng nhỏ mới: cham_soc_cuoc_goi (sổ chỉ-thêm: mỗi lần gọi một dòng, dòng mới nhất của (khách, loại, ngày gốc) quyết định khách còn hiện trong hàng đợi hay không).
--
-- 7 loại hàng đợi (loai) + 1 hàng "hen_goi_lai":
--   nhac_lich      lịch hẹn NGÀY MAI (chưa xác nhận / đã xác nhận)
--   khong_den      lịch "không đến" trong N ngày qua, khách chưa có lịch/lần đến nào sau đó
--   huy_lich       lịch "huỷ" trong N ngày qua, khách chưa có lịch/lần đến nào sau đó
--   sau_dieu_tri   lịch hoàn thành cách đây N..N+2 ngày (N chỉnh được, mặc định 3), là lần hoàn thành mới nhất của khách
--   dinh_ky        lần đến cuối cách đây đúng mốc 1/3/6/12 tháng (cửa sổ 7 ngày), không có lịch sắp tới
--   sinh_nhat      sinh nhật hôm nay đến 3 ngày tới
--   den_khong_mua  lịch hoàn thành 1..7 ngày qua mà không có hoá đơn (cùng ngày/cùng lịch), không có buổi trừ thẻ
-- "Ngày gốc" (ngay_goc) = ngày của sự kiện gây ra việc gọi (ngày lịch, ngày sinh nhật năm nay, ngày lần đến cuối). Kết quả gọi gắn với (khách, loại, ngày gốc)
-- nên sự kiện mới (lịch mới) tự mở hàng đợi mới, không bị kết quả gọi cũ che.
-- Ẩn/hiện: da_lien_lac / tu_choi / da_dat_lich = xong, ẩn hẳn; khong_nghe_may = ẩn trong ngày, mai hiện lại (trừ khi chọn "không cần gọi lại");
-- có ngày gọi lại = ẩn khỏi hàng đợi gốc, đúng ngày (hoặc quá ngày) hiện ở hàng "Hẹn gọi lại" cho tới khi có dòng gọi mới hơn.

-- DB dùng chung, nhiều người đang đọc: không chờ khoá lâu.
set lock_timeout = '4s';

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('cs_sau_dt_ngay', '3', 'Chăm sóc sau điều trị: gọi khách sau N ngày kể từ lần hoàn thành dịch vụ'),
  ('cs_sau_dt_cua_so', '3', 'Chăm sóc sau điều trị: khách còn nằm trong danh sách thêm bao nhiêu ngày sau mốc N (để cuối tuần/ngày bận không sót)'),
  ('cs_khong_den_ngay', '14', 'Hẹn không đến / huỷ lịch: chỉ lấy lịch trong N ngày gần đây'),
  ('cs_den_khong_mua_ngay', '7', 'Đến mà không mua: chỉ lấy lịch hoàn thành trong N ngày gần đây (không tính hôm nay)'),
  ('cs_sinh_nhat_truoc', '3', 'Sinh nhật: hiện khách sinh nhật từ hôm nay đến N ngày tới'),
  ('cs_dinh_ky_cua_so', '7', 'Gọi định kỳ 1/3/6/12 tháng: khách còn nằm trong danh sách trong N ngày kể từ đúng mốc')
on conflict (khoa) do nothing;

create table public.cham_soc_cuoc_goi (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id),
  loai text not null check (loai in ('nhac_lich', 'khong_den', 'huy_lich', 'sau_dieu_tri', 'dinh_ky', 'sinh_nhat', 'den_khong_mua')),
  ngay_goc date not null,
  trang_thai text not null check (trang_thai in ('da_lien_lac', 'khong_nghe_may', 'hen_goi_lai', 'tu_choi', 'da_dat_lich')),
  chi_tiet text check (chi_tiet is null or char_length(chi_tiet) <= 120),
  noi_dung text check (noi_dung is null or char_length(noi_dung) <= 1000),
  ngay_goi_lai date,
  khong_can_goi_lai boolean not null default false,
  chi_nhanh_id uuid references public.chi_nhanh (id),
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  constraint cuoc_goi_hen_can_ngay check (trang_thai <> 'hen_goi_lai' or ngay_goi_lai is not null),
  constraint cuoc_goi_goi_lai_mot_kieu check (not (khong_can_goi_lai and ngay_goi_lai is not null))
);
create index cham_soc_cuoc_goi_khoa_idx on public.cham_soc_cuoc_goi (khach_id, loai, ngay_goc, tao_luc desc);
create index cham_soc_cuoc_goi_hen_idx on public.cham_soc_cuoc_goi (ngay_goi_lai) where ngay_goi_lai is not null;
create trigger cham_soc_cuoc_goi_chi_them before update or delete on public.cham_soc_cuoc_goi
  for each row execute function public.chi_them_dong();

alter table public.cham_soc_cuoc_goi enable row level security;
alter table public.cham_soc_cuoc_goi force row level security;
create policy chan_het on public.cham_soc_cuoc_goi for all to anon, authenticated using (false) with check (false);
revoke all on public.cham_soc_cuoc_goi from anon, authenticated;

-- ───────── ỨNG VIÊN của từng loại hàng đợi (chưa trừ những khách đã được xử lý) ─────────
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
     join public.khach_hang k on to_char(k.ngay_sinh, 'MM-DD') = to_char(s.d, 'MM-DD')
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

-- ───────── HÀNG ĐỢI HIỆN TẠI: ứng viên đã trừ khách được xử lý + hàng "hen_goi_lai" ─────────
create or replace function public.cham_soc_hien(p_cn uuid default null, p_loai text default null, p_sau_dt int default null)
returns table (hang text, loai text, khach_id uuid, ngay_goc date, lich_id uuid, moc int, chi_nhanh_id uuid, hen_ngay date)
language sql stable as $$
  with hn as (select public.hom_nay() d),
  moi as (   -- dòng gọi mới nhất của từng (khách, loại, ngày gốc)
    select distinct on (g.khach_id, g.loai, g.ngay_goc) g.*
      from public.cham_soc_cuoc_goi g
     order by g.khach_id, g.loai, g.ngay_goc, g.tao_luc desc, g.id desc)
  select c.loai, c.loai, c.khach_id, c.ngay_goc, c.lich_id, c.moc, c.chi_nhanh_id, null::date
    from public.cham_soc_ung_vien(p_cn, p_loai, p_sau_dt) c cross join hn
    left join moi m on m.khach_id = c.khach_id and m.loai = c.loai and m.ngay_goc = c.ngay_goc
   where m.id is null
      or (m.trang_thai = 'khong_nghe_may' and m.ngay_goi_lai is null and not m.khong_can_goi_lai and (m.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date < hn.d)
  union all
  select 'hen_goi_lai'::text, m.loai, m.khach_id, m.ngay_goc, null::uuid, null::int, coalesce(m.chi_nhanh_id, k.chi_nhanh_id), m.ngay_goi_lai
    from moi m join public.khach_hang k on k.id = m.khach_id cross join hn
   where (p_loai is null or p_loai = 'hen_goi_lai') and m.ngay_goi_lai is not null and m.ngay_goi_lai <= hn.d and not k.danh_dau_mat
     and (p_cn is null or coalesce(m.chi_nhanh_id, k.chi_nhanh_id) = p_cn);
$$;

-- Số lượng mỗi loại (cho các nút lọc trên trang).
create or replace function public.dem_cham_soc(p_cn uuid default null, p_sau_dt int default null)
returns table (hang text, so bigint)
language sql stable as $$
  select h.hang, count(*) from public.cham_soc_hien(p_cn, null, p_sau_dt) h group by h.hang;
$$;

-- Danh sách một loại, phân trang (p_so ≤ 50 dòng/trang), kèm thông tin khách, dịch vụ của lịch và lần gọi gần nhất.
create or replace function public.ds_cham_soc(p_loai text, p_cn uuid default null, p_sau_dt int default null, p_tu int default 0, p_so int default 50)
returns table (tong bigint, hang text, loai text, khach_id uuid, ma text, ho_ten text, dien_thoai text, chi_nhanh_id uuid, ngay_goc date, lich_id uuid, moc int, hen_ngay date,
               gio timestamptz, lich_tt text, dich_vu text, goi_tt text, goi_luc timestamptz, goi_chi_tiet text, goi_noi_dung text, goi_nguoi text, so_lan_goi int)
language sql stable as $$
  with p as (
    select count(*) over ()::bigint tong, h.hang, h.loai, h.khach_id, k.ma, k.ho_ten, k.dien_thoai, h.chi_nhanh_id, h.ngay_goc, h.lich_id, h.moc, h.hen_ngay, l.bat_dau, l.trang_thai lich_tt,
           case when h.hang in ('nhac_lich', 'sinh_nhat', 'hen_goi_lai') then coalesce(h.hen_ngay, h.ngay_goc) - date '2000-01-01' else date '2100-01-01' - h.ngay_goc end sk
      from public.cham_soc_hien(p_cn, p_loai, p_sau_dt) h
      join public.khach_hang k on k.id = h.khach_id
      left join public.lich_hen l on l.id = h.lich_id
     order by sk, l.bat_dau, k.ho_ten, h.khach_id
     offset greatest(coalesce(p_tu, 0), 0) limit least(greatest(coalesce(p_so, 50), 1), 50))
  select p.tong, p.hang, p.loai, p.khach_id, p.ma, p.ho_ten, p.dien_thoai, p.chi_nhanh_id, p.ngay_goc, p.lich_id, p.moc, p.hen_ngay, p.bat_dau, p.lich_tt,
         (select string_agg(d.ten, ', ' order by d.ten) from public.lich_hen_dich_vu ld join public.dich_vu d on d.id = ld.dich_vu_id where ld.lich_id = p.lich_id),
         g.trang_thai, g.tao_luc, g.chi_tiet, g.noi_dung, nv.ho_ten,
         (select count(*)::int from public.cham_soc_cuoc_goi g2 where g2.khach_id = p.khach_id and g2.loai = p.loai and g2.ngay_goc = p.ngay_goc)
    from p
    left join lateral (select g1.* from public.cham_soc_cuoc_goi g1 where g1.khach_id = p.khach_id and g1.loai = p.loai and g1.ngay_goc = p.ngay_goc order by g1.tao_luc desc, g1.id desc limit 1) g on true
    left join public.nhan_vien nv on nv.id = g.nguoi_id
   order by p.sk, p.bat_dau, p.ho_ten, p.khach_id;
$$;

revoke all on function public.cham_soc_ung_vien(uuid, text, int) from public, anon, authenticated;
revoke all on function public.cham_soc_hien(uuid, text, int) from public, anon, authenticated;
revoke all on function public.dem_cham_soc(uuid, int) from public, anon, authenticated;
revoke all on function public.ds_cham_soc(text, uuid, int, int, int) from public, anon, authenticated;

reset lock_timeout;
