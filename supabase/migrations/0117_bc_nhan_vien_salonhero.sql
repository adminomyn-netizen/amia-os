-- 0117 — "THEO NHÂN VIÊN" y hệt cột SalonHero (G1, 29/10/2026): số lần phục vụ + doanh số dịch vụ, số sản phẩm đã bán + doanh số sản phẩm,
-- số thẻ đã bán + doanh số bán thẻ, số lần tư vấn + doanh số tư vấn, tổng doanh số. Chỉ thêm 1 hàm đọc.
-- Doanh số một dòng = thành tiền × (tiền hàng − giảm giá cả đơn) ÷ tiền hàng × tỉ lệ chia của người đó (như báo cáo cũ).
-- Dòng dịch vụ làm bằng thẻ (thành tiền 0) được tính theo giá một buổi của thẻ (giá bán thẻ ÷ số buổi), như SalonHero tính giá trị dịch vụ.
-- Đối chiếu SalonHero 10/2026 Vinh: số sản phẩm + doanh số sản phẩm và số thẻ bán + doanh số bán thẻ khớp; doanh số dịch vụ / tư vấn lệch vì
-- một phần thẻ chưa có hồ sơ trong app (không có giá thẻ) và SalonHero có cách quy giá trị thẻ riêng.
create function public.bc_nhan_vien_sh(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, ho_ten text, so_phuc_vu int, ds_dich_vu bigint, so_san_pham int, ds_san_pham bigint, so_the int, ds_the bigint, so_tu_van int, ds_tu_van bigint)
language sql stable as $$
  with l as (
    select c.nhan_vien_id, c.vai, v.loai, c.ti_le / 100 * (case when d.the_khach_sh_id is not null and coalesce(t.so_buoi_tong, 0) > 0 and v.loai = 'dich_vu'
                                                                  then v.so_luong * t.tong_tien::numeric / t.so_buoi_tong else v.doanh_so end) as ds
      from public.dong_nhan_vien c
      join public.v_doanh_so_dong v on v.dong_id = c.dong_id
      join public.hoa_don_dong d on d.id = v.dong_id
      left join public.the_khach t on t.sh_id = d.the_khach_sh_id
     where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn))
  select l.nhan_vien_id, n.ho_ten,
         (count(*) filter (where l.loai = 'dich_vu' and l.vai = 'phuc_vu'))::int, round(coalesce(sum(l.ds) filter (where l.loai = 'dich_vu' and l.vai = 'phuc_vu'), 0))::bigint,
         (count(*) filter (where l.loai = 'san_pham' and l.vai = 'ban'))::int, round(coalesce(sum(l.ds) filter (where l.loai = 'san_pham' and l.vai = 'ban'), 0))::bigint,
         (count(*) filter (where l.loai = 'goi_the' and l.vai = 'ban'))::int, round(coalesce(sum(l.ds) filter (where l.loai = 'goi_the' and l.vai = 'ban'), 0))::bigint,
         (count(*) filter (where l.vai = 'tu_van'))::int, round(coalesce(sum(l.ds) filter (where l.vai = 'tu_van'), 0))::bigint
    from l join public.nhan_vien n on n.id = l.nhan_vien_id
   group by l.nhan_vien_id, n.ho_ten
$$;

select public.khoa_tat_ca_bang();
