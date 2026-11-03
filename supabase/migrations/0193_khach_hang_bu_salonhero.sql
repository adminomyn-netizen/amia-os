-- 0193 — Mảng Khách hàng bù chỗ còn thiếu so với SalonHero (03/11/2026). Chỉ THÊM hàm, không đụng dữ liệu.
-- (1) the_dung_loc: một điều kiện lọc DUY NHẤT cho "Danh sách khách dùng thẻ" (màn hình, các ô tổng, Xuất Excel dùng chung nên số khớp nhau):
--     chi nhánh, loại thẻ, 8 tình trạng, nhóm khách, ngày cấp, ngày hết hạn, ô tìm (tên không dấu / SĐT / mã khách / mã thẻ).
-- (2) tong_khach_dung_the: ba ô tổng theo cùng bộ lọc (thay bản 0190, thêm tham số, có giá trị mặc định cho tham số bỏ được).
-- (3) dem_the_sap_het_han: số thẻ hết hạn trong 7 / 30 ngày tới (dòng báo bấm để lọc).
-- (4) the_gan_nhat: ngày dùng thẻ gần nhất của một nhóm thẻ (cột "Gần nhất").
-- (5) khach_gan_den (+ _tong, _het): khách vừa đến (hoá đơn hoàn thành mới nhất của mỗi khách), lọc chi nhánh, phân trang, tổng, bản lấy hết cho Excel.
-- (6) thong_ke_khach_ngay: số khách theo ngày (khách lẻ / đến lần đầu / khách cũ) và khách mới trong tuần cho màn Thống kê khách.

-- ===== (1) =====
drop function if exists public.the_dung_loc(uuid, text, text, date, uuid, date, date, date, date, text, text, text);
create function public.the_dung_loc(
  p_cn uuid default null, p_loai text default '', p_tt text default '', p_hom date default null,
  p_nhom uuid default null, p_cap_tu date default null, p_cap_den date default null, p_han_tu date default null, p_han_den date default null,
  p_tim text default '', p_tim_kd text default '', p_sdt text default ''
) returns setof public.v_the_khach language plpgsql stable as $$
begin
  -- plpgsql (không để Postgres "inline" hàm vào câu lệnh của PostgREST): nếu inline, ô tìm theo tên thành truy vấn con chạy lại cho TỪNG thẻ và quá giờ (đã đo 8 giây, hết thời gian).
  return query
  select v.*
  from public.v_the_khach v
  where (p_cn is null or v.chi_nhanh_id = p_cn)
    and (coalesce(p_loai, '') = '' or v.loai = p_loai)
    -- Tình trạng: '' = đang dùng (gồm thẻ đang khoá, như trước); tat_ca = mọi thẻ; su_dung = đang dùng + sắp hết;
    -- sap_het / het_han / hoan_thanh / thu_hoi / khoa = đúng tình trạng đó; tuan / thang = thẻ còn hiệu lực hết hạn trong 7 / 30 ngày tới.
    and case coalesce(p_tt, '')
          when 'tat_ca' then true
          when 'su_dung' then v.tinh_trang in ('hoat_dong', 'sap_het')
          when 'sap_het' then v.tinh_trang = 'sap_het'
          when 'het_han' then v.tinh_trang = 'het_han'
          when 'hoan_thanh' then v.tinh_trang = 'hoan_thanh'
          when 'thu_hoi' then v.tinh_trang = 'thu_hoi'
          when 'khoa' then v.tinh_trang = 'khoa'
          when 'tuan' then v.tinh_trang in ('hoat_dong', 'sap_het', 'khoa') and v.han_dung >= coalesce(p_hom, public.hom_nay()) and v.han_dung <= coalesce(p_hom, public.hom_nay()) + 7
          when 'thang' then v.tinh_trang in ('hoat_dong', 'sap_het', 'khoa') and v.han_dung >= coalesce(p_hom, public.hom_nay()) and v.han_dung <= coalesce(p_hom, public.hom_nay()) + 30
          else v.tinh_trang in ('hoat_dong', 'sap_het', 'khoa')
        end
    and (p_cap_tu is null or v.ngay_cap >= p_cap_tu)
    and (p_cap_den is null or v.ngay_cap <= p_cap_den)
    and (p_han_tu is null or v.han_dung >= p_han_tu)
    and (p_han_den is null or v.han_dung <= p_han_den)
    and (p_nhom is null or v.khach_id in (select n.khach_id from public.khach_nhom n where n.nhom_id = p_nhom))
    and (coalesce(p_tim, '') = '' or strpos(lower(v.ma), lower(p_tim)) > 0
         or v.khach_id in (select k.id from public.khach_hang k
                            where strpos(k.ho_ten_khong_dau, coalesce(nullif(p_tim_kd, ''), lower(p_tim))) > 0
                               or strpos(lower(k.ma), lower(p_tim)) > 0
                               or (coalesce(p_sdt, '') <> '' and strpos(k.dien_thoai, p_sdt) > 0)));
