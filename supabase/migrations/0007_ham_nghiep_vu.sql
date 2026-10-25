-- 0007 — HÀM NGHIỆP VỤ (chạy trong 1 giao dịch, khoá dòng để không lệch khi 2 người thao tác cùng lúc).
create table public.cau_hinh (khoa text primary key, gia_tri text not null, ghi_chu text);
insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('nguong_lech_pct', '5', 'Dùng vượt định mức quá ngưỡng % này thì phải có lý do + bác sĩ xác nhận (Flora đề xuất 5%, chị Lâm chưa chốt)'),
  ('the_sap_het_buoi', '2', 'Thẻ lần còn ≤ số buổi này thì báo "sắp hết"'),
  ('ngay_mat_khach', '180', 'Khách không phát sinh gì quá số ngày này và hết liệu trình thì tự coi là "mất"');

create function public.hom_nay() returns date language sql stable as
  $$ select (now() at time zone 'Asia/Ho_Chi_Minh')::date $$;

-- ───────── CHỐT HOÁ ĐƠN ─────────
create function public.chot_hoa_don(p_id uuid, p_nguoi uuid) returns void language plpgsql as $$
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

  -- Bán sản phẩm → trừ kho (sản phẩm theo dõi kho).
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, hoa_don_id, nguoi_id)
  select h.chi_nhanh_id, d.san_pham_id, 'xuat_ban', -sum(d.so_luong), p_id, p_nguoi
    from public.hoa_don_dong d join public.san_pham s on s.id = d.san_pham_id
   where d.hoa_don_id = p_id and d.loai = 'san_pham' and s.theo_doi_kho
   group by d.san_pham_id;

  update public.hoa_don set trang_thai = 'hoan_thanh', chot_luc = now() where id = p_id;
end $$;

-- ───────── HUỶ HOÁ ĐƠN (hoàn tiền, thu hồi thẻ, trả kho) ─────────
create function public.huy_hoa_don(p_id uuid, p_ly_do text, p_nguoi uuid) returns void language plpgsql as $$
declare h public.hoa_don; r record;
begin
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Huỷ hoá đơn phải ghi lý do' using errcode = 'P0001'; end if;
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.trang_thai = 'huy' then raise exception 'Hoá đơn % đã huỷ rồi', h.ma using errcode = 'P0001'; end if;

  if exists (
    select 1 from public.the_khach t join public.hoa_don_dong d on d.id = t.hoa_don_dong_id
     where d.hoa_don_id = p_id and exists (select 1 from public.the_so_cai c where c.the_id = t.id and c.loai in ('dung_buoi','tru_tien'))
  ) then
    raise exception 'Thẻ bán trong hoá đơn % đã được dùng, không huỷ được — điều chỉnh thẻ trước', h.ma using errcode = 'P0001';
  end if;

  for r in
    select phuong_thuc, the_id, sum(case loai when 'thu' then so_tien else -so_tien end) as rong
      from public.thanh_toan where hoa_don_id = p_id group by phuong_thuc, the_id
  loop
    if r.rong > 0 then
      insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, the_id, nguoi_id, ghi_chu)
      values (p_id, 'hoan', r.phuong_thuc, r.rong, r.the_id, p_nguoi, 'Hoàn do huỷ hoá đơn: ' || p_ly_do);
    end if;
  end loop;

  for r in
    select t.id, coalesce(sum(c.so_buoi), 0) as sb, coalesce(sum(c.so_tien), 0) as st
      from public.the_khach t join public.hoa_don_dong d on d.id = t.hoa_don_dong_id
      left join public.the_so_cai c on c.the_id = t.id
     where d.hoa_don_id = p_id group by t.id
  loop
    insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, hoa_don_id, nguoi_id, ghi_chu)
    values (r.id, 'thu_hoi', -r.sb, -r.st, p_id, p_nguoi, 'Thu hồi do huỷ hoá đơn');
    update public.the_khach set trang_thai = 'thu_hoi' where id = r.id;
  end loop;

  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, hoa_don_id, nguoi_id, ghi_chu)
  select chi_nhanh_id, san_pham_id, 'dieu_chinh', -so_luong, p_id, p_nguoi, 'Trả kho do huỷ hoá đơn'
    from public.kho_so_cai where hoa_don_id = p_id and loai = 'xuat_ban';

  update public.hoa_don set trang_thai = 'huy', huy_luc = now(), ly_do_huy = p_ly_do where id = p_id;
end $$;

