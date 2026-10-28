-- 0119 — "KHÁCH HÀNG NỢ → CÁC LẦN TRẢ NỢ" như SalonHero (G1, 29/10/2026): mỗi lần khách trả nợ (thu sau ngày lập đơn, không tính thẻ tiền) một dòng.
-- Chỉ thêm 1 hàm đọc. Người thu = tên ghi trong dòng thu chuyển từ SalonHero ("SalonHero PAYMENT_DEBT · <tên>") hoặc người ghi thu trong app.
-- Đối chiếu SalonHero 30/09–29/10/2026 (cả hai chi nhánh): 9 lần trả nợ, tổng 49.000.000.
create or replace function public.bc_cac_lan_tra_no(p_tu date, p_den date, p_cn uuid default null, p_tim text default null, p_so int default 30, p_tu_dong int default 0)
returns table (thanh_toan_id uuid, ngay date, hoa_don_id uuid, ma_hd text, khach_id uuid, khach text, dien_thoai text, chi_nhanh text, tong_hd bigint, so_tien bigint, phuong_thuc text, nguoi_thu text, tong_dong bigint, tong_tien bigint)
language sql stable as $$
  with l as (
    select t.id as tt, t.ngay, h.id as hd, coalesce(h.sh_ma, h.ma) as ma_hd, h.khach_id, k.ho_ten, k.dien_thoai, k.ho_ten_khong_dau, c.ten as cn, h.tong_phai_thu as tong_hd,
           (case t.loai when 'thu' then t.so_tien else -t.so_tien end) as so_tien, t.phuong_thuc,
           coalesce(nullif(btrim(substring(t.ghi_chu from 'SalonHero PAYMENT(?:_DEBT)? · (.*)$')), ''), n.ho_ten) as nguoi_thu
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
      left join public.khach_hang k on k.id = h.khach_id left join public.chi_nhanh c on c.id = h.chi_nhanh_id left join public.nhan_vien n on n.id = t.nguoi_id
     where t.ngay between p_tu and p_den and t.ngay > h.ngay_hd and t.phuong_thuc <> 'the_tien' and h.trang_thai = 'hoan_thanh' and (p_cn is null or h.chi_nhanh_id = p_cn)
       and (nullif(btrim(p_tim), '') is null or h.ma ilike '%' || btrim(p_tim) || '%' or h.sh_ma ilike '%' || btrim(p_tim) || '%'
            or (select bool_and(k.ho_ten_khong_dau like '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%') from unnest(regexp_split_to_array(public.bo_dau(btrim(p_tim)), '\s+')) w where w <> '')
            or (k.dien_thoai like '%' || regexp_replace(p_tim, '\D', '', 'g') || '%' and length(regexp_replace(p_tim, '\D', '', 'g')) >= 3))),
  s as (select l.*, count(*) over () as tong_dong, sum(l.so_tien) over () as tong_tien from l)
  select s.tt, s.ngay, s.hd, s.ma_hd, s.khach_id, s.ho_ten, s.dien_thoai, s.cn, s.tong_hd::bigint, s.so_tien::bigint, s.phuong_thuc, s.nguoi_thu, s.tong_dong, s.tong_tien::bigint
    from s order by s.ngay desc, s.ma_hd desc, s.tt
   limit least(coalesce(p_so, 30), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

select public.khoa_tat_ca_bang();
