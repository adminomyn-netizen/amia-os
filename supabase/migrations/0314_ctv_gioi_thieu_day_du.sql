-- 0314 — CTV / GIỚI THIỆU ĐẦY ĐỦ (M4, docs/bedental/DOI-CHIEU-10-11.md mục 1.4 + 1.7; màn BeDental ở docs/bedental/marketing.md mục 5).
-- Chỉ THÊM bảng/cột/hàm; thay 3 hàm (dat_lich_online thêm p_ref, bc_hoa_hong_gioi_thieu + _ct dùng mức riêng theo dịch vụ). Không xoá dữ liệu.
--   doi_tac_gt.ma_ref        Mã REF = SĐT di động chuẩn hoá (0[35789]xxxxxxxx), duy nhất; tự lấy từ dien_thoai. Mã GT cũ (ma_gioi_thieu) vẫn dùng làm mã phụ.
--   doi_tac_ref_cu           đổi SĐT thì mã REF cũ còn hiệu lực 90 ngày (không cho nguồn khác lấy số đó trong 90 ngày)
--   doi_tac_theo_ref()       tra REF → nguồn: REF hiện tại → REF cũ còn hạn → mã GT
--   doi_tac_gt.ten_hien_thi / email / gui_email   tên hiện ở trang đặt lịch, email nhận thông báo + công tắc (gửi thư làm ở M5)
--   doi_tac_hh_muc           hoa hồng riêng từng dịch vụ / sản phẩm / thẻ của một nguồn (không có = mức mặc định của nguồn)
--   yeu_cau_dat_lich.doi_tac_id, lich_hen.doi_tac_id, khach_hang.doi_tac_id   người giới thiệu (FK doi_tac_gt; KHÁC nguoi_gioi_thieu_id là FK khach_hang)
--   luot_ghe_ref             lượt ghé trang đặt lịch theo REF (mỗi IP băm 1 lượt / ngày)
--   dat_lich_online(+p_ref)  ghi người giới thiệu vào yêu cầu + lịch hẹn + khách (nếu khách chưa có nguồn); khách MỚI thì tạo lead nguồn giới thiệu
--   but_toan_hh_gt           SỔ bút toán hoa hồng giới thiệu (chỉ thêm): ghi nhận / điều chỉnh / đảo (âm) khi hoá đơn huỷ, mở lại hoặc đổi người giới thiệu.
--                            Chỉ tính hoá đơn tạo trong AMIA từ ngày cau_hinh ctv.but_toan_tu_ngay (10/11/2026): hoa hồng thời SalonHero coi như đã quyết toán ngoài app,
--                            vẫn xem ở báo cáo Hoa hồng › Nguồn giới thiệu như cũ.
--   yeu_cau_rut_hh           chi trả hoa hồng: Cần xử lý → Đang duyệt chi → Đã chi (sinh phiếu chi ở Sổ quỹ) / Từ chối (tiền quay về số dư)
--   bc_nguon_gioi_thieu()    bảng nguồn gộp số: khách, đơn, doanh thu, hoa hồng (theo kỳ, chi nhánh) + chưa thanh toán (mọi kỳ)
-- Để sau (khi có CTV thật): quan hệ tuyến trên + chương trình 2 cấp, cổng CTV (M5).
-- Chạy lại nhiều lần không hỏng (if not exists / create or replace / drop … if exists / on conflict do nothing).
set lock_timeout = '4s';

