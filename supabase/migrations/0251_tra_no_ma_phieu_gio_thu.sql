-- 0251 — Báo cáo khách nợ › Các lần trả nợ y SalonHero (đợt 3, 03/11/2026): thêm Mã phiếu thu + Giờ thu.
-- • Mã phiếu thu = số tự tăng thanh_toan.so_phieu (0200), in "PT" + 6 số — AMIA tự sinh cho MỌI lần thu (cả dòng nhập từ SalonHero,
--   vì getCashBook của SalonHero không có mã cho tiền khách trả: dòng "order_…" không có trường code).
-- • Giờ thu: dòng thu trong app → tao_luc. Dòng nhập từ SalonHero → tao_luc là lúc nhập (sai giờ), nên tra bảng sh_gio_thanh_toan
--   (createdAt các dòng order_… của getCashBook, nạp bằng scripts/chuyen-salonhero/gio-thanh-toan-sh.mjs) theo (mã HĐ SalonHero, ngày, số tiền, tiền mặt/ngân hàng).
--   Không có trong bảng tra → để trống (không bịa giờ).
-- Không đụng bảng đồng bộ đêm ghi (chỉ tạo bảng tra mới + đổi hàm báo cáo).

create table if not exists public.sh_gio_thanh_toan (
  ma_hd text not null,
  ngay date not null,
  so_tien bigint not null,
  quy text not null check (quy in ('tien_mat', 'ngan_hang')),
  thu_luc timestamptz not null,
  primary key (ma_hd, ngay, so_tien, quy, thu_luc)
);

drop function if exists public.bc_cac_lan_tra_no(date, date, uuid, text, integer, integer);
create function public.bc_cac_lan_tra_no(p_tu date, p_den date, p_cn uuid default null, p_tim text default null, p_so integer default 30, p_tu_dong integer default 0)
returns table (thanh_toan_id uuid, ngay date, hoa_don_id uuid, ma_hd text, khach_id uuid, khach text, dien_thoai text, chi_nhanh text, tong_hd bigint, so_tien bigint,
               phuong_thuc text, nguoi_thu text, tong_dong bigint, tong_tien bigint, so_phieu bigint, thu_luc timestamptz)
language sql stable set search_path = public, pg_temp as $$
  with l as (
    select t.id as tt, t.ngay, h.id as hd, coalesce(h.sh_ma, h.ma) as ma_hd, h.khach_id, k.ho_ten, k.dien_thoai, k.ho_ten_khong_dau, c.ten as cn, h.tong_phai_thu as tong_hd,
           (case t.loai when 'thu' then t.so_tien else -t.so_tien end) as so_tien, t.phuong_thuc,
           coalesce(nullif(btrim(substring(t.ghi_chu from 'SalonHero PAYMENT(?:_DEBT)? · (.*)$')), ''), n.ho_ten) as nguoi_thu,
           t.so_phieu, h.sh_ma, t.so_tien as tien_goc, t.tao_luc, (t.nhap_dot like 'SH-%') as tu_sh
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
      left join public.khach_hang k on k.id = h.khach_id left join public.chi_nhanh c on c.id = h.chi_nhanh_id left join public.nhan_vien n on n.id = t.nguoi_id
     where t.ngay between p_tu and p_den and t.ngay > h.ngay_hd and t.phuong_thuc <> 'the_tien' and h.trang_thai = 'hoan_thanh' and (p_cn is null or h.chi_nhanh_id = p_cn)
       and (nullif(btrim(p_tim), '') is null or h.ma ilike '%' || btrim(p_tim) || '%' or h.sh_ma ilike '%' || btrim(p_tim) || '%'
            or ('PT' || lpad(t.so_phieu::text, 6, '0')) ilike '%' || btrim(p_tim) || '%'
            or (select bool_and(k.ho_ten_khong_dau like '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%') from unnest(regexp_split_to_array(public.bo_dau(btrim(p_tim)), '\s+')) w where w <> '')
            or (k.dien_thoai like '%' || regexp_replace(p_tim, '\D', '', 'g') || '%' and length(regexp_replace(p_tim, '\D', '', 'g')) >= 3))),
  s as (select l.*, count(*) over () as tong_dong, sum(l.so_tien) over () as tong_tien from l),
  p as (select s.* from s order by s.ngay desc, s.ma_hd desc, s.tt limit least(coalesce(p_so, 30), 20000) offset greatest(coalesce(p_tu_dong, 0), 0))
  select p.tt, p.ngay, p.hd, p.ma_hd, p.khach_id, p.ho_ten, p.dien_thoai, p.cn, p.tong_hd::bigint, p.so_tien::bigint, p.phuong_thuc, p.nguoi_thu, p.tong_dong, p.tong_tien::bigint,
         p.so_phieu,
         case when not coalesce(p.tu_sh, false) then p.tao_luc
              else (select min(g.thu_luc) from public.sh_gio_thanh_toan g where g.ma_hd = p.sh_ma and g.ngay = p.ngay and g.so_tien = p.tien_goc
                       and g.quy = case p.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end) end
    from p order by p.ngay desc, p.ma_hd desc, p.tt
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
