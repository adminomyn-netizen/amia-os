-- 0066 — BỘ LỌC KHÁCH NHƯ SALONHERO + SỐ ĐẦU TRANG + DANH MỤC LỌC (28/10/2026).
-- Chỉ thêm hàm đọc và chỉ mục, không đổi dữ liệu.
-- • loc_khach(p, tu, so): lọc/sắp xếp/phân trang danh sách khách ở MÁY CHỦ CSDL (nhóm, hạng, điểm, giới tính, tuổi, thẻ, nợ,
--   sinh nhật, chi nhánh, tỉnh/quận, lần cuối đến, ngày tạo, dịch vụ đã dùng, nhân viên từng phục vụ, doanh số). Trả tổng số khớp + từng dòng (jsonb).
--   Điều kiện ghép động bằng format(%L) — mọi giá trị người dùng đều được trích dẫn; điều kiện nặng (lần cuối đến, doanh số, nợ…) chỉ chạy khi được chọn.
-- • so_lieu_khach(): 4 số đầu trang (giờ Việt Nam) trong 1 lượt đọc.
-- • tuy_chon_loc_khach(): danh sách tỉnh → quận, tên dịch vụ đã bán (từ dòng hoá đơn SalonHero) cho ô lọc.

create index if not exists dong_nhan_vien_nv_idx on public.dong_nhan_vien (nhan_vien_id, vai);
create index if not exists khach_hang_tao_luc_idx on public.khach_hang (tao_luc desc);
create index if not exists khach_hang_tinh_idx on public.khach_hang (tinh_thanh, quan_huyen) where tinh_thanh is not null;

create function public.loc_khach(p jsonb, p_tu int default 0, p_so int default 40)
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

  return query execute format($q$
    select count(*) over ()::bigint as tong,
      jsonb_build_object('id', k.id, 'ma', k.ma, 'ho_ten', k.ho_ten, 'dien_thoai', k.dien_thoai, 'zalo', k.zalo, 'email', k.email,
        'gioi_tinh', k.gioi_tinh, 'ngay_sinh', k.ngay_sinh, 'dia_chi', k.dia_chi, 'nguon', k.nguon, 'nguon_chi_tiet', k.nguon_chi_tiet,
        'trang_thai', k.trang_thai, 'hang', k.hang, 'nguoi_phu_trach_id', k.nguoi_phu_trach_id, 'chi_nhanh_id', k.chi_nhanh_id,
        'so_the_dang_dung', k.so_the_dang_dung, 'chi_12_thang', k.chi_12_thang, 'tao_luc', k.tao_luc,
        'tinh_thanh', x.tinh_thanh, 'quan_huyen', x.quan_huyen, 'diem_so_du', x.diem_so_du, 'facebook', x.facebook, 'co_so_goc', x.co_so_goc,
        'nhom', coalesce((select jsonb_agg(jsonb_build_object('ten', n.ten, 'mau', n.mau) order by n.ten)
                            from public.khach_nhom kn join public.nhom_khach n on n.id = kn.nhom_id where kn.khach_id = k.id), '[]'::jsonb)) as dong
      from public.v_khach_hang k join public.khach_hang x on x.id = k.id
     where %s
     order by %s, k.id
     offset %s limit %s$q$, array_to_string(w, ' and '), ord, greatest(coalesce(p_tu, 0), 0), least(greatest(coalesce(p_so, 40), 1), 1000));
end $$;

create function public.so_lieu_khach() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'tong', count(*),
    'moi_hom_nay', count(*) filter (where (tao_luc at time zone 'Asia/Ho_Chi_Minh')::date = public.hom_nay()),
    'sinh_nhat_hom_nay', count(*) filter (where to_char(ngay_sinh, 'MM-DD') = to_char(public.hom_nay(), 'MM-DD')),
    'sinh_nhat_thang', count(*) filter (where extract(month from ngay_sinh) = extract(month from public.hom_nay())))
  from public.khach_hang
$$;

create function public.tuy_chon_loc_khach() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'tinh', coalesce((select jsonb_agg(jsonb_build_object('tinh', t.tinh_thanh, 'so', t.so, 'quan', t.quan) order by t.so desc)
       from (select tinh_thanh, sum(so)::int so, jsonb_agg(quan_huyen order by quan_huyen) filter (where quan_huyen is not null) quan
               from (select tinh_thanh, quan_huyen, count(*) so from public.khach_hang where tinh_thanh is not null group by 1, 2) a group by 1) t), '[]'::jsonb),
    'dich_vu', coalesce((select jsonb_agg(ten order by ten) from (select distinct d.ten from public.hoa_don_dong d where d.loai = 'dich_vu') s), '[]'::jsonb))
$$;

revoke all on function public.loc_khach(jsonb, int, int) from public, anon, authenticated;
revoke all on function public.so_lieu_khach() from public, anon, authenticated;
revoke all on function public.tuy_chon_loc_khach() from public, anon, authenticated;
grant execute on function public.loc_khach(jsonb, int, int) to service_role;
grant execute on function public.so_lieu_khach() to service_role;
grant execute on function public.tuy_chon_loc_khach() to service_role;