-- 1. Mã REF ────────────────────────────────────────────────────────────────
alter table public.doi_tac_gt
  add column if not exists ma_ref text,
  add column if not exists ten_hien_thi text,
  add column if not exists email text,
  add column if not exists gui_email boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'doi_tac_gt_ma_ref_dang') then
    alter table public.doi_tac_gt add constraint doi_tac_gt_ma_ref_dang check (ma_ref is null or ma_ref ~ '^0(3|5|7|8|9)[0-9]{8}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'doi_tac_gt_ten_hien_thi_dai') then
    alter table public.doi_tac_gt add constraint doi_tac_gt_ten_hien_thi_dai check (ten_hien_thi is null or length(ten_hien_thi) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'doi_tac_gt_email_dang') then
    alter table public.doi_tac_gt add constraint doi_tac_gt_email_dang check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
end $$;
create unique index if not exists doi_tac_gt_ma_ref_uq on public.doi_tac_gt (ma_ref) where ma_ref is not null;

create table if not exists public.doi_tac_ref_cu (
  id uuid primary key default gen_random_uuid(),
  doi_tac_id uuid not null references public.doi_tac_gt (id),
  ma_ref text not null,
  het_han_luc timestamptz not null,
  tao_luc timestamptz not null default now()
);
create index if not exists doi_tac_ref_cu_ma_idx on public.doi_tac_ref_cu (ma_ref, het_han_luc desc);

-- SĐT → mã REF: bỏ ký tự không phải số, 84… → 0…; chỉ nhận di động 10 số đầu 03/05/07/08/09, còn lại null.
create or replace function public.chuan_ma_ref(p text) returns text language sql immutable set search_path = public, pg_temp as $$
  select case when x ~ '^0(3|5|7|8|9)[0-9]{8}$' then x end
    from (select case when y ~ '^84[0-9]{9}$' then '0' || substr(y, 3) else y end x
            from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') y) a) b
$$;

-- Nạp REF cho nguồn cũ: mỗi SĐT di động hợp lệ một nguồn (nguồn trùng số: ưu tiên có mức hoa hồng > 0, có gắn khách, mã SalonHero nhỏ); nguồn còn lại để trống REF, sửa tay sau.
update public.doi_tac_gt d set ma_ref = x.ref
  from (select id, public.chuan_ma_ref(dien_thoai) ref,
               row_number() over (partition by public.chuan_ma_ref(dien_thoai) order by (hh_gia_tri > 0) desc, (khach_id is not null) desc, sh_id nulls last, tao_luc, id) n
          from public.doi_tac_gt where public.chuan_ma_ref(dien_thoai) is not null) x
 where d.id = x.id and x.n = 1 and d.ma_ref is null
   and not exists (select 1 from public.doi_tac_gt o where o.ma_ref = x.ref);

-- Trước khi ghi: REF tự theo SĐT; không cho lấy số đang là REF cũ (còn hạn) của nguồn khác.
create or replace function public.trg_doi_tac_gt_ref() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' or new.dien_thoai is distinct from old.dien_thoai then
    new.ma_ref := public.chuan_ma_ref(new.dien_thoai);
  end if;
  if new.ma_ref is not null and (tg_op = 'INSERT' or new.ma_ref is distinct from old.ma_ref)
     and exists (select 1 from public.doi_tac_ref_cu c where c.ma_ref = new.ma_ref and c.doi_tac_id <> new.id and c.het_han_luc > now()) then
    raise exception 'Số % là mã REF cũ của nguồn khác, còn hiệu lực 90 ngày. Chưa dùng được cho nguồn này.', new.ma_ref using errcode = 'P0001';
  end if;
  if new.ma_ref is not null and exists (select 1 from public.doi_tac_gt o where o.ma_ref = new.ma_ref and o.id <> new.id) then
    raise exception 'Số % đang là mã REF của nguồn giới thiệu khác.', new.ma_ref using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists doi_tac_gt_ref on public.doi_tac_gt;
create trigger doi_tac_gt_ref before insert or update on public.doi_tac_gt for each row execute function public.trg_doi_tac_gt_ref();

-- Sau khi đổi: REF cũ còn dùng 90 ngày (link/QR đã in không chết ngay).
create or replace function public.trg_doi_tac_gt_ref_cu() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.ma_ref is not null and old.ma_ref is distinct from new.ma_ref then
    insert into public.doi_tac_ref_cu (doi_tac_id, ma_ref, het_han_luc) values (new.id, old.ma_ref, now() + interval '90 days');
  end if;
  return null;
end $$;
drop trigger if exists doi_tac_gt_ref_cu on public.doi_tac_gt;
create trigger doi_tac_gt_ref_cu after update on public.doi_tac_gt for each row execute function public.trg_doi_tac_gt_ref_cu();

-- REF (SĐT hoặc mã GT) → nguồn đang hợp tác. p_luc để kiểm hạn 90 ngày.
create or replace function public.doi_tac_theo_ref(p_ref text, p_luc timestamptz default now()) returns uuid language plpgsql stable set search_path = public, pg_temp as $$
declare v text := public.chuan_ma_ref(p_ref); r uuid; m text := upper(btrim(coalesce(p_ref, '')));
begin
  if v is not null then
    select id into r from public.doi_tac_gt where ma_ref = v and hoat_dong;
    if r is not null then return r; end if;
    select c.doi_tac_id into r from public.doi_tac_ref_cu c join public.doi_tac_gt d on d.id = c.doi_tac_id and d.hoat_dong
     where c.ma_ref = v and c.het_han_luc > p_luc and coalesce(d.ma_ref, '') <> v order by c.het_han_luc desc limit 1;
    return r;
  end if;
  if m ~ '^[A-Z0-9]{3,20}$' then
    select id into r from public.doi_tac_gt where upper(ma_gioi_thieu) = m and hoat_dong order by tao_luc limit 1;
  end if;
  return r;
end $$;

-- 2. Hoa hồng riêng từng dịch vụ / sản phẩm / thẻ ──────────────────────────
create table if not exists public.doi_tac_hh_muc (
  doi_tac_id uuid not null references public.doi_tac_gt (id) on delete cascade,
  loai text not null check (loai in ('dich_vu', 'san_pham', 'goi_the')),
  muc_id uuid not null,
  kieu text not null check (kieu in ('phan_tram', 'tien')),
  gia_tri numeric not null check (gia_tri >= 0 and gia_tri <= 1000000000),
  nguoi_id uuid references public.nhan_vien (id),
  cap_nhat_luc timestamptz not null default now(),
  primary key (doi_tac_id, loai, muc_id),
  check (kieu <> 'phan_tram' or gia_tri <= 100)
);

-- Tiền hoa hồng giới thiệu của một dòng theo nguồn: mức riêng của mục (nếu có) rồi mới tới mức mặc định của nguồn. Theo điểm = 0 đồng.
create or replace function public.hh_gt_muc(p_dt uuid, p_loai text, p_muc uuid) returns table (kieu text, gia_tri numeric)
language sql stable set search_path = public, pg_temp as $$
  select coalesce(m.kieu, d.hh_kieu), coalesce(m.gia_tri, d.hh_gia_tri)
    from public.doi_tac_gt d left join public.doi_tac_hh_muc m on m.doi_tac_id = d.id and m.loai = p_loai and m.muc_id = p_muc
   where d.id = p_dt
$$;
create or replace function public.hh_gt_tien(p_dt uuid, p_loai text, p_muc uuid, p_ds numeric, p_sl numeric) returns numeric
language sql stable set search_path = public, pg_temp as $$
  select coalesce((select case when x.kieu = 'phan_tram' then p_ds * x.gia_tri / 100 when x.kieu = 'tien' then x.gia_tri * p_sl else 0 end
                     from public.hh_gt_muc(p_dt, p_loai, p_muc) x), 0)
$$;

-- Báo cáo cũ (0253) giữ nguyên công thức, chỉ đổi nhánh "nguồn theo khách giới thiệu cả đơn" sang mức riêng theo mục.
create or replace function public.bc_hoa_hong_gioi_thieu(p_tu date, p_den date, p_cn uuid default null)
returns table (nguon text, nguoi_khoa text, nguoi_ten text, nguoi_ma text, nguoi_dt text, so_hd integer, doanh_so bigint, hoa_hong bigint, nguon_id uuid, loai_nguon text, so_dv bigint)
language sql stable set search_path = public, pg_temp as $$
  with goc as (
    select k.id::text khoa, k.ho_ten ten, k.ma, k.dien_thoai dt, h.id hd, v.doanh_so,
           case when dt.id is null then public.hh_tinh(v.doanh_so, v.so_luong, v.loai, 'gioi_thieu', v.muc_id, null)
                else public.hh_gt_tien(dt.id, v.loai, v.muc_id, v.doanh_so, v.so_luong) end hh,
           dt.id nguon_id, coalesce(public.nhan_loai_nguon_gt(dt.loai, dt.loai_sh), 'Khách hàng') loai_nguon, case when v.loai = 'dich_vu' then v.so_luong else 0 end so_dv
      from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.hoa_don_dong d on d.id = v.dong_id
      join public.khach_hang k on k.id = h.nguoi_gioi_thieu_id
      left join lateral (select x.id, x.hh_kieu, x.hh_gia_tri, x.loai, x.loai_sh from public.doi_tac_gt x where x.khach_id = k.id order by x.hoat_dong desc, x.tao_luc limit 1) dt on true
     where d.gt_doi_tac_id is null and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
    union all
    select coalesce(k.id::text, 'gt:' || g.id), coalesce(k.ho_ten, g.ten), coalesce(k.ma, g.ma_gioi_thieu, g.ma), coalesce(k.dien_thoai, g.dien_thoai), v.hoa_don_id, v.doanh_so,
           case when d.gt_kieu = 'phan_tram' then v.doanh_so * d.gt_gia_tri / 100 when d.gt_kieu = 'tien' then d.gt_gia_tri * v.so_luong else 0 end,
           g.id, public.nhan_loai_nguon_gt(g.loai, g.loai_sh), case when v.loai = 'dich_vu' then v.so_luong else 0 end
      from public.v_doanh_so_dong v join public.hoa_don_dong d on d.id = v.dong_id join public.doi_tac_gt g on g.id = d.gt_doi_tac_id
      left join public.khach_hang k on k.id = g.khach_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
  )
  select 'khach', khoa, min(ten), min(ma), min(dt), count(distinct hd)::int, round(sum(doanh_so))::bigint, round(sum(hh))::bigint,
         (array_agg(nguon_id) filter (where nguon_id is not null))[1], min(loai_nguon), sum(so_dv)::bigint
    from goc group by khoa
  union all
  select 'salonhero', coalesce(n.id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')),
         coalesce(n.ho_ten, dt.ten, g.ten_nguoi, 'SalonHero #' || coalesce(g.sh_nhan_vien_id::text, '?') || ' (chưa ghép)'),
         coalesce(n.ma_nv, dt.ma_gioi_thieu), dt.dien_thoai, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint, round(sum(g.gia_tri))::bigint,
         dt.id, case when n.id is not null then 'Nhân viên' else coalesce(public.nhan_loai_nguon_gt(dt.loai, dt.loai_sh), 'Khác') end,
         sum(case when v.loai = 'dich_vu' then v.so_luong else 0 end)::bigint
    from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id join public.hoa_don h on h.id = v.hoa_don_id left join public.nhan_vien n on n.id = g.nhan_vien_id
    left join public.doi_tac_gt dt on dt.sh_id = g.sh_nhan_vien_id and n.id is null
   where g.vai = 'gioi_thieu' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by 2, 3, 4, 5, dt.id, n.id, dt.loai, dt.loai_sh
$$;

create or replace function public.bc_hoa_hong_gioi_thieu_ct(p_tu date, p_den date, p_nguon text, p_khoa text, p_cn uuid default null)
returns table (hoa_don_id uuid, ma_hd text, ngay date, khach_id uuid, khach text, so_dv bigint, doanh_so bigint, hoa_hong bigint)
language sql stable set search_path = public, pg_temp as $$
  with goc as (
    select h.id hd, v.doanh_so, case when v.loai = 'dich_vu' then v.so_luong else 0 end so_dv,
           case when dt.id is null then public.hh_tinh(v.doanh_so, v.so_luong, v.loai, 'gioi_thieu', v.muc_id, null)
                else public.hh_gt_tien(dt.id, v.loai, v.muc_id, v.doanh_so, v.so_luong) end hh
      from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.hoa_don_dong d on d.id = v.dong_id
      left join lateral (select x.id from public.doi_tac_gt x where x.khach_id = h.nguoi_gioi_thieu_id order by x.hoat_dong desc, x.tao_luc limit 1) dt on true
     where p_nguon = 'khach' and h.nguoi_gioi_thieu_id::text = p_khoa and d.gt_doi_tac_id is null and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
    union all
    select v.hoa_don_id, v.doanh_so, case when v.loai = 'dich_vu' then v.so_luong else 0 end,
           case when d.gt_kieu = 'phan_tram' then v.doanh_so * d.gt_gia_tri / 100 when d.gt_kieu = 'tien' then d.gt_gia_tri * v.so_luong else 0 end
      from public.v_doanh_so_dong v join public.hoa_don_dong d on d.id = v.dong_id join public.doi_tac_gt g on g.id = d.gt_doi_tac_id
     where p_nguon = 'khach' and coalesce(g.khach_id::text, 'gt:' || g.id) = p_khoa and v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
    union all
    select v.hoa_don_id, v.doanh_so, case when v.loai = 'dich_vu' then v.so_luong else 0 end, g.gia_tri
      from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id
     where p_nguon = 'salonhero' and g.vai = 'gioi_thieu' and v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
       and coalesce(g.nhan_vien_id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')) = p_khoa
  )
  select h.id, coalesce(h.sh_ma, h.ma), h.ngay_hd, h.khach_id, k.ho_ten, sum(g.so_dv)::bigint, round(sum(g.doanh_so))::bigint, round(sum(g.hh))::bigint
    from goc g join public.hoa_don h on h.id = g.hd left join public.khach_hang k on k.id = h.khach_id
   group by h.id, k.ho_ten order by h.ngay_hd desc, 2 desc
   limit 500
$$;

-- 3. Người giới thiệu trên đặt lịch / lịch hẹn / khách ─────────────────────
alter table public.yeu_cau_dat_lich add column if not exists doi_tac_id uuid references public.doi_tac_gt (id);
alter table public.lich_hen add column if not exists doi_tac_id uuid references public.doi_tac_gt (id);
alter table public.khach_hang add column if not exists doi_tac_id uuid references public.doi_tac_gt (id);
create index if not exists yeu_cau_dat_lich_dt_idx on public.yeu_cau_dat_lich (doi_tac_id, tao_luc) where doi_tac_id is not null;
create index if not exists lich_hen_dt_idx on public.lich_hen (doi_tac_id, bat_dau) where doi_tac_id is not null;
create index if not exists khach_hang_dt_idx on public.khach_hang (doi_tac_id) where doi_tac_id is not null;
comment on column public.khach_hang.doi_tac_id is 'Nguồn giới thiệu (doi_tac_gt) của khách, ghi lần đầu khách đặt lịch qua link REF. Thu ngân được gợi ý người giới thiệu theo cột này.';

-- Lịch hẹn nhân viên tạo cho khách đã có nguồn giới thiệu: tự mang nguồn đó.
create or replace function public.trg_lich_hen_doi_tac() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.doi_tac_id is null then select doi_tac_id into new.doi_tac_id from public.khach_hang where id = new.khach_id; end if;
  return new;
end $$;
drop trigger if exists lich_hen_doi_tac on public.lich_hen;
create trigger lich_hen_doi_tac before insert on public.lich_hen for each row execute function public.trg_lich_hen_doi_tac();

create table if not exists public.luot_ghe_ref (
  doi_tac_id uuid not null references public.doi_tac_gt (id),
  ngay date not null,
  ip_bam text not null check (length(ip_bam) between 8 and 128),
  primary key (doi_tac_id, ngay, ip_bam)
);

-- Trang đặt lịch mở bằng REF: ghi 1 lượt ghé (mỗi IP băm một lần / ngày) và trả tên hiển thị. REF sai → null.
create or replace function public.ghi_luot_ghe_ref(p_ref text, p_ip_bam text) returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v uuid; d public.doi_tac_gt;
begin
  if p_ref is null or length(p_ref) > 30 then return null; end if;
  v := public.doi_tac_theo_ref(p_ref);
  if v is null then return null; end if;
  select * into d from public.doi_tac_gt where id = v;
  if p_ip_bam is not null and length(p_ip_bam) between 8 and 128 then
    insert into public.luot_ghe_ref (doi_tac_id, ngay, ip_bam) values (v, (now() at time zone 'Asia/Ho_Chi_Minh')::date, p_ip_bam) on conflict do nothing;
  end if;
  return jsonb_build_object('ten', coalesce(nullif(btrim(d.ten_hien_thi), ''), d.ten));
end $$;
revoke all on function public.ghi_luot_ghe_ref(text, text) from public, anon, authenticated;
grant execute on function public.ghi_luot_ghe_ref(text, text) to service_role;

-- dat_lich_online: y hệt 0271 + p_ref (đặt cuối, có mặc định nên lời gọi cũ vẫn chạy). Bỏ bản 10 tham số để PostgREST không phải chọn giữa 2 bản.
drop function if exists public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, int, uuid, text, text);
create or replace function public.dat_lich_online(p_cn uuid, p_dv uuid[], p_bat_dau timestamptz, p_ho_ten text, p_sdt text, p_gioi_tinh text,
  p_so_khach int, p_nv uuid, p_ghi_chu text, p_ip_bam text, p_ref text default null) returns jsonb language plpgsql as $$
declare
  tc jsonb := public.web_dat_lich_tuy_chon();
  v_ten text := regexp_replace(btrim(coalesce(p_ho_ten, '')), '\s+', ' ', 'g');
  v_ghi text := nullif(regexp_replace(btrim(coalesce(p_ghi_chu, '')), '\s+', ' ', 'g'), '');
  v_sdt text := regexp_replace(coalesce(p_sdt, ''), '\D', '', 'g');
  v_dv uuid[] := coalesce(p_dv, '{}'::uuid[]);
  v_sk int := coalesce(p_so_khach, 1);
  v_nv uuid; v_gt text; v_phut int; v_n int; v_ngay date; v_kt timestamptz; v_khach uuid; v_ten_k text; v_pt uuid; v_moi boolean := false;
  v_tt text; v_lich uuid; v_ma text; v_toi_da int;
  v_dt uuid; d_gt public.doi_tac_gt; v_nguon uuid; v_lead uuid; v_ten_dv text;
begin
  if coalesce((select gia_tri from public.cau_hinh where khoa = 'dat_online.mo'), '0') <> '1' then raise exception 'Đặt lịch online hiện chưa mở. Vui lòng gọi điện cho phòng khám.'; end if;
  if p_ip_bam is null or length(p_ip_bam) < 8 or length(p_ip_bam) > 128 then raise exception 'Chưa gửi được. Vui lòng thử lại.'; end if;
  perform pg_advisory_xact_lock(hashtext('gui_yeu_cau_dat_lich'));

  if v_sdt ~ '^84\d{9}$' then v_sdt := '0' || substr(v_sdt, 3); end if;
  if length(v_ten) < 2 or length(v_ten) > 100 or v_ten ~ '[<>]' or v_ten ~* '(https?:|www\.)' then raise exception 'Nhập họ tên (2 đến 100 ký tự, không chứa liên kết).'; end if;
  if v_sdt !~ '^0\d{9,10}$' then raise exception 'Số điện thoại chưa đúng (bắt đầu bằng 0, đủ 10 hoặc 11 số).'; end if;
  if v_ghi is not null and (length(v_ghi) > 300 or v_ghi ~ '[<>]' or v_ghi ~* '(https?:|www\.)') then raise exception 'Ghi chú tối đa 300 ký tự và không chứa liên kết.'; end if;
  if v_sk < 1 or v_sk > 20 then raise exception 'Số người đi cùng nhóm từ 1 đến 20.'; end if;
  v_gt := case coalesce(tc ->> 'doiTuong', 'ca') when 'nu' then 'nữ' when 'nam' then 'nam' else case when p_gioi_tinh in ('nam', 'nữ') then p_gioi_tinh else 'nữ' end end;
  if not exists (select 1 from public.chi_nhanh where id = p_cn and hoat_dong and hien_dat_lich) then raise exception 'Chọn chi nhánh.'; end if;

  if (tc -> 'hienDvSp') is distinct from 'true'::jsonb then v_dv := '{}'; end if;
  if cardinality(v_dv) > 5 then raise exception 'Chọn tối đa 5 dịch vụ.'; end if;
  if (select count(distinct x) from unnest(v_dv) x) <> cardinality(v_dv) then raise exception 'Dịch vụ bị chọn trùng.'; end if;
  if cardinality(v_dv) > 0 then
    select count(*), coalesce(sum(thoi_luong_phut), 0) into v_n, v_phut from public.dich_vu
     where id = any (v_dv) and hoat_dong and dat_online and noi_hien_thi in ('tat_ca', 'dat_lich')
       and (chi_nhanh_ids is null or chi_nhanh_ids = '{}' or p_cn = any (chi_nhanh_ids));
    if v_n <> cardinality(v_dv) then raise exception 'Có dịch vụ chưa nhận đặt online ở chi nhánh này. Vui lòng chọn lại.'; end if;
    if v_phut > 240 then raise exception 'Các dịch vụ đã chọn quá dài cho một lần đặt. Vui lòng chọn ít hơn hoặc gọi phòng khám.'; end if;
    v_phut := greatest(v_phut, 5);
  else
    v_phut := case when (tc ->> 'thoiLuongPhut') ~ '^\d{1,3}$' and (tc ->> 'thoiLuongPhut')::int between 5 and 480 then (tc ->> 'thoiLuongPhut')::int else 30 end;
  end if;
  v_nv := case when (tc -> 'chonKtv') = 'true'::jsonb then p_nv end;

  if p_bat_dau is null then raise exception 'Chọn ngày và giờ hẹn.'; end if;
  if p_bat_dau < now() then raise exception 'Khung giờ quý khách chọn đã qua. Vui lòng chọn khung giờ khác.'; end if;
  v_ngay := (p_bat_dau at time zone 'Asia/Ho_Chi_Minh')::date;
  v_toi_da := coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.toi_da_ngay'), 60);
  if v_ngay > ((now() at time zone 'Asia/Ho_Chi_Minh')::date + v_toi_da) then raise exception 'Chỉ đặt được trong vòng % ngày tới.', v_toi_da; end if;
  if not exists (select 1 from public.khung_gio_online(p_cn, v_ngay, v_phut, v_sk, v_nv) k
                  where k.gio = to_char(p_bat_dau at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI') and k.con_cho) then
    raise exception 'Khung giờ này đã hết chỗ. Vui lòng chọn giờ khác.';
  end if;
  v_kt := p_bat_dau + make_interval(mins => v_phut);

  if (select count(*) from public.yeu_cau_dat_lich y where y.dien_thoai = v_sdt and y.bat_dau > now() and ((y.lich_id is null and y.trang_thai = 'cho') or exists (select 1 from public.lich_hen l where l.id = y.lich_id and l.trang_thai not in ('huy', 'khong_den')))) >= 3 then
    raise exception 'Số điện thoại này đã có nhiều lịch đặt online sắp tới. Vui lòng gọi điện cho phòng khám để đặt thêm.';
  end if;
  if exists (select 1 from public.yeu_cau_dat_lich y where y.dien_thoai = v_sdt and ((y.lich_id is null and y.trang_thai = 'cho') or exists (select 1 from public.lich_hen l where l.id = y.lich_id and l.trang_thai not in ('huy', 'khong_den'))) and y.bat_dau < v_kt and y.bat_dau + make_interval(mins => y.thoi_luong_phut) > p_bat_dau) then
    raise exception 'Số điện thoại này đã đặt lịch vào khung giờ đó.';
  end if;
  if (select count(*) from public.yeu_cau_dat_lich where dien_thoai = v_sdt and tao_luc > now() - interval '1 day') >= 5 then
    raise exception 'Số điện thoại này đặt quá nhiều lần trong ngày. Vui lòng gọi điện cho phòng khám.';
  end if;
  if (select count(*) from public.yeu_cau_dat_lich where ip_bam = p_ip_bam and tao_luc > now() - interval '1 hour') >= 10 then
    raise exception 'Quý khách gửi quá nhiều lần trong một giờ. Vui lòng thử lại sau hoặc gọi điện cho phòng khám.';
  end if;
  if (select count(*) from public.yeu_cau_dat_lich where tao_luc > now() - interval '1 hour') >= 60 then
    raise exception 'Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau hoặc gọi điện cho phòng khám.';
  end if;

  select id, ho_ten into v_khach, v_ten_k from public.khach_hang where dien_thoai = v_sdt order by tao_luc limit 1;
  if v_khach is null then
    select nullif(gia_tri, '')::uuid into v_pt from public.cau_hinh where khoa = 'dat_online.phu_trach' and gia_tri ~ '^[0-9a-f-]{36}$';
    if v_pt is null or not exists (select 1 from public.nhan_vien where id = v_pt and hoat_dong) then
      select id into v_pt from public.nhan_vien where hoat_dong and vai_tro in ('quan_ly', 'le_tan', 'chu') and (chi_nhanh_id = p_cn or chi_nhanh_id is null)
       order by (chi_nhanh_id = p_cn) desc nulls last, case vai_tro when 'quan_ly' then 1 when 'le_tan' then 2 else 3 end, tao_luc limit 1;
    end if;
    if v_pt is null then raise exception 'Chưa đặt được lịch. Vui lòng gọi điện cho phòng khám.'; end if;
    insert into public.khach_hang (ma, ho_ten, dien_thoai, gioi_tinh, chi_nhanh_id, nguon, nguon_chi_tiet, nguoi_phu_trach_id)
    values ('KH' || lpad(public.so_tiep_theo('khach')::text, 6, '0'), v_ten, v_sdt, v_gt, p_cn, 'mkt', 'Đặt lịch online', v_pt) returning id into v_khach;
    v_ten_k := v_ten; v_moi := true;
  end if;

  -- Người giới thiệu theo REF (SĐT / mã GT). Tự giới thiệu chính mình (SĐT trùng REF hoặc là khách gắn với nguồn) thì bỏ qua.
  if p_ref is not null and length(p_ref) <= 30 then
    v_dt := public.doi_tac_theo_ref(p_ref);
    if v_dt is not null then
      select * into d_gt from public.doi_tac_gt where id = v_dt;
      if d_gt.ma_ref = public.chuan_ma_ref(v_sdt) or public.chuan_ma_ref(d_gt.dien_thoai) = public.chuan_ma_ref(v_sdt) or d_gt.khach_id = v_khach then v_dt := null; end if;
    end if;
  end if;

  v_tt := case when tc ->> 'trangThai' = 'da_xac_nhan' then 'da_xac_nhan' else 'chua_xac_nhan' end;
  v_ma := 'W' || upper(substr(md5(gen_random_uuid()::text), 1, 7));
  if v_dt is not null then update public.khach_hang set doi_tac_id = v_dt where id = v_khach and doi_tac_id is null; end if;
  insert into public.lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, xac_nhan_luc, nguon, so_khach, nhan_vien_id, ma_dat_lich, ghi_chu, doi_tac_id)
  values (v_khach, p_cn, p_bat_dau, v_kt, v_tt, case when v_tt = 'da_xac_nhan' then now() end, 'ONLINE', v_sk, v_nv, v_ma,
          'Khách tự đặt online' || case when v_sk > 1 then ' · nhóm ' || v_sk || ' khách' else '' end || coalesce(' · ' || v_ghi, '')
            || case when not v_moi and v_ten <> v_ten_k then ' · Tên khách ghi: ' || v_ten else '' end
            || case when v_dt is not null then ' · Người giới thiệu: ' || d_gt.ten else '' end,
          v_dt)
  returning id into v_lich;
  if cardinality(v_dv) > 0 then insert into public.lich_hen_dich_vu (lich_id, dich_vu_id) select v_lich, unnest(v_dv); end if;
  insert into public.yeu_cau_dat_lich (chi_nhanh_id, dich_vu_ids, bat_dau, thoi_luong_phut, ho_ten, dien_thoai, ghi_chu, ip_bam, trang_thai, lich_id, xu_ly_luc, gioi_tinh, so_khach, nhan_vien_id, doi_tac_id)
  values (p_cn, v_dv, p_bat_dau, v_phut, v_ten, v_sdt, v_ghi, p_ip_bam, 'da_duyet', v_lich, now(), v_gt, v_sk, v_nv, v_dt);

  -- Lead nguồn giới thiệu (luật SOP: không tạo lead cho khách cũ). Số đang có lead mở thì chỉ gắn nguồn + khách + đẩy sang "Đã đặt lịch".
  -- Lỗi ở phần lead KHÔNG được làm hỏng lịch khách vừa đặt.
  if v_dt is not null then
    begin
      select id into v_lead from public.lead where sdt = v_sdt and ket_qua = 'open' and trang_thai_phan_bo not in ('lead_trung', 'khong_hop_le') order by tao_luc desc limit 1;
      if v_lead is not null then
        update public.lead set doi_tac_id = coalesce(doi_tac_id, v_dt), khach_id = coalesce(khach_id, v_khach), trang_thai_lien_he = 'da_dat_lich' where id = v_lead;
      elsif v_moi then
        select id into v_nguon from public.nguon_lead where ma = case when d_gt.loai in ('ctv', 'kol') then 'ctv' else 'gioi_thieu' end and hoat_dong;
        if v_nguon is null then select id into v_nguon from public.nguon_lead where loai = 'doi_tac' and hoat_dong order by thu_tu limit 1; end if;
        if v_nguon is not null then
          select string_agg(ten, ', ') into v_ten_dv from public.dich_vu where id = any (v_dv);
          insert into public.lead (ma, ho_ten, sdt, nguon_id, doi_tac_id, chi_nhanh_id, khach_id, trang_thai_lien_he, dich_vu_quan_tam, nhu_cau)
          values ('LD' || lpad(public.so_tiep_theo('lead')::text, 6, '0'), v_ten, v_sdt, v_nguon, v_dt, p_cn, v_khach, 'da_dat_lich', v_ten_dv,
                  'Tự đặt lịch online qua link giới thiệu ' || to_char(p_bat_dau at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY') || coalesce(' · ' || v_ghi, ''));
        end if;
      end if;
    exception when others then
      raise warning 'dat_lich_online: không tạo được lead giới thiệu: %', sqlerrm;
    end;
  end if;
  return jsonb_build_object('lich_id', v_lich, 'ma', v_ma, 'phut', v_phut, 'trang_thai', v_tt, 'gioi_thieu', v_dt is not null);
end $$;
revoke all on function public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, int, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, int, uuid, text, text, text) to service_role;

-- 4. Sổ bút toán hoa hồng giới thiệu ───────────────────────────────────────
insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('ctv.but_toan_tu_ngay', '2026-11-10', 'Sổ bút toán hoa hồng giới thiệu tính từ hoá đơn ngày này (hoa hồng thời SalonHero coi như đã quyết toán ngoài AMIA OS)'),
  ('ctv.toi_thieu_rut', '0', 'Số dư hoa hồng tối thiểu để tạo yêu cầu chi trả (đồng)'),
  ('ctv.tu_dang_ky_kieu', 'phan_tram', 'Mức hoa hồng mặc định cho CTV tự đăng ký (cổng CTV, M5): phan_tram / tien'),
  ('ctv.tu_dang_ky_gia_tri', '10', 'Giá trị mức hoa hồng mặc định cho CTV tự đăng ký')
on conflict (khoa) do nothing;

create table if not exists public.but_toan_hh_gt (
  id uuid primary key default gen_random_uuid(),
  doi_tac_id uuid not null references public.doi_tac_gt (id),
  hoa_don_id uuid not null,               -- không khoá ngoại: hoá đơn có bị xoá thì sổ vẫn giữ và tự đảo
  ma_hd text,
  ngay_hd date not null,
  chi_nhanh_id uuid,
  muc_loai text not null,
  muc_id uuid,
  ten_muc text,
  loai text not null check (loai in ('ghi_nhan', 'dieu_chinh', 'dao')),
  doanh_so bigint not null,               -- doanh thu tính hoa hồng (có dấu: dòng đảo âm)
  kieu text,
  gia_tri numeric,                        -- % hoặc tiền / đơn vị lúc ghi
  so_tien bigint not null,                -- hoa hồng (có dấu)
  ghi_luc timestamptz not null default now()
);
create index if not exists but_toan_hh_gt_dt_idx on public.but_toan_hh_gt (doi_tac_id, ngay_hd);
create index if not exists but_toan_hh_gt_hd_idx on public.but_toan_hh_gt (hoa_don_id);
drop trigger if exists but_toan_hh_gt_chi_them on public.but_toan_hh_gt;
create trigger but_toan_hh_gt_chi_them before update or delete on public.but_toan_hh_gt for each row execute function public.chi_them_dong();

-- Hoa hồng ĐÚNG của một hoá đơn lúc này, theo (nguồn, mục). Hoá đơn chưa hoàn thành / đã huỷ / lịch sử SalonHero / trước ngày bắt đầu sổ → rỗng.
create or replace function public.hh_gt_muc_tieu(p_hd uuid) returns table (doi_tac_id uuid, muc_loai text, muc_id uuid, ten_muc text, doanh_so numeric, kieu text, gia_tri numeric, so_tien numeric)
language sql stable set search_path = public, pg_temp as $$
  with h as (
    select h.* from public.hoa_don h
     where h.id = p_hd and h.trang_thai = 'hoan_thanh' and not h.la_lich_su and not h.la_so_du_dau and h.sh_id is null
       and h.ngay_hd >= coalesce((select nullif(gia_tri, '')::date from public.cau_hinh where khoa = 'ctv.but_toan_tu_ngay'), date '2026-11-10')
  )
  select d.gt_doi_tac_id, v.loai, v.muc_id, min(v.ten), sum(v.doanh_so), min(d.gt_kieu), min(d.gt_gia_tri),
         sum(case when d.gt_kieu = 'phan_tram' then v.doanh_so * d.gt_gia_tri / 100 when d.gt_kieu = 'tien' then d.gt_gia_tri * v.so_luong else 0 end)
    from h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.hoa_don_dong d on d.id = v.dong_id
   where d.gt_doi_tac_id is not null
   group by d.gt_doi_tac_id, v.loai, v.muc_id
  union all
  -- Mức lấy lúc ghi nhận lần đầu (đã có trong sổ) được giữ nguyên: sau này đổi mức của nguồn không làm đổi bút toán cũ.
  select dt.id, v.loai, v.muc_id, min(v.ten), sum(v.doanh_so), min(coalesce(cu.kieu, m.kieu)), min(coalesce(cu.gia_tri, m.gia_tri)),
         sum(case when cu.kieu = 'phan_tram' then v.doanh_so * cu.gia_tri / 100 when cu.kieu = 'tien' then cu.gia_tri * v.so_luong when cu.kieu is not null then 0
                  else public.hh_gt_tien(dt.id, v.loai, v.muc_id, v.doanh_so, v.so_luong) end)
    from h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.hoa_don_dong d on d.id = v.dong_id
    join lateral (select x.id from public.doi_tac_gt x where x.khach_id = h.nguoi_gioi_thieu_id order by x.hoat_dong desc, x.tao_luc limit 1) dt on true
    left join lateral public.hh_gt_muc(dt.id, v.loai, v.muc_id) m on true
    left join lateral (select b.kieu, b.gia_tri from public.but_toan_hh_gt b where b.hoa_don_id = h.id and b.doi_tac_id = dt.id and b.muc_loai = v.loai
                         and b.muc_id = v.muc_id and b.kieu is not null order by b.ghi_luc, b.id limit 1) cu on true
   where d.gt_doi_tac_id is null and h.nguoi_gioi_thieu_id is not null
   group by dt.id, v.loai, v.muc_id
$$;

-- Đối chiếu sổ với số đúng của một hoá đơn, ghi phần CHÊNH (không sửa dòng cũ). Gọi bao nhiêu lần cũng được (đúng rồi thì không ghi gì).
create or replace function public.ghi_but_toan_hh_gt(p_hd uuid) returns int language plpgsql set search_path = public, pg_temp as $$
declare h public.hoa_don; n int;
begin
  perform pg_advisory_xact_lock(hashtext('but_toan_hh_gt:' || p_hd));
  select * into h from public.hoa_don where id = p_hd;
  with tg as (
    select t.doi_tac_id, t.muc_loai, t.muc_id, min(t.ten_muc) ten_muc, round(sum(t.doanh_so))::bigint ds, min(t.kieu) kieu, min(t.gia_tri) gia_tri, round(sum(t.so_tien))::bigint st
      from public.hh_gt_muc_tieu(p_hd) t group by 1, 2, 3
  ), so as (
    select b.doi_tac_id, b.muc_loai, b.muc_id, sum(b.doanh_so)::bigint ds, sum(b.so_tien)::bigint st, min(b.ten_muc) ten_muc, min(b.ma_hd) ma_hd, min(b.ngay_hd) ngay_hd, min(b.chi_nhanh_id::text)::uuid cn
      from public.but_toan_hh_gt b where b.hoa_don_id = p_hd group by 1, 2, 3
  ), lech as (
    select coalesce(tg.doi_tac_id, so.doi_tac_id) doi_tac_id, coalesce(tg.muc_loai, so.muc_loai) muc_loai, coalesce(tg.muc_id, so.muc_id) muc_id,
           coalesce(tg.ten_muc, so.ten_muc) ten_muc, coalesce(tg.ds, 0) - coalesce(so.ds, 0) ds, coalesce(tg.st, 0) - coalesce(so.st, 0) st,
           tg.kieu, tg.gia_tri, coalesce(so.ds, 0) <> 0 or coalesce(so.st, 0) <> 0 da_co, coalesce(tg.ds, 0) <> 0 or coalesce(tg.st, 0) <> 0 con, so.ma_hd, so.ngay_hd, so.cn
      from tg full join so on so.doi_tac_id = tg.doi_tac_id and so.muc_loai = tg.muc_loai
                           and coalesce(so.muc_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(tg.muc_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  insert into public.but_toan_hh_gt (doi_tac_id, hoa_don_id, ma_hd, ngay_hd, chi_nhanh_id, muc_loai, muc_id, ten_muc, loai, doanh_so, kieu, gia_tri, so_tien)
  select l.doi_tac_id, p_hd, coalesce(h.sh_ma, h.ma, l.ma_hd), coalesce(h.ngay_hd, l.ngay_hd), coalesce(h.chi_nhanh_id, l.cn), l.muc_loai, l.muc_id, l.ten_muc,
         case when not l.da_co then 'ghi_nhan' when not l.con then 'dao' else 'dieu_chinh' end, l.ds, l.kieu, l.gia_tri, l.st
    from lech l where l.ds <> 0 or l.st <> 0;
  get diagnostics n = row_count;
  return n;
end $$;

-- Đối chiếu mọi hoá đơn có thể có hoa hồng giới thiệu từ ngày bắt đầu sổ (lưới an toàn khi trigger lỡ; gọi khi mở màn CTV / trước khi chi trả).
create or replace function public.dong_bo_but_toan_hh_gt() returns int language plpgsql set search_path = public, pg_temp as $$
declare r record; n int := 0; v_tu date := coalesce((select nullif(gia_tri, '')::date from public.cau_hinh where khoa = 'ctv.but_toan_tu_ngay'), date '2026-11-10');
begin
  for r in
    select h.id from public.hoa_don h where h.ngay_hd >= v_tu and h.sh_id is null and not h.la_lich_su
       and (h.nguoi_gioi_thieu_id is not null or exists (select 1 from public.hoa_don_dong d where d.hoa_don_id = h.id and d.gt_doi_tac_id is not null))
    union
    select distinct b.hoa_don_id from public.but_toan_hh_gt b
  loop
    n := n + public.ghi_but_toan_hh_gt(r.id);
  end loop;
  return n;
end $$;

-- Trigger: hoá đơn đổi trạng thái (chốt / huỷ / mở lại) hoặc đổi số tiền, người giới thiệu → đối chiếu. Lỗi ở sổ hoa hồng không được chặn thu ngân.
create or replace function public.trg_hoa_don_but_toan_hh() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (old.trang_thai = 'hoan_thanh' or new.trang_thai = 'hoan_thanh') and new.sh_id is null and not new.la_lich_su
     and (new.trang_thai is distinct from old.trang_thai or new.nguoi_gioi_thieu_id is distinct from old.nguoi_gioi_thieu_id or new.giam_gia_don is distinct from old.giam_gia_don
          or new.tong_hang is distinct from old.tong_hang or new.ngay_hd is distinct from old.ngay_hd) then
    begin
      perform public.ghi_but_toan_hh_gt(new.id);
    exception when others then
      raise warning 'Sổ hoa hồng giới thiệu chưa ghi được cho hoá đơn %: %', new.id, sqlerrm;
    end;
  end if;
  return null;
end $$;
drop trigger if exists hoa_don_but_toan_hh on public.hoa_don;
create trigger hoa_don_but_toan_hh after update on public.hoa_don for each row execute function public.trg_hoa_don_but_toan_hh();

create or replace function public.trg_hoa_don_dong_but_toan_hh() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_hd uuid := coalesce(new.hoa_don_id, old.hoa_don_id);
begin
  if exists (select 1 from public.hoa_don where id = v_hd and trang_thai = 'hoan_thanh' and sh_id is null and not la_lich_su) then
    begin
      perform public.ghi_but_toan_hh_gt(v_hd);
    exception when others then
      raise warning 'Sổ hoa hồng giới thiệu chưa ghi được cho hoá đơn %: %', v_hd, sqlerrm;
    end;
  end if;
  return null;
end $$;
drop trigger if exists hoa_don_dong_but_toan_hh on public.hoa_don_dong;
create trigger hoa_don_dong_but_toan_hh after insert or delete or update of gt_doi_tac_id, gt_kieu, gt_gia_tri, don_gia, giam_gia, so_luong on public.hoa_don_dong
  for each row execute function public.trg_hoa_don_dong_but_toan_hh();

-- 5. Chi trả hoa hồng ──────────────────────────────────────────────────────
insert into public.loai_thu_chi (ten, huong, he_thong, thu_tu) values ('Chi hoa hồng giới thiệu', 'chi', true, 40) on conflict (ten) do nothing;

create table if not exists public.yeu_cau_rut_hh (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  doi_tac_id uuid not null references public.doi_tac_gt (id),
  so_tien bigint not null check (so_tien > 0 and so_tien <= 100000000000),
  hinh_thuc text not null check (hinh_thuc in ('chuyen_khoan', 'tien_mat')),
  ngan_hang text, so_tk text, ten_chu_tk text,
  ghi_chu text check (ghi_chu is null or length(ghi_chu) <= 500),
  trang_thai text not null default 'cho_xu_ly' check (trang_thai in ('cho_xu_ly', 'dang_duyet_chi', 'da_chi', 'tu_choi')),
  ly_do_tu_choi text,
  tao_boi uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  duyet_boi uuid references public.nhan_vien (id), duyet_luc timestamptz,
  chi_boi uuid references public.nhan_vien (id), chi_luc timestamptz,
  so_quy_id uuid references public.so_quy (id),
  tu_choi_boi uuid references public.nhan_vien (id), tu_choi_luc timestamptz,
  check (hinh_thuc <> 'chuyen_khoan' or (coalesce(btrim(ngan_hang), '') <> '' and coalesce(btrim(so_tk), '') <> '' and coalesce(btrim(ten_chu_tk), '') <> '')),
  check (trang_thai <> 'da_chi' or so_quy_id is not null),
  check (trang_thai <> 'tu_choi' or coalesce(btrim(ly_do_tu_choi), '') <> '')
);
-- Mỗi nguồn chỉ một yêu cầu đang mở.
create unique index if not exists yeu_cau_rut_hh_mot_mo on public.yeu_cau_rut_hh (doi_tac_id) where trang_thai in ('cho_xu_ly', 'dang_duyet_chi');
create index if not exists yeu_cau_rut_hh_tt_idx on public.yeu_cau_rut_hh (trang_thai, tao_luc desc);

-- Chặn ở DB: không xoá; số tiền / nguồn / người tạo không đổi; chỉ đi đúng đường Cần xử lý → Đang duyệt chi → Đã chi, hoặc → Từ chối.
create or replace function public.trg_yeu_cau_rut_hh() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then raise exception 'Yêu cầu chi trả hoa hồng không xoá được (từ chối thay vì xoá).' using errcode = 'P0001'; end if;
  if new.so_tien <> old.so_tien or new.doi_tac_id <> old.doi_tac_id or new.tao_boi <> old.tao_boi or new.ma <> old.ma or new.hinh_thuc <> old.hinh_thuc then
    raise exception 'Không sửa số tiền, nguồn hay hình thức của yêu cầu đã gửi.' using errcode = 'P0001';
  end if;
  if old.trang_thai in ('da_chi', 'tu_choi') then raise exception 'Yêu cầu đã kết thúc, không sửa được.' using errcode = 'P0001'; end if;
  if new.trang_thai is distinct from old.trang_thai and not (
       (old.trang_thai = 'cho_xu_ly' and new.trang_thai in ('dang_duyet_chi', 'tu_choi')) or
       (old.trang_thai = 'dang_duyet_chi' and new.trang_thai in ('da_chi', 'tu_choi'))) then
    raise exception 'Không chuyển được yêu cầu từ % sang %.', old.trang_thai, new.trang_thai using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists yeu_cau_rut_hh_kiem on public.yeu_cau_rut_hh;
create trigger yeu_cau_rut_hh_kiem before update or delete on public.yeu_cau_rut_hh for each row execute function public.trg_yeu_cau_rut_hh();

-- Số dư hoa hồng của một nguồn: tổng sổ (từ ngày bắt đầu sổ) − đã chi − đang chờ chi.
create or replace function public.so_du_hh_gt(p_dt uuid) returns table (tong_hh bigint, da_chi bigint, dang_cho bigint, kha_dung bigint)
language sql stable set search_path = public, pg_temp as $$
  with t as (select coalesce(sum(so_tien), 0)::bigint v from public.but_toan_hh_gt where doi_tac_id = p_dt),
       r as (select coalesce(sum(so_tien) filter (where trang_thai = 'da_chi'), 0)::bigint chi,
                    coalesce(sum(so_tien) filter (where trang_thai in ('cho_xu_ly', 'dang_duyet_chi')), 0)::bigint cho
               from public.yeu_cau_rut_hh where doi_tac_id = p_dt)
  select t.v, r.chi, r.cho, t.v - r.chi - r.cho from t, r
$$;

-- Hạn mức duyệt hiệu lực (giống lib/de-xuat.ts hanMucHieuLuc): đã đặt thì theo số đặt; chưa đặt thì Chủ / Kỹ thuật / Quản lý không giới hạn, vai khác 0.
create or replace function public.du_han_muc_duyet(p_nv uuid, p_tien bigint) returns boolean language sql stable set search_path = public, pg_temp as $$
  select coalesce((select case when n.han_muc_duyet is not null then n.han_muc_duyet >= p_tien else n.vai_tro in ('chu', 'ky_thuat', 'quan_ly') end
                     from public.nhan_vien n where n.id = p_nv and n.hoat_dong), false)
$$;

create or replace function public.rut_hh_tao(p_dt uuid, p_so_tien bigint, p_hinh_thuc text, p_ngan_hang text, p_so_tk text, p_ten_chu_tk text, p_ghi_chu text, p_nguoi uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_id uuid; v_min bigint; s record;
begin
  if p_nguoi is null then raise exception 'Thiếu người tạo.' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.doi_tac_gt where id = p_dt) then raise exception 'Không tìm thấy nguồn giới thiệu.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('rut_hh:' || p_dt));
  if exists (select 1 from public.yeu_cau_rut_hh where doi_tac_id = p_dt and trang_thai in ('cho_xu_ly', 'dang_duyet_chi')) then
    raise exception 'Nguồn này đang có một yêu cầu chi trả chưa xử lý xong.' using errcode = 'P0001';
  end if;
  -- Đối chiếu sổ các hoá đơn của nguồn trước khi tính số dư.
  perform public.ghi_but_toan_hh_gt(x.hd) from (
    select distinct d.hoa_don_id hd from public.hoa_don_dong d where d.gt_doi_tac_id = p_dt
    union select distinct b.hoa_don_id from public.but_toan_hh_gt b where b.doi_tac_id = p_dt) x;
  select * into s from public.so_du_hh_gt(p_dt);
  v_min := coalesce((select nullif(gia_tri, '')::bigint from public.cau_hinh where khoa = 'ctv.toi_thieu_rut'), 0);
  if p_so_tien is null or p_so_tien <= 0 then raise exception 'Số tiền phải lớn hơn 0.' using errcode = 'P0001'; end if;
  if s.kha_dung <= 0 then raise exception 'Nguồn này chưa có hoa hồng chưa thanh toán.' using errcode = 'P0001'; end if;
  if p_so_tien > s.kha_dung then raise exception 'Số tiền vượt số dư được rút (% đ).', s.kha_dung using errcode = 'P0001'; end if;
  if p_so_tien < v_min then raise exception 'Chưa đạt mức tối thiểu được rút (% đ).', v_min using errcode = 'P0001'; end if;
  insert into public.yeu_cau_rut_hh (ma, doi_tac_id, so_tien, hinh_thuc, ngan_hang, so_tk, ten_chu_tk, ghi_chu, tao_boi)
  values ('RH' || lpad(public.so_tiep_theo('rut_hh')::text, 5, '0'), p_dt, p_so_tien, p_hinh_thuc, nullif(btrim(p_ngan_hang), ''), nullif(btrim(p_so_tk), ''), nullif(btrim(p_ten_chu_tk), ''), nullif(btrim(p_ghi_chu), ''), p_nguoi)
  returning id into v_id;
  return v_id;
end $$;

-- Xử lý → Đang duyệt chi: người duyệt khác người tạo, đủ hạn mức duyệt (Cài đặt › Chính sách phê duyệt).
create or replace function public.rut_hh_duyet(p_id uuid, p_nguoi uuid) returns void language plpgsql set search_path = public, pg_temp as $$
declare r public.yeu_cau_rut_hh;
begin
  select * into r from public.yeu_cau_rut_hh where id = p_id for update;
  if not found then raise exception 'Không tìm thấy yêu cầu.' using errcode = 'P0001'; end if;
  if r.trang_thai <> 'cho_xu_ly' then raise exception 'Yêu cầu không còn ở bước Cần xử lý.' using errcode = 'P0001'; end if;
  if r.tao_boi = p_nguoi then raise exception 'Người tạo yêu cầu không tự duyệt chi.' using errcode = 'P0001'; end if;
  if not public.du_han_muc_duyet(p_nguoi, r.so_tien) then raise exception 'Hạn mức duyệt của bạn thấp hơn số tiền yêu cầu.' using errcode = 'P0001'; end if;
  update public.yeu_cau_rut_hh set trang_thai = 'dang_duyet_chi', duyet_boi = p_nguoi, duyet_luc = now() where id = p_id;
end $$;

-- Đánh dấu đã chi: ghi MỘT phiếu chi vào Sổ quỹ (ngày hôm nay) rồi gắn vào yêu cầu. Người tạo không tự chi; người duyệt không tự chi (trừ Kỹ thuật, như chi_theo_de_xuat).
create or replace function public.rut_hh_da_chi(p_id uuid, p_nguoi uuid, p_quy uuid, p_bo_qua_kiem boolean default false) returns uuid language plpgsql set search_path = public, pg_temp as $$
declare r public.yeu_cau_rut_hh; q public.quy; d public.doi_tac_gt; v_lt uuid; v_ma text; v_sq uuid; v_can text;
begin
  select * into r from public.yeu_cau_rut_hh where id = p_id for update;
  if not found then raise exception 'Không tìm thấy yêu cầu.' using errcode = 'P0001'; end if;
  if r.trang_thai <> 'dang_duyet_chi' then raise exception 'Yêu cầu chưa được duyệt chi hoặc đã kết thúc.' using errcode = 'P0001'; end if;
  if r.tao_boi = p_nguoi then raise exception 'Người tạo yêu cầu không tự chi.' using errcode = 'P0001'; end if;
  if not p_bo_qua_kiem and r.duyet_boi = p_nguoi then raise exception 'Người duyệt không tự thực hiện chi cùng yêu cầu.' using errcode = 'P0001'; end if;
  select * into q from public.quy where id = p_quy and hoat_dong;
  if q.id is null then raise exception 'Chọn quỹ đang dùng.' using errcode = 'P0001'; end if;
  v_can := case r.hinh_thuc when 'chuyen_khoan' then 'ngan_hang' else 'tien_mat' end;
  if q.loai <> v_can then
    raise exception 'Quỹ không khớp hình thức nhận: yêu cầu nhận % thì chi từ quỹ %.', r.hinh_thuc, v_can using errcode = 'P0001';
  end if;
  select id into v_lt from public.loai_thu_chi where ten = 'Chi hoa hồng giới thiệu';
  select * into d from public.doi_tac_gt where id = r.doi_tac_id;
  v_ma := 'PC' || lpad(public.so_tiep_theo('so_quy_PC')::text, 6, '0');
  insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguoi_nhan, nguoi_id)
  values (v_ma, (now() at time zone 'Asia/Ho_Chi_Minh')::date, q.id, 'chi', r.so_tien, v_lt, 'Chi hoa hồng giới thiệu ' || r.ma || ': ' || d.ten, d.ten,
          coalesce(r.ten_chu_tk, d.ten), p_nguoi)
  returning id into v_sq;
  update public.yeu_cau_rut_hh set trang_thai = 'da_chi', chi_boi = p_nguoi, chi_luc = now(), so_quy_id = v_sq where id = p_id;
  return v_sq;
end $$;

-- Từ chối (có lý do): không ghi tiền; số tiền tự quay về số dư của nguồn.
create or replace function public.rut_hh_tu_choi(p_id uuid, p_nguoi uuid, p_ly_do text) returns void language plpgsql set search_path = public, pg_temp as $$
declare r public.yeu_cau_rut_hh;
begin
  select * into r from public.yeu_cau_rut_hh where id = p_id for update;
  if not found then raise exception 'Không tìm thấy yêu cầu.' using errcode = 'P0001'; end if;
  if r.trang_thai not in ('cho_xu_ly', 'dang_duyet_chi') then raise exception 'Yêu cầu đã kết thúc.' using errcode = 'P0001'; end if;
  if coalesce(btrim(p_ly_do), '') = '' then raise exception 'Nhập lý do từ chối.' using errcode = 'P0001'; end if;
  update public.yeu_cau_rut_hh set trang_thai = 'tu_choi', ly_do_tu_choi = left(btrim(p_ly_do), 500), tu_choi_boi = p_nguoi, tu_choi_luc = now() where id = p_id;
end $$;

-- 6. Bảng nguồn gộp số ─────────────────────────────────────────────────────
-- Theo kỳ + chi nhánh: số khách mua, số đơn, doanh thu tính HH, hoa hồng (từ sổ), lịch đặt qua REF, lượt ghé, lead. Mọi kỳ: tổng HH, đã chi, đang chờ, chưa thanh toán.
create or replace function public.bc_nguon_gioi_thieu(p_tu date, p_den date, p_cn uuid default null)
returns table (doi_tac_id uuid, so_khach int, so_don int, doanh_thu bigint, hoa_hong bigint, tong_hh bigint, da_chi bigint, dang_cho bigint, chua_thanh_toan bigint,
               so_lich int, luot_ghe int, so_lead int, so_khach_gan int)
language sql stable set search_path = public, pg_temp as $$
  with ky as (
    select b.doi_tac_id, b.hoa_don_id, sum(b.doanh_so) ds, sum(b.so_tien) st from public.but_toan_hh_gt b
     where b.ngay_hd between p_tu and p_den and (p_cn is null or b.chi_nhanh_id = p_cn) group by 1, 2
  ), ky_dt as (
    select k.doi_tac_id, count(distinct h.khach_id) filter (where k.ds <> 0 or k.st <> 0)::int kh, count(*) filter (where k.ds <> 0 or k.st <> 0)::int don,
           sum(k.ds)::bigint ds, sum(k.st)::bigint st
      from ky k left join public.hoa_don h on h.id = k.hoa_don_id group by 1
  ), tong as (select b.doi_tac_id, sum(b.so_tien)::bigint v from public.but_toan_hh_gt b group by 1),
  rut as (select r.doi_tac_id, coalesce(sum(r.so_tien) filter (where r.trang_thai = 'da_chi'), 0)::bigint chi,
                 coalesce(sum(r.so_tien) filter (where r.trang_thai in ('cho_xu_ly', 'dang_duyet_chi')), 0)::bigint cho
            from public.yeu_cau_rut_hh r group by 1),
  lich as (select l.doi_tac_id, count(*)::int n from public.lich_hen l
            where l.doi_tac_id is not null and (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den and (p_cn is null or l.chi_nhanh_id = p_cn) group by 1),
  ghe as (select g.doi_tac_id, count(*)::int n from public.luot_ghe_ref g where g.ngay between p_tu and p_den group by 1),
  ld as (select l.doi_tac_id, count(*)::int n from public.lead l
          where l.doi_tac_id is not null and (l.thoi_diem_phat_sinh at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den and (p_cn is null or l.chi_nhanh_id = p_cn) group by 1),
  kg as (select k.doi_tac_id, count(*)::int n from public.khach_hang k where k.doi_tac_id is not null group by 1)
  select d.id, coalesce(ky_dt.kh, 0), coalesce(ky_dt.don, 0), coalesce(ky_dt.ds, 0), coalesce(ky_dt.st, 0), coalesce(tong.v, 0), coalesce(rut.chi, 0), coalesce(rut.cho, 0),
         coalesce(tong.v, 0) - coalesce(rut.chi, 0), coalesce(lich.n, 0), coalesce(ghe.n, 0), coalesce(ld.n, 0), coalesce(kg.n, 0)
    from public.doi_tac_gt d
    left join ky_dt on ky_dt.doi_tac_id = d.id left join tong on tong.doi_tac_id = d.id left join rut on rut.doi_tac_id = d.id
    left join lich on lich.doi_tac_id = d.id left join ghe on ghe.doi_tac_id = d.id left join ld on ld.doi_tac_id = d.id left join kg on kg.doi_tac_id = d.id
$$;

-- Ghi sổ lần đầu cho hoá đơn từ ngày bắt đầu sổ (hiện chưa có hoá đơn AMIA nào có người giới thiệu → thường 0 dòng).
select public.dong_bo_but_toan_hh_gt();

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
