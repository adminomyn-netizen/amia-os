-- 0095 — TỐI ƯU TỐC ĐỘ TRANG CHỦ (29/10/2026). Chỉ thêm 2 hàm ĐỌC, không đổi bảng/dữ liệu/cách tính.
-- • top_khach_chi_12_thang(chi nhánh, số lượng): thay cho "select ... from v_khach_hang order by chi_12_thang desc limit 10" (view tính 4 phép nối cho cả 13,6 nghìn khách: ~2,1 giây).
--   Cùng luật với v_khach_hang.chi_12_thang: hoá đơn hoàn thành, không phải số dư đầu, ngày >= hôm nay - 365, tiền = max(tổng hàng - giảm giá đơn, 0); lọc chi nhánh theo CHI NHÁNH CỦA KHÁCH.
-- • top_ban_thang(từ ngày, chi nhánh): 10 dịch vụ + 10 sản phẩm bán chạy từ ngày đó (gộp theo tên dòng, theo thành tiền) — thay cho việc tải tới 4000 dòng hoá đơn về máy chủ rồi gộp.
set lock_timeout = '4s';

create or replace function public.top_khach_chi_12_thang(p_cn uuid default null, p_so int default 10)
returns table (ho_ten text, chi bigint) language sql stable as $$
  select k.ho_ten, c.chi::bigint
    from (select d.khach_id, sum(greatest(d.tong_hang - d.giam_gia_don, 0)) chi
            from public.hoa_don d
           where d.trang_thai = 'hoan_thanh' and not d.la_so_du_dau and d.ngay_hd >= public.hom_nay() - 365
           group by d.khach_id) c
    join public.khach_hang k on k.id = c.khach_id
   where c.chi > 0 and (p_cn is null or k.chi_nhanh_id = p_cn)
   order by c.chi desc, k.id
   limit least(greatest(coalesce(p_so, 10), 1), 100);
$$;

create or replace function public.top_ban_thang(p_tu date, p_cn uuid default null)
returns table (nhom text, ten text, so numeric, tien numeric) language sql stable as $$
  with g as (
    select (case when d.loai = 'san_pham' then 'san_pham' else 'dich_vu' end) nhom, d.ten,
           sum(d.so_luong) so, sum(coalesce(d.thanh_tien, 0)) tien
      from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
     where h.ngay_hd >= p_tu and h.trang_thai = 'hoan_thanh' and (p_cn is null or h.chi_nhanh_id = p_cn)
     group by 1, 2),
  x as (select g.*, row_number() over (partition by g.nhom order by g.tien desc, g.ten) rn from g)
  select x.nhom, x.ten, x.so, x.tien from x where x.rn <= 10 order by x.nhom, x.rn;
$$;

revoke all on function public.top_khach_chi_12_thang(uuid, int) from public, anon, authenticated;
revoke all on function public.top_ban_thang(date, uuid) from public, anon, authenticated;
grant execute on function public.top_khach_chi_12_thang(uuid, int) to service_role;
grant execute on function public.top_ban_thang(date, uuid) to service_role;
