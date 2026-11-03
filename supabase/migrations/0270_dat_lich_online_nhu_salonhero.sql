-- 0270 — Trang đặt lịch online y SalonHero (đợt 4, 03/11/2026). Chị Lâm: "ưu tiên làm full thêm trang đặt lịch online".
-- Đối chiếu SalonHero amia.salonhero.vn/dat-lich + #/setting-public-booking (đọc 03/11/2026):
--  • Khách đặt là có LỊCH HẸN NGAY (SalonHero tạo booking thẳng, trạng thái mặc định "Chưa xác nhận" = BOOKED), không còn qua bước lễ tân duyệt.
--    Bảng yeu_cau_dat_lich vẫn ghi một dòng cho mỗi lần đặt (trang_thai 'da_duyet', lich_id) để đếm giới hạn chống spam theo SĐT/IP.
--  • Khung giờ theo tuỳ chọn "Thời gian của 1 khung giờ" (10–240 phút), trả cả giờ HẾT CHỖ để trang hiện ô xám như SalonHero.
--  • Còn chỗ = (tổng số khách các lịch chạy cùng lúc + số khách đặt) ≤ tổng sức chứa chỗ làm (cho_lam.suc_chua) — nay đếm theo so_khach (lịch nhóm).
--  • "Số lượt khách đặt tối đa cho 1 khung giờ" + bảng "Tùy chọn giới hạn số lịch đặt" (giờ bắt đầu/kết thúc, số lịch, thứ, chi nhánh).
--  • "Cho phép chọn stylist": khách chọn người làm; người đó phải rảnh (lịch chính lẫn khách đi cùng).
--  • "Hiện thị thông tin dịch vụ": tắt thì khách không chọn dịch vụ, thời lượng = "Thời gian (mặc định) làm dịch vụ" (0 → 30 phút như SalonHero).
--  • "Dành cho khách hàng" (nam/nữ/cả hai) quyết định giới tính khách; "Trạng thái mặc định" quyết định trạng thái lịch tạo ra.
-- Không đổi cột của lich_hen / khach_hang (đồng bộ đêm ghi vào đó); chỉ thêm cột nullable vào yeu_cau_dat_lich (đồng bộ đêm không đụng bảng này).

alter table public.yeu_cau_dat_lich
  add column if not exists gioi_tinh text check (gioi_tinh is null or gioi_tinh in ('nữ', 'nam')),
  add column if not exists so_khach int check (so_khach is null or so_khach between 1 and 20),
  add column if not exists nhan_vien_id uuid references public.nhan_vien (id);
create index if not exists yeu_cau_dat_lich_lich_idx on public.yeu_cau_dat_lich (lich_id) where lich_id is not null;

-- ───────── Tuỳ chọn Web đặt Lịch (JSON ở cau_hinh 'dat_online.tuy_chon'); hỏng thì coi như rỗng ─────────
create or replace function public.web_dat_lich_tuy_chon() returns jsonb language plpgsql stable as $$
declare v jsonb;
begin
  begin
    v := (select gia_tri from public.cau_hinh where khoa = 'dat_online.tuy_chon')::jsonb;
  exception when others then v := null;
  end;
  if v is null or jsonb_typeof(v) <> 'object' then v := '{}'::jsonb; end if;
  return v;
end $$;

-- ───────── Còn chỗ cho p_n khách? Tổng khách các lịch chạy cùng lúc (tại mọi mốc bắt đầu trong khoảng) + p_n ≤ tổng sức chứa ─────────
create or replace function public.con_cho_online_n(p_cn uuid, p_bd timestamptz, p_kt timestamptz, p_n int) returns boolean language sql stable as $$
  with cap as (select coalesce(sum(suc_chua), 0)::int n from public.cho_lam where chi_nhanh_id = p_cn and hoat_dong),
  ls as (
    select bat_dau, ket_thuc, greatest(coalesce(so_khach, 1), 1) sk from public.lich_hen
     where chi_nhanh_id = p_cn and trang_thai not in ('huy', 'khong_den') and bat_dau < p_kt and ket_thuc > p_bd
       and bat_dau > p_bd - interval '1 day' -- lịch dài nhất 10 giờ: chặn dưới để dùng chỉ mục (chi_nhanh_id, bat_dau), không quét cả lịch sử
  ),
  diem as (select p_bd as t union select bat_dau from ls where bat_dau > p_bd)
  select (select n from cap) > 0
     and not exists (select 1 from diem d where coalesce((select sum(sk) from ls where ls.bat_dau <= d.t and ls.ket_thuc > d.t), 0) + greatest(p_n, 1) > (select n from cap));