-- ───────── THỰC HIỆN BUỔI: "đã làm" → trừ 1 buổi thẻ, ghi người làm, ghi doanh thu buổi ─────────
create function public.thuc_hien_buoi(
  p_the uuid, p_dich_vu uuid, p_nv uuid, p_bac_si uuid, p_lich uuid, p_ngay date, p_tham_so jsonb, p_ghi_chu text, p_nguoi uuid
) returns uuid language plpgsql as $$
declare t public.the_khach; v_con int; v_id uuid; l public.lich_hen;
begin
  select * into t from public.the_khach where id = p_the for update;
  if not found then raise exception 'Không có thẻ này' using errcode = 'P0001'; end if;
  if t.loai <> 'lan' then raise exception 'Chỉ thẻ liệu trình (thẻ lần) mới trừ buổi' using errcode = 'P0001'; end if;
  if t.trang_thai <> 'hoat_dong' then raise exception 'Thẻ % đang bị khoá hoặc đã thu hồi', t.ma using errcode = 'P0001'; end if;
  if t.han_dung is not null and t.han_dung < p_ngay then raise exception 'Thẻ % đã hết hạn ngày %', t.ma, t.han_dung using errcode = 'P0001'; end if;
  select coalesce(sum(so_buoi), 0) into v_con from public.the_so_cai where the_id = t.id;
  if v_con < 1 then raise exception 'Thẻ % đã hết buổi', t.ma using errcode = 'P0001'; end if;
  if exists (select 1 from public.goi_the_dich_vu where goi_id = t.goi_id)
     and not exists (select 1 from public.goi_the_dich_vu where goi_id = t.goi_id and dich_vu_id = p_dich_vu) then
    raise exception 'Dịch vụ này không nằm trong thẻ %', t.ma using errcode = 'P0001';
  end if;
  if p_lich is not null then
    select * into l from public.lich_hen where id = p_lich for update;
    if not found or l.khach_id <> t.khach_id then raise exception 'Lịch hẹn không thuộc khách của thẻ' using errcode = 'P0001'; end if;
    if l.trang_thai in ('huy','khong_den') then raise exception 'Lịch hẹn đã huỷ / khách không đến' using errcode = 'P0001'; end if;
  end if;
  insert into public.buoi_thuc_hien (khach_id, the_id, dich_vu_id, lich_hen_id, chi_nhanh_id, ngay_lam, nv_thuc_hien_id, bac_si_id, tham_so, doanh_thu_buoi, ghi_chu, tao_boi)
  values (t.khach_id, t.id, p_dich_vu, p_lich, t.chi_nhanh_id, coalesce(p_ngay, public.hom_nay()), p_nv, p_bac_si, coalesce(p_tham_so, '{}'::jsonb), t.gia_tri_buoi, p_ghi_chu, p_nguoi)
  returning id into v_id;
  insert into public.the_so_cai (the_id, loai, so_buoi, buoi_id, nguoi_id, ghi_chu) values (t.id, 'dung_buoi', -1, v_id, p_nguoi, p_ghi_chu);
  if p_lich is not null then
    update public.lich_hen set trang_thai = 'hoan_thanh', cap_nhat_luc = now() where id = p_lich;
  end if;
  return v_id;
end $$;

create function public.huy_buoi(p_buoi uuid, p_ly_do text, p_nguoi uuid) returns void language plpgsql as $$
declare b public.buoi_thuc_hien;
begin
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Huỷ buổi phải ghi lý do' using errcode = 'P0001'; end if;
  select * into b from public.buoi_thuc_hien where id = p_buoi for update;
  if not found then raise exception 'Không có buổi này' using errcode = 'P0001'; end if;
  if b.trang_thai = 'huy' then raise exception 'Buổi này đã huỷ rồi' using errcode = 'P0001'; end if;
  update public.buoi_thuc_hien set trang_thai = 'huy', ly_do_huy = p_ly_do, huy_luc = now() where id = p_buoi;
  if b.the_id is not null then
    insert into public.the_so_cai (the_id, loai, so_buoi, buoi_id, nguoi_id, ghi_chu) values (b.the_id, 'hoan_buoi', 1, p_buoi, p_nguoi, p_ly_do);
  end if;
end $$;

-- ───────── PHIẾU CẤP VẬT TƯ TRƯỚC CA ─────────
create function public.ton_kho(p_chi_nhanh uuid, p_san_pham uuid) returns numeric language sql stable as
  $$ select coalesce(sum(so_luong), 0) from public.kho_so_cai where chi_nhanh_id = p_chi_nhanh and san_pham_id = p_san_pham $$;

