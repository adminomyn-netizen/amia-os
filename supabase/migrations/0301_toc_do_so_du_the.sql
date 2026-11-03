-- 0301 — TỐC ĐỘ: số dư thẻ tính sẵn (03/11/2026, chị Lâm: "lag lòi luôn").
-- Vấn đề: v_the_khach tính số buổi/số tiền còn của MỖI thẻ bằng cách cộng lại the_so_cai (lateral sum) mỗi lần hỏi.
--   Chuông thông báo đếm "thẻ sắp hết buổi" (v_the_khach lọc tinh_trang) ~11.000 lần/tuần × 0,6–1,8 s; v_khach_hang
--   (danh sách khách) cũng cộng lại qua v_the_khach cho từng khách.
-- Cách sửa: bảng phụ the_so_du (1 dòng/thẻ = tổng sổ cái), cập nhật bằng trigger MỨC CÂU LỆNH (transition table) trên
--   the_so_cai: mỗi câu lệnh ghi sổ (kể cả lô 1.000 dòng của đồng bộ đêm) chỉ tính lại MỘT lần cho đúng các thẻ bị đụng,
--   bằng cách CỘNG LẠI từ sổ cái (không cộng dồn) → không trôi số. Sổ cái vẫn chỉ-thêm, không sửa dòng nào.
--   v_the_khach giữ NGUYÊN cột/kiểu/thứ tự, chỉ thay lateral sum bằng join bảng phụ → mọi màn hình/hàm đang dùng không đổi.
-- An toàn số liệu: cuối migration tự so bảng phụ với tổng sổ cái từng thẻ; lệch 1 thẻ là huỷ cả migration.
-- Phòng hờ: trigger không chạy khi session_replication_role = replica (vd script khôi phục); hàm tinh_lai_the_so_du()
--   so và sửa toàn bộ, pg_cron chạy 00:45 và 06:45 giờ VN (sau đồng bộ đêm 23:15).

create table if not exists public.the_so_du (
  the_id uuid primary key,
  so_buoi bigint not null default 0,      -- = sum(the_so_cai.so_buoi)  (sum int → bigint, y như view cũ)
  so_tien numeric not null default 0       -- = sum(the_so_cai.so_tien)  (sum bigint → numeric, y như view cũ)
);
comment on table public.the_so_du is 'Tổng sổ cái thẻ theo từng thẻ (tính sẵn bằng trigger trên the_so_cai) — chỉ để đọc nhanh; nguồn sự thật vẫn là the_so_cai.';

-- Tính lại đúng các thẻ trong danh sách (cộng lại từ sổ cái; thẻ không còn dòng sổ nào thì xoá dòng phụ).
create or replace function public.the_so_du_tinh(p_ids uuid[]) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then return; end if;
  insert into public.the_so_du (the_id, so_buoi, so_tien)
    select c.the_id, sum(c.so_buoi), sum(c.so_tien) from public.the_so_cai c where c.the_id = any(p_ids) group by c.the_id
  on conflict (the_id) do update set so_buoi = excluded.so_buoi, so_tien = excluded.so_tien
    where (the_so_du.so_buoi, the_so_du.so_tien) is distinct from (excluded.so_buoi, excluded.so_tien);
  delete from public.the_so_du d where d.the_id = any(p_ids) and not exists (select 1 from public.the_so_cai c where c.the_id = d.the_id);
end $$;

create or replace function public.trg_the_so_du_them() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.the_so_du_tinh(array(select distinct the_id from moi));
  return null;
end $$;
create or replace function public.trg_the_so_du_xoa() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.the_so_du_tinh(array(select distinct the_id from cu));
  return null;
end $$;
create or replace function public.trg_the_so_du_sua() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.the_so_du_tinh(array(select the_id from moi union select the_id from cu));
  return null;
end $$;
create or replace function public.trg_the_so_du_truncate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.the_so_du;
  return null;
end $$;

drop trigger if exists the_so_du_them on public.the_so_cai;
drop trigger if exists the_so_du_xoa on public.the_so_cai;
drop trigger if exists the_so_du_sua on public.the_so_cai;
drop trigger if exists the_so_du_truncate on public.the_so_cai;
create trigger the_so_du_them after insert on public.the_so_cai referencing new table as moi
  for each statement execute function public.trg_the_so_du_them();
create trigger the_so_du_xoa after delete on public.the_so_cai referencing old table as cu
  for each statement execute function public.trg_the_so_du_xoa();
