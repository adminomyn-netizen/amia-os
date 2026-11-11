-- 0330 — Ẩn 97 hồ sơ dựng lại cho khách ĐÃ BỊ XOÁ bên SalonHero (chị Lâm duyệt 11/11/2026).
-- Hồ sơ dựng lại từ thẻ/đơn khi khách đã bị xoá ở SalonHero (ghi_chu bắt đầu "Khách đã bị xoá khỏi danh sách SalonHero"): tên ".", "..", SĐT KHONG-SDT-…/…-TRUNG….
-- GIỮ NGUYÊN mọi dữ liệu (116 thẻ, 241 hoá đơn cũ vẫn gắn — doanh thu/thẻ/hoá đơn không đổi). Chỉ thêm cờ an_sh_xoa:
--  • Ẩn khỏi danh sách Khách hàng mặc định (loc_khach; bật ô "Hiện khách đã xoá bên SalonHero" → p.hien_sh_xoa = '1'), tên hiển thị "Khách đã xoá bên SalonHero" (giữ mã).
--  • Ẩn khỏi số đếm/thống kê khách (so_lieu_khach, thong_ke_khach, thong_ke_khach_ngay, tuy_chon_loc_khach, bao_cao_sang_tinh, bc_phan_bo[_nhom] — phần khách, KHÔNG phần thẻ/nợ),
--    danh sách chăm sóc (cham_soc_*, ds_cham_soc, nhac_cham_soc_loc, ds_tai_kham, ds_the_sap_het — trừ khi xem riêng 1 khách), khách gần đến.
--  • Mở hồ sơ bằng đường dẫn/hoá đơn vẫn được (v_khach_hang không lọc).
--  • Trigger: hồ sơ dựng lại kiểu này thêm về sau (đồng bộ SalonHero) tự gắn cờ; đồng bộ không bao giờ gỡ cờ (không ghi cột này khi cập nhật).

alter table public.khach_hang add column if not exists an_sh_xoa boolean not null default false;
comment on column public.khach_hang.an_sh_xoa is 'Hồ sơ dựng lại cho khách đã bị xoá bên SalonHero: ẩn khỏi danh sách/tìm kiếm/thống kê/chăm sóc, giữ thẻ + hoá đơn (0330, chị Lâm 11/11/2026)';

update public.khach_hang set an_sh_xoa = true where ghi_chu like 'Khách đã bị xoá khỏi danh sách SalonHero%' and not an_sh_xoa;

create index if not exists khach_hang_an_sh_xoa_idx on public.khach_hang (id) where an_sh_xoa;

create or replace function public.trg_khach_an_sh_xoa() returns trigger language plpgsql set search_path = public, pg_temp as $f$
begin
  if new.ghi_chu like 'Khách đã bị xoá khỏi danh sách SalonHero%' then new.an_sh_xoa := true; end if;
  return new;