create function public.tao_phieu_cap(
  p_chi_nhanh uuid, p_lich uuid, p_khach uuid, p_dich_vu uuid, p_bac_si uuid, p_ktv uuid, p_chi_dinh jsonb, p_nguoi uuid
) returns uuid language plpgsql as $$
declare v_id uuid; v_ma text; e jsonb; dm public.dinh_muc; sp public.san_pham; v_sl numeric; v_ymd text; v_dem int;
begin
  if exists (select 1 from public.phieu_cap where lich_hen_id is not distinct from p_lich and dich_vu_id = p_dich_vu and khach_id = p_khach and trang_thai <> 'huy' and p_lich is not null) then
    raise exception 'Ca này đã có phiếu cấp vật tư' using errcode = 'P0001';
  end if;
  v_ymd := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDD');
  v_ma := 'PC-' || v_ymd || '-' || lpad(public.so_tiep_theo('pc-' || v_ymd)::text, 3, '0');
  insert into public.phieu_cap (ma, chi_nhanh_id, lich_hen_id, khach_id, dich_vu_id, bac_si_id, ktv_id, tao_boi)
  values (v_ma, p_chi_nhanh, p_lich, p_khach, p_dich_vu, p_bac_si, p_ktv, p_nguoi) returning id into v_id;

  -- vật tư cố định của dịch vụ (nhóm A)
  insert into public.phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, don_gia)
  select v_id, d.san_pham_id, s.nhom_cap, d.so_luong, d.so_luong, s.gia_nhap_don_vi
    from public.dinh_muc d join public.san_pham s on s.id = d.san_pham_id
   where d.dich_vu_id = p_dich_vu and not d.chon_theo_chi_dinh and s.nhom_cap = 'A';

  -- vật tư bác sĩ chỉ định (đầu tip nào, bao nhiêu shot/line/ml)
  for e in select * from jsonb_array_elements(coalesce(p_chi_dinh, '[]'::jsonb)) loop
    select * into dm from public.dinh_muc where dich_vu_id = p_dich_vu and san_pham_id = (e ->> 'san_pham_id')::uuid and chon_theo_chi_dinh;
    if not found then raise exception 'Vật tư được chỉ định không nằm trong phương án định mức của dịch vụ' using errcode = 'P0001'; end if;
    select * into sp from public.san_pham where id = dm.san_pham_id;
    v_sl := coalesce(nullif(e ->> 'so_luong', '')::numeric, dm.so_luong);
    if v_sl <= 0 then raise exception 'Số lượng chỉ định của % phải lớn hơn 0', sp.ten using errcode = 'P0001'; end if;
    insert into public.phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, don_gia)
    values (v_id, sp.id, sp.nhom_cap, dm.so_luong, v_sl, sp.gia_nhap_don_vi);
  end loop;

  select count(*) into v_dem from public.phieu_cap_dong where phieu_id = v_id;
  if v_dem = 0 then raise exception 'Dịch vụ này chưa có vật tư nhóm A trong định mức, không cần phiếu cấp' using errcode = 'P0001'; end if;
  return v_id;
end $$;

create function public.cap_phieu(p_id uuid, p_nguoi uuid) returns void language plpgsql as $$
declare p public.phieu_cap; r record; v_ton numeric;
begin
  select * into p from public.phieu_cap where id = p_id for update;
  if not found then raise exception 'Không có phiếu này' using errcode = 'P0001'; end if;
  if p.trang_thai <> 'cho_cap' then raise exception 'Phiếu % không ở trạng thái chờ cấp', p.ma using errcode = 'P0001'; end if;
  for r in select d.*, s.ten from public.phieu_cap_dong d join public.san_pham s on s.id = d.san_pham_id where d.phieu_id = p_id order by d.san_pham_id loop
    perform pg_advisory_xact_lock(hashtext(p.chi_nhanh_id::text || r.san_pham_id::text));
    v_ton := public.ton_kho(p.chi_nhanh_id, r.san_pham_id);
    if v_ton < r.so_cap then raise exception 'Kho không đủ "%": còn %, cần cấp %', r.ten, v_ton, r.so_cap using errcode = 'P0001'; end if;
    insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
    values (p.chi_nhanh_id, r.san_pham_id, 'cap_ca', -r.so_cap, r.don_gia, p_id, p_nguoi, 'Cấp theo phiếu ' || p.ma);
  end loop;
  update public.phieu_cap set trang_thai = 'da_cap', cap_boi = p_nguoi, cap_luc = now() where id = p_id;
end $$;

