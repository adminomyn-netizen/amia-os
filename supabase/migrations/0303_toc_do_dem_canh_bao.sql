-- 0303 — TỐC ĐỘ: chuông thông báo đếm thẻ sắp hết + hàng dưới mức tối thiểu + tồn âm trong MỘT lần gọi (03/11/2026).
-- Trước: 3 câu đếm qua PostgREST, mỗi câu tính view 2 lần (lấy dòng + đếm) → 100–400 ms mỗi câu lúc máy bận.
-- Sau: 1 hàm, mỗi view tính 1 lần. Kết quả y hệt 3 câu cũ (cùng view, cùng điều kiện, cùng lọc chi nhánh).
create or replace function public.dem_canh_bao_nhanh(p_cn uuid default null) returns jsonb
language sql stable set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'the_sap_het', (select count(*) from public.v_the_khach v where v.tinh_trang = 'sap_het' and v.loai = 'lan' and (p_cn is null or v.chi_nhanh_id = p_cn)),
    'kho_duoi_muc', (select count(*) from public.v_ton_kho t where t.duoi_muc_toi_thieu = true and (p_cn is null or t.chi_nhanh_id = p_cn)),
    'kho_ton_am', (select count(*) from public.v_ton_kho t where t.ton < 0 and (p_cn is null or t.chi_nhanh_id = p_cn)));
$$;
revoke all on function public.dem_canh_bao_nhanh(uuid) from public, anon, authenticated;
grant execute on function public.dem_canh_bao_nhanh(uuid) to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
