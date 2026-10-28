-- 0045 — KHO CHẶT: hàng hết hạn, tồn âm, mã vạch, bắt buộc hạn dùng, tên không trùng (chị Lâm 28/10: "TCKT làm chặt, nhất là kho: tồn kho, hàng hết hạn, mã sản phẩm, cách đặt tên").
--  · kiem_kho_xuat: trước khi BÁN hoặc CẤP vật tư, nếu kho còn hàng đã hết hạn mà phần còn hạn không đủ thì chặn và dặn làm phiếu Xử lý vật tư.
--    Hết tồn thì chặn bán khi bật cau_hinh kho.chan_ban_khi_het_ton = 1 (mặc định 0: kho mới có 65 dòng sổ cái, bật sớm sẽ chặn hết đơn). Cấp phiếu vẫn luôn chặn khi không đủ tồn như trước.
--  · san_pham.ma_vach: mã vạch tách riêng khỏi mã nội bộ (mã cũ toàn số 8–14 chữ số được sao sang ma_vach).
--  · san_pham.bat_buoc_han_dung: hàng này bắt buộc nhập hạn dùng khi nhập kho/nhận hàng (mặc định có; Quà tặng thì không).
--  · Tên không trùng (bỏ khoảng trắng thừa, không dấu, không phân biệt hoa thường) được chặn ở màn Danh mục, KHÔNG chặn bằng chỉ mục vì tập lệnh nhập định mức tạm tạo bản trùng rồi gộp lại.

alter table public.san_pham
  add column ma_vach text,
  add column bat_buoc_han_dung boolean not null default true;
update public.san_pham set ma_vach = ma where ma ~ '^[0-9]{8,14}$';
update public.san_pham set bat_buoc_han_dung = false where nhom = 'Quà tặng';
create unique index san_pham_ma_vach_uniq on public.san_pham (ma_vach) where ma_vach is not null;

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('kho.chan_ban_khi_het_ton', '0', 'Bật (1) khi kho đã nhập đủ tồn đầu: bán hàng vượt tồn sẽ bị chặn. Tắt (0): chỉ chặn hàng đã hết hạn.')
on conflict (khoa) do nothing;

create function public.kiem_kho_xuat(p_cn uuid, p_sp uuid, p_sl numeric, p_ten text, p_chan_het_ton boolean) returns void language plpgsql stable as $$
declare v_ton numeric := public.ton_kho(p_cn, p_sp); v_het numeric;
begin
  if p_chan_het_ton and v_ton < p_sl then
    raise exception 'Kho không đủ "%": còn %, cần %', p_ten, trim_scale(v_ton), trim_scale(p_sl) using errcode = 'P0001';
  end if;
  select coalesce(sum(con_lai), 0) into v_het from public.v_ton_lo where chi_nhanh_id = p_cn and san_pham_id = p_sp and han_dung is not null and han_dung < public.hom_nay();
  if v_het > 0 and v_ton - v_het < p_sl then
    raise exception '"%" đang có % đã HẾT HẠN, chỉ còn % còn hạn dùng. Làm phiếu Xử lý vật tư cho số hết hạn rồi mới bán hoặc cấp.', p_ten, trim_scale(v_het), trim_scale(greatest(v_ton - v_het, 0)) using errcode = 'P0001';
  end if;
