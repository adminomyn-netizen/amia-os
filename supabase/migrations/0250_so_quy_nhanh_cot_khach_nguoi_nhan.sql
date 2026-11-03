-- 0250 — Sổ quỹ y SalonHero (đợt 3, 03/11/2026): tải nhanh + cột Khách hàng, Người nhận tiền.
-- 1) so_quy_tong chậm: hàm SQL có SET search_path nên không được "nhúng", Postgres lập kế hoạch CHUNG (không biết p_quy) qua view v_so_quy
--    → đo 03/11: kế hoạch chung 3,1 giây, có lần 6,6 giây qua PostgREST (sát ngưỡng statement_timeout 8s của authenticator → trang báo
--    "hệ thống đang chậm"). Viết lại thẳng trên so_quy + thanh_toan⋈hoa_don (kế hoạch chung đo được 85 ms). Số liệu y hệt (cùng điều kiện lọc).
-- 2) Cột mới CHỈ THÊM, nullable (script đồng bộ đêm so-quy-sh.mjs ghi so_quy qua so_quy_nhap_sh và đọc v_so_quy cột id/quy_id/bien_dong/nguon/sh_id — giữ nguyên):
--    so_quy.nguoi_nhan = "Người nhận tiền" của SalonHero (receiver_name). View thêm cuối: khach_id, khach_ten, nguoi_nhan.
--    Dòng bán hàng: Người thu/chi lấy tên thu ngân SalonHero trong ghi_chu ("SalonHero PAYMENT · tên"); dòng nhập từ SalonHero không có tên → '' (không hiện nhầm tài khoản hệ thống).

alter table public.so_quy add column if not exists nguoi_nhan text;

-- 9 phiếu tay SalonHero có "Người nhận tiền" (receiver_name) trong lịch sử, sổ chỉ-thêm nên không UPDATE: bảng tra theo sh_id.
create table if not exists public.so_quy_nguoi_nhan_sh (sh_id bigint primary key, ten text not null);
insert into public.so_quy_nguoi_nhan_sh (sh_id, ten) values
  (296533, 'Anh Văn'),
  (296534, 'Tú Viên'),
  (382282, 'PHong Tài'),
  (384161, 'đinh thị minh'),
  (504700, 'c Hằng'),
  (504769, 'C Hằng'),
  (610853, 'Lê Thị Thùy Trang'),
  (736732, 'Nguyễn Thị Thanh Hoài'),
  (835858, 'Mai Thọ Ngọc')
on conflict (sh_id) do nothing;

create or replace view public.v_so_quy with (security_invoker = true) as
  select s.id::text as id, s.ma, s.ngay, s.quy_id, q.chi_nhanh_id, q.loai as loai_quy, s.loai, s.so_tien,
         case when s.loai in ('thu', 'nap') then s.so_tien else -s.so_tien end as bien_dong,
         lt.ten as loai_thu_chi, s.noi_dung, s.doi_tuong, s.nguon, s.nguoi_id, s.tao_luc, s.phieu_goc_id,
         exists (select 1 from public.so_quy d where d.phieu_goc_id = s.id) as da_dao, true as sua_duoc,
         s.sh_id, s.sh_nguoi_tao as nguoi_ten,
         null::uuid as khach_id, null::text as khach_ten,
         coalesce(nullif(btrim(s.nguoi_nhan), ''), nn.ten, case when s.sh_id is null and s.loai in ('chi', 'rut') then nullif(btrim(s.doi_tuong), '') end) as nguoi_nhan
    from public.so_quy s
    join public.quy q on q.id = s.quy_id
    left join public.loai_thu_chi lt on lt.id = s.loai_thu_chi_id
    left join public.so_quy_nguoi_nhan_sh nn on nn.sh_id = s.sh_id
  union all
  select t.id::text, h.ma, t.ngay, q.id, h.chi_nhanh_id, q.loai,
         case t.loai when 'thu' then 'thu' else 'chi' end, t.so_tien,
         case t.loai when 'thu' then t.so_tien else -t.so_tien end,
         case t.loai when 'thu' then 'Bán hàng' else 'Hoàn tiền khách' end,
         case t.loai when 'thu' then 'Thu tiền hoá đơn ' else 'Hoàn tiền hoá đơn ' end || h.ma, null, 'ban_hang', t.nguoi_id, t.tao_luc, null, false, false,
         null::bigint,
         coalesce(nullif(btrim(substring(t.ghi_chu from 'SalonHero PAYMENT(?:_DEBT)? · (.*)$')), ''), case when t.nhap_dot like 'SH-%' then '' end),
         h.khach_id, k.ho_ten, null::text
    from public.thanh_toan t
    join public.hoa_don h on h.id = t.hoa_don_id
    join public.quy q on q.chi_nhanh_id = h.chi_nhanh_id
     and q.loai = case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end
    left join public.khach_hang k on k.id = h.khach_id
   where t.phuong_thuc not in ('the_tien', 'ship_cod');

-- Tổng sổ quỹ: cùng điều kiện như v_so_quy nhưng đọc thẳng bảng gốc (nhanh cả khi Postgres lập kế hoạch chung).
create or replace function public.so_quy_tong(p_quy uuid[], p_tu date, p_den date)
returns table (dau bigint, thu bigint, chi bigint, nap bigint, rut bigint, hien_tai bigint)
language sql stable set search_path = public, pg_temp as $$
  with q as (select id, chi_nhanh_id, loai from public.quy where id = any (p_quy)),
  d as (
    select s.ngay, s.loai, s.so_tien, (s.nguon = 'dao_phieu' or exists (select 1 from public.so_quy g where g.phieu_goc_id = s.id)) as bo
      from public.so_quy s where s.quy_id = any (p_quy)
    union all
    select t.ngay, case t.loai when 'thu' then 'thu' else 'chi' end, t.so_tien, false
      from public.thanh_toan t
      join public.hoa_don h on h.id = t.hoa_don_id
      join q on q.chi_nhanh_id = h.chi_nhanh_id and q.loai = case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end
     where t.phuong_thuc <> all (array['the_tien', 'ship_cod'])
  ),
  g as (select coalesce(sum(so_du_dau), 0)::bigint as v from public.quy where id = any (p_quy))
  select (g.v + coalesce(sum(case when d.loai in ('thu', 'nap') then d.so_tien else -d.so_tien end) filter (where d.ngay < p_tu), 0))::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'thu' and not d.bo), 0)::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'chi' and not d.bo), 0)::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'nap' and not d.bo), 0)::bigint,
         coalesce(sum(d.so_tien) filter (where d.ngay between p_tu and p_den and d.loai = 'rut' and not d.bo), 0)::bigint,
         (g.v + coalesce(sum(case when d.loai in ('thu', 'nap') then d.so_tien else -d.so_tien end), 0))::bigint
    from g left join d on true
   group by g.v
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