end
$$;
revoke all on function public.the_dung_loc(uuid, text, text, date, uuid, date, date, date, date, text, text, text) from public, anon, authenticated;
grant execute on function public.the_dung_loc(uuid, text, text, date, uuid, date, date, date, date, text, text, text) to service_role;

-- ===== (2) =====
drop function if exists public.tong_khach_dung_the(text, text, date, uuid);
drop function if exists public.tong_khach_dung_the(text, text, date, uuid, uuid, date, date, date, date, text, text, text);
create function public.tong_khach_dung_the(
  p_loai text default '', p_tt text default '', p_hom date default null, p_cn uuid default null,
  p_nhom uuid default null, p_cap_tu date default null, p_cap_den date default null, p_han_tu date default null, p_han_den date default null,
  p_tim text default '', p_tim_kd text default '', p_sdt text default ''
) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'so_khach', count(distinct khach_id),
    'tong_tien', coalesce(sum(so_du_tien) filter (where loai = 'tien'), 0),
    -- Thẻ liệu trình 'không giới hạn' (so_buoi_tong = 999999) KHÔNG tính vào giá trị buổi còn lại (nhân 999.996 buổi ra số vô nghĩa).
    'tong_lan', coalesce(sum(coalesce(so_buoi_con, 0) * coalesce(gia_tri_buoi, 0)) filter (where loai <> 'tien' and coalesce(so_buoi_tong, 0) < 999999), 0))
  from public.the_dung_loc(p_cn, p_loai, p_tt, p_hom, p_nhom, p_cap_tu, p_cap_den, p_han_tu, p_han_den, p_tim, p_tim_kd, p_sdt);
$$;
revoke all on function public.tong_khach_dung_the(text, text, date, uuid, uuid, date, date, date, date, text, text, text) from public, anon, authenticated;
grant execute on function public.tong_khach_dung_the(text, text, date, uuid, uuid, date, date, date, date, text, text, text) to service_role;

-- ===== (3) =====
drop function if exists public.dem_the_sap_het_han(uuid, date);
create function public.dem_the_sap_het_han(p_cn uuid default null, p_hom date default null) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'tuan', count(*) filter (where han_dung <= coalesce(p_hom, public.hom_nay()) + 7),
    'thang', count(*))
  from public.v_the_khach
  where tinh_trang in ('hoat_dong', 'sap_het', 'khoa')
    and han_dung >= coalesce(p_hom, public.hom_nay()) and han_dung <= coalesce(p_hom, public.hom_nay()) + 30
    and (p_cn is null or chi_nhanh_id = p_cn);
$$;
revoke all on function public.dem_the_sap_het_han(uuid, date) from public, anon, authenticated;
grant execute on function public.dem_the_sap_het_han(uuid, date) to service_role;