$$;
-- Hàm cũ (lễ tân duyệt yêu cầu cũ) dùng chung cách đếm mới, 1 khách.
create or replace function public.con_cho_online(p_cn uuid, p_bd timestamptz, p_kt timestamptz) returns boolean language sql stable as $$
  select public.con_cho_online_n(p_cn, p_bd, p_kt, 1);
$$;

-- ───────── Người làm (stylist/KTV) có nhận khách online và rảnh trong khoảng? ─────────
create or replace function public.nv_ranh_online(p_nv uuid, p_cn uuid, p_bd timestamptz, p_kt timestamptz) returns boolean language sql stable as $$
  select exists (select 1 from public.nhan_vien where id = p_nv and hoat_dong and la_phuc_vu and hien_dat_lich and (chi_nhanh_id is null or chi_nhanh_id = p_cn))
     and not exists (select 1 from public.lich_hen where nhan_vien_id = p_nv and trang_thai not in ('huy', 'khong_den') and bat_dau < p_kt and bat_dau > p_bd - interval '1 day' and ket_thuc > p_bd)
     and not exists (select 1 from public.lich_hen_khach k join public.lich_hen l on l.id = k.lich_id
                      where k.nhan_vien_id = p_nv and l.trang_thai not in ('huy', 'khong_den')
                        and l.bat_dau < p_kt and l.bat_dau > p_bd - interval '1 day' and (case when k.thoi_luong_phut is not null then l.bat_dau + make_interval(mins => k.thoi_luong_phut) else l.ket_thuc end) > p_bd);
$$;

-- ───────── Mọi khung giờ của một ngày + còn chỗ hay hết chỗ (giống lưới giờ SalonHero) ─────────
-- Không trả dòng nào khi: trang khoá, chi nhánh không hiện ở web đặt lịch, ngày nghỉ, ngày đã qua hoặc quá "Giới hạn số ngày đặt lịch trước".
create or replace function public.khung_gio_online(p_cn uuid, p_ngay date, p_phut int, p_so_khach int default 1, p_nv uuid default null)
returns table (gio text, con_cho boolean) language plpgsql stable as $$
declare
  tc jsonb := public.web_dat_lich_tuy_chon();
  v_gl jsonb; v_cn jsonb; v_ng jsonb; v_mo time; v_dong time; v_t time; v_bd timestamptz; v_kt timestamptz;
  v_som timestamptz; v_muon timestamptz; v_thu text; v_buoc int; v_luot int; v_gh int; v_r jsonb; v_da int; v_ok boolean;
  v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; v_toi_da int;