end $$;
revoke all on function public.kiem_kho_xuat(uuid, uuid, numeric, text, boolean) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.chot_hoa_don(p_id uuid, p_nguoi uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare h public.hoa_don; r record; i int; v_net numeric; v_buoi bigint; v_the uuid; v_ma text;
begin
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.trang_thai <> 'nhap' then raise exception 'Hoá đơn % không còn ở trạng thái nháp', h.ma using errcode = 'P0001'; end if;
  perform public.tinh_lai_hoa_don(p_id);
  select * into h from public.hoa_don where id = p_id;
  if not exists (select 1 from public.hoa_don_dong where hoa_don_id = p_id) then
    raise exception 'Hoá đơn chưa có dòng hàng nào' using errcode = 'P0001';
  end if;
  if h.giam_gia_don > h.tong_hang then raise exception 'Giảm giá cả đơn lớn hơn tổng tiền hàng' using errcode = 'P0001'; end if;
  if h.da_thu > h.tong_phai_thu then raise exception 'Đã thu % lớn hơn tổng phải thu % — kiểm tra lại giảm giá/dòng hàng', h.da_thu, h.tong_phai_thu using errcode = 'P0001'; end if;
  if h.khach_id is null and (h.con_no > 0 or exists (select 1 from public.hoa_don_dong where hoa_don_id = p_id and loai = 'goi_the')) then
    raise exception 'Hoá đơn còn nợ hoặc có bán thẻ thì phải gắn khách hàng' using errcode = 'P0001';
  end if;
  for r in
    select d.ten, dnv.vai, sum(dnv.ti_le) as tong
      from public.dong_nhan_vien dnv join public.hoa_don_dong d on d.id = dnv.dong_id
     where d.hoa_don_id = p_id group by d.id, d.ten, dnv.vai having abs(sum(dnv.ti_le) - 100) > 0.01
  loop
    raise exception 'Dòng "%": vai % chia mới được % — phải cộng đủ 100 phần trăm', r.ten, r.vai, r.tong using errcode = 'P0001';
  end loop;

  -- Bán thẻ → cấp thẻ cho khách (mỗi đơn vị 1 thẻ), ghi sổ cái thẻ.
  for r in
    select d.id as dong_id, d.so_luong, d.thanh_tien, g.id as goi_id, g.loai, g.so_buoi, g.gia_tri_the, g.han_dung_ngay
      from public.hoa_don_dong d join public.goi_the g on g.id = d.goi_id
     where d.hoa_don_id = p_id and d.loai = 'goi_the'
  loop
    v_net := case when h.tong_hang > 0 then (r.thanh_tien::numeric / r.so_luong) * (h.tong_hang - h.giam_gia_don) / h.tong_hang else 0 end;
    v_buoi := case when r.loai = 'lan' then round(v_net / r.so_buoi)::bigint else 0 end;
    for i in 1..r.so_luong loop
      v_ma := 'TH' || lpad(public.so_tiep_theo('the')::text, 6, '0');
      insert into public.the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, hoa_don_dong_id, so_buoi_tong, tong_tien, gia_tri_buoi, han_dung)
      values (v_ma, h.khach_id, r.goi_id, h.chi_nhanh_id, r.loai, r.dong_id,
              case when r.loai = 'lan' then r.so_buoi end, case when r.loai = 'tien' then r.gia_tri_the end, v_buoi,
              case when r.han_dung_ngay is not null then h.ngay_hd + r.han_dung_ngay end)
      returning id into v_the;
      if r.loai = 'lan' then
        insert into public.the_so_cai (the_id, loai, so_buoi, hoa_don_id, nguoi_id, ghi_chu) values (v_the, 'cap', r.so_buoi, p_id, p_nguoi, 'Cấp khi bán thẻ');
      else
        insert into public.the_so_cai (the_id, loai, so_tien, hoa_don_id, nguoi_id, ghi_chu) values (v_the, 'nap', r.gia_tri_the, p_id, p_nguoi, 'Nạp khi bán thẻ');
      end if;
    end loop;
  end loop;

  -- Chặn bán hàng đã hết hạn; hết tồn thì chặn khi bật cấu hình kho.chan_ban_khi_het_ton (mặc định tắt cho tới khi kho nhập đủ tồn đầu).
  for r in select d.san_pham_id, sum(d.so_luong) as sl, max(s.ten) as ten from public.hoa_don_dong d join public.san_pham s on s.id = d.san_pham_id
            where d.hoa_don_id = p_id and d.loai = 'san_pham' and s.theo_doi_kho group by d.san_pham_id loop
    perform pg_advisory_xact_lock(hashtext(h.chi_nhanh_id::text || r.san_pham_id::text));
    perform public.kiem_kho_xuat(h.chi_nhanh_id, r.san_pham_id, r.sl, r.ten, coalesce((select gia_tri from public.cau_hinh where khoa = 'kho.chan_ban_khi_het_ton'), '0') = '1');
  end loop;

  -- Bán sản phẩm → trừ kho (sản phẩm theo dõi kho).
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, hoa_don_id, nguoi_id)
  select h.chi_nhanh_id, d.san_pham_id, 'xuat_ban', -sum(d.so_luong), p_id, p_nguoi
    from public.hoa_don_dong d join public.san_pham s on s.id = d.san_pham_id
   where d.hoa_don_id = p_id and d.loai = 'san_pham' and s.theo_doi_kho
   group by d.san_pham_id;

  update public.hoa_don set trang_thai = 'hoan_thanh', chot_luc = now() where id = p_id;
