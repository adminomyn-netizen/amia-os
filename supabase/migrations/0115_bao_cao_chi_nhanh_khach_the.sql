-- 0115 — BÁO CÁO "THEO CHI NHÁNH", "THEO KHÁCH HÀNG", "LỊCH SỬ DÙNG THẺ" y hệt SalonHero (đối chiếu 29/10/2026, G1).
-- Chỉ thêm 3 hàm đọc (không bảng, không dữ liệu). Doanh thu lấy qua v_hd_doanh_thu như mọi báo cáo khác (không đổi cách tính).
--
-- 1) bc_theo_chi_nhanh: mỗi chi nhánh một dòng.
--    Đã thu = tiền mặt + chuyển khoản + quẹt thẻ thu trong kỳ (kể cả thu nợ); Còn nợ = tổng còn nợ của đơn trong kỳ;
--    Doanh thu = doanh thu đơn trong kỳ sau trừ thẻ tiền; "bán hàng" = thu cùng ngày với đơn, "thu nợ" = thu sau ngày đơn.
--    SalonHero 01–29/10/2026, Vinh: 579 đơn · đã thu 1.233.594.000 · còn nợ 41.500.000 · doanh thu 1.252.094.000.
-- 2) bc_theo_khach_hang: mỗi khách có đơn trong kỳ một dòng + số tổng cả kỳ (cùng một lượt gọi, có phân trang).
--    Hạng = khach_hang.hang_goc (hạng SalonHero đã chuyển sang, khớp 285/285 khách Vinh 10/2026).
--    Khách mới = chưa có hoá đơn hoàn thành nào trước kỳ.
-- 3) bc_lich_su_dung_the: mỗi lần dùng thẻ một dòng. Thẻ lần: dòng hoá đơn gắn thẻ (chuyển từ SalonHero) + buổi trừ thẻ làm trong app;
--    thẻ tiền: khoản trả bằng thẻ tiền. Tiền tương đương = số lần × làm tròn(giá bán thẻ ÷ số buổi) (thẻ lần) hoặc số tiền trừ (thẻ tiền) — công thức của SalonHero.

create function public.bc_theo_chi_nhanh(p_tu date, p_den date)
returns table (chi_nhanh_id uuid, ten text, so_nhan_vien int, so_don int, da_thu bigint, con_no bigint, doanh_thu bigint, tm_ban bigint, tm_no bigint, ck_ban bigint, ck_no bigint)
language sql stable as $$
  with don as (
    select h.chi_nhanh_id as cn, count(*)::int as so_don, sum(v.tong_don - v.tru_the)::bigint as dt, sum(h.con_no)::bigint as no
      from public.v_hd_doanh_thu v join public.hoa_don h on h.id = v.hoa_don_id
     where v.ngay_hd between p_tu and p_den group by h.chi_nhanh_id),
  tt as (
    select h.chi_nhanh_id as cn,
           sum(s.v) filter (where h.ngay_hd = t.ngay or h.ngay_hd < t.ngay)::bigint as da_thu,
           sum(s.v) filter (where t.phuong_thuc = 'tien_mat' and h.ngay_hd = t.ngay)::bigint as tm_ban,
           sum(s.v) filter (where t.phuong_thuc = 'tien_mat' and h.ngay_hd < t.ngay)::bigint as tm_no,
           sum(s.v) filter (where t.phuong_thuc in ('chuyen_khoan', 'quet_the') and h.ngay_hd = t.ngay)::bigint as ck_ban,
           sum(s.v) filter (where t.phuong_thuc in ('chuyen_khoan', 'quet_the') and h.ngay_hd < t.ngay)::bigint as ck_no
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
      cross join lateral (select case t.loai when 'thu' then t.so_tien else -t.so_tien end as v) s
     where t.ngay between p_tu and p_den and t.phuong_thuc <> 'the_tien' group by h.chi_nhanh_id)
  select c.id, c.ten, (select count(*) from public.nhan_vien n where n.chi_nhanh_id = c.id and n.trang_thai_lam = 'dang_lam')::int,
         coalesce(don.so_don, 0), coalesce(tt.da_thu, 0), coalesce(don.no, 0), coalesce(don.dt, 0),
         coalesce(tt.tm_ban, 0), coalesce(tt.tm_no, 0), coalesce(tt.ck_ban, 0), coalesce(tt.ck_no, 0)
    from public.chi_nhanh c left join don on don.cn = c.id left join tt on tt.cn = c.id
   order by coalesce(tt.da_thu, 0) desc, c.ten
$$;

create function public.bc_theo_khach_hang(
  p_tu date, p_den date, p_cn uuid default null, p_nhom uuid[] default null, p_hang text default null, p_tim text default null, p_so int default 30, p_tu_dong int default 0)
