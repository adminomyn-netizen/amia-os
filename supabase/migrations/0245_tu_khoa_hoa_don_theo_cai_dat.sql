-- 0245 — Tự khoá hoá đơn sau N giờ (Cài đặt › Các thiết lập khác), như SalonHero (đợt 3 nhóm C, 03/11/2026).
-- Chặn đã có sẵn: mo_lai_hoa_don (0201 → 0209 → 0210) đọc cau_hinh 'hoa_don.khoa_sua_sau_gio' và từ chối "Sửa" hoá đơn đã chốt quá N giờ.
-- Màn Cài đặt lưu ở khoá tl.khoa_hd_bat / tl.khoa_hd_gio → từ nay lưu thêm hoa_don.khoa_sua_sau_gio (= số giờ khi bật, 0 khi tắt).
-- Migration này: (1) đồng bộ một lần nếu đã bật ở tl.*; (2) thêm 2 hàm CHỈ ĐỌC để màn hình hỏi trước (ẩn nút Sửa, hiện "Đã khoá").
-- KHÔNG thêm trigger trên hoa_don (đồng bộ đêm và trigger thanh toán vẫn cập nhật hoa_don bình thường); KHÔNG sửa mo_lai_hoa_don.

insert into public.cau_hinh (khoa, gia_tri)
select 'hoa_don.khoa_sua_sau_gio', coalesce(nullif((select gia_tri from public.cau_hinh where khoa = 'tl.khoa_hd_gio'), ''), '0')
 where (select gia_tri from public.cau_hinh where khoa = 'tl.khoa_hd_bat') = '1'
on conflict (khoa) do update set gia_tri = excluded.gia_tri;

create or replace function public.so_gio_khoa_hoa_don()
returns numeric language sql stable set search_path = public, pg_temp as $$
  select greatest(coalesce(nullif((select gia_tri from public.cau_hinh where khoa = 'hoa_don.khoa_sua_sau_gio'), '')::numeric, 0), 0);
$$;
comment on function public.so_gio_khoa_hoa_don() is 'Số giờ sau khi chốt thì khoá Sửa hoá đơn (0 = không khoá). Cùng nguồn với mo_lai_hoa_don.';

create or replace function public.hoa_don_da_khoa(p_hoa_don_id uuid)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select coalesce((
    select g > 0 and h.chot_luc is not null and h.chot_luc < now() - make_interval(secs => (g * 3600)::double precision)
      from public.hoa_don h, (select public.so_gio_khoa_hoa_don() as g) c
     where h.id = p_hoa_don_id), false);
$$;
comment on function public.hoa_don_da_khoa(uuid) is 'true = hoá đơn đã chốt quá N giờ (Cài đặt › Tự động khoá hoá đơn) nên không Sửa được nữa. Cùng luật với mo_lai_hoa_don.';

revoke all on function public.so_gio_khoa_hoa_don() from public, anon, authenticated;
revoke all on function public.hoa_don_da_khoa(uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