end $function$;

CREATE OR REPLACE FUNCTION public.cap_phieu(p_id uuid, p_nguoi uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare p public.phieu_cap; r record; v_ton numeric;
begin
  select * into p from public.phieu_cap where id = p_id for update;
  if not found then raise exception 'Không có phiếu này' using errcode = 'P0001'; end if;
  if p.trang_thai <> 'cho_cap' then raise exception 'Phiếu % không ở trạng thái chờ cấp', p.ma using errcode = 'P0001'; end if;
  for r in select d.*, s.ten from public.phieu_cap_dong d join public.san_pham s on s.id = d.san_pham_id where d.phieu_id = p_id order by d.san_pham_id loop
    perform pg_advisory_xact_lock(hashtext(p.chi_nhanh_id::text || r.san_pham_id::text));
    v_ton := public.ton_kho(p.chi_nhanh_id, r.san_pham_id);
    if v_ton < r.so_cap then raise exception 'Kho không đủ "%": còn %, cần cấp %', r.ten, trim_scale(v_ton), trim_scale(r.so_cap) using errcode = 'P0001'; end if;
    perform public.kiem_kho_xuat(p.chi_nhanh_id, r.san_pham_id, r.so_cap, r.ten, false);
    insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
    values (p.chi_nhanh_id, r.san_pham_id, 'cap_ca', -r.so_cap, r.don_gia, p_id, p_nguoi, 'Cấp theo phiếu ' || p.ma);
  end loop;
  update public.phieu_cap set trang_thai = 'da_cap', cap_boi = p_nguoi, cap_luc = now() where id = p_id;
end $function$;

CREATE OR REPLACE FUNCTION public.cap_them_phieu(p_id uuid, p_san_pham uuid, p_so_luong numeric, p_ly_do text, p_bac_si_xn uuid, p_nguoi uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
  perform public.kiem_kho_xuat(p.chi_nhanh_id, p_san_pham, p_so_luong, s.ten, false);
  insert into public.phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, don_gia, cap_them, ly_do_vuot, bac_si_xac_nhan_id)
  values (p_id, p_san_pham, s.nhom_cap, 0, p_so_luong, s.gia_nhap_don_vi, true, p_ly_do, p_bac_si_xn)
  on conflict (phieu_id, san_pham_id) do update set so_cap = public.phieu_cap_dong.so_cap + excluded.so_cap,
    ly_do_vuot = excluded.ly_do_vuot, bac_si_xac_nhan_id = excluded.bac_si_xac_nhan_id, cap_them = true;
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
  values (p.chi_nhanh_id, p_san_pham, 'cap_ca', -p_so_luong, s.gia_nhap_don_vi, p_id, p_nguoi, 'Cấp thêm: ' || p_ly_do);
end $function$;

select public.khoa_tat_ca_bang();
