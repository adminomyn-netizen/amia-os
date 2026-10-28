-- 0072 — QUẢN LÝ NHÓM KHÁCH + gán hàng loạt theo bộ lọc + chỉ mục email (28/10/2026).
-- • Nhóm bị ẩn (hoat_dong = false, "xoá mềm") không còn hiện làm nhãn trên danh sách khách; dòng khach_nhom vẫn giữ để khôi phục nhóm là có lại.
--   Bản dưới là loc_khach của 0069 y nguyên, chỉ thêm điều kiện `n.hoat_dong` ở nhãn nhóm.
-- • gan_nhom_theo_loc: xem trước / áp dụng gán hoặc bỏ một nhóm cho TOÀN BỘ khách khớp bộ lọc (dùng chính loc_khach nên khớp danh sách trên màn hình).
--   Không bao giờ xoá khách hay sửa dữ liệu khách: chỉ thêm / bớt dòng khach_nhom.
-- • Chỉ mục nhỏ cho tìm email (khách có email còn rất ít nên chỉ mục gần như không tốn dung lượng).

create index khach_hang_email_idx on public.khach_hang (lower(email)) where email is not null and email <> '';

-- loc_khach: như 0069, chỉ lọc nhóm đang hoạt động ở nhãn.
create or replace function public.loc_khach(p jsonb, p_tu int default 0, p_so int default 40)
returns table (tong bigint, dong jsonb) language plpgsql stable as $$
declare
  w text[] := array['true'];
  v text; v2 text; ord text;
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
    w := w || format('(k.ho_ten ilike %1$L or k.ma ilike %1$L or k.email ilike %1$L%2$s)', '%' || v || '%',
                     case when v2 is not null and length(v2) >= 3 then format(' or k.dien_thoai like %L', '%' || v2 || '%') else '' end);
  end if;
  if nullif(p->>'trang_thai', '') is not null then w := w || format('k.trang_thai = %L', p->>'trang_thai'); end if;
  if nullif(p->>'nguon', '') is not null then w := w || format('k.nguon = %L', p->>'nguon'); end if;
  if nullif(p->>'phu_trach', '') is not null then w := w || format('k.nguoi_phu_trach_id = %L::uuid', p->>'phu_trach'); end if;
  if nullif(p->>'hang', '') is not null then w := w || format('k.hang = %L', p->>'hang'); end if;
  if nullif(p->>'gioi_tinh', '') = 'chua_ro' then w := w || 'k.gioi_tinh is null'::text;
  elsif nullif(p->>'gioi_tinh', '') is not null then w := w || format('k.gioi_tinh = %L', p->>'gioi_tinh'); end if;
  -- Nhóm khách: một nhóm cụ thể, hoặc "khong" = khách chưa thuộc nhóm nào.
  if p->>'nhom' = 'khong' then w := w || 'not exists (select 1 from public.khach_nhom kn where kn.khach_id = k.id)'::text;
  elsif nullif(p->>'nhom', '') is not null then w := w || format('exists (select 1 from public.khach_nhom kn where kn.khach_id = k.id and kn.nhom_id = %L::uuid)', p->>'nhom'); end if;
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
  elsif v = 'thang' then w := w || format('extract(month from k.ngay_sinh) = %s', extract(month from hn)::int);
  elsif v ~ '^(1[0-2]|[1-9])$' then w := w || format('extract(month from k.ngay_sinh) = %s', v::int); end if;
  if nullif(p->>'chi_nhanh', '') is not null then w := w || format('k.chi_nhanh_id = %L::uuid', p->>'chi_nhanh'); end if;
  if p->>'nhieu_cn' = '1' then w := w || 'x.co_so_goc like ''%,%'''::text; end if;
  if nullif(p->>'tinh', '') is not null then w := w || format('x.tinh_thanh = %L', p->>'tinh'); end if;
  if nullif(p->>'quan', '') is not null then w := w || format('x.quan_huyen = %L', p->>'quan'); end if;
  if nullif(p->>'den_tu', '') is not null then w := w || format('%s >= %L::date', den, p->>'den_tu'); end if;
  if nullif(p->>'den_den', '') is not null then w := w || format('%s <= %L::date', den, p->>'den_den'); end if;
  if nullif(p->>'tao_tu', '') is not null then w := w || format('%s >= %L::date', ngay_tao, p->>'tao_tu'); end if;
  if nullif(p->>'tao_den', '') is not null then w := w || format('%s <= %L::date', ngay_tao, p->>'tao_den'); end if;
  -- Dịch vụ đã dùng: theo tên dòng dịch vụ trên hoá đơn đã hoàn thành (dữ liệu SalonHero phần lớn chỉ có tên, chưa gắn mã dịch vụ).
  v := left(nullif(trim(p->>'dich_vu'), ''), 120);
  if v is not null then
    w := w || format('k.id in (select h.khach_id from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id where d.loai = ''dich_vu'' and h.trang_thai = ''hoan_thanh'' and d.ten ilike %L)', '%' || v || '%');
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

  -- Bước 1 chỉ lọc + sắp xếp + cắt trang lấy id (không dựng jsonb cho cả 13 nghìn dòng); bước 2 dựng dòng đầy đủ cho đúng trang đó.
  return query execute format($q$
    with trang as (
      select k.id, count(*) over ()::bigint as tong, row_number() over (order by %2$s, k.id) as rn
        from public.v_khach_hang k join public.khach_hang x on x.id = k.id
       where %1$s
       order by %2$s, k.id
       offset %3$s limit %4$s)
    select t.tong,
      jsonb_build_object('id', k.id, 'ma', k.ma, 'ho_ten', k.ho_ten, 'dien_thoai', k.dien_thoai, 'zalo', k.zalo, 'email', k.email,
        'gioi_tinh', k.gioi_tinh, 'ngay_sinh', k.ngay_sinh, 'dia_chi', k.dia_chi, 'nguon', k.nguon, 'nguon_chi_tiet', k.nguon_chi_tiet,
        'trang_thai', k.trang_thai, 'hang', k.hang, 'nguoi_phu_trach_id', k.nguoi_phu_trach_id, 'chi_nhanh_id', k.chi_nhanh_id,
        'so_the_dang_dung', k.so_the_dang_dung, 'chi_12_thang', k.chi_12_thang, 'tao_luc', k.tao_luc,
        'tinh_thanh', x.tinh_thanh, 'quan_huyen', x.quan_huyen, 'diem_so_du', x.diem_so_du, 'facebook', x.facebook, 'co_so_goc', x.co_so_goc,
        'nhom', coalesce((select jsonb_agg(jsonb_build_object('ten', n.ten, 'mau', n.mau) order by n.ten)
                            from public.khach_nhom kn join public.nhom_khach n on n.id = kn.nhom_id where kn.khach_id = k.id and n.hoat_dong), '[]'::jsonb))
      from trang t join public.v_khach_hang k on k.id = t.id join public.khach_hang x on x.id = k.id
     order by t.rn$q$, array_to_string(w, ' and '), ord, greatest(coalesce(p_tu, 0), 0), least(greatest(coalesce(p_so, 40), 1), 1000));
