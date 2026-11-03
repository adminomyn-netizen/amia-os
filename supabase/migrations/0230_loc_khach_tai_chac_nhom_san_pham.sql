-- 0230 — Danh sách khách tải chắc + Tìm nâng cao như SalonHero (đợt 3, 03/11/2026).
-- • loc_khach = bản 0093, đổi cách chạy: không còn count(*) over () trên view v_khach_hang (bắt tính hạng/trạng thái/thẻ cho cả 13 nghìn khách mỗi lần mở → ~1,4s,
--   lúc trưa DB bận thì quá giờ, màn hiện "Đang tải… 0 khách"). Lọc thường đọc thẳng khach_hang theo chỉ mục (ho_ten, id); chỉ lọc theo cột tính mới cần view.
-- • Nhóm khách chọn nhiều + "thuộc 1 trong / thuộc tất cả" (nhom = id,id,…; nhom_kieu = 'tat_ca').
-- • Sản phẩm đã mua (san_pham) bên cạnh Dịch vụ đã dùng; Sinh nhật 7 ngày tới (sinh_nhat = '7_ngay').
-- Đầu ra (tong, dong) giữ nguyên nên gan_nhom_theo_loc, xuất Excel, báo cáo sáng dùng tiếp không đổi.
create index if not exists khach_hang_ho_ten_id_idx on public.khach_hang (ho_ten, id);

create or replace function public.loc_khach(p jsonb, p_tu int default 0, p_so int default 40)
returns table (tong bigint, dong jsonb) language plpgsql stable as $$
declare
  w text[] := array['true'];
  v text; v2 text; ord text; tk text; qkd text; ds_nhom uuid[]; nguon_tu text; dieu_kien text;
  dong text := $x$jsonb_build_object('id', k.id, 'ma', k.ma, 'ho_ten', k.ho_ten, 'dien_thoai', k.dien_thoai, 'zalo', k.zalo, 'email', k.email,
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
  tuoi text := $x$extract(year from age(public.hom_nay(), k.ngay_sinh))$x$;
  ngay_tao text := $x$(k.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date$x$;
begin
  p := coalesce(p, '{}'::jsonb);
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
end $$;

-- Tên sản phẩm đã bán (dòng hoá đơn) cho ô gợi ý "Sản phẩm đã mua", cạnh tên dịch vụ đã bán.
create or replace function public.tuy_chon_loc_khach() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'tinh', coalesce((select jsonb_agg(jsonb_build_object('tinh', t.tinh_thanh, 'so', t.so, 'quan', t.quan) order by t.so desc)
       from (select tinh_thanh, sum(so)::int so, jsonb_agg(quan_huyen order by quan_huyen) filter (where quan_huyen is not null) quan
               from (select tinh_thanh, quan_huyen, count(*) so from public.khach_hang where tinh_thanh is not null group by 1, 2) a group by 1) t), '[]'::jsonb),
    'dich_vu', coalesce((select jsonb_agg(ten order by ten) from (select distinct d.ten from public.hoa_don_dong d where d.loai = 'dich_vu') s), '[]'::jsonb),
    'san_pham', coalesce((select jsonb_agg(ten order by ten) from (select distinct d.ten from public.hoa_don_dong d where d.loai = 'san_pham') s), '[]'::jsonb))
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
