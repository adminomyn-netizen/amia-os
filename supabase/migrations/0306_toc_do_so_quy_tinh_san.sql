-- 0306 — TỐC ĐỘ SỔ QUỸ: tổng tiền khách trả theo ngày tính sẵn (03/11/2026).
-- Vấn đề: so_quy_tong (ô Đầu kỳ / Thu / Chi / Hiện tại ở Sổ quỹ) phải cộng TOÀN BỘ lịch sử thanh_toan (23 nghìn dòng), mỗi dòng tra
--   hoa_don để biết chi nhánh → 0,25 s lúc rảnh, 5 s lúc máy CSDL bận (trang hiện trọn tới 11,8 s).
-- Sửa: bảng quy_tt_ngay = tổng tiền thanh_toan theo (chi nhánh của hoá đơn, loại quỹ, ngày, thu/chi), đúng phép lọc/phân loại so_quy_tong
--   đang dùng. Cập nhật bằng trigger mức câu lệnh trên thanh_toan (tính lại đúng các nhóm bị đụng, cộng lại từ nguồn — không cộng dồn)
--   + trigger dòng khi hoá đơn đổi chi nhánh. so_quy_tong đọc bảng này thay cho phép nối thanh_toan × hoa_don. Kết quả y hệt (so trước/sau bằng scripts/thu, tự kiểm đối soát trong tệp).
-- Phòng hờ ghi ở chế độ replica: tinh_lai_quy_tt_ngay() so và sửa toàn bộ; pg_cron 00:50 và 06:50 giờ VN.

create table if not exists public.quy_tt_ngay (
  chi_nhanh_id uuid not null,
  loai_quy text not null,         -- 'tien_mat' | 'ngan_hang' (theo phương thức như so_quy_tong)
  ngay date not null,
  huong text not null,            -- 'thu' | 'chi' (thanh_toan.loai = 'thu' → thu, còn lại → chi)
  so_tien numeric not null,
  primary key (chi_nhanh_id, loai_quy, ngay, huong)
);
comment on table public.quy_tt_ngay is 'Tổng tiền thanh_toan theo chi nhánh/loại quỹ/ngày/thu-chi (tính sẵn bằng trigger, 0306) cho so_quy_tong. Nguồn sự thật vẫn là thanh_toan.';

-- Tính lại các nhóm (chi nhánh, ngày) cho trước, cộng thẳng từ nguồn.
create or replace function public.quy_tt_ngay_tinh(p_cn uuid[], p_ngay date[]) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_cn is null or cardinality(p_cn) = 0 then return; end if;
  -- Khoá các hoá đơn của nhóm không cần: dùng khoá tư vấn theo (chi nhánh, ngày) để 2 giao dịch cùng nhóm không ghi đè tổng cũ.
  perform pg_advisory_xact_lock(hashtextextended(x.c::text || x.d::text, 0))
     from (select distinct c, d from unnest(p_cn, p_ngay) u(c, d) order by 1, 2) x;
  delete from public.quy_tt_ngay q using (select distinct c, d from unnest(p_cn, p_ngay) u(c, d)) k
   where q.chi_nhanh_id = k.c and q.ngay = k.d;
  insert into public.quy_tt_ngay (chi_nhanh_id, loai_quy, ngay, huong, so_tien)
  select h.chi_nhanh_id, case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end, t.ngay,
         case t.loai when 'thu' then 'thu' else 'chi' end, sum(t.so_tien)
    from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
    join (select distinct c, d from unnest(p_cn, p_ngay) u(c, d)) k on k.c = h.chi_nhanh_id and k.d = t.ngay
   where t.phuong_thuc <> all (array['the_tien', 'ship_cod'])
   group by 1, 2, 3, 4;
end $$;

create or replace function public.trg_quy_tt_ngay() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare c uuid[]; d date[];
begin
  if tg_op = 'INSERT' then
    select array_agg(h.chi_nhanh_id), array_agg(m.ngay) into c, d from (select distinct hoa_don_id, ngay from moi) m join public.hoa_don h on h.id = m.hoa_don_id where h.chi_nhanh_id is not null;
  elsif tg_op = 'DELETE' then
    select array_agg(h.chi_nhanh_id), array_agg(m.ngay) into c, d from (select distinct hoa_don_id, ngay from cu) m join public.hoa_don h on h.id = m.hoa_don_id where h.chi_nhanh_id is not null;
  else
    select array_agg(h.chi_nhanh_id), array_agg(m.ngay) into c, d from (select hoa_don_id, ngay from moi union select hoa_don_id, ngay from cu) m join public.hoa_don h on h.id = m.hoa_don_id where h.chi_nhanh_id is not null;
  end if;
  perform public.quy_tt_ngay_tinh(c, d);
  return null;
end $$;
-- Xoá hoá đơn cùng câu lệnh với xoá thanh toán (gỡ đợt nhập) có thể làm hoá đơn biến mất trước khi trigger tra; lịch đối soát bù.