end $$;

-- Xem trước (p_ap_dung = false) hoặc áp dụng (true). p_che_do: 'gan' | 'bo'.
-- p_du_kien: số khách đã xem trước; áp dụng mà số thật khác thì HUỶ cả thao tác (dữ liệu đổi giữa lúc xem và lúc bấm áp dụng).
-- Trả {tong: số khách khớp bộ lọc, thay_doi: số khách được thêm vào / bị bỏ khỏi nhóm}. Xem trước: thay_doi = số khách SẼ bị tác động.
create or replace function public.gan_nhom_theo_loc(p jsonb, p_nhom uuid, p_che_do text, p_ap_dung boolean default false, p_du_kien int default null)
returns jsonb language plpgsql as $$
declare
  tu int := 0; n int; tong bigint := 0; ids uuid[] := '{}'; tac_dong int := 0; moi uuid[];
  gioi_han constant int := 20000;
begin
  if p_che_do not in ('gan', 'bo') then raise exception 'Chế độ phải là gan hoặc bo' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.nhom_khach where id = p_nhom and hoat_dong) then raise exception 'Nhóm không tồn tại hoặc đã bị ẩn' using errcode = 'P0001'; end if;
  loop
    select coalesce(array_agg((r.dong->>'id')::uuid), '{}'), coalesce(max(r.tong), 0), count(*)::int into moi, tong, n from public.loc_khach(p, tu, 1000) r;
    ids := ids || moi;
    exit when n < 1000 or tu + 1000 >= gioi_han;
    tu := tu + 1000;
  end loop;
  if tong > gioi_han then raise exception 'Bộ lọc khớp % khách, vượt giới hạn % khách mỗi lần. Thu hẹp bộ lọc rồi làm lại.', tong, gioi_han using errcode = 'P0001'; end if;
  if p_che_do = 'gan' then
    select count(*)::int into tac_dong from unnest(ids) x where not exists (select 1 from public.khach_nhom kn where kn.khach_id = x and kn.nhom_id = p_nhom);
    if p_ap_dung and p_du_kien is not null and p_du_kien <> tac_dong then raise exception 'Số khách thay đổi từ % (đã xem trước) thành %. Xem trước lại rồi áp dụng.', p_du_kien, tac_dong using errcode = 'P0001'; end if;
    if p_ap_dung then
      insert into public.khach_nhom (khach_id, nhom_id) select x, p_nhom from unnest(ids) x on conflict do nothing;
      get diagnostics tac_dong = row_count;
    end if;
  else
    select count(*)::int into tac_dong from public.khach_nhom kn where kn.nhom_id = p_nhom and kn.khach_id = any (ids);
    if p_ap_dung and p_du_kien is not null and p_du_kien <> tac_dong then raise exception 'Số khách thay đổi từ % (đã xem trước) thành %. Xem trước lại rồi áp dụng.', p_du_kien, tac_dong using errcode = 'P0001'; end if;
    if p_ap_dung then
      delete from public.khach_nhom kn where kn.nhom_id = p_nhom and kn.khach_id = any (ids);
      get diagnostics tac_dong = row_count;
    end if;
  end if;
  return jsonb_build_object('tong', tong, 'thay_doi', tac_dong);
end $$;

-- Chỉ máy chủ (service_role) gọi được; anon/authenticated không được chạm vào (cổng kiểm thử nghiep-vu).
revoke all on function public.gan_nhom_theo_loc(jsonb, uuid, text, boolean, int) from public, anon, authenticated;