begin
  if p_phut is null or p_phut < 5 or p_phut > 480 or coalesce(p_so_khach, 0) < 1 or p_so_khach > 20 then return; end if;
  if (select coalesce(gia_tri, '0') from public.cau_hinh where khoa = 'dat_online.mo') is distinct from '1' then return; end if;
  if not exists (select 1 from public.chi_nhanh where id = p_cn and hoat_dong and hien_dat_lich) then return; end if;
  v_toi_da := coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.toi_da_ngay'), 60);
  if p_ngay < v_hom_nay or p_ngay > v_hom_nay + v_toi_da then return; end if;
  select gio_lam_viec into v_gl from public.cua_hang where id = 1;
  select gio_lam_viec into v_cn from public.chi_nhanh where id = p_cn;
  v_thu := (array['t2', 't3', 't4', 't5', 't6', 't7', 'cn'])[extract(isodow from p_ngay)::int];
  v_ng := case when jsonb_typeof(v_cn -> v_thu) = 'object' then v_cn -> v_thu end;
  if coalesce(v_ng ->> 'nghi', 'false') = 'true' then return; end if;
  if v_ng is null and coalesce(v_gl -> 'nghi', '[]'::jsonb) ? v_thu then return; end if;
  v_mo := coalesce(nullif(v_ng ->> 'mo', ''), nullif(v_gl ->> 'mo', ''), '08:00')::time;
  v_dong := coalesce(nullif(v_ng ->> 'dong', ''), nullif(v_gl ->> 'dong', ''), '20:00')::time;
  v_buoc := case when (tc ->> 'khungPhut') ~ '^\d{1,3}$' and (tc ->> 'khungPhut')::int between 10 and 240 then (tc ->> 'khungPhut')::int else 15 end;
  v_luot := case when (tc ->> 'toiDaLuot') ~ '^\d{1,3}$' and (tc ->> 'toiDaLuot')::int >= 1 then (tc ->> 'toiDaLuot')::int else 10 end;
  v_som := now() + make_interval(mins => coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.bao_truoc_phut'), 120));
  v_muon := now() + make_interval(days => v_toi_da);
  v_t := v_mo;
  while v_t < v_dong loop
    exit when (p_ngay::timestamp + v_t + make_interval(mins => p_phut)) > (p_ngay::timestamp + v_dong);
    v_bd := (p_ngay::timestamp + v_t) at time zone 'Asia/Ho_Chi_Minh';
    v_kt := v_bd + make_interval(mins => p_phut);
    v_ok := v_bd >= v_som and v_bd <= v_muon;
    if v_ok then
      -- Giới hạn số lượt của khung giờ: dòng "Tùy chọn giới hạn số lịch đặt" khớp đầu tiên (giờ, thứ, chi nhánh) thắng mức chung.
      v_gh := v_luot;
      for v_r in select x from jsonb_array_elements(case when jsonb_typeof(tc -> 'gioiHanRieng') = 'array' then tc -> 'gioiHanRieng' else '[]'::jsonb end) x loop
        if (v_r ->> 'tu') ~ '^\d{2}:\d{2}$' and (v_r ->> 'den') ~ '^\d{2}:\d{2}$' and (v_r ->> 'so') ~ '^\d{1,3}$'
           and v_t >= (v_r ->> 'tu')::time and v_t < (v_r ->> 'den')::time
           and (jsonb_typeof(v_r -> 'thu') <> 'array' or jsonb_array_length(v_r -> 'thu') = 0 or (v_r -> 'thu') ? v_thu)
           and (nullif(v_r ->> 'cn', '') is null or v_r ->> 'cn' = p_cn::text) then
          v_gh := (v_r ->> 'so')::int; exit;
        end if;
      end loop;
      select coalesce(sum(greatest(coalesce(so_khach, 1), 1)), 0) into v_da from public.lich_hen
       where chi_nhanh_id = p_cn and trang_thai not in ('huy', 'khong_den') and bat_dau >= v_bd and bat_dau < v_bd + make_interval(mins => v_buoc);
      v_ok := v_da + p_so_khach <= v_gh
        and public.con_cho_online_n(p_cn, v_bd, v_kt, p_so_khach)
        and (p_nv is null or public.nv_ranh_online(p_nv, p_cn, v_bd, v_kt));
    end if;
    gio := to_char(v_t, 'HH24:MI'); con_cho := v_ok;
    return next;
    v_t := v_t + make_interval(mins => v_buoc);
  end loop;
end $$;

-- ───────── Khách đặt lịch: kiểm tra + giới hạn, tạo khách (nếu SĐT mới) + LỊCH HẸN trong MỘT giao dịch ─────────
-- Lỗi người dùng thấy: raise exception tiếng Việt. Cố ý KHÔNG nói số điện thoại đã là khách hay chưa, không trả thông tin khách.
create or replace function public.dat_lich_online(p_cn uuid, p_dv uuid[], p_bat_dau timestamptz, p_ho_ten text, p_sdt text, p_gioi_tinh text,
  p_so_khach int, p_nv uuid, p_ghi_chu text, p_ip_bam text) returns jsonb language plpgsql as $$
declare
  tc jsonb := public.web_dat_lich_tuy_chon();
  v_ten text := regexp_replace(btrim(coalesce(p_ho_ten, '')), '\s+', ' ', 'g');
  v_ghi text := nullif(regexp_replace(btrim(coalesce(p_ghi_chu, '')), '\s+', ' ', 'g'), '');
  v_sdt text := regexp_replace(coalesce(p_sdt, ''), '\D', '', 'g');
  v_dv uuid[] := coalesce(p_dv, '{}'::uuid[]);
  v_sk int := coalesce(p_so_khach, 1);
  v_nv uuid; v_gt text; v_phut int; v_n int; v_ngay date; v_kt timestamptz; v_khach uuid; v_ten_k text; v_pt uuid; v_moi boolean := false;
  v_tt text; v_lich uuid; v_ma text; v_toi_da int;
begin
  if coalesce((select gia_tri from public.cau_hinh where khoa = 'dat_online.mo'), '0') <> '1' then raise exception 'Đặt lịch online hiện chưa mở. Vui lòng gọi điện cho phòng khám.'; end if;
  if p_ip_bam is null or length(p_ip_bam) < 8 or length(p_ip_bam) > 128 then raise exception 'Chưa gửi được. Vui lòng thử lại.'; end if;
  perform pg_advisory_xact_lock(hashtext('gui_yeu_cau_dat_lich'));

  if v_sdt ~ '^84\d{9}$' then v_sdt := '0' || substr(v_sdt, 3); end if;
  if length(v_ten) < 2 or length(v_ten) > 100 or v_ten ~ '[<>]' or v_ten ~* '(https?:|www\.)' then raise exception 'Nhập họ tên (2 đến 100 ký tự, không chứa liên kết).'; end if;
  if v_sdt !~ '^0\d{9,10}$' then raise exception 'Số điện thoại chưa đúng (bắt đầu bằng 0, đủ 10 hoặc 11 số).'; end if;
  if v_ghi is not null and (length(v_ghi) > 300 or v_ghi ~ '[<>]' or v_ghi ~* '(https?:|www\.)') then raise exception 'Ghi chú tối đa 300 ký tự và không chứa liên kết.'; end if;
  if v_sk < 1 or v_sk > 20 then raise exception 'Số người đi cùng nhóm từ 1 đến 20.'; end if;
  -- "Dành cho khách hàng": chỉ nữ / chỉ nam thì giới tính theo cài đặt; cả hai thì theo khách chọn (Chị / Anh).
  v_gt := case coalesce(tc ->> 'doiTuong', 'ca') when 'nu' then 'nữ' when 'nam' then 'nam' else case when p_gioi_tinh in ('nam', 'nữ') then p_gioi_tinh else 'nữ' end end;
  if not exists (select 1 from public.chi_nhanh where id = p_cn and hoat_dong and hien_dat_lich) then raise exception 'Chọn chi nhánh.'; end if;

  -- Dịch vụ: chỉ khi bật "Hiện thị thông tin dịch vụ & sản phẩm"; tắt thì bỏ qua và dùng thời lượng mặc định.
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
  -- Người làm: chỉ khi bật "Cho phép chọn stylist lúc đặt lịch".
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

  -- Chống spam (chỉ đếm lần đặt online, không lộ lịch do nhân viên tạo).
  if (select count(*) from public.yeu_cau_dat_lich where dien_thoai = v_sdt and bat_dau > now() and trang_thai <> 'tu_choi') >= 3 then
    raise exception 'Số điện thoại này đã có nhiều lịch đặt online sắp tới. Vui lòng gọi điện cho phòng khám để đặt thêm.';
  end if;
  if exists (select 1 from public.yeu_cau_dat_lich where dien_thoai = v_sdt and trang_thai <> 'tu_choi' and bat_dau < v_kt and bat_dau + make_interval(mins => thoi_luong_phut) > p_bat_dau) then
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

  -- Khách: SĐT đã có thì gắn vào khách cũ (không sửa hồ sơ); chưa có thì tạo khách nguồn "Đặt lịch online".
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

  v_tt := case when tc ->> 'trangThai' = 'da_xac_nhan' then 'da_xac_nhan' else 'chua_xac_nhan' end;
  v_ma := 'W' || upper(substr(md5(gen_random_uuid()::text), 1, 7));
  insert into public.lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, xac_nhan_luc, nguon, so_khach, nhan_vien_id, ma_dat_lich, ghi_chu)
  values (v_khach, p_cn, p_bat_dau, v_kt, v_tt, case when v_tt = 'da_xac_nhan' then now() end, 'ONLINE', v_sk, v_nv, v_ma,
          'Khách tự đặt online' || case when v_sk > 1 then ' · nhóm ' || v_sk || ' khách' else '' end || coalesce(' · ' || v_ghi, '')
            || case when not v_moi and v_ten <> v_ten_k then ' · Tên khách ghi: ' || v_ten else '' end)
  returning id into v_lich;
  if cardinality(v_dv) > 0 then insert into public.lich_hen_dich_vu (lich_id, dich_vu_id) select v_lich, unnest(v_dv); end if;
  insert into public.yeu_cau_dat_lich (chi_nhanh_id, dich_vu_ids, bat_dau, thoi_luong_phut, ho_ten, dien_thoai, ghi_chu, ip_bam, trang_thai, lich_id, xu_ly_luc, gioi_tinh, so_khach, nhan_vien_id)
  values (p_cn, v_dv, p_bat_dau, v_phut, v_ten, v_sdt, v_ghi, p_ip_bam, 'da_duyet', v_lich, now(), v_gt, v_sk, v_nv);
  return jsonb_build_object('lich_id', v_lich, 'ma', v_ma, 'phut', v_phut, 'trang_thai', v_tt);
end $$;

revoke all on function public.web_dat_lich_tuy_chon() from public, anon, authenticated;
revoke all on function public.con_cho_online_n(uuid, timestamptz, timestamptz, int) from public, anon, authenticated;
revoke all on function public.con_cho_online(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.nv_ranh_online(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.khung_gio_online(uuid, date, int, int, uuid) from public, anon, authenticated;
revoke all on function public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, int, uuid, text, text) from public, anon, authenticated;
grant execute on function public.web_dat_lich_tuy_chon(), public.con_cho_online_n(uuid, timestamptz, timestamptz, int), public.con_cho_online(uuid, timestamptz, timestamptz),
  public.nv_ranh_online(uuid, uuid, timestamptz, timestamptz), public.khung_gio_online(uuid, date, int, int, uuid),
  public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, int, uuid, text, text) to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
