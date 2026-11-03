-- 0232 — Khách gần đây: chọn khoảng ngày + ô tìm khách như SalonHero (đợt 3, 03/11/2026).
-- khach_gan_den / khach_gan_den_tong (bản 0193) thêm p_tu, p_den (ngày hoá đơn; mặc định tới hôm nay) và p_q (tên không dấu / SĐT / mã khách).
-- Trong khoảng ngày: mỗi khách lấy hoá đơn hoàn thành MỚI NHẤT nằm trong khoảng đó. Không truyền tham số mới thì y như bản cũ.
drop function if exists public.khach_gan_den(uuid, int, int);
create function public.khach_gan_den(p_cn uuid default null, p_lim int default 30, p_off int default 0, p_tu date default null, p_den date default null, p_q text default null)
returns table (khach_id uuid, ngay date, hd_id uuid, hd_ma text, tien bigint) language sql stable as $$
  with m as (select coalesce(p_tu, '-infinity'::date) tu, least(coalesce(p_den, public.hom_nay()), public.hom_nay()) den, nullif(trim(coalesce(p_q, '')), '') q),
  kq as (
    select k.id from public.khach_hang k, m
     where m.q is not null
       and (k.ho_ten_khong_dau like '%' || public.bo_dau(m.q) || '%' or k.ma ilike '%' || m.q || '%'
            or (length(regexp_replace(m.q, '\D', '', 'g')) >= 3 and k.dien_thoai like '%' || regexp_replace(m.q, '\D', '', 'g') || '%')))
  select h.khach_id, h.ngay_hd, h.id, coalesce(h.sh_ma, h.ma), h.tong_phai_thu
  from public.hoa_don h, m
  where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.khach_id is not null and h.ngay_hd <= m.den and h.ngay_hd >= m.tu
    and (p_cn is null or h.chi_nhanh_id = p_cn)
    and (m.q is null or h.khach_id in (select id from kq))
    and not exists (select 1 from public.hoa_don h2
                    where h2.khach_id = h.khach_id and h2.trang_thai = 'hoan_thanh' and not h2.la_so_du_dau and h2.ngay_hd <= m.den
                      and (p_cn is null or h2.chi_nhanh_id = p_cn)
                      and h2.ngay_hd >= h.ngay_hd and (h2.ngay_hd > h.ngay_hd or (h2.ngay_hd = h.ngay_hd and (h2.tao_luc > h.tao_luc or (h2.tao_luc = h.tao_luc and h2.id > h.id)))))
  order by h.ngay_hd desc, h.tao_luc desc, h.id desc
  limit greatest(p_lim, 1) offset greatest(p_off, 0);
$$;
revoke all on function public.khach_gan_den(uuid, int, int, date, date, text) from public, anon, authenticated;
grant execute on function public.khach_gan_den(uuid, int, int, date, date, text) to service_role;

drop function if exists public.khach_gan_den_tong(uuid);
create function public.khach_gan_den_tong(p_cn uuid default null, p_tu date default null, p_den date default null, p_q text default null) returns bigint language sql stable as $$
  with m as (select coalesce(p_tu, '-infinity'::date) tu, least(coalesce(p_den, public.hom_nay()), public.hom_nay()) den, nullif(trim(coalesce(p_q, '')), '') q)
  select count(distinct h.khach_id) from public.hoa_don h, m
  where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.khach_id is not null and h.ngay_hd <= m.den and h.ngay_hd >= m.tu and (p_cn is null or h.chi_nhanh_id = p_cn)
    and (m.q is null or h.khach_id in (select k.id from public.khach_hang k
          where k.ho_ten_khong_dau like '%' || public.bo_dau(m.q) || '%' or k.ma ilike '%' || m.q || '%'
             or (length(regexp_replace(m.q, '\D', '', 'g')) >= 3 and k.dien_thoai like '%' || regexp_replace(m.q, '\D', '', 'g') || '%')));
$$;
revoke all on function public.khach_gan_den_tong(uuid, date, date, text) from public, anon, authenticated;
grant execute on function public.khach_gan_den_tong(uuid, date, date, text) to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
