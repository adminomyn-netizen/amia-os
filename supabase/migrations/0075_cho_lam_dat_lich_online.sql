-- 0075 — CHỖ LÀM (giường/phòng) THEO CHI NHÁNH + ĐẶT LỊCH ONLINE CHO KHÁCH (28/10/2026).
-- • cho_lam: danh mục chỗ (giường/phòng) mỗi chi nhánh, có cờ hoạt động. lich_hen.phong giữ TÊN chỗ (chữ), 53.463 lịch cũ đều để trống nên không phải chuyển gì.
-- • dich_vu.dat_online: dịch vụ nào cho khách tự đặt trên trang công khai /dat-lich. Mặc định TẮT; người quản lý bật từng dịch vụ.
-- • dat_lich_online: sổ ghi mọi lịch do khách tự đặt (chỉ thêm) — dùng đếm giới hạn theo IP (chỉ lưu băm, không lưu IP thật) và theo số điện thoại.
-- • Công tắc cau_hinh 'dat_online.mo' mặc định '0' (TẮT): đẩy migration lên không làm mở trang cho khách; người quản lý bật sau khi đã tạo chỗ + chọn dịch vụ.
-- • Hàm gio_trong_online / con_cho_online / dat_lich_online: toàn bộ kiểm tra nằm trong cơ sở dữ liệu (một nguồn duy nhất), chỉ máy chủ (service_role) gọi được.
--   Khung giờ còn trống = số lịch đang chạy cùng lúc ở chi nhánh < số chỗ đang hoạt động; trong giờ mở cửa (cua_hang.gio_lam_viec), không rơi ngày nghỉ.

create table public.cho_lam (
  id uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  ten text not null check (length(btrim(ten)) between 1 and 40),
  thu_tu int not null default 100,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now(),
  unique (chi_nhanh_id, ten)
);
create index cho_lam_cn_idx on public.cho_lam (chi_nhanh_id, thu_tu);

alter table public.dich_vu add column dat_online boolean not null default false;

create table public.dat_lich_online (
  id bigint generated always as identity primary key,
  lich_id uuid not null references public.lich_hen (id) on delete cascade,
  ip_bam text not null,
  tao_luc timestamptz not null default now()
);
create index dat_lich_online_ip_idx on public.dat_lich_online (ip_bam, tao_luc desc);
create index dat_lich_online_luc_idx on public.dat_lich_online (tao_luc desc);
create index dat_lich_online_lich_idx on public.dat_lich_online (lich_id);

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('dat_online.mo', '0', 'Đặt lịch online cho khách (trang /dat-lich): 1 = mở, 0 = tắt'),
  ('dat_online.bao_truoc_phut', '120', 'Khách phải đặt trước giờ hẹn ít nhất bao nhiêu phút'),
  ('dat_online.toi_da_ngay', '60', 'Khách chỉ đặt được trong bấy nhiêu ngày tới'),
  ('dat_online.phu_trach', '', 'Mã nhân viên phụ trách khách mới do đặt online (để trống = lễ tân/quản lý của chi nhánh)')
on conflict (khoa) do nothing;

-- ───────── Chỗ còn trống? Số lịch chạy cùng lúc (tại mọi mốc bắt đầu trong khoảng) phải nhỏ hơn số chỗ hoạt động ─────────
create function public.con_cho_online(p_cn uuid, p_bd timestamptz, p_kt timestamptz) returns boolean language sql stable as $$
  with cap as (select count(*)::int n from public.cho_lam where chi_nhanh_id = p_cn and hoat_dong),
  ls as (
    select bat_dau, ket_thuc from public.lich_hen
     where chi_nhanh_id = p_cn and trang_thai not in ('huy', 'khong_den') and bat_dau < p_kt and ket_thuc > p_bd
  ),
  diem as (select p_bd as t union select bat_dau from ls where bat_dau > p_bd)
  select (select n from cap) > 0
     and not exists (select 1 from diem d where (select count(*) from ls where ls.bat_dau <= d.t and ls.ket_thuc > d.t) >= (select n from cap));
