-- 0325 — Bảng xếp hạng Dashboard (chị Lâm 10/11/2026: "sản phẩm nào được gia hạn nhiều nhất").
-- "Gia hạn" = như nút Gia hạn ở Bán hàng: khách mua lại ĐÚNG gói thẻ mình đã từng có. Đếm mỗi dòng bán gói thẻ (hoá đơn hoàn thành, không phải
-- số dư đầu kỳ) trong kỳ — chỉ thẻ liệu trình (bỏ thẻ tiền / tiền cọc) — mà khách đó đã có một thẻ cùng gói được cấp TRƯỚC ngày hoá đơn. Chỉ THÊM hàm đọc, không đổi bảng/dữ liệu.
create or replace function public.xh_the_gia_han(p_tu date, p_den date, p_cn uuid default null, p_so int default 10)
returns table (goi_id uuid, ten text, so_lan bigint, so_khach bigint, tien bigint)
language sql stable
set search_path = public, pg_temp
as $$
  select d.goi_id, min(btrim(d.ten)), count(*)::bigint, count(distinct h.khach_id)::bigint, round(sum(coalesce(d.thanh_tien, 0)))::bigint
    from public.hoa_don_dong d
    join public.hoa_don h on h.id = d.hoa_don_id
    join public.goi_the g on g.id = d.goi_id
   where d.loai = 'goi_the' and g.loai = 'lan' and g.ten !~* 'c[ọo]c' and d.goi_id is not null and h.khach_id is not null
     and h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau
     and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
     and exists (select 1 from public.the_khach t where t.khach_id = h.khach_id and t.goi_id = d.goi_id and t.ngay_cap < h.ngay_hd)
   group by d.goi_id
   order by 3 desc, 5 desc, 2
   limit greatest(1, least(coalesce(p_so, 10), 50));
$$;

revoke all on function public.xh_the_gia_han(date, date, uuid, int) from public, anon, authenticated;
grant execute on function public.xh_the_gia_han(date, date, uuid, int) to service_role;
