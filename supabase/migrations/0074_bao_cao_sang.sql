-- 0074 — BÁO CÁO SÁNG (28/10/2026): tóm tắt đầu ngày cho quản lý.
-- • bao_cao_sang_tinh(ngày, chi nhánh): HÔM QUA (số hoá đơn, lịch hoàn thành/huỷ/không đến, khách mới) + HÔM NAY (số lịch hẹn, khách sinh nhật,
--   nhắc đến hạn, nhắc quá hạn, thẻ sắp hết, khách đến hẹn tái khám). KHÔNG có tiền, KHÔNG có số điện thoại.
--   Trang chủ tính hàm này MỖI LẦN mở (không cần cron).
-- • luu_bao_cao_sang(): lưu 1 bản (tất cả chi nhánh + từng chi nhánh) vào bao_cao_sang; pg_cron (đã bật sẵn trên Supabase, miễn phí) gọi lúc 07:00 giờ Việt Nam (00:00 UTC).
set lock_timeout = '4s';

create table public.bao_cao_sang (
  id uuid primary key default gen_random_uuid(),
  ngay date not null,
  chi_nhanh_id uuid references public.chi_nhanh (id),
  du_lieu jsonb not null,
  tao_luc timestamptz not null default now()
);
create unique index bao_cao_sang_ngay_cn_uq on public.bao_cao_sang (ngay, coalesce(chi_nhanh_id, '00000000-0000-0000-0000-000000000000'::uuid));

create or replace function public.bao_cao_sang_tinh(p_ngay date default null, p_cn uuid default null) returns jsonb language plpgsql stable as $$
declare
  hn date := coalesce(p_ngay, public.hom_nay());
  hq date := coalesce(p_ngay, public.hom_nay()) - 1;
  t_hn timestamptz := (coalesce(p_ngay, public.hom_nay()))::timestamp at time zone 'Asia/Ho_Chi_Minh';
  t_hq timestamptz := ((coalesce(p_ngay, public.hom_nay()) - 1))::timestamp at time zone 'Asia/Ho_Chi_Minh';
  t_mai timestamptz := ((coalesce(p_ngay, public.hom_nay()) + 1))::timestamp at time zone 'Asia/Ho_Chi_Minh';
  r jsonb;
begin
  r := jsonb_build_object('ngay', hn, 'chi_nhanh_id', p_cn);
  r := r || jsonb_build_object('hom_qua', jsonb_build_object(
    'ngay', hq,
    'so_hoa_don', (select count(*) from public.hoa_don h where h.ngay_hd = hq and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn)),
    'lich_hoan_thanh', (select count(*) from public.lich_hen l where l.bat_dau >= t_hq and l.bat_dau < t_hn and l.trang_thai = 'hoan_thanh' and (p_cn is null or l.chi_nhanh_id = p_cn)),
    'lich_huy', (select count(*) from public.lich_hen l where l.bat_dau >= t_hq and l.bat_dau < t_hn and l.trang_thai = 'huy' and (p_cn is null or l.chi_nhanh_id = p_cn)),
    'lich_khong_den', (select count(*) from public.lich_hen l where l.bat_dau >= t_hq and l.bat_dau < t_hn and l.trang_thai = 'khong_den' and (p_cn is null or l.chi_nhanh_id = p_cn)),
    'khach_moi', (select count(*) from public.khach_hang k where k.tao_luc >= t_hq and k.tao_luc < t_hn and (p_cn is null or k.chi_nhanh_id = p_cn))));
  r := r || jsonb_build_object('hom_nay', jsonb_build_object(
    'ngay', hn,
    'so_lich', (select count(*) from public.lich_hen l where l.bat_dau >= t_hn and l.bat_dau < t_mai and l.trang_thai not in ('huy', 'khong_den') and (p_cn is null or l.chi_nhanh_id = p_cn)),
    'sinh_nhat', (select count(*) from public.khach_hang k where k.ngay_sinh is not null and to_char(k.ngay_sinh, 'MM-DD') = to_char(hn, 'MM-DD') and (p_cn is null or k.chi_nhanh_id = p_cn)),
    'sinh_nhat_ten', coalesce((select jsonb_agg(x.ho_ten order by x.ho_ten) from (select k.ho_ten from public.khach_hang k where k.ngay_sinh is not null and to_char(k.ngay_sinh, 'MM-DD') = to_char(hn, 'MM-DD') and (p_cn is null or k.chi_nhanh_id = p_cn) order by k.ho_ten limit 10) x), '[]'::jsonb),
    'nhac_den_han', (select count(*) from public.khach_nhac n where n.trang_thai = 'dang_nhac' and not n.la_lich_su and n.ngay_nhac >= t_hn and n.ngay_nhac < t_mai and (p_cn is null or n.chi_nhanh_id = p_cn)),
    'nhac_qua_han', (select count(*) from public.khach_nhac n where n.trang_thai = 'dang_nhac' and not n.la_lich_su and n.ngay_nhac < t_hn and (p_cn is null or n.chi_nhanh_id = p_cn)),
    'the_sap_het', (select coalesce(max(s.tong), 0) from public.ds_the_sap_het(p_cn, null, null, null, 1) s),
    'tai_kham', (select coalesce(max(s.tong), 0) from public.ds_tai_kham(p_cn, null, null, null, 1) s)));
  return r;
end $$;

create or replace function public.luu_bao_cao_sang(p_ngay date default null) returns int language plpgsql as $$
declare hn date := coalesce(p_ngay, public.hom_nay()); n int := 0; c uuid;
begin
  delete from public.bao_cao_sang where ngay = hn;
  insert into public.bao_cao_sang (ngay, chi_nhanh_id, du_lieu) values (hn, null, public.bao_cao_sang_tinh(hn, null));
  n := 1;
  for c in select id from public.chi_nhanh where hoat_dong order by thu_tu, ma loop
    insert into public.bao_cao_sang (ngay, chi_nhanh_id, du_lieu) values (hn, c, public.bao_cao_sang_tinh(hn, c));
    n := n + 1;
  end loop;
  delete from public.bao_cao_sang where ngay < hn - 90;   -- chỉ giữ 90 ngày gần nhất
  return n;
end $$;

alter table public.bao_cao_sang enable row level security;
alter table public.bao_cao_sang force row level security;
create policy chan_het on public.bao_cao_sang for all to anon, authenticated using (false) with check (false);
revoke all on public.bao_cao_sang from anon, authenticated;
revoke all on function public.bao_cao_sang_tinh(date, uuid) from public, anon, authenticated;
revoke all on function public.luu_bao_cao_sang(date) from public, anon, authenticated;

-- Lịch 07:00 giờ Việt Nam = 00:00 UTC, nếu máy có pg_cron (Supabase bật sẵn; PGlite khi kiểm thử thì bỏ qua).
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'bao-cao-sang';
    perform cron.schedule('bao-cao-sang', '0 0 * * *', 'select public.luu_bao_cao_sang()');
  end if;
end $$;
reset lock_timeout;
