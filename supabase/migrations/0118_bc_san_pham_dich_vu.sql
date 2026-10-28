-- 0118 — "THEO SẢN PHẨM / DỊCH VỤ" như SalonHero (G1, 29/10/2026): mỗi dòng = một mặt hàng theo loại (dịch vụ trả tiền, sản phẩm, bán thẻ, dùng thẻ).
-- Số lượng; Trước giảm giá = đơn giá × số lượng; Sau giảm giá = thành tiền sau khi chia giảm giá cả đơn; Trừ thẻ tiền = phần thanh toán bằng thẻ tiền của đơn,
-- chia theo tỉ lệ doanh số từng dòng; Thực nhận = Sau giảm giá − Trừ thẻ tiền. Chỉ thêm 1 hàm đọc.
-- Đối chiếu SalonHero 01–29/10/2026 Vinh: tổng sau giảm giá 1.297.094.000 (bán thẻ 1.240.780.000 + sản phẩm 56.314.000 + dịch vụ 0), trừ thẻ tiền 45.000.000, thực nhận 1.252.094.000.
create function public.bc_san_pham_dich_vu(p_tu date, p_den date, p_cn uuid default null)
returns table (loai text, ma text, ten text, so_luong bigint, truoc bigint, sau bigint, tru_the bigint, thuc_nhan bigint)
language sql stable as $$
  with l as (
    select case when d.loai = 'goi_the' then 'ban_the' when d.loai = 'san_pham' then 'san_pham'
                when d.the_khach_sh_id is not null or d.thanh_tien = 0 then 'dung_the' else 'dich_vu' end as loai,
           coalesce(dv.ma, sp.ma, gt.ma) as ma, btrim(d.ten) as ten, d.so_luong, d.don_gia * d.so_luong as truoc, v.doanh_so as sau,
           v.doanh_so * coalesce(x.tru_the, 0) / nullif(sum(v.doanh_so) over (partition by d.hoa_don_id), 0) as tru_the
      from public.hoa_don_dong d
      join public.v_doanh_so_dong v on v.dong_id = d.id
      join public.v_hd_doanh_thu x on x.hoa_don_id = d.hoa_don_id
      left join public.dich_vu dv on dv.id = d.dich_vu_id left join public.san_pham sp on sp.id = d.san_pham_id left join public.goi_the gt on gt.id = d.goi_id
     where x.ngay_hd between p_tu and p_den and (p_cn is null or x.chi_nhanh_id = p_cn))
  select l.loai, min(l.ma), l.ten, sum(l.so_luong)::bigint, sum(l.truoc)::bigint, round(sum(l.sau))::bigint, round(coalesce(sum(l.tru_the), 0))::bigint,
         (round(sum(l.sau)) - round(coalesce(sum(l.tru_the), 0)))::bigint
    from l group by l.loai, l.ten order by round(sum(l.sau)) desc, l.ten
$$;

select public.khoa_tat_ca_bang();