end $f$;
drop trigger if exists khach_an_sh_xoa on public.khach_hang;
create trigger khach_an_sh_xoa before insert on public.khach_hang for each row execute function public.trg_khach_an_sh_xoa();
revoke execute on function public.trg_khach_an_sh_xoa() from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.loc_khach(p jsonb, p_tu integer DEFAULT 0, p_so integer DEFAULT 40)
 RETURNS TABLE(tong bigint, dong jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  w text[];
  v text; v2 text; ord text; tk text; qkd text; ds_nhom uuid[]; nguon_tu text; dieu_kien text;
  dong text := $x$jsonb_build_object('id', k.id, 'ma', k.ma, 'ho_ten', case when x.an_sh_xoa then 'Khách đã xoá bên SalonHero' else k.ho_ten end, 'an_sh_xoa', x.an_sh_xoa, 'dien_thoai', k.dien_thoai, 'zalo', k.zalo, 'email', k.email,
        'gioi_tinh', k.gioi_tinh, 'ngay_sinh', k.ngay_sinh, 'dia_chi', k.dia_chi, 'nguon', k.nguon, 'nguon_chi_tiet', k.nguon_chi_tiet,
        'trang_thai', k.trang_thai, 'hang', k.hang, 'nguoi_phu_trach_id', k.nguoi_phu_trach_id, 'chi_nhanh_id', k.chi_nhanh_id,
        'so_the_dang_dung', k.so_the_dang_dung, 'chi_12_thang', k.chi_12_thang, 'tao_luc', k.tao_luc,
        'tinh_thanh', x.tinh_thanh, 'quan_huyen', x.quan_huyen, 'diem_so_du', x.diem_so_du, 'facebook', x.facebook, 'co_so_goc', x.co_so_goc,
        'nhom', coalesce((select jsonb_agg(jsonb_build_object('ten', n.ten, 'mau', n.mau) order by n.ten)
                            from public.khach_nhom kn join public.nhom_khach n on n.id = kn.nhom_id where kn.khach_id = k.id and n.hoat_dong), '[]'::jsonb))$x$;
  hn date := public.hom_nay();
  den text := $x$greatest(x.lan_den_cuoi,
      (select max(h.ngay_hd) from public.hoa_don h where h.khach_id = k.id and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau),
      (select max((l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date) from public.lich_hen l where l.khach_id = k.id and l.trang_thai = 'hoan_thanh'))$x$;
  ds text := $x$(select coalesce(sum(greatest(h.tong_hang - h.giam_gia_don, 0)), 0) from public.hoa_don h where h.khach_id = k.id and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau)$x$;
  tuoi text := $x$(case when extract(year from k.ngay_sinh) = 1904 then null else extract(year from age(public.hom_nay(), k.ngay_sinh)) end)$x$; -- 1904 = không rõ năm (0327)
  ngay_tao text := $x$(k.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date$x$;
begin
  p := coalesce(p, '{}'::jsonb);
  -- 0330: hồ sơ dựng lại cho khách đã bị xoá bên SalonHero (an_sh_xoa) chỉ hiện khi bật ô "Hiện khách đã xoá bên SalonHero".
  w := array[case when p->>'hien_sh_xoa' = '1' then 'true' else 'not x.an_sh_xoa' end];
  -- Tìm kiếm: tên, mã, email; số điện thoại đã chuẩn hoá ở ứng dụng (q_sdt).
  v := left(nullif(trim(p->>'q'), ''), 80);
  if v is not null then
    v2 := nullif(p->>'q_sdt', '');
    qkd := replace(replace(replace(public.bo_dau(v), '\', '\\'), '%', '\%'), '_', '\_');
    -- Cả cụm gõ có trong tên, hoặc mọi từ đều là ĐẦU một từ trong tên ("ho thi than" ra Hồ Thi Thân, Hồ Thị Thanh…). Khi đang tìm và sắp theo tên: tên BẮT ĐẦU bằng cụm gõ lên trước, rồi tên chứa cả cụm, rồi còn lại (như thứ tự SalonHero).
    tk := format('(x.ho_ten_khong_dau like %L or (%s))', '%' || replace(replace(replace(public.bo_dau(v), '\', '\\'), '%', '\%'), '_', '\_') || '%',
      coalesce((select string_agg(format('('' '' || x.ho_ten_khong_dau) like %L', '% ' || replace(replace(replace(t, '\', '\\'), '%', '\%'), '_', '\_') || '%'), ' and ')
                  from unnest(regexp_split_to_array(public.bo_dau(v), '\s+')) t where t <> ''), 'false'));
    w := w || format('(%3$s or k.ma ilike %1$L or k.email ilike %1$L%2$s)', '%' || v || '%',
                     case when v2 is not null and length(v2) >= 3 then format(' or k.dien_thoai like %L', '%' || v2 || '%') else '' end, tk);
  end if;
  if nullif(p->>'trang_thai', '') is not null then w := w || format('k.trang_thai = %L', p->>'trang_thai'); end if;
  if nullif(p->>'nguon', '') is not null then w := w || format('k.nguon = %L', p->>'nguon'); end if;
  if nullif(p->>'phu_trach', '') is not null then w := w || format('k.nguoi_phu_trach_id = %L::uuid', p->>'phu_trach'); end if;
  if nullif(p->>'hang', '') is not null then w := w || format('k.hang = %L', p->>'hang'); end if;
  if nullif(p->>'gioi_tinh', '') = 'chua_ro' then w := w || 'k.gioi_tinh is null'::text;
  elsif nullif(p->>'gioi_tinh', '') is not null then w := w || format('k.gioi_tinh = %L', p->>'gioi_tinh'); end if;
  -- Nhóm khách: "khong" = chưa thuộc nhóm nào; một hoặc nhiều nhóm (id cách nhau dấu phẩy) với nhom_kieu = 'tat_ca' (thuộc TẤT CẢ các nhóm đã chọn) hoặc mặc định thuộc MỘT TRONG các nhóm — như Tìm nâng cao SalonHero.
  if p->>'nhom' = 'khong' then w := w || 'not exists (select 1 from public.khach_nhom kn where kn.khach_id = k.id)'::text;
  elsif nullif(p->>'nhom', '') is not null then
    select array_agg(distinct t::uuid) into ds_nhom from unnest(string_to_array(p->>'nhom', ',')) t where t ~* '^[0-9a-f-]{36}$';
    if coalesce(array_length(ds_nhom, 1), 0) > 0 then
      if p->>'nhom_kieu' = 'tat_ca' and array_length(ds_nhom, 1) > 1 then
        w := w || format('(select count(distinct kn.nhom_id) from public.khach_nhom kn where kn.khach_id = k.id and kn.nhom_id = any(%L::uuid[])) = %s', ds_nhom, array_length(ds_nhom, 1));
      else
        w := w || format('exists (select 1 from public.khach_nhom kn where kn.khach_id = k.id and kn.nhom_id = any(%L::uuid[]))', ds_nhom);
      end if;
    end if;
  end if;
  if nullif(p->>'diem_tu', '') is not null then w := w || format('x.diem_so_du >= %s', (p->>'diem_tu')::int); end if;
  if nullif(p->>'diem_den', '') is not null then w := w || format('x.diem_so_du <= %s', (p->>'diem_den')::int); end if;
  if nullif(p->>'tuoi_tu', '') is not null then w := w || format('%s >= %s', tuoi, (p->>'tuoi_tu')::int); end if;
  if nullif(p->>'tuoi_den', '') is not null then w := w || format('%s <= %s', tuoi, (p->>'tuoi_den')::int); end if;
  if p->>'the' = 'co' then w := w || 'k.so_the_dang_dung > 0'::text;
  elsif p->>'the' = 'khong' then w := w || 'k.so_the_dang_dung = 0'::text; end if;
  if p->>'no' = 'co' then w := w || 'exists (select 1 from public.hoa_don h where h.khach_id = k.id and h.trang_thai = ''hoan_thanh'' and h.con_no > 0)'::text;
  elsif p->>'no' = 'khong' then w := w || 'not exists (select 1 from public.hoa_don h where h.khach_id = k.id and h.trang_thai = ''hoan_thanh'' and h.con_no > 0)'::text; end if;
  v := nullif(p->>'sinh_nhat', '');
  if v = 'hom_nay' then w := w || format('to_char(k.ngay_sinh, ''MM-DD'') = %L', to_char(hn, 'MM-DD'));
  elsif v = '7_ngay' then
    -- 7 ngày tới (từ ngày mai đến hết 7 ngày sau, qua năm mới vẫn đúng): hộp "Sinh nhật · 7 ngày tới" của SalonHero.
    w := w || format('to_char(k.ngay_sinh, ''MM-DD'') = any(%L::text[])', (select array_agg(to_char(hn + i, 'MM-DD')) from generate_series(1, 7) i));
  elsif v = 'thang' then w := w || format('extract(month from k.ngay_sinh) = %s', extract(month from hn)::int);
  elsif v ~ '^(1[0-2]|[1-9])$' then w := w || format('extract(month from k.ngay_sinh) = %s', v::int); end if;
  -- Ngày sinh nhật (1–31), dùng chung hoặc riêng với tháng: như ô Ngày / Tháng của "Khách hàng có sinh nhật" ở SalonHero.
  if nullif(p->>'sinh_ngay', '') ~ '^([1-9]|[12][0-9]|3[01])$' then w := w || format('extract(day from k.ngay_sinh) = %s', (p->>'sinh_ngay')::int); end if;
  if nullif(p->>'chi_nhanh', '') is not null then w := w || format('k.chi_nhanh_id = %L::uuid', p->>'chi_nhanh'); end if;
  if p->>'nhieu_cn' = '1' then w := w || 'x.co_so_goc like ''%,%'''::text; end if;
  if nullif(p->>'tinh', '') is not null then w := w || format('x.tinh_thanh = %L', p->>'tinh'); end if;
  if nullif(p->>'quan', '') is not null then w := w || format('x.quan_huyen = %L', p->>'quan'); end if;
  if nullif(p->>'den_tu', '') is not null then w := w || format('%s >= %L::date', den, p->>'den_tu'); end if;
  if nullif(p->>'den_den', '') is not null then w := w || format('%s <= %L::date', den, p->>'den_den'); end if;
  if nullif(p->>'tao_tu', '') is not null then w := w || format('%s >= %L::date', ngay_tao, p->>'tao_tu'); end if;
  if nullif(p->>'tao_den', '') is not null then w := w || format('%s <= %L::date', ngay_tao, p->>'tao_den'); end if;
  -- Dịch vụ đã dùng / Sản phẩm đã mua: theo tên dòng trên hoá đơn đã hoàn thành (dữ liệu SalonHero phần lớn chỉ có tên, chưa gắn mã).
  v := left(nullif(trim(p->>'dich_vu'), ''), 120);
  if v is not null then
    w := w || format('k.id in (select h.khach_id from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id where d.loai = ''dich_vu'' and h.trang_thai = ''hoan_thanh'' and d.ten ilike %L)', '%' || v || '%');
  end if;
  v := left(nullif(trim(p->>'san_pham'), ''), 120);
  if v is not null then
    w := w || format('k.id in (select h.khach_id from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id where d.loai = ''san_pham'' and h.trang_thai = ''hoan_thanh'' and d.ten ilike %L)', '%' || v || '%');
  end if;
  if nullif(p->>'nhan_vien', '') is not null then
    w := w || format('k.id in (select h.khach_id from public.dong_nhan_vien n join public.hoa_don_dong d on d.id = n.dong_id join public.hoa_don h on h.id = d.hoa_don_id where n.nhan_vien_id = %L::uuid and n.vai = ''phuc_vu'')', p->>'nhan_vien');
  end if;
  if nullif(p->>'ds_tu', '') is not null then w := w || format('%s >= %s', ds, (p->>'ds_tu')::bigint); end if;
  if nullif(p->>'ds_den', '') is not null then w := w || format('%s <= %s', ds, (p->>'ds_den')::bigint); end if;

  ord := case p->>'sx'
    when 'moi' then 'k.tao_luc desc'
    when 'chi' then 'k.chi_12_thang desc'
    when 'diem' then 'x.diem_so_du desc'
    when 'ten_giam' then 'k.ho_ten desc'
    else 'k.ho_ten asc' end;
  if qkd is not null and coalesce(p->>'sx', 'ten') = 'ten' then
    ord := format('(case when x.ho_ten_khong_dau like %L then 0 when x.ho_ten_khong_dau like %L then 1 else 2 end), k.ho_ten asc', qkd || '%', '%' || qkd || '%');
  end if;

  -- Bước 1 chỉ lọc + sắp xếp + cắt trang lấy id. Chỉ đọc view v_khach_hang (4 truy vấn con mỗi dòng) khi bộ lọc/sắp xếp cần cột tính
  -- (hạng, trạng thái, thẻ đang dùng, chi 12 tháng); còn lại đọc thẳng bảng khach_hang và đi theo chỉ mục (ho_ten, id) → trang đầu < 50ms thay vì ~1,4s
  -- (lỗi "Đang tải… 0 khách" lúc trưa: cửa sổ count(*) over () bắt dựng view cho cả 13 nghìn khách). Tổng đếm riêng một câu.
  dieu_kien := array_to_string(w, ' and ');
  if (dieu_kien || ' ' || ord) ~ 'k\.(hang|trang_thai|so_the_dang_dung|chi_12_thang)\M' then
    -- Lọc/sắp theo cột tính: một lượt qua view (đếm bằng cửa sổ) như bản 0093 — đếm riêng sẽ phải tính view hai lần.
    return query execute format($q$
      with trang as materialized (
        select k.id, count(*) over ()::bigint as tong, row_number() over (order by %2$s, k.id) as rn
          from public.v_khach_hang k join public.khach_hang x on x.id = k.id
         where %1$s
         order by %2$s, k.id
         offset %3$s limit %4$s)
      select t.tong, %5$s
        from trang t join public.v_khach_hang k on k.id = t.id join public.khach_hang x on x.id = k.id
       order by t.rn$q$, dieu_kien, ord, greatest(coalesce(p_tu, 0), 0), least(greatest(coalesce(p_so, 40), 1), 1000), dong);
    return;
  end if;
  nguon_tu := 'public.khach_hang k join public.khach_hang x on x.id = k.id';
  return query execute format($q$
    with tong as materialized (select count(*)::bigint as n from %5$s where %1$s),
    trang as materialized (
      select k.id, row_number() over (order by %2$s, k.id) as rn from %5$s where %1$s order by %2$s, k.id offset %3$s limit %4$s)
    select (select n from tong), %6$s
      from trang t join public.v_khach_hang k on k.id = t.id join public.khach_hang x on x.id = k.id
     order by t.rn$q$, dieu_kien, ord, greatest(coalesce(p_tu, 0), 0), least(greatest(coalesce(p_so, 40), 1), 1000), nguon_tu, dong);
end $function$;

CREATE OR REPLACE FUNCTION public.so_lieu_khach()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with h as materialized (  -- materialized: tính "hôm nay" đúng 1 lần (không để bộ lập kế hoạch chép biểu thức vào từng dòng)
    select d, (extract(month from d) * 100 + extract(day from d))::int md, extract(month from d)::int th,
           (d::timestamp at time zone 'Asia/Ho_Chi_Minh') tu, ((d + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') den
    from (select public.hom_nay() d) x
  )
  select jsonb_build_object(
    'tong', count(*),
    'moi_hom_nay', count(*) filter (where k.tao_luc >= h.tu and k.tao_luc < h.den),
    'sinh_nhat_hom_nay', count(*) filter (where (extract(month from k.ngay_sinh) * 100 + extract(day from k.ngay_sinh))::int = h.md),
    'sinh_nhat_thang', count(*) filter (where extract(month from k.ngay_sinh)::int = h.th))
  from public.khach_hang k cross join h
  where not k.an_sh_xoa  -- 0330
$function$;

CREATE OR REPLACE FUNCTION public.thong_ke_khach()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with k as (
    select x.id, x.gioi_tinh, x.nguon, x.chi_nhanh_id, x.tinh_thanh, x.ngay_sinh, x.diem_so_du,
           (x.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date as ngay_tao,
           case when x.ngay_sinh_khong_nam then null else extract(year from age(public.hom_nay(), x.ngay_sinh))::int end as tuoi
      from public.khach_hang x where not x.an_sh_xoa),  -- 0330
  v as (select vk.trang_thai, vk.hang, vk.so_the_dang_dung from public.v_khach_hang vk join public.khach_hang x on x.id = vk.id where not x.an_sh_xoa)
  select jsonb_build_object(
    'tong', (select count(*) from k),
    'gioi_tinh', (select jsonb_object_agg(coalesce(gioi_tinh, 'chua_ro'), n) from (select gioi_tinh, count(*) n from k group by 1) a),
    'nguon', (select jsonb_object_agg(coalesce(nguon, 'chua_ro'), n) from (select nguon, count(*) n from k group by 1) a),
    'chi_nhanh', (select jsonb_object_agg(coalesce(chi_nhanh_id::text, 'chua_ro'), n) from (select chi_nhanh_id, count(*) n from k group by 1) a),
    'tinh', (select jsonb_agg(jsonb_build_object('ten', tinh_thanh, 'so', n) order by n desc) from (select tinh_thanh, count(*) n from k where tinh_thanh is not null group by 1 order by 2 desc limit 10) a),
    'chua_co_tinh', (select count(*) from k where tinh_thanh is null),
    'tuoi', (select jsonb_object_agg(nhom, n) from (
        select case when tuoi is null then 'chua_ro' when tuoi < 18 then 'duoi_18' when tuoi < 25 then '18_24' when tuoi < 35 then '25_34'
                    when tuoi < 45 then '35_44' when tuoi < 55 then '45_54' else 'tu_55' end nhom, count(*) n from k group by 1) a),
    'moi_theo_thang', (select jsonb_agg(jsonb_build_object('thang', to_char(t, 'YYYY-MM'), 'so', (select count(*) from k where date_trunc('month', k.ngay_tao) = t)) order by t)
        from generate_series(date_trunc('month', public.hom_nay()::timestamp) - interval '11 months', date_trunc('month', public.hom_nay()::timestamp), interval '1 month') t),
    'trang_thai', (select jsonb_object_agg(coalesce(trang_thai, 'lead'), n) from (select trang_thai, count(*) n from v group by 1) a),
    'hang', (select jsonb_object_agg(coalesce(hang, 'Chưa xếp'), n) from (select hang, count(*) n from v group by 1) a),
    'co_the', (select count(*) from v where so_the_dang_dung > 0),
    'dang_no', (select count(distinct h.khach_id) from public.hoa_don h join public.khach_hang x on x.id = h.khach_id where h.trang_thai = 'hoan_thanh' and h.con_no > 0 and not x.an_sh_xoa),
    'co_diem', (select count(*) from k where diem_so_du > 0),
    'tong_diem', (select coalesce(sum(diem_so_du), 0) from k where diem_so_du > 0))
$function$;

CREATE OR REPLACE FUNCTION public.thong_ke_khach_ngay(p_so_ngay integer DEFAULT 30, p_den date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  with p as (select least(coalesce(p_den, public.hom_nay()), public.hom_nay()) as hom, greatest(least(p_so_ngay, 92), 1) as n),
  ngay as (select (p.hom - g)::date as d from p, generate_series(0, (select n from p) - 1) g),
  v as (
    select h.ngay_hd, h.khach_id from public.hoa_don h, p
    where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd > p.hom - p.n and h.ngay_hd <= p.hom
  ),
  le as (select ngay_hd as d, count(*) as so from v where khach_id is null group by ngay_hd),
  co as (select ngay_hd as d, khach_id from v where khach_id is not null group by ngay_hd, khach_id),
  den as (select d, count(*) as so from co group by d),
  moi as (
    select c.d, count(*) as so from co c
    where not exists (select 1 from public.hoa_don h2 where h2.khach_id = c.khach_id and h2.trang_thai = 'hoan_thanh' and not h2.la_so_du_dau and h2.ngay_hd < c.d)
    group by c.d
  )
  select jsonb_build_object(
    'ngay', coalesce((select jsonb_agg(jsonb_build_object(
        'ngay', n.d, 'le', coalesce(l.so, 0), 'moi', coalesce(m.so, 0), 'cu', greatest(coalesce(e.so, 0) - coalesce(m.so, 0), 0), 'tong', coalesce(l.so, 0) + coalesce(e.so, 0)) order by n.d)
      from ngay n left join le l on l.d = n.d left join den e on e.d = n.d left join moi m on m.d = n.d), '[]'::jsonb),
    -- Khách mới trong tuần: hồ sơ khách tạo trong 7 ngày gần nhất (hôm nay trừ 6 ngày), cùng cách tính với ô "Khách hàng mới hôm nay".
    'moi_tuan', (select count(*) from public.khach_hang k, p where not k.an_sh_xoa and k.tao_luc >= ((p.hom - 6)::timestamp at time zone 'Asia/Ho_Chi_Minh') and k.tao_luc < ((p.hom + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')),
    -- Khách mới trong khoảng ngày đang xem (hồ sơ tạo trong khoảng).
    'moi_khoang', (select count(*) from public.khach_hang k, p where not k.an_sh_xoa and k.tao_luc >= ((p.hom - p.n + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') and k.tao_luc < ((p.hom + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')));
$function$;

CREATE OR REPLACE FUNCTION public.tuy_chon_loc_khach()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select jsonb_build_object(
    'tinh', coalesce((select jsonb_agg(jsonb_build_object('tinh', t.tinh_thanh, 'so', t.so, 'quan', t.quan) order by t.so desc)
       from (select tinh_thanh, sum(so)::int so, jsonb_agg(quan_huyen order by quan_huyen) filter (where quan_huyen is not null) quan
               from (select tinh_thanh, quan_huyen, count(*) so from public.khach_hang where tinh_thanh is not null and not an_sh_xoa group by 1, 2) a group by 1) t), '[]'::jsonb),
    'dich_vu', coalesce((select jsonb_agg(ten order by ten) from (select distinct d.ten from public.hoa_don_dong d where d.loai = 'dich_vu') s), '[]'::jsonb),
    'san_pham', coalesce((select jsonb_agg(ten order by ten) from (select distinct d.ten from public.hoa_don_dong d where d.loai = 'san_pham') s), '[]'::jsonb))
$function$;

CREATE OR REPLACE FUNCTION public.bao_cao_sang_tinh(p_ngay date DEFAULT NULL::date, p_cn uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    'khach_moi', (select count(*) from public.khach_hang k where not k.an_sh_xoa and k.tao_luc >= t_hq and k.tao_luc < t_hn and (p_cn is null or k.chi_nhanh_id = p_cn))));
  r := r || jsonb_build_object('hom_nay', jsonb_build_object(
    'ngay', hn,
    'so_lich', (select count(*) from public.lich_hen l where l.bat_dau >= t_hn and l.bat_dau < t_mai and l.trang_thai not in ('huy', 'khong_den') and (p_cn is null or l.chi_nhanh_id = p_cn)),
    'sinh_nhat', (select count(*) from public.khach_hang k where not k.an_sh_xoa and k.ngay_sinh is not null and to_char(k.ngay_sinh, 'MM-DD') = to_char(hn, 'MM-DD') and (p_cn is null or k.chi_nhanh_id = p_cn)),
    'sinh_nhat_ten', coalesce((select jsonb_agg(x.ho_ten order by x.ho_ten) from (select k.ho_ten from public.khach_hang k where not k.an_sh_xoa and k.ngay_sinh is not null and to_char(k.ngay_sinh, 'MM-DD') = to_char(hn, 'MM-DD') and (p_cn is null or k.chi_nhanh_id = p_cn) order by k.ho_ten limit 10) x), '[]'::jsonb),
    'nhac_den_han', (select count(*) from public.khach_nhac n where n.trang_thai = 'dang_nhac' and not n.la_lich_su and n.ngay_nhac >= t_hn and n.ngay_nhac < t_mai and (p_cn is null or n.chi_nhanh_id = p_cn)),
    'nhac_qua_han', (select count(*) from public.khach_nhac n where n.trang_thai = 'dang_nhac' and not n.la_lich_su and n.ngay_nhac < t_hn and (p_cn is null or n.chi_nhanh_id = p_cn)),
    'the_sap_het', (select coalesce(max(s.tong), 0) from public.ds_the_sap_het(p_cn, null, null, null, 1) s),
    'tai_kham', (select coalesce(max(s.tong), 0) from public.ds_tai_kham(p_cn, null, null, null, 1) s)));
  return r;
end $function$;

CREATE OR REPLACE FUNCTION public.bc_phan_bo_nhom(p_cn uuid DEFAULT NULL::uuid, p_nhom text[] DEFAULT NULL::text[])
 RETURNS TABLE(nhom text, nhan text, so bigint, tien bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  co boolean;
begin
  co := p_nhom is null;
  if co or p_nhom && array['hang','trang_thai'] then
    return query
      select case when grouping(v.hang) = 0 then 'hang' else 'trang_thai' end,
             case when grouping(v.hang) = 0 then coalesce(v.hang::text, 'Chưa xếp') else v.trang_thai::text end,
             count(*), 0::bigint
        from public.v_khach_hang v join public.khach_hang x on x.id = v.id where not x.an_sh_xoa and (p_cn is null or v.chi_nhanh_id = p_cn)
       group by grouping sets ((v.hang), (v.trang_thai));
  end if;
  if co or 'nguon' = any(p_nhom) then
    return query select 'nguon'::text, k.nguon::text, count(*), 0::bigint from public.khach_hang k where not k.an_sh_xoa and (p_cn is null or k.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or 'khach_moi' = any(p_nhom) then
    return query select 'khach_moi'::text, to_char(date_trunc('month', k.tao_luc), 'YYYY-MM'), count(*), 0::bigint from public.khach_hang k
      where not k.an_sh_xoa and k.tao_luc >= date_trunc('month', public.hom_nay()::timestamp) - interval '5 months' and (p_cn is null or k.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or p_nhom && array['the_lan','the_tien'] then
    return query select case when t.loai = 'lan' then 'the_lan' else 'the_tien' end, t.tinh_trang::text, count(*),
        case when t.loai = 'lan' then 0::bigint else coalesce(sum(t.so_du_tien), 0)::bigint end
      from public.v_the_khach t where t.loai in ('lan', 'tien') and (p_cn is null or t.chi_nhanh_id = p_cn) group by t.loai, t.tinh_trang;
  end if;
  if co or 'no_tuoi' = any(p_nhom) then
    return query select 'no_tuoi'::text,
         case when public.hom_nay() - h.ngay_hd <= 30 then '0-30 ngày' when public.hom_nay() - h.ngay_hd <= 90 then '31-90 ngày' else 'Trên 90 ngày' end,
         count(*), coalesce(sum(h.con_no), 0)::bigint
      from public.hoa_don h where h.trang_thai = 'hoan_thanh' and h.con_no > 0 and (p_cn is null or h.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or 'phieu' = any(p_nhom) then
    return query select 'phieu'::text, p.trang_thai::text, count(*), 0::bigint from public.phieu_cap p where (p_cn is null or p.chi_nhanh_id = p_cn) group by 2;
  end if;
  if co or 'phu_trach' = any(p_nhom) then
    return query select 'phu_trach'::text, x.ten::text, x.so, 0::bigint from (
      select coalesce(n.ho_ten, 'Chưa gán') as ten, count(*) as so
        from public.khach_hang k left join public.nhan_vien n on n.id = k.nguoi_phu_trach_id
       where not k.an_sh_xoa and (p_cn is null or k.chi_nhanh_id = p_cn) group by 1 order by 2 desc limit 8) x;
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.bc_phan_bo(p_cn uuid DEFAULT NULL::uuid)
 RETURNS TABLE(nhom text, nhan text, so bigint, tien bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select 'hang', coalesce(hang, 'Chưa xếp'), count(*), 0::bigint from public.v_khach_hang where id not in (select id from public.khach_hang where an_sh_xoa) and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'trang_thai', trang_thai, count(*), 0 from public.v_khach_hang where id not in (select id from public.khach_hang where an_sh_xoa) and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'nguon', nguon, count(*), 0 from public.khach_hang where not an_sh_xoa and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'khach_moi', to_char(date_trunc('month', tao_luc), 'YYYY-MM'), count(*), 0 from public.khach_hang
   where not an_sh_xoa and tao_luc >= date_trunc('month', public.hom_nay()::timestamp) - interval '5 months' and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'the_lan', tinh_trang, count(*), 0 from public.v_the_khach where loai = 'lan' and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'the_tien', tinh_trang, count(*), coalesce(sum(so_du_tien), 0)::bigint from public.v_the_khach where loai = 'tien' and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'no_tuoi',
         case when public.hom_nay() - ngay_hd <= 30 then '0-30 ngày' when public.hom_nay() - ngay_hd <= 90 then '31-90 ngày' else 'Trên 90 ngày' end,
         count(*), coalesce(sum(con_no), 0)::bigint
    from public.hoa_don where trang_thai = 'hoan_thanh' and con_no > 0 and (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'phieu', trang_thai, count(*), 0 from public.phieu_cap where (p_cn is null or chi_nhanh_id = p_cn) group by 2
  union all
  select 'phu_trach', ten, so, 0 from (
    select coalesce(n.ho_ten, 'Chưa gán') as ten, count(*) as so
      from public.khach_hang k left join public.nhan_vien n on n.id = k.nguoi_phu_trach_id
     where not k.an_sh_xoa and (p_cn is null or k.chi_nhanh_id = p_cn) group by 1 order by 2 desc limit 8) x
$function$;

CREATE OR REPLACE FUNCTION public.cham_soc_ung_vien(p_cn uuid DEFAULT NULL::uuid, p_loai text DEFAULT NULL::text, p_sau_dt integer DEFAULT NULL::integer)
 RETURNS TABLE(loai text, khach_id uuid, ngay_goc date, lich_id uuid, moc integer, chi_nhanh_id uuid)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
            where (p_loai is null or p_loai = 'dinh_ky') and not k0.danh_dau_mat and not k0.an_sh_xoa and (p_cn is null or k0.chi_nhanh_id = p_cn)
           union
           select l0.khach_id, k1.chi_nhanh_id from public.lich_hen l0 join public.khach_hang k1 on k1.id = l0.khach_id cross join cfg
             join moc on l0.bat_dau >= (moc.den - (cfg.w_dk - 1))::timestamp at time zone 'Asia/Ho_Chi_Minh' and l0.bat_dau < (moc.den + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh'
            where (p_loai is null or p_loai = 'dinh_ky') and l0.trang_thai = 'hoan_thanh' and not k1.danh_dau_mat and not k1.an_sh_xoa and (p_cn is null or k1.chi_nhanh_id = p_cn)) u
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
    where (p_loai is null or p_loai = 'sinh_nhat') and not k.danh_dau_mat and not k.an_sh_xoa and k.ngay_sinh is not null and (p_cn is null or k.chi_nhanh_id = p_cn))
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
$function$;

CREATE OR REPLACE FUNCTION public.cham_soc_hien(p_cn uuid DEFAULT NULL::uuid, p_loai text DEFAULT NULL::text, p_sau_dt integer DEFAULT NULL::integer)
 RETURNS TABLE(hang text, loai text, khach_id uuid, ngay_goc date, lich_id uuid, moc integer, chi_nhanh_id uuid, hen_ngay date)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
   where (p_loai is null or p_loai = 'hen_goi_lai') and m.ngay_goi_lai is not null and m.ngay_goi_lai <= hn.d and not k.danh_dau_mat and not k.an_sh_xoa
     and (p_cn is null or coalesce(m.chi_nhanh_id, k.chi_nhanh_id) = p_cn);
$function$;

CREATE OR REPLACE FUNCTION public.ds_cham_soc(p_loai text, p_cn uuid DEFAULT NULL::uuid, p_sau_dt integer DEFAULT NULL::integer, p_tu integer DEFAULT 0, p_so integer DEFAULT 50)
 RETURNS TABLE(tong bigint, hang text, loai text, khach_id uuid, ma text, ho_ten text, dien_thoai text, chi_nhanh_id uuid, ngay_goc date, lich_id uuid, moc integer, hen_ngay date, gio timestamp with time zone, lich_tt text, dich_vu text, goi_tt text, goi_luc timestamp with time zone, goi_chi_tiet text, goi_noi_dung text, goi_nguoi text, so_lan_goi integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with p as (
    select count(*) over ()::bigint tong, h.hang, h.loai, h.khach_id, k.ma, k.ho_ten, k.dien_thoai, h.chi_nhanh_id, h.ngay_goc, h.lich_id, h.moc, h.hen_ngay, l.bat_dau, l.trang_thai lich_tt,
           case when h.hang in ('nhac_lich', 'sinh_nhat', 'hen_goi_lai') then coalesce(h.hen_ngay, h.ngay_goc) - date '2000-01-01' else date '2100-01-01' - h.ngay_goc end sk
      from public.cham_soc_hien(p_cn, p_loai, p_sau_dt) h
      join public.khach_hang k on k.id = h.khach_id and not k.an_sh_xoa  -- 0330
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
$function$;

CREATE OR REPLACE FUNCTION public.nhac_cham_soc_loc(p_cn uuid DEFAULT NULL::uuid, p_tu date DEFAULT NULL::date, p_den date DEFAULT NULL::date, p_tt text DEFAULT NULL::text, p_phu_trach uuid DEFAULT NULL::uuid, p_lim integer DEFAULT 50, p_off integer DEFAULT 0, p_q text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, khach_id uuid, ngay timestamp with time zone, so_lan integer, tong bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with mien as (
    select case when p_tu is null then '-infinity'::timestamptz else (p_tu::timestamp at time zone 'Asia/Ho_Chi_Minh') end as tu,
           case when p_den is null then 'infinity'::timestamptz else ((p_den + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') end as den,
           nullif(trim(coalesce(p_q, '')), '') as q
  ), khach as (
    select k.id from public.khach_hang k, mien m
     where m.q is not null
       and (k.ho_ten_khong_dau like '%' || public.bo_dau(m.q) || '%' or k.ma ilike '%' || m.q || '%'
            or (length(regexp_replace(m.q, '\D', '', 'g')) >= 3 and k.dien_thoai like '%' || regexp_replace(m.q, '\D', '', 'g') || '%'))
  ), goc as (
    select n.* from public.khach_nhac n, mien m
     where (p_cn is null or n.chi_nhanh_id = p_cn)
       and (p_tt is null or p_tt = '' or n.trang_thai = p_tt)
       and (p_phu_trach is null or n.nguoi_phu_trach_id = p_phu_trach)
       and (m.q is null or n.khach_id in (select id from khach))
       and n.ngay_nhac < m.den
       and not exists (select 1 from public.khach_hang kx where kx.id = n.khach_id and kx.an_sh_xoa)  -- 0330
  ), khop as (
    select g.id, g.khach_id, g.ngay_nhac as ngay, 1 as so_lan
      from goc g, mien m
     where (coalesce(g.kieu_lap, 'SINGLE') = 'SINGLE' or jsonb_typeof(g.cac_ngay_nhac) is distinct from 'array')
       and g.ngay_nhac >= m.tu
    union all
    select g.id, g.khach_id, min(t.t) as ngay, jsonb_array_length(g.cac_ngay_nhac) as so_lan
      from goc g cross join mien m
      cross join lateral (select (x #>> '{}')::timestamptz as t from jsonb_array_elements(g.cac_ngay_nhac) x) t
     where coalesce(g.kieu_lap, 'SINGLE') <> 'SINGLE' and jsonb_typeof(g.cac_ngay_nhac) = 'array'
       and t.t >= m.tu and t.t < m.den
     group by g.id, g.khach_id, g.cac_ngay_nhac
  )
  select k.id, k.khach_id, k.ngay, k.so_lan, count(*) over () as tong
  from khop k order by k.ngay, k.id
  limit greatest(1, least(coalesce(p_lim, 50), 200)) offset greatest(0, coalesce(p_off, 0));
$function$;

CREATE OR REPLACE FUNCTION public.ds_tai_kham(p_cn uuid DEFAULT NULL::uuid, p_bao_truoc integer DEFAULT NULL::integer, p_tre_toi_da integer DEFAULT NULL::integer, p_khach uuid DEFAULT NULL::uuid, p_gioi_han integer DEFAULT 500)
 RETURNS TABLE(tong bigint, khach_id uuid, ma text, ho_ten text, dien_thoai text, the_id uuid, ma_the text, ten_goi text, so_the integer, so_buoi_con integer, khong_gioi_han boolean, han_dung date, lan_cuoi date, khoang_cach integer, den_han date, so_ngay_tre integer, trang_thai text, ghi_chu text, chi_nhanh_id uuid, nhac_id uuid)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with cfg as (
    select public.hom_nay() hn, public.cau_hinh_so('tai_kham_ngay_mac_dinh', 30) md,
           coalesce(p_bao_truoc, public.cau_hinh_so('tai_kham_bao_truoc_ngay', 7)) bt,
           coalesce(p_tre_toi_da, public.cau_hinh_so('tai_kham_tre_toi_da_ngay', 90)) tt),
  the as (
    select t.id, t.khach_id, t.ma, t.chi_nhanh_id, t.ngay_cap, t.han_dung, t.so_buoi_tong, g.ten ten_goi,
           coalesce(g.khoang_cach_ngay, cfg.md) kc, s.con
      from public.the_khach t
      join public.goi_the g on g.id = t.goi_id
      cross join cfg
      cross join lateral (select coalesce(sum(c.so_buoi), 0)::int con from public.the_so_cai c where c.the_id = t.id) s
     where t.loai = 'lan' and t.trang_thai = 'hoat_dong' and s.con > 0
       and (t.han_dung is null or t.han_dung >= cfg.hn)
       and (p_cn is null or t.chi_nhanh_id = p_cn)
       and (p_khach is null or t.khach_id = p_khach)),
  kh as (
    select k.id, k.ma, k.ho_ten, k.dien_thoai,
           (array_agg(x.id order by x.ngay_cap + x.kc, x.id))[1] the_id,
           (array_agg(x.ma order by x.ngay_cap + x.kc, x.id))[1] ma_the,
           (array_agg(x.ten_goi order by x.ngay_cap + x.kc, x.id))[1] ten_goi,
           (array_agg(x.chi_nhanh_id order by x.ngay_cap + x.kc, x.id))[1] chi_nhanh_id,
           count(*)::int so_the, min(x.kc)::int kc, max(x.ngay_cap) cap_cuoi,
           (array_agg(x.con order by x.ngay_cap + x.kc, x.id))[1] so_buoi_con,
           (array_agg(x.so_buoi_tong >= 100000 order by x.ngay_cap + x.kc, x.id))[1] khong_gioi_han,
           min(x.han_dung) han_dung,
           k.lan_den_cuoi
      from the x join public.khach_hang k on k.id = x.khach_id and (p_khach is not null or not k.an_sh_xoa)  -- 0330: hồ sơ khách xem riêng vẫn thấy
     group by k.id),
  tinh as materialized (
    select kh.*, greatest(kh.lan_den_cuoi, kh.cap_cuoi,
             ((select max(l.bat_dau) from public.lich_hen l where l.khach_id = kh.id and l.trang_thai = 'hoan_thanh') at time zone 'Asia/Ho_Chi_Minh')::date) lc
      from kh),
  den as (
    select tinh.*, (tinh.lc + tinh.kc) den_han from tinh)
  select count(*) over ()::bigint, d.id, d.ma, d.ho_ten, d.dien_thoai, d.the_id, d.ma_the, d.ten_goi, d.so_the, d.so_buoi_con, coalesce(d.khong_gioi_han, false),
         d.han_dung, d.lc, d.kc, d.den_han, (cfg.hn - d.den_han)::int, x.trang_thai, x.ghi_chu, d.chi_nhanh_id, x.nhac_id
    from den d cross join cfg
    left join public.tai_kham_xu_ly x on x.khach_id = d.id and x.lan_cuoi = d.lc
   where d.den_han <= cfg.hn + cfg.bt and d.den_han >= cfg.hn - cfg.tt
     and not exists (select 1 from public.lich_hen l where l.khach_id = d.id and l.bat_dau >= now() and l.trang_thai in ('chua_xac_nhan', 'da_xac_nhan', 'cho_phuc_vu', 'dang_phuc_vu'))
   order by d.den_han, d.ho_ten, d.id
   limit least(greatest(coalesce(p_gioi_han, 500), 1), 2000);
$function$;

CREATE OR REPLACE FUNCTION public.ds_the_sap_het(p_cn uuid DEFAULT NULL::uuid, p_buoi integer DEFAULT NULL::integer, p_ngay integer DEFAULT NULL::integer, p_khach uuid DEFAULT NULL::uuid, p_gioi_han integer DEFAULT 500)
 RETURNS TABLE(tong bigint, the_id uuid, ma_the text, khach_id uuid, ma text, ho_ten text, dien_thoai text, ten_goi text, loai text, so_buoi_con integer, so_du_tien bigint, han_dung date, so_ngay_con integer, ly_do text, chi_nhanh_id uuid, ngay_cap date)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with cfg as materialized (select public.hom_nay() hn, coalesce(p_buoi, public.cau_hinh_so('the_sap_het_buoi', 2)) b, coalesce(p_ngay, public.cau_hinh_so('the_sap_het_ngay', 30)) n),
  c as (
    select t.id, t.ma, t.khach_id, t.chi_nhanh_id, t.loai, t.ngay_cap, t.han_dung, t.so_buoi_tong, g.ten ten_goi,
           s.con, s.tien, cfg.hn, cfg.b, cfg.n
      from public.the_khach t join public.goi_the g on g.id = t.goi_id cross join cfg
      cross join lateral (select coalesce(sum(c.so_buoi), 0)::int con, coalesce(sum(c.so_tien), 0)::bigint tien from public.the_so_cai c where c.the_id = t.id) s
     where t.trang_thai = 'hoat_dong' and (p_cn is null or t.chi_nhanh_id = p_cn) and (p_khach is null or t.khach_id = p_khach)
       and (case when t.loai = 'lan' then s.con > 0 else s.tien > 0 end)
       and (t.han_dung is null or t.han_dung >= cfg.hn)),
  x as (
    select c.*,
      (c.loai = 'lan' and coalesce(c.so_buoi_tong, 0) < 100000 and c.con <= c.b) het_buoi,
      (c.han_dung is not null and c.han_dung >= date '2000-01-01' and c.han_dung <= c.hn + c.n) het_han
      from c)
  select count(*) over ()::bigint, x.id, x.ma, x.khach_id, k.ma, k.ho_ten, k.dien_thoai, x.ten_goi, x.loai, x.con, x.tien, x.han_dung,
         case when x.han_dung >= date '2000-01-01' then (x.han_dung - x.hn)::int end,
         case when x.het_buoi and x.het_han then 'ca_hai' when x.het_buoi then 'het_buoi' else 'het_han' end, x.chi_nhanh_id, x.ngay_cap
    from x join public.khach_hang k on k.id = x.khach_id and (p_khach is not null or not k.an_sh_xoa)  -- 0330: hồ sơ khách xem riêng vẫn thấy
   where x.het_buoi or x.het_han
   order by case when x.het_han then (x.han_dung - x.hn) else 99999 end, x.con, k.ho_ten, x.id
   limit least(greatest(coalesce(p_gioi_han, 500), 1), 2000);
$function$;

CREATE OR REPLACE FUNCTION public.khach_gan_den(p_cn uuid DEFAULT NULL::uuid, p_lim integer DEFAULT 30, p_off integer DEFAULT 0, p_tu date DEFAULT NULL::date, p_den date DEFAULT NULL::date, p_q text DEFAULT NULL::text)
 RETURNS TABLE(khach_id uuid, ngay date, hd_id uuid, hd_ma text, tien bigint)
 LANGUAGE sql
 STABLE
AS $function$
  with m as (select coalesce(p_tu, '-infinity'::date) tu, least(coalesce(p_den, public.hom_nay()), public.hom_nay()) den, nullif(trim(coalesce(p_q, '')), '') q),
  kq as (
    select k.id from public.khach_hang k, m
     where m.q is not null
       and (k.ho_ten_khong_dau like '%' || public.bo_dau(m.q) || '%' or k.ma ilike '%' || m.q || '%'
            or (length(regexp_replace(m.q, '\D', '', 'g')) >= 3 and k.dien_thoai like '%' || regexp_replace(m.q, '\D', '', 'g') || '%')))
  select h.khach_id, h.ngay_hd, h.id, coalesce(h.sh_ma, h.ma), h.tong_phai_thu
  from public.hoa_don h, m
  where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.khach_id is not null and h.ngay_hd <= m.den and h.ngay_hd >= m.tu
    and (p_cn is null or h.chi_nhanh_id = p_cn)
    and (m.q is null or h.khach_id in (select id from kq))
    and not exists (select 1 from public.khach_hang kx where kx.id = h.khach_id and kx.an_sh_xoa)  -- 0330
    and not exists (select 1 from public.hoa_don h2
                    where h2.khach_id = h.khach_id and h2.trang_thai = 'hoan_thanh' and not h2.la_so_du_dau and h2.ngay_hd <= m.den
                      and (p_cn is null or h2.chi_nhanh_id = p_cn)
                      and h2.ngay_hd >= h.ngay_hd and (h2.ngay_hd > h.ngay_hd or (h2.ngay_hd = h.ngay_hd and (h2.tao_luc > h.tao_luc or (h2.tao_luc = h.tao_luc and h2.id > h.id)))))
  order by h.ngay_hd desc, h.tao_luc desc, h.id desc
  limit greatest(p_lim, 1) offset greatest(p_off, 0);
$function$;

CREATE OR REPLACE FUNCTION public.khach_gan_den_tong(p_cn uuid DEFAULT NULL::uuid, p_tu date DEFAULT NULL::date, p_den date DEFAULT NULL::date, p_q text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE sql
 STABLE
AS $function$
  with m as (select coalesce(p_tu, '-infinity'::date) tu, least(coalesce(p_den, public.hom_nay()), public.hom_nay()) den, nullif(trim(coalesce(p_q, '')), '') q)
  select count(distinct h.khach_id) from public.hoa_don h, m
  where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.khach_id is not null and h.ngay_hd <= m.den and h.ngay_hd >= m.tu and (p_cn is null or h.chi_nhanh_id = p_cn)
    and not exists (select 1 from public.khach_hang kx where kx.id = h.khach_id and kx.an_sh_xoa)  -- 0330
    and (m.q is null or h.khach_id in (select k.id from public.khach_hang k
          where k.ho_ten_khong_dau like '%' || public.bo_dau(m.q) || '%' or k.ma ilike '%' || m.q || '%'
             or (length(regexp_replace(m.q, '\D', '', 'g')) >= 3 and k.dien_thoai like '%' || regexp_replace(m.q, '\D', '', 'g') || '%')));
$function$;

notify pgrst, 'reload schema';