create trigger the_so_du_sua after update on public.the_so_cai referencing old table as cu new table as moi
  for each statement execute function public.trg_the_so_du_sua();
create trigger the_so_du_truncate after truncate on public.the_so_cai
  for each statement execute function public.trg_the_so_du_truncate();

-- So toàn bộ với sổ cái và sửa chỗ lệch; trả về số thẻ đã sửa (0 = khớp). Dùng cho lịch phòng hờ và kiểm tra tay.
create or replace function public.tinh_lai_the_so_du() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare ids uuid[];
begin
  with dung as (select the_id, sum(so_buoi) so_buoi, sum(so_tien) so_tien from public.the_so_cai group by the_id)
  select array_agg(coalesce(d.the_id, s.the_id)) into ids
    from dung d full join public.the_so_du s on s.the_id = d.the_id
   where (d.so_buoi, d.so_tien) is distinct from (s.so_buoi, s.so_tien);
  perform public.the_so_du_tinh(ids);
  return coalesce(cardinality(ids), 0);
end $$;
revoke all on function public.the_so_du_tinh(uuid[]) from public, anon, authenticated;
revoke all on function public.tinh_lai_the_so_du() from public, anon, authenticated;

-- Nạp lần đầu.
select public.tinh_lai_the_so_du();

-- View: y nguyên cột, kiểu, thứ tự và cách tính tình trạng như trước; chỉ đổi nguồn tổng.
create or replace view public.v_the_khach with (security_invoker = true) as
 SELECT t.id,
    t.ma,
    t.khach_id,
    t.goi_id,
    t.chi_nhanh_id,
    t.loai,
    t.hoa_don_dong_id,
    t.so_buoi_tong,
    t.tong_tien,
    t.gia_tri_buoi,
    t.cap_tay,
    t.ngay_cap,
    t.han_dung,
    t.trang_thai,
    t.ghi_chu,
    t.tao_luc,
    t.sh_id,
    COALESCE(s.so_buoi, 0::bigint)::integer AS so_buoi_con,
    COALESCE(s.so_tien, 0::numeric)::bigint AS so_du_tien,
        CASE
            WHEN t.trang_thai = 'thu_hoi'::text THEN 'thu_hoi'::text
            WHEN t.trang_thai = 'khoa'::text THEN 'khoa'::text
            WHEN t.han_dung IS NOT NULL AND t.han_dung < (SELECT hom_nay()) THEN 'het_han'::text  -- tính 1 lần/câu hỏi thay vì từng dòng
            WHEN t.loai = 'lan'::text AND COALESCE(s.so_buoi, 0::bigint) <= 0 THEN 'hoan_thanh'::text
            WHEN t.loai = 'tien'::text AND COALESCE(s.so_tien, 0::numeric) <= 0::numeric THEN 'hoan_thanh'::text
            WHEN t.loai = 'lan'::text AND COALESCE(s.so_buoi, 0::bigint) <= (( SELECT COALESCE(cau_hinh.gia_tri::integer, 2) AS "coalesce"
               FROM cau_hinh
              WHERE cau_hinh.khoa = 'the_sap_het_buoi'::text)) THEN 'sap_het'::text
            ELSE 'hoat_dong'::text
        END AS tinh_trang
   FROM the_khach t
     LEFT JOIN the_so_du s ON s.the_id = t.id;

-- Tự kiểm: bảng phụ phải khớp tổng sổ cái của MỌI thẻ (lệch là huỷ cả migration).
do $$
declare n int;
begin
  select count(*) into n from public.the_khach t
    left join lateral (select sum(c.so_buoi) b, sum(c.so_tien) tien from public.the_so_cai c where c.the_id = t.id) g on true
    left join public.the_so_du s on s.the_id = t.id
   where (coalesce(g.b, 0), coalesce(g.tien, 0)) is distinct from (coalesce(s.so_buoi, 0), coalesce(s.so_tien, 0));
  if n > 0 then raise exception 'the_so_du lệch % thẻ so với sổ cái — huỷ migration', n; end if;
end $$;

-- Lịch phòng hờ (00:45 và 06:45 giờ VN = 17:45 và 23:45 UTC), nếu có pg_cron (PGlite khi kiểm thử thì bỏ qua).
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'tinh-lai-the-so-du';
    perform cron.schedule('tinh-lai-the-so-du', '45 17,23 * * *', 'select public.tinh_lai_the_so_du()');
  end if;
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