create function public.nhan_phieu(p_id uuid, p_nguoi uuid, p_dem_truoc int) returns void language plpgsql as $$
declare p public.phieu_cap;
begin
  select * into p from public.phieu_cap where id = p_id for update;
  if not found then raise exception 'Không có phiếu này' using errcode = 'P0001'; end if;
  if p.trang_thai <> 'da_cap' then raise exception 'Phiếu % chưa được kho cấp hoặc đã nhận rồi', p.ma using errcode = 'P0001'; end if;
  update public.phieu_cap set trang_thai = 'da_nhan', nhan_boi = p_nguoi, nhan_luc = now(), ktv_id = coalesce(ktv_id, p_nguoi), dem_may_truoc = p_dem_truoc where id = p_id;
end $$;

-- Cấp thêm giữa ca: bắt buộc có lý do + bác sĩ duyệt.
create function public.cap_them_phieu(p_id uuid, p_san_pham uuid, p_so_luong numeric, p_ly_do text, p_bac_si_xn uuid, p_nguoi uuid) returns void language plpgsql as $$
declare p public.phieu_cap; s public.san_pham; v_ton numeric;
begin
  if coalesce(trim(p_ly_do), '') = '' or p_bac_si_xn is null then raise exception 'Cấp thêm phải có lý do và bác sĩ xác nhận' using errcode = 'P0001'; end if;
  if p_so_luong is null or p_so_luong <= 0 then raise exception 'Số cấp thêm phải lớn hơn 0' using errcode = 'P0001'; end if;
  select * into p from public.phieu_cap where id = p_id for update;
  if not found or p.trang_thai not in ('da_cap','da_nhan') then raise exception 'Chỉ cấp thêm được khi phiếu đã cấp và chưa làm xong' using errcode = 'P0001'; end if;
  select * into s from public.san_pham where id = p_san_pham;
  perform pg_advisory_xact_lock(hashtext(p.chi_nhanh_id::text || p_san_pham::text));
  v_ton := public.ton_kho(p.chi_nhanh_id, p_san_pham);
  if v_ton < p_so_luong then raise exception 'Kho không đủ "%": còn %, cần cấp thêm %', s.ten, v_ton, p_so_luong using errcode = 'P0001'; end if;
  insert into public.phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, don_gia, cap_them, ly_do_vuot, bac_si_xac_nhan_id)
  values (p_id, p_san_pham, s.nhom_cap, 0, p_so_luong, s.gia_nhap_don_vi, true, p_ly_do, p_bac_si_xn)
  on conflict (phieu_id, san_pham_id) do update set so_cap = public.phieu_cap_dong.so_cap + excluded.so_cap,
    ly_do_vuot = excluded.ly_do_vuot, bac_si_xac_nhan_id = excluded.bac_si_xac_nhan_id, cap_them = true;
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
  values (p.chi_nhanh_id, p_san_pham, 'cap_ca', -p_so_luong, s.gia_nhap_don_vi, p_id, p_nguoi, 'Cấp thêm: ' || p_ly_do);
end $$;

-- Làm xong: KTV trả phần thừa + chụp số đếm sau ca. Dùng thật = cấp − trả. Dùng quá ngưỡng so với định mức thì phải có lý do + bác sĩ xác nhận.
create function public.hoan_tat_phieu(p_id uuid, p_dong jsonb, p_dem_sau int, p_nguoi uuid) returns void language plpgsql as $$
declare p public.phieu_cap; r record; e jsonb; v_tra numeric; v_dung numeric; v_nguong numeric; v_ly text; v_bs uuid;
begin
  select * into p from public.phieu_cap where id = p_id for update;
  if not found then raise exception 'Không có phiếu này' using errcode = 'P0001'; end if;
  if p.trang_thai <> 'da_nhan' then raise exception 'Phiếu % chưa ở trạng thái đã nhận (KTV phải nhận trước khi làm)', p.ma using errcode = 'P0001'; end if;
  select coalesce(gia_tri::numeric, 5) into v_nguong from public.cau_hinh where khoa = 'nguong_lech_pct';
  for r in select d.*, s.ten from public.phieu_cap_dong d join public.san_pham s on s.id = d.san_pham_id where d.phieu_id = p_id loop
    select x into e from jsonb_array_elements(coalesce(p_dong, '[]'::jsonb)) x where (x ->> 'dong_id')::uuid = r.id limit 1;
    if e is null then raise exception 'Thiếu số trả của "%": nhập 0 nếu dùng hết', r.ten using errcode = 'P0001'; end if;
    v_tra := coalesce(nullif(e ->> 'so_tra', '')::numeric, 0);
    if v_tra < 0 or v_tra > r.so_cap then raise exception 'Số trả của "%" phải từ 0 đến số đã cấp (%)', r.ten, r.so_cap using errcode = 'P0001'; end if;
    v_dung := r.so_cap - v_tra;
    v_ly := nullif(trim(coalesce(e ->> 'ly_do_vuot', r.ly_do_vuot, '')), '');
    v_bs := coalesce(nullif(e ->> 'bac_si_xac_nhan_id', '')::uuid, r.bac_si_xac_nhan_id);
    if r.dinh_muc > 0 and v_dung > r.dinh_muc * (1 + v_nguong / 100.0) and (v_ly is null or v_bs is null) then
      raise exception 'Dùng "%": % vượt định mức % quá % phần trăm — phải ghi lý do và bác sĩ xác nhận', r.ten, v_dung, r.dinh_muc, v_nguong using errcode = 'P0001';
    end if;
    update public.phieu_cap_dong set so_tra = v_tra, ly_do_vuot = v_ly, bac_si_xac_nhan_id = v_bs where id = r.id;
    if v_tra > 0 then
      insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
      values (p.chi_nhanh_id, r.san_pham_id, 'tra_ca', v_tra, r.don_gia, p_id, p_nguoi, 'Trả thừa theo phiếu ' || p.ma);
    end if;
  end loop;
  update public.phieu_cap set trang_thai = 'da_lam', dem_may_sau = p_dem_sau, lam_xong_luc = now() where id = p_id;
