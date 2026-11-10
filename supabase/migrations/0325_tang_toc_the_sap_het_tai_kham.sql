-- Tăng tốc "Thẻ sắp hết" và "Nhắc tái khám" (chị Lâm 10/11/2026: bấm dưới 1s). Chỉ đổi KẾ HOẠCH chạy, kết quả y hệt:
-- * ds_the_sap_het: cfg MATERIALIZED → hom_nay()/cau_hinh_so() tính MỘT lần thay vì mỗi dòng thẻ (~340ms → ~100ms).
-- * ds_tai_kham: tinh MATERIALIZED → ngày làm gần nhất (lich_hen) tính một lần/khách thay vì 3 lần;
--   max(bat_dau) rồi mới đổi sang ngày VN (đơn điệu, cùng kết quả) để dùng được chỉ mục lich_hen_khach_idx (~300ms → ~125ms).
-- CREATE OR REPLACE giữ nguyên quyền thực thi đang có.

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
    from x join public.khach_hang k on k.id = x.khach_id
   where x.het_buoi or x.het_han
   order by case when x.het_han then (x.han_dung - x.hn) else 99999 end, x.con, k.ho_ten, x.id
   limit least(greatest(coalesce(p_gioi_han, 500), 1), 2000);
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
      from the x join public.khach_hang k on k.id = x.khach_id
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
