-- 0195 — Báo cáo ngày / hoa hồng bù chỗ còn thiếu so với SalonHero (03/11/2026). Chỉ THÊM hàm đọc, không đổi bảng, không đổi hàm có sẵn.
--  1) bc_khach_cua_muc: nút "Xem danh sách khách" ở mỗi dòng báo cáo Theo sản phẩm / dịch vụ. Cùng cách nhóm với bc_san_pham_dich_vu (0118): (loại, tên bỏ khoảng trắng đầu cuối).
--  2) bc_hoa_hong_nv_nhom: hoa hồng từng nhân viên tách 4 nhóm như SalonHero (tư vấn / dịch vụ / sản phẩm / bán thẻ) + nhóm "khac" cho tổ hợp vai × loại còn lại (vd vai giới thiệu).
--     Cùng công thức hoa hồng với bc_nhan_vien (0087): doanh số × tỉ lệ chia người; hoa hồng = tỉ lệ chia người × hh_tinh(...).
--  3) bc_hoa_hong_nv_chi_tiet: nút "Chi tiết" của một nhân viên: từng dòng hoá đơn đã tạo ra hoa hồng.

create or replace function public.bc_khach_cua_muc(p_loai text, p_ten text, p_tu date, p_den date, p_cn uuid default null, p_gioi_han int default 300)
returns table (khach_id uuid, ho_ten text, dien_thoai text, hoa_don_id uuid, ma_hd text, ngay_hd date, so_luong bigint, thanh_tien bigint, tong_dong bigint)
language sql stable as $$
  with l as (
    select h.khach_id, k.ho_ten, k.dien_thoai, h.id as hoa_don_id, coalesce(h.sh_ma, h.ma) as ma_hd, h.ngay_hd, d.so_luong::bigint as so_luong, round(v.doanh_so)::bigint as thanh_tien
      from public.hoa_don_dong d
      join public.v_doanh_so_dong v on v.dong_id = d.id
      join public.v_hd_doanh_thu x on x.hoa_don_id = d.hoa_don_id
      join public.hoa_don h on h.id = d.hoa_don_id
      left join public.khach_hang k on k.id = h.khach_id
     where x.ngay_hd between p_tu and p_den and (p_cn is null or x.chi_nhanh_id = p_cn)
       and btrim(d.ten) = btrim(p_ten)
       and (case when d.loai = 'goi_the' then 'ban_the' when d.loai = 'san_pham' then 'san_pham'
                 when d.the_khach_sh_id is not null or d.thanh_tien = 0 then 'dung_the' else 'dich_vu' end) = p_loai)
  select l.khach_id, l.ho_ten, l.dien_thoai, l.hoa_don_id, l.ma_hd, l.ngay_hd, l.so_luong, l.thanh_tien, count(*) over ()
    from l order by l.ngay_hd desc, l.ma_hd limit greatest(p_gioi_han, 1)
$$;

create or replace function public.bc_hoa_hong_nv_nhom(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, nhom text, so_dong int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  select c.nhan_vien_id,
         case when c.vai = 'tu_van' then 'tu_van'
              when c.vai = 'phuc_vu' and v.loai = 'dich_vu' then 'dich_vu'
              when c.vai = 'ban' and v.loai = 'san_pham' then 'san_pham'
              when c.vai = 'ban' and v.loai = 'goi_the' then 'ban_the'
              else 'khac' end,
         count(*)::int, round(sum(v.doanh_so * c.ti_le / 100))::bigint,
         round(sum(c.ti_le / 100 * public.hh_tinh(v.doanh_so, v.so_luong, v.loai, c.vai, v.muc_id, c.nhan_vien_id)))::bigint
    from public.dong_nhan_vien c join public.v_doanh_so_dong v on v.dong_id = c.dong_id
   where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
   group by 1, 2
$$;

create or replace function public.bc_hoa_hong_nv_chi_tiet(p_nv uuid, p_tu date, p_den date, p_cn uuid default null, p_gioi_han int default 2000)
returns table (hoa_don_id uuid, ma_hd text, ngay_hd date, khach text, ten_dong text, loai text, vai text, so_luong int, doanh_so bigint, hoa_hong bigint, tong_dong bigint)
language sql stable as $$
  with l as (
    select h.id as hoa_don_id, coalesce(h.sh_ma, h.ma) as ma_hd, v.ngay_hd, coalesce(k.ho_ten, 'Khách lẻ') as khach, v.ten as ten_dong, v.loai, c.vai, v.so_luong,
           round(v.doanh_so * c.ti_le / 100)::bigint as doanh_so,
           round(c.ti_le / 100 * public.hh_tinh(v.doanh_so, v.so_luong, v.loai, c.vai, v.muc_id, c.nhan_vien_id))::bigint as hoa_hong
      from public.dong_nhan_vien c
      join public.v_doanh_so_dong v on v.dong_id = c.dong_id
      join public.hoa_don h on h.id = v.hoa_don_id
      left join public.khach_hang k on k.id = h.khach_id
     where c.nhan_vien_id = p_nv and v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn))
  select l.*, count(*) over () from l order by l.ngay_hd desc, l.ma_hd, l.ten_dong limit greatest(p_gioi_han, 1)
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