-- ===== (4) =====
drop function if exists public.the_gan_nhat(uuid[]);
create function public.the_gan_nhat(p_ids uuid[]) returns table (the_id uuid, ngay date) language sql stable as $$
  select x.the_id, max(x.d)
  from (
    select b.the_id, b.ngay_lam as d from public.buoi_thuc_hien b where b.the_id = any(p_ids) and b.trang_thai = 'da_lam'
    union all
    select s.the_id, (s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date from public.the_so_cai s where s.the_id = any(p_ids) and s.loai in ('dung_buoi', 'tru_tien')
  ) x
  group by x.the_id;
$$;
revoke all on function public.the_gan_nhat(uuid[]) from public, anon, authenticated;
grant execute on function public.the_gan_nhat(uuid[]) to service_role;

-- ===== (5) =====
-- Khách vừa đến: đi từ hoá đơn mới nhất trở về trước (chỉ mục hoa_don_ngay_tao_idx) và giữ hoá đơn là LẦN CUỐI của khách (không còn hoá đơn nào mới hơn,
-- tra bằng chỉ mục hoa_don_khach_idx) nên dừng sớm sau (trang × 30) khách thay vì sắp xếp cả 80 nghìn hoá đơn (bản đầu quá giờ).
drop function if exists public.khach_gan_den(uuid, int, int);
create function public.khach_gan_den(p_cn uuid default null, p_lim int default 30, p_off int default 0)
returns table (khach_id uuid, ngay date, hd_id uuid, hd_ma text, tien bigint) language sql stable as $$
  select h.khach_id, h.ngay_hd, h.id, coalesce(h.sh_ma, h.ma), h.tong_phai_thu
  from public.hoa_don h
  where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.khach_id is not null and h.ngay_hd <= public.hom_nay()
    and (p_cn is null or h.chi_nhanh_id = p_cn)
    and not exists (select 1 from public.hoa_don h2
                    where h2.khach_id = h.khach_id and h2.trang_thai = 'hoan_thanh' and not h2.la_so_du_dau and h2.ngay_hd <= public.hom_nay()
                      and (p_cn is null or h2.chi_nhanh_id = p_cn)
                      and h2.ngay_hd >= h.ngay_hd and (h2.ngay_hd > h.ngay_hd or (h2.ngay_hd = h.ngay_hd and (h2.tao_luc > h.tao_luc or (h2.tao_luc = h.tao_luc and h2.id > h.id)))))
  order by h.ngay_hd desc, h.tao_luc desc, h.id desc
  limit greatest(p_lim, 1) offset greatest(p_off, 0);
$$;
revoke all on function public.khach_gan_den(uuid, int, int) from public, anon, authenticated;
grant execute on function public.khach_gan_den(uuid, int, int) to service_role;

-- Tổng số khách đã từng có hoá đơn (cho thanh phân trang) và bản lấy hết một lượt (cho Xuất Excel).
drop function if exists public.khach_gan_den_tong(uuid);
create function public.khach_gan_den_tong(p_cn uuid default null) returns bigint language sql stable as $$
  select count(distinct h.khach_id) from public.hoa_don h
  where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.khach_id is not null and h.ngay_hd <= public.hom_nay() and (p_cn is null or h.chi_nhanh_id = p_cn);
$$;
revoke all on function public.khach_gan_den_tong(uuid) from public, anon, authenticated;
grant execute on function public.khach_gan_den_tong(uuid) to service_role;

drop function if exists public.khach_gan_den_het(uuid);
create function public.khach_gan_den_het(p_cn uuid default null)
returns table (khach_id uuid, ngay date, hd_ma text, tien bigint) language sql stable as $$
  select distinct on (h.khach_id) h.khach_id, h.ngay_hd, coalesce(h.sh_ma, h.ma), h.tong_phai_thu
  from public.hoa_don h
  where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.khach_id is not null and h.ngay_hd <= public.hom_nay() and (p_cn is null or h.chi_nhanh_id = p_cn)
  order by h.khach_id, h.ngay_hd desc, h.tao_luc desc, h.id desc;
$$;
revoke all on function public.khach_gan_den_het(uuid) from public, anon, authenticated;
grant execute on function public.khach_gan_den_het(uuid) to service_role;

-- ===== (6) =====
-- Chỉ nhìn hoá đơn của p_so_ngay ngày gần nhất; "đến lần đầu" = khách chưa có hoá đơn hoàn thành nào ở ngày trước đó (tra bằng chỉ mục hoa_don_khach_idx).
drop function if exists public.thong_ke_khach_ngay(int);
create function public.thong_ke_khach_ngay(p_so_ngay int default 30) returns jsonb language sql stable as $$
  with p as (select public.hom_nay() as hom, greatest(least(p_so_ngay, 90), 1) as n),
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
    'moi_tuan', (select count(*) from public.khach_hang k, p where k.tao_luc >= ((p.hom - 6)::timestamp at time zone 'Asia/Ho_Chi_Minh')));
$$;
revoke all on function public.thong_ke_khach_ngay(int) from public, anon, authenticated;
grant execute on function public.thong_ke_khach_ngay(int) to service_role;

create index if not exists khach_hang_tao_luc_idx on public.khach_hang (tao_luc);

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
