-- 0012 — Thông báo "kho không đủ" hiện số gọn (1000 thay vì 1000.000).
create or replace function public.cap_phieu(p_id uuid, p_nguoi uuid) returns void language plpgsql as $$
declare p public.phieu_cap; r record; v_ton numeric;
begin
  select * into p from public.phieu_cap where id = p_id for update;
  if not found then raise exception 'Không có phiếu này' using errcode = 'P0001'; end if;
  if p.trang_thai <> 'cho_cap' then raise exception 'Phiếu % không ở trạng thái chờ cấp', p.ma using errcode = 'P0001'; end if;
  for r in select d.*, s.ten from public.phieu_cap_dong d join public.san_pham s on s.id = d.san_pham_id where d.phieu_id = p_id order by d.san_pham_id loop
    perform pg_advisory_xact_lock(hashtext(p.chi_nhanh_id::text || r.san_pham_id::text));
    v_ton := public.ton_kho(p.chi_nhanh_id, r.san_pham_id);
    if v_ton < r.so_cap then raise exception 'Kho không đủ "%": còn %, cần cấp %', r.ten, trim_scale(v_ton), trim_scale(r.so_cap) using errcode = 'P0001'; end if;
    insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
    values (p.chi_nhanh_id, r.san_pham_id, 'cap_ca', -r.so_cap, r.don_gia, p_id, p_nguoi, 'Cấp theo phiếu ' || p.ma);
  end loop;
  update public.phieu_cap set trang_thai = 'da_cap', cap_boi = p_nguoi, cap_luc = now() where id = p_id;
end $$;

create or replace function public.cap_them_phieu(p_id uuid, p_san_pham uuid, p_so_luong numeric, p_ly_do text, p_bac_si_xn uuid, p_nguoi uuid) returns void language plpgsql as $$
declare p public.phieu_cap; s public.san_pham; v_ton numeric;
begin
  if coalesce(trim(p_ly_do), '') = '' or p_bac_si_xn is null then raise exception 'Cấp thêm phải có lý do và bác sĩ xác nhận' using errcode = 'P0001'; end if;
  if p_so_luong is null or p_so_luong <= 0 then raise exception 'Số cấp thêm phải lớn hơn 0' using errcode = 'P0001'; end if;
  select * into p from public.phieu_cap where id = p_id for update;
  if not found or p.trang_thai not in ('da_cap','da_nhan') then raise exception 'Chỉ cấp thêm được khi phiếu đã cấp và chưa làm xong' using errcode = 'P0001'; end if;
  select * into s from public.san_pham where id = p_san_pham;
  perform pg_advisory_xact_lock(hashtext(p.chi_nhanh_id::text || p_san_pham::text));
  v_ton := public.ton_kho(p.chi_nhanh_id, p_san_pham);
  if v_ton < p_so_luong then raise exception 'Kho không đủ "%": còn %, cần cấp thêm %', s.ten, trim_scale(v_ton), trim_scale(p_so_luong) using errcode = 'P0001'; end if;
  insert into public.phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, don_gia, cap_them, ly_do_vuot, bac_si_xac_nhan_id)
  values (p_id, p_san_pham, s.nhom_cap, 0, p_so_luong, s.gia_nhap_don_vi, true, p_ly_do, p_bac_si_xn)
  on conflict (phieu_id, san_pham_id) do update set so_cap = public.phieu_cap_dong.so_cap + excluded.so_cap,
    ly_do_vuot = excluded.ly_do_vuot, bac_si_xac_nhan_id = excluded.bac_si_xac_nhan_id, cap_them = true;
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
  values (p.chi_nhanh_id, p_san_pham, 'cap_ca', -p_so_luong, s.gia_nhap_don_vi, p_id, p_nguoi, 'Cấp thêm: ' || p_ly_do);
end $$;

select public.khoa_tat_ca_bang();
