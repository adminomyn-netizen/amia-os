-- Báo cáo xuất kho (bc_kho_xuat, 0121): thêm loại sổ kho 'xuat_noi_bo' (0256, "Xuất sang kho nội bộ") vào phân loại "noi_bo" — nhãn SalonHero đã có sẵn trong ô Phân loại.
-- Mã phiếu của dòng này là NB… như màn Phiếu xuất. Chỉ đổi thân hàm, không đổi chữ ký.
CREATE OR REPLACE FUNCTION public.bc_kho_xuat(p_tu date, p_den date, p_cn uuid DEFAULT NULL::uuid, p_loai text DEFAULT NULL::text, p_tim text DEFAULT NULL::text, p_tong boolean DEFAULT false, p_so integer DEFAULT 10, p_tu_dong integer DEFAULT 0)
 RETURNS TABLE(khoa text, san_pham_id uuid, ma text, ten text, nhom text, lo text, han date, ma_phieu text, thoi_gian timestamp with time zone, nguoi_nhan text, phan_loai text, gia_von numeric, gia_tb numeric, so_luong numeric, tong_dong bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with l as (
    select s.id as sid, s.san_pham_id, p.ma, btrim(p.ten) as ten, p.nhom, s.so_lo, s.han_dung, s.tao_luc,
           coalesce(pc.ma, substring(s.ghi_chu from '^Xuất sang kho nội bộ (NB\d+)'), 'PX' || lpad(s.id::text, 6, '0')) as ma_phieu, nv.ho_ten as nguoi_nhan,
           case s.loai when 'cap_ca' then 'tieu_hao' when 'tra_ca' then 'tieu_hao' when 'hao_hut' then 'huy' when 'tra_ncc' then 'tra_ncc' when 'kiem_ke' then 'can_bang' when 'dieu_chinh' then 'can_bang' when 'xuat_noi_bo' then 'noi_bo' else 'khac' end as loai_ma,
           coalesce(s.don_gia, p.gia_nhap_don_vi, 0) as gia_tb, -s.so_luong as so_luong
      from public.kho_so_cai s join public.san_pham p on p.id = s.san_pham_id
      left join public.phieu_cap pc on pc.id = s.phieu_cap_id left join public.nhan_vien nv on nv.id = pc.nhan_boi
     where s.loai in ('cap_ca', 'tra_ca', 'hao_hut', 'tra_ncc', 'xuat_khan', 'kiem_ke', 'dieu_chinh', 'xuat_noi_bo') and (s.loai in ('cap_ca', 'tra_ca', 'hao_hut', 'tra_ncc', 'xuat_khan', 'xuat_noi_bo') or s.so_luong < 0)
       and ((s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date) between p_tu and p_den and (p_cn is null or s.chi_nhanh_id = p_cn)
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(p.ten) ilike '%' || public.bo_dau(btrim(p_tim)) || '%')
  ), f as (select * from l where coalesce(p_loai, '') = '' or l.loai_ma = p_loai),
  r as (
    select f.sid::text as khoa, f.san_pham_id, f.ma, f.ten, f.nhom, f.so_lo as lo, f.han_dung as han, f.ma_phieu, f.tao_luc as thoi_gian, f.nguoi_nhan, f.loai_ma as phan_loai, round(f.gia_tb * f.so_luong) as gia_von, f.gia_tb, f.so_luong
      from f where not p_tong
    union all
    select f.san_pham_id::text, f.san_pham_id, min(f.ma), f.ten, min(f.nhom), null, null, null, null, null, null, null, null, sum(f.so_luong)
      from f where p_tong group by f.san_pham_id, f.ten
  ), t as (select r.*, count(*) over () as tong_dong from r)
  select t.khoa, t.san_pham_id, t.ma, t.ten, t.nhom, t.lo, t.han, t.ma_phieu, t.thoi_gian, t.nguoi_nhan, t.phan_loai, t.gia_von, t.gia_tb, t.so_luong, t.tong_dong
    from t order by t.thoi_gian desc nulls last, t.ten, t.khoa limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$function$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
