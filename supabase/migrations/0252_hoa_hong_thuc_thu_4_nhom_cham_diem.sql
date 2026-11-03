-- 0252 — Báo cáo Hoa hồng thực thu y SalonHero (đợt 3, 03/11/2026): tách 4 nhóm (tư vấn / d.vụ / s.phẩm / bán thẻ) × (thực thu, hoa hồng)
-- và cột "Chấm điểm d.vụ" (ở cả Bảng hoa hồng nhân viên).
-- • bc_hoa_hong_thuc_thu_nhom: CÙNG công thức bc_hoa_hong_thuc_thu (giữ nguyên hàm cũ), thêm cột nhom theo đúng cách chia nhóm của
--   bc_hoa_hong_nv_nhom (Bảng hoa hồng): tư vấn = vai tu_van; d.vụ = phục vụ dòng dịch vụ; s.phẩm = bán dòng sản phẩm; bán thẻ = bán dòng gói thẻ; còn lại = khac.
-- • bc_cham_diem_nv: điểm khách chấm nhân viên (danh_gia_nhan_vien, 1–5 sao) theo ngày hoá đơn: số lượt + điểm trung bình.

create or replace function public.bc_hoa_hong_thuc_thu_nhom(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, vai text, nhom text, chi_nhanh_id uuid, nguon text, so_hd integer, doanh_so_tien bigint, hoa_hong_tien bigint, doanh_so_the bigint, hoa_hong_the bigint)
language sql stable set search_path = public, pg_temp as $$
  with tt as (
    select t.hoa_don_id,
           sum(case when t.phuong_thuc <> 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as tien,
           sum(case when t.phuong_thuc = 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as the
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn)
     group by t.hoa_don_id),
  l as (
    select c.nhan_vien_id, c.vai, v.loai, h.chi_nhanh_id, case when h.ngay_hd < p_tu then 'cu' else 'moi' end as nguon, h.id as hd,
           v.doanh_so * c.ti_le / 100 * tt.tien / h.tong_phai_thu as ds_tien,
           tt.tien / h.tong_phai_thu * public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le) as hh_tien,
           v.doanh_so * c.ti_le / 100 * tt.the / h.tong_phai_thu as ds_the,
           tt.the / h.tong_phai_thu * public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le) as hh_the
      from tt join public.hoa_don h on h.id = tt.hoa_don_id
      join public.v_doanh_so_dong v on v.hoa_don_id = h.id
      join public.dong_nhan_vien c on c.dong_id = v.dong_id
     where not public.hh_la_dong_the(v.dong_id)
    union all
    select c.nhan_vien_id, c.vai, v.loai, v.chi_nhanh_id, 'moi', v.hoa_don_id, 0, 0, 0, public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le)
      from public.v_doanh_so_dong v join public.dong_nhan_vien c on c.dong_id = v.dong_id join public.hoa_don h on h.id = v.hoa_don_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn) and not h.la_so_du_dau and public.hh_la_dong_the(v.dong_id)
       and public.hh_nguoi(v.dong_id, c.vai, c.nhan_vien_id, c.ti_le) <> 0)
  select l.nhan_vien_id, l.vai,
         case when l.vai = 'tu_van' then 'tu_van'
              when l.vai = 'phuc_vu' and l.loai = 'dich_vu' then 'dich_vu'
              when l.vai = 'ban' and l.loai = 'san_pham' then 'san_pham'
              when l.vai = 'ban' and l.loai = 'goi_the' then 'ban_the'
              else 'khac' end,
         l.chi_nhanh_id, l.nguon, count(distinct l.hd)::int,
         round(sum(l.ds_tien))::bigint, round(sum(l.hh_tien))::bigint, round(sum(l.ds_the))::bigint, round(sum(l.hh_the))::bigint
    from l group by 1, 2, 3, 4, 5
$$;

create or replace function public.bc_cham_diem_nv(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, so_luot integer, diem_tb numeric)
language sql stable set search_path = public, pg_temp as $$
  select d.nhan_vien_id, count(*)::int, round(avg(d.diem), 1)
    from public.danh_gia_nhan_vien d join public.hoa_don h on h.id = d.hoa_don_id
   where h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by 1
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
