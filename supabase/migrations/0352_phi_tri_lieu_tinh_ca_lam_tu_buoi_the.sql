-- Từ 17/11/2026 (SalonHero ngừng đồng bộ) ca làm theo thẻ chỉ ghi ở buoi_thuc_hien + buoi_nhan_vien, không còn dòng hoá đơn/dong_nhan_vien vai phục vụ.
-- bc_phi_tl_ca (nguồn phần "dịch vụ bác sĩ làm" và phí trị liệu) chỉ đọc hoá đơn nên từ 17/11 không hiện ca nào. Thêm các buổi đã làm vào cùng kết quả.
-- Với buổi, dong_id = id buổi (để đánh dấu "ca không tính phí" dùng chung), nên bỏ khoá ngoại của phi_tl_loai_tru sang hoa_don_dong.
alter table public.phi_tl_loai_tru drop constraint if exists phi_tl_loai_tru_dong_id_fkey;

create or replace function public.bc_phi_tl_ca(p_tu date, p_den date, p_cn uuid default null)
returns table (dong_id uuid, hoa_don_id uuid, ma_hd text, chi_nhanh_id uuid, ngay_hd date, khach text, dich_vu_id uuid, ten text, so_luong numeric, thanh_tien numeric, nguoi jsonb, loai_tru text)
language sql stable set search_path = public, pg_temp as $$
  select d.id, h.id, h.ma, h.chi_nhanh_id, h.ngay_hd, k.ho_ten,
         coalesce(d.dich_vu_id, (select dv.id from public.dich_vu dv where lower(trim(dv.ten)) = lower(trim(d.ten)) order by dv.hoat_dong desc limit 1)), d.ten, d.so_luong, d.thanh_tien,
         coalesce((select jsonb_agg(jsonb_build_object('nv', c.nhan_vien_id, 'tl', c.ti_le) order by c.ti_le desc) from public.dong_nhan_vien c where c.dong_id = d.id and c.vai = 'phuc_vu'), '[]'::jsonb),
         x.ly_do
    from public.hoa_don h join public.hoa_don_dong d on d.hoa_don_id = h.id
    left join public.khach_hang k on k.id = h.khach_id
    left join public.phi_tl_loai_tru x on x.dong_id = d.id
   where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
     and d.loai = 'dich_vu'
  union all
  -- Ca làm theo thẻ trên AMIA OS: người thực hiện = nhân viên của buổi (+ bác sĩ nếu chưa nằm trong danh sách)
  select b.id, null::uuid, 'Thẻ ' || coalesce(t.ma, left(b.id::text, 6)), b.chi_nhanh_id, b.ngay_lam, k.ho_ten, b.dich_vu_id, dv.ten, 1::numeric, b.doanh_thu_buoi::numeric,
         (select coalesce(jsonb_agg(jsonb_build_object('nv', p.nv, 'tl', p.tl) order by p.tl desc), '[]'::jsonb) from (
            select bn.nhan_vien_id as nv, bn.ti_le as tl from public.buoi_nhan_vien bn where bn.buoi_id = b.id and bn.vai = 'thuc_hien'
            union all
            select b.bac_si_id, 100::numeric where b.bac_si_id is not null and not exists (select 1 from public.buoi_nhan_vien bn where bn.buoi_id = b.id and bn.vai = 'thuc_hien' and bn.nhan_vien_id = b.bac_si_id)
          ) p),
         x.ly_do
    from public.buoi_thuc_hien b
    join public.dich_vu dv on dv.id = b.dich_vu_id
    left join public.the_khach t on t.id = b.the_id
    left join public.khach_hang k on k.id = b.khach_id
    left join public.phi_tl_loai_tru x on x.dong_id = b.id
   where b.trang_thai = 'da_lam' and b.ngay_lam between p_tu and p_den and (p_cn is null or b.chi_nhanh_id = p_cn)
$$;
revoke all on function public.bc_phi_tl_ca(date, date, uuid) from public, anon, authenticated;
select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