returns table (
  khach_id uuid, ma text, ho_ten text, dien_thoai text, hang text, la_moi boolean, so_don int, doanh_thu bigint, thuc_thu bigint, thu_no bigint, no_moi bigint,
  tong_dong bigint, t_khach bigint, t_doanh_thu bigint, t_thuc_thu bigint, t_thu_no bigint, t_khach_moi bigint, t_dt_moi bigint, t_thu_moi bigint, t_khach_cu bigint, t_dt_cu bigint, t_thu_cu bigint)
language sql stable as $$
  with hd as (
    select h.id, h.khach_id, h.ngay_hd, v.tong_don - v.tru_the as dt, h.con_no
      from public.v_hd_doanh_thu v join public.hoa_don h on h.id = v.hoa_don_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)),
  thu as (
    select hd.khach_id, sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) as tn
      from public.thanh_toan t join hd on hd.id = t.hoa_don_id
     where t.phuong_thuc <> 'the_tien' and t.ngay > hd.ngay_hd and t.ngay <= p_den group by hd.khach_id),
  g as (select hd.khach_id, count(*)::int as so_don, sum(hd.dt)::bigint as doanh_thu, sum(hd.con_no)::bigint as no_moi from hd group by hd.khach_id),
  c as (
    select g.khach_id, k.ma, coalesce(k.ho_ten, 'Khách lẻ (đơn không ghi khách)') as ho_ten, k.dien_thoai, coalesce(k.hang_goc, 'Thường') as hang,
           (g.khach_id is not null and not exists (select 1 from public.hoa_don x where x.khach_id = g.khach_id and x.trang_thai = 'hoan_thanh' and not x.la_so_du_dau and x.ngay_hd < p_tu)) as la_moi,
           g.so_don, g.doanh_thu, (g.doanh_thu - g.no_moi)::bigint as thuc_thu, coalesce(thu.tn, 0)::bigint as thu_no, g.no_moi, k.ho_ten_khong_dau
      from g left join thu on thu.khach_id is not distinct from g.khach_id left join public.khach_hang k on k.id = g.khach_id
     where (p_hang is null or coalesce(k.hang_goc, 'Thường') = p_hang)
       and (p_nhom is null or exists (select 1 from public.khach_nhom n where n.khach_id = g.khach_id and n.nhom_id = any (p_nhom)))),
  s as (
    select c.*, count(*) over () as t_khach, sum(c.doanh_thu) over () as t_doanh_thu, sum(c.thuc_thu) over () as t_thuc_thu, sum(c.thu_no) over () as t_thu_no,
           count(*) filter (where c.la_moi) over () as t_khach_moi, coalesce(sum(c.doanh_thu) filter (where c.la_moi) over (), 0) as t_dt_moi, coalesce(sum(c.thuc_thu) filter (where c.la_moi) over (), 0) as t_thu_moi,
           count(*) filter (where not c.la_moi) over () as t_khach_cu, coalesce(sum(c.doanh_thu) filter (where not c.la_moi) over (), 0) as t_dt_cu, coalesce(sum(c.thuc_thu) filter (where not c.la_moi) over (), 0) as t_thu_cu
      from c),
  l as (
    select s.*, count(*) over () as tong_dong
      from s
     where nullif(btrim(p_tim), '') is null
        or (select bool_and(s.ho_ten_khong_dau like '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%')
              from unnest(regexp_split_to_array(public.bo_dau(btrim(p_tim)), '\s+')) w where w <> '')
        or (s.dien_thoai like '%' || regexp_replace(p_tim, '\D', '', 'g') || '%' and length(regexp_replace(p_tim, '\D', '', 'g')) >= 3)
        or s.ma ilike '%' || btrim(p_tim) || '%')
  select l.khach_id, l.ma, l.ho_ten, l.dien_thoai, l.hang, l.la_moi, l.so_don, l.doanh_thu, l.thuc_thu, l.thu_no, l.no_moi,
         l.tong_dong, l.t_khach, l.t_doanh_thu::bigint, l.t_thuc_thu::bigint, l.t_thu_no::bigint, l.t_khach_moi, l.t_dt_moi::bigint, l.t_thu_moi::bigint, l.t_khach_cu, l.t_dt_cu::bigint, l.t_thu_cu::bigint
    from l order by l.doanh_thu desc, l.khach_id
   limit least(coalesce(p_so, 30), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

create function public.bc_lich_su_dung_the(
  p_tu date, p_den date, p_cn uuid default null, p_tim text default null, p_ten_the text default null, p_loai text default null, p_so int default 30, p_tu_dong int default 0)
returns table (
  hoa_don_id uuid, ma_hd text, ngay timestamptz, khach_id uuid, khach text, dien_thoai text, chi_nhanh text, ten_the text, ma_the text, loai_the text, so_lan int, tien bigint,
  tong_dong bigint, tong_lan bigint, tong_tien bigint)
language sql stable as $$
  with a as (
    -- thẻ lần: dòng hoá đơn gắn thẻ (SalonHero chuyển sang), gộp theo (hoá đơn, thẻ) như SalonHero
    select h.id as hd, coalesce(h.sh_ma, h.ma) as ma_hd, h.tao_luc as ngay, h.khach_id, h.chi_nhanh_id as cn, 'lan'::text as loai,
           coalesce(g.ten, min(d.ten)) as ten_the, t.ma as ma_the, sum(d.so_luong)::int as so_lan,
           (sum(d.so_luong) * case when coalesce(t.so_buoi_tong, 0) > 0 then round(t.tong_tien::numeric / t.so_buoi_tong) else 0 end)::bigint as tien
      from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
      left join public.the_khach t on t.sh_id = d.the_khach_sh_id left join public.goi_the g on g.id = t.goi_id
     where d.the_khach_sh_id is not null and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
     group by h.id, d.the_khach_sh_id, g.ten, t.ma, t.so_buoi_tong, t.tong_tien
    union all
    -- thẻ lần: buổi trừ thẻ làm trong app
    select null, null, b.tao_luc, b.khach_id, b.chi_nhanh_id, 'lan', coalesce(g.ten, dv.ten), t.ma, 1,
           (case when coalesce(t.so_buoi_tong, 0) > 0 then round(t.tong_tien::numeric / t.so_buoi_tong) else 0 end)::bigint
      from public.buoi_thuc_hien b left join public.the_khach t on t.id = b.the_id left join public.goi_the g on g.id = t.goi_id left join public.dich_vu dv on dv.id = b.dich_vu_id
     where b.trang_thai = 'da_lam' and b.the_id is not null and b.ngay_lam between p_tu and p_den and (p_cn is null or b.chi_nhanh_id = p_cn)
    union all
    -- thẻ tiền: khoản trả bằng thẻ tiền (hoá đơn chuyển từ SalonHero chưa ghi thẻ nào → nếu khách chỉ có đúng một thẻ tiền thì lấy thẻ đó)
    select h.id, coalesce(h.sh_ma, h.ma), h.tao_luc, h.khach_id, h.chi_nhanh_id, 'tien', coalesce(g.ten, 'Thẻ tiền'), t.ma, 1, t2.so_tien
      from public.thanh_toan t2 join public.hoa_don h on h.id = t2.hoa_don_id
      left join lateral (select x.ma, x.goi_id from public.the_khach x
                          where x.id = t2.the_id or (t2.the_id is null and x.khach_id = h.khach_id and x.loai = 'tien'
                                                     and (select count(*) from public.the_khach y where y.khach_id = h.khach_id and y.loai = 'tien') = 1) limit 1) t on true
      left join public.goi_the g on g.id = t.goi_id
     where t2.phuong_thuc = 'the_tien' and t2.loai = 'thu' and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)),
  l as (
    select a.*, k.ho_ten, k.dien_thoai, c.ten as cn_ten, k.ho_ten_khong_dau
      from a left join public.khach_hang k on k.id = a.khach_id left join public.chi_nhanh c on c.id = a.cn
     where (p_loai is null or p_loai = '' or a.loai = p_loai)
       and (nullif(btrim(p_ten_the), '') is null or a.ten_the ilike '%' || btrim(p_ten_the) || '%' or a.ma_the ilike '%' || btrim(p_ten_the) || '%')
       and (nullif(btrim(p_tim), '') is null
            or (select bool_and(k.ho_ten_khong_dau like '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%')
                  from unnest(regexp_split_to_array(public.bo_dau(btrim(p_tim)), '\s+')) w where w <> '')
            or (k.dien_thoai like '%' || regexp_replace(p_tim, '\D', '', 'g') || '%' and length(regexp_replace(p_tim, '\D', '', 'g')) >= 3))),
  s as (select l.*, count(*) over () as tong_dong, sum(l.so_lan) over () as tong_lan, sum(l.tien) over () as tong_tien from l)
  select s.hd, s.ma_hd, s.ngay, s.khach_id, s.ho_ten, s.dien_thoai, s.cn_ten, s.ten_the, s.ma_the, s.loai, s.so_lan, s.tien, s.tong_dong, s.tong_lan::bigint, s.tong_tien::bigint
    from s order by s.ngay desc, s.ma_hd desc nulls last, s.ma_the
   limit least(coalesce(p_so, 30), 50000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

select public.khoa_tat_ca_bang();
