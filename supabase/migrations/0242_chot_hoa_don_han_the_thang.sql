-- 0242 (đợt 3, nhóm B): Bán thẻ ở Thu ngân → hạn thẻ tính theo THÁNG + NGÀY của loại thẻ như SalonHero (0238).
-- CHỈ ĐỔI MỘT CHỖ trong chot_hoa_don: "h.ngay_hd + r.han_dung_ngay" → public.tinh_han_the(r.han_dung_thang, r.han_dung_ngay, h.ngay_hd)
-- (và lấy thêm g.han_dung_thang trong vòng lặp thẻ). Phần còn lại chép NGUYÊN bản đang chạy trên DB lúc 03/11/2026 (pg_get_functiondef).
-- Loại thẻ chỉ có ngày (không tháng) cho kết quả y như cũ: ngay_hd + số ngày.
CREATE OR REPLACE FUNCTION public.chot_hoa_don(p_id uuid, p_nguoi uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
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
    select d.id as dong_id, d.so_luong, d.thanh_tien, g.id as goi_id, g.loai, g.so_buoi, g.gia_tri_the, g.han_dung_ngay, g.han_dung_thang
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
              public.tinh_han_the(r.han_dung_thang, r.han_dung_ngay, h.ngay_hd))
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

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