end $$;

create function public.doi_chieu_phieu(p_id uuid, p_nguoi uuid) returns void language plpgsql as $$
declare p public.phieu_cap;
begin
  select * into p from public.phieu_cap where id = p_id for update;
  if not found or p.trang_thai <> 'da_lam' then raise exception 'Chỉ đối chiếu được phiếu đã làm xong' using errcode = 'P0001'; end if;
  update public.phieu_cap set trang_thai = 'da_doi_chieu', doi_chieu_boi = p_nguoi, doi_chieu_luc = now() where id = p_id;
end $$;

create function public.huy_phieu(p_id uuid, p_ly_do text, p_nguoi uuid) returns void language plpgsql as $$
declare p public.phieu_cap;
begin
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Huỷ phiếu phải ghi lý do' using errcode = 'P0001'; end if;
  select * into p from public.phieu_cap where id = p_id for update;
  if not found then raise exception 'Không có phiếu này' using errcode = 'P0001'; end if;
  if p.trang_thai in ('da_lam','da_doi_chieu','huy') then raise exception 'Phiếu % không huỷ được ở trạng thái này', p.ma using errcode = 'P0001'; end if;
  if p.trang_thai in ('da_cap','da_nhan') then
    insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
    select p.chi_nhanh_id, san_pham_id, 'tra_ca', so_cap, don_gia, p_id, p_nguoi, 'Hoàn kho do huỷ phiếu ' || p.ma from public.phieu_cap_dong where phieu_id = p_id;
  end if;
  update public.phieu_cap set trang_thai = 'huy', ly_do_huy = p_ly_do where id = p_id;
end $$;

-- KHOÁ CA: chuyển lịch hẹn sang "đang phục vụ" mà dịch vụ có vật tư nhóm A chưa có phiếu "đã nhận" → từ chối.
create function public.trg_lich_hen_khoa_ca() returns trigger language plpgsql as $$
declare r record;
begin
  new.cap_nhat_luc := now();
  if new.trang_thai = 'dang_phuc_vu' and old.trang_thai is distinct from 'dang_phuc_vu' then
    for r in
      select l.dich_vu_id, v.ten from public.lich_hen_dich_vu l join public.dich_vu v on v.id = l.dich_vu_id
       where l.lich_id = new.id
         and exists (select 1 from public.dinh_muc dm join public.san_pham s on s.id = dm.san_pham_id and s.nhom_cap = 'A' where dm.dich_vu_id = l.dich_vu_id)
         and not exists (select 1 from public.phieu_cap p where p.lich_hen_id = new.id and p.dich_vu_id = l.dich_vu_id and p.trang_thai in ('da_nhan','da_lam','da_doi_chieu'))
    loop
      raise exception 'Chưa mở ca được: dịch vụ "%" cần phiếu cấp vật tư và KTV phải bấm "Đã nhận" trước', r.ten using errcode = 'P0001';
    end loop;
  end if;
  return new;
end $$;
create trigger lich_hen_khoa_ca before update on public.lich_hen
  for each row execute function public.trg_lich_hen_khoa_ca();