$$;

-- ───────── Các khung giờ (mỗi 30 phút) còn trống của một ngày, cho dịch vụ kéo dài p_phut phút ─────────
create function public.gio_trong_online(p_cn uuid, p_ngay date, p_phut int) returns setof text language plpgsql stable as $$
declare
  v_gl jsonb; v_mo time; v_dong time; v_t time; v_bd timestamptz; v_kt timestamptz;
  v_som timestamptz; v_muon timestamptz; v_thu text;
begin
  if p_phut is null or p_phut < 5 or p_phut > 480 then return; end if;
  if (select coalesce(gia_tri, '0') from public.cau_hinh where khoa = 'dat_online.mo') is distinct from '1' then return; end if;
  if not exists (select 1 from public.chi_nhanh where id = p_cn and hoat_dong) then return; end if;
  select gio_lam_viec into v_gl from public.cua_hang where id = 1;
  v_mo := coalesce(nullif(v_gl ->> 'mo', ''), '08:00')::time;
  v_dong := coalesce(nullif(v_gl ->> 'dong', ''), '20:00')::time;
  v_thu := (array['t2', 't3', 't4', 't5', 't6', 't7', 'cn'])[extract(isodow from p_ngay)::int];
  if coalesce(v_gl -> 'nghi', '[]'::jsonb) ? v_thu then return; end if;
  v_som := now() + make_interval(mins => coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.bao_truoc_phut'), 120));
  v_muon := now() + make_interval(days => coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.toi_da_ngay'), 60));
  v_t := v_mo;
  while v_t < v_dong loop
    v_bd := (p_ngay::timestamp + v_t) at time zone 'Asia/Ho_Chi_Minh';
    v_kt := v_bd + make_interval(mins => p_phut);
    exit when (p_ngay::timestamp + v_t + make_interval(mins => p_phut)) > (p_ngay::timestamp + v_dong);
    if v_bd >= v_som and v_bd <= v_muon and public.con_cho_online(p_cn, v_bd, v_kt) then
      return next to_char(v_t, 'HH24:MI');
    end if;
    v_t := v_t + interval '30 minutes';
  end loop;
end $$;

-- ───────── Khách tự đặt lịch: kiểm tra đầu vào + giới hạn + tạo khách/lịch trong MỘT giao dịch ─────────
-- Lỗi người dùng thấy: raise exception tiếng Việt (P0001). Cố ý KHÔNG nói số điện thoại đã là khách cũ hay chưa; không trả về thông tin khách.
create function public.dat_lich_online(p_cn uuid, p_dv uuid[], p_bat_dau timestamptz, p_ho_ten text, p_sdt text, p_ghi_chu text, p_ip_bam text) returns jsonb language plpgsql as $$
declare
  v_ten text := regexp_replace(btrim(coalesce(p_ho_ten, '')), '\s+', ' ', 'g');
  v_ghi text := nullif(regexp_replace(btrim(coalesce(p_ghi_chu, '')), '\s+', ' ', 'g'), '');
  v_sdt text := regexp_replace(coalesce(p_sdt, ''), '\D', '', 'g');
  v_phut int; v_n int; v_ngay date; v_khach uuid; v_lich uuid; v_pt uuid; v_ma text; v_kt timestamptz;
  v_chuoi text;
begin
  if coalesce((select gia_tri from public.cau_hinh where khoa = 'dat_online.mo'), '0') <> '1' then raise exception 'Đặt lịch online hiện chưa mở. Vui lòng gọi điện cho phòng khám.'; end if;
  if p_ip_bam is null or length(p_ip_bam) < 8 or length(p_ip_bam) > 128 then raise exception 'Chưa gửi được. Vui lòng thử lại.'; end if;
  -- Một người đặt tại một thời điểm: tránh hai khách cùng giành khung giờ cuối cùng.
  perform pg_advisory_xact_lock(hashtext('dat_lich_online'));

  if v_sdt ~ '^84\d{9}$' then v_sdt := '0' || substr(v_sdt, 3); end if;
  if length(v_ten) < 2 or length(v_ten) > 100 or v_ten ~ '[<>]' or v_ten ~* '(https?:|www\.)' then raise exception 'Nhập họ tên (2 đến 100 ký tự, không chứa liên kết).'; end if;
  if v_sdt !~ '^0\d{9,10}$' then raise exception 'Số điện thoại chưa đúng (bắt đầu bằng 0, đủ 10 hoặc 11 số).'; end if;
  if v_ghi is not null and (length(v_ghi) > 300 or v_ghi ~ '[<>]' or v_ghi ~* '(https?:|www\.)') then raise exception 'Ghi chú tối đa 300 ký tự và không chứa liên kết.'; end if;
  if p_dv is null or cardinality(p_dv) < 1 or cardinality(p_dv) > 5 then raise exception 'Chọn từ 1 đến 5 dịch vụ.'; end if;
  if (select count(distinct x) from unnest(p_dv) x) <> cardinality(p_dv) then raise exception 'Dịch vụ bị chọn trùng.'; end if;
  select count(*), coalesce(sum(thoi_luong_phut), 0) into v_n, v_phut from public.dich_vu where id = any (p_dv) and hoat_dong and dat_online;
  if v_n <> cardinality(p_dv) then raise exception 'Có dịch vụ chưa nhận đặt online. Vui lòng chọn lại.'; end if;
  if v_phut > 240 then raise exception 'Các dịch vụ đã chọn quá dài cho một lần đặt. Vui lòng chọn ít hơn hoặc gọi phòng khám.'; end if;
  if not exists (select 1 from public.chi_nhanh where id = p_cn and hoat_dong) then raise exception 'Chọn chi nhánh.'; end if;
  if p_bat_dau is null then raise exception 'Chọn ngày và giờ hẹn.'; end if;
  if p_bat_dau < now() then raise exception 'Không đặt được vào giờ đã qua.'; end if;
  v_ngay := (p_bat_dau at time zone 'Asia/Ho_Chi_Minh')::date;
  if v_ngay > ((now() at time zone 'Asia/Ho_Chi_Minh')::date + coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.toi_da_ngay'), 60)) then
    raise exception 'Chỉ đặt được trong vòng % ngày tới.', coalesce((select nullif(gia_tri, '') from public.cau_hinh where khoa = 'dat_online.toi_da_ngay'), '60');
  end if;
  -- Khung giờ phải nằm trong danh sách còn trống (đã gồm giờ mở cửa, ngày nghỉ, đặt trước tối thiểu, còn chỗ).
  if not (to_char(p_bat_dau at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI') = any (array(select public.gio_trong_online(p_cn, v_ngay, v_phut)))) then
    raise exception 'Khung giờ này không còn trống. Vui lòng chọn giờ khác.';
  end if;
  v_kt := p_bat_dau + make_interval(mins => v_phut);

  -- Giới hạn chống lạm dụng. Số điện thoại: chỉ đếm lịch ĐẶT ONLINE của số đó (không lộ lịch do nhân viên tạo).
  if (select count(*) from public.dat_lich_online d join public.lich_hen l on l.id = d.lich_id join public.khach_hang k on k.id = l.khach_id
       where k.dien_thoai = v_sdt and l.trang_thai = 'chua_xac_nhan' and l.bat_dau > now()) >= 3 then
    raise exception 'Số điện thoại này đang có lịch chờ xác nhận. Vui lòng đợi phòng khám liên hệ, hoặc gọi điện để đặt thêm.';
  end if;
  if exists (select 1 from public.dat_lich_online d join public.lich_hen l on l.id = d.lich_id join public.khach_hang k on k.id = l.khach_id
              where k.dien_thoai = v_sdt and l.trang_thai = 'chua_xac_nhan' and l.bat_dau < v_kt and l.ket_thuc > p_bat_dau) then
    raise exception 'Số điện thoại này đã có lịch chờ xác nhận vào khung giờ đó. Vui lòng đợi phòng khám liên hệ.';
  end if;
  if (select count(*) from public.dat_lich_online where ip_bam = p_ip_bam and tao_luc > now() - interval '1 hour') >= 10 then
    raise exception 'Bạn đặt quá nhiều lần trong một giờ. Vui lòng thử lại sau hoặc gọi điện cho phòng khám.';
  end if;
  if (select count(*) from public.dat_lich_online where tao_luc > now() - interval '1 hour') >= 60 then
    raise exception 'Hệ thống đang nhận quá nhiều đặt lịch. Vui lòng thử lại sau hoặc gọi điện cho phòng khám.';
  end if;
  if (select count(*) from public.dat_lich_online d join public.lich_hen l on l.id = d.lich_id where l.trang_thai = 'chua_xac_nhan' and l.chi_nhanh_id = p_cn) >= 300 then
    raise exception 'Phòng khám đang có quá nhiều lịch chờ xác nhận. Vui lòng gọi điện để đặt lịch.';
  end if;

  -- Khách: gắn theo số điện thoại đã chuẩn hoá; chưa có thì tạo mới. KHÔNG sửa gì ở khách cũ.
  select id into v_khach from public.khach_hang where dien_thoai = v_sdt limit 1;
  if v_khach is null then
    select nullif(gia_tri, '')::uuid into v_pt from public.cau_hinh where khoa = 'dat_online.phu_trach';
    if v_pt is null or not exists (select 1 from public.nhan_vien where id = v_pt and hoat_dong) then
      select id into v_pt from public.nhan_vien
       where hoat_dong and vai_tro in ('le_tan', 'quan_ly', 'thu_ngan', 'chu') and (chi_nhanh_id = p_cn or chi_nhanh_id is null)
       order by (chi_nhanh_id = p_cn) desc nulls last, (vai_tro = 'le_tan') desc, (vai_tro = 'quan_ly') desc, tao_luc limit 1;
    end if;
    if v_pt is null then raise exception 'Hệ thống chưa sẵn sàng nhận đặt lịch online. Vui lòng gọi điện cho phòng khám.'; end if;
    v_ma := 'KH' || lpad(public.so_tiep_theo('khach')::text, 6, '0');
    insert into public.khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguon_chi_tiet, nguoi_phu_trach_id)
    values (v_ma, v_ten, v_sdt, p_cn, 'mkt', 'Đặt lịch online', v_pt) returning id into v_khach;
  end if;

  insert into public.lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nguon, ghi_chu)
  values (v_khach, p_cn, p_bat_dau, v_kt, 'chua_xac_nhan', 'ONLINE', 'Khách tự đặt online' || coalesce(' · ' || v_ghi, '') || case when v_ten <> (select ho_ten from public.khach_hang where id = v_khach) then ' · Tên khách ghi: ' || v_ten else '' end)
  returning id into v_lich;
  insert into public.lich_hen_dich_vu (lich_id, dich_vu_id) select v_lich, unnest(p_dv);
  insert into public.dat_lich_online (lich_id, ip_bam) values (v_lich, p_ip_bam);
  return jsonb_build_object('lich_id', v_lich, 'bat_dau', p_bat_dau, 'ket_thuc', v_kt, 'chi_nhanh_id', p_cn);
end $$;

revoke all on function public.con_cho_online(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.gio_trong_online(uuid, date, int) from public, anon, authenticated;
revoke all on function public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, text) from public, anon, authenticated;
grant execute on function public.con_cho_online(uuid, timestamptz, timestamptz), public.gio_trong_online(uuid, date, int), public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, text) to service_role;

-- Sổ đặt online chỉ thêm (xoá lịch thì dòng ghi tự mất theo khoá ngoại; không cho sửa tay).
create or replace function public.chan_sua_dat_lich_online() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then raise exception 'Sổ đặt lịch online không được sửa.' using errcode = 'P0001'; end if;
  return old;
end $$;
create trigger dat_lich_online_khong_sua before update on public.dat_lich_online for each row execute function public.chan_sua_dat_lich_online();

select public.khoa_tat_ca_bang();