drop trigger if exists quy_tt_ngay_them on public.thanh_toan;
drop trigger if exists quy_tt_ngay_xoa on public.thanh_toan;
drop trigger if exists quy_tt_ngay_sua on public.thanh_toan;
create trigger quy_tt_ngay_them after insert on public.thanh_toan referencing new table as moi for each statement execute function public.trg_quy_tt_ngay();
create trigger quy_tt_ngay_xoa after delete on public.thanh_toan referencing old table as cu for each statement execute function public.trg_quy_tt_ngay();
create trigger quy_tt_ngay_sua after update on public.thanh_toan referencing old table as cu new table as moi for each statement execute function public.trg_quy_tt_ngay();

-- Hoá đơn đổi chi nhánh (hiếm): tính lại các ngày có thanh toán của hoá đơn đó ở cả chi nhánh cũ và mới.
create or replace function public.trg_quy_tt_ngay_hd() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare c uuid[]; d date[];
begin
  select array_agg(x.c), array_agg(x.d) into c, d from (
    select distinct v.c, t.ngay d from public.thanh_toan t cross join (values (old.chi_nhanh_id), (new.chi_nhanh_id)) v(c)
     where t.hoa_don_id = new.id and v.c is not null) x;
  perform public.quy_tt_ngay_tinh(c, d);
  return null;
end $$;
drop trigger if exists quy_tt_ngay_hd on public.hoa_don;
create trigger quy_tt_ngay_hd after update of chi_nhanh_id on public.hoa_don
  for each row when (old.chi_nhanh_id is distinct from new.chi_nhanh_id) execute function public.trg_quy_tt_ngay_hd();

-- Đối soát toàn bộ: trả số nhóm (chi nhánh, ngày) đã sửa (0 = khớp).
create or replace function public.tinh_lai_quy_tt_ngay() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare c uuid[]; d date[];
begin
  with dung as (
    select h.chi_nhanh_id, case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end loai_quy, t.ngay,
           case t.loai when 'thu' then 'thu' else 'chi' end huong, sum(t.so_tien) so_tien
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.phuong_thuc <> all (array['the_tien', 'ship_cod']) and h.chi_nhanh_id is not null
     group by 1, 2, 3, 4),
  lech as (
    select distinct coalesce(a.chi_nhanh_id, b.chi_nhanh_id) c, coalesce(a.ngay, b.ngay) d
      from dung a full join public.quy_tt_ngay b using (chi_nhanh_id, loai_quy, ngay, huong)
     where a.so_tien is distinct from b.so_tien)
  select array_agg(lech.c), array_agg(lech.d) into c, d from lech;
  perform public.quy_tt_ngay_tinh(c, d);
  return coalesce(cardinality(c), 0);
end $$;
revoke all on function public.quy_tt_ngay_tinh(uuid[], date[]) from public, anon, authenticated;
revoke all on function public.tinh_lai_quy_tt_ngay() from public, anon, authenticated;

-- Nạp lần đầu, rồi tự kiểm: đối soát lần hai phải ra 0 nhóm lệch.
select public.tinh_lai_quy_tt_ngay();
do $$ begin
  if public.tinh_lai_quy_tt_ngay() <> 0 then raise exception '0306: quy_tt_ngay lệch với thanh_toan sau khi nạp'; end if;
end $$;

-- so_quy_tong: giữ nguyên chữ ký và cách tính; phần thanh_toan đọc từ bảng tính sẵn.
create or replace function public.so_quy_tong(p_quy uuid[], p_tu date, p_den date)
 returns table(dau bigint, thu bigint, chi bigint, nap bigint, rut bigint, hien_tai bigint)
 language sql stable set search_path to 'public', 'pg_temp'
as $function$
  with q as (select id, chi_nhanh_id, loai from public.quy where id = any (p_quy)),
  d as (
    select s.ngay, s.loai, s.so_tien::numeric so_tien, (s.nguon = 'dao_phieu' or exists (select 1 from public.so_quy g where g.phieu_goc_id = s.id)) as bo
      from public.so_quy s where s.quy_id = any (p_quy)
    union all
    select a.ngay, a.huong, a.so_tien, false
      from public.quy_tt_ngay a join q on q.chi_nhanh_id = a.chi_nhanh_id and q.loai = a.loai_quy
  ),
  g as (select coalesce(sum(so_du_dau), 0)::bigint as v from public.quy where id = any (p_quy))
  select (g.v + coalesce(sum(case when d.loai in ('thu', 'nap') then d.so_tien else -d.so_tien end) filter (where d.ngay < p_tu), 0))::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'thu' and not d.bo), 0)::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'chi' and not d.bo), 0)::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'nap' and not d.bo), 0)::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'rut' and not d.bo), 0)::bigint,
         (g.v + coalesce(sum(case when d.loai in ('thu', 'nap') then d.so_tien else -d.so_tien end), 0))::bigint
    from g left join d on true
   group by g.v
$function$;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'tinh-lai-quy-tt-ngay';
    perform cron.schedule('tinh-lai-quy-tt-ngay', '50 17,23 * * *', 'select public.tinh_lai_quy_tt_ngay()');
  end if;
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
