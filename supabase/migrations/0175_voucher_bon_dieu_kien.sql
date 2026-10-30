-- 0175 — Voucher: 4 điều kiện còn thiếu so với SalonHero (chị Lâm 30/10): giới hạn "Tùy chọn" từng dịch vụ, nhóm khách hàng, loại lịch hẹn, khung giờ sử dụng.
-- Kiểm ở CHÍNH hàm chốt đơn (chot_hoa_don_voucher) và hàm tính tiền giảm (tinh_giam_voucher), cùng nguyên tắc với migration 0080; voucher cũ không có 4 cột này (null) chạy y như trước.
-- Loại lịch hẹn = nguồn đặt lịch (lich_hen.nguon). Khung giờ tính theo giờ Việt Nam, gồm cả hai đầu.

alter table public.voucher
  add column dich_vu_ids uuid[],        -- chỉ dùng khi gioi_han = 'tuy_chon': các dịch vụ được giảm
  add column nhom_khach_ids uuid[],      -- null = mọi khách
  add column loai_lich_hen text[],       -- null = mọi loại (kể cả đơn không từ lịch hẹn)
  add column gio_tu time,
  add column gio_den time;
alter table public.voucher drop constraint voucher_gioi_han_check;
alter table public.voucher add constraint voucher_gioi_han_check check (gioi_han in ('tong_don', 'dich_vu_the', 'san_pham', 'the', 'dich_vu', 'dich_vu_san_pham', 'tuy_chon'));
alter table public.voucher add constraint voucher_tuy_chon_can_dich_vu check (gioi_han <> 'tuy_chon' or coalesce(cardinality(dich_vu_ids), 0) > 0);
alter table public.voucher add constraint voucher_khung_gio_hop_le check ((gio_tu is null) = (gio_den is null) and (gio_tu is null or gio_tu < gio_den));

create or replace function public.voucher_loai_dong(p_gioi_han text) returns text[] language sql immutable as $$
  select case p_gioi_han
    when 'dich_vu_the' then array['dich_vu', 'goi_the']
    when 'san_pham' then array['san_pham']
    when 'the' then array['goi_the']
    when 'dich_vu' then array['dich_vu']
    when 'tuy_chon' then array['dich_vu']
    when 'dich_vu_san_pham' then array['dich_vu', 'san_pham']
    else array['dich_vu', 'goi_the', 'san_pham'] end $$;

create or replace function public.tinh_giam_voucher(p_voucher uuid, p_hoa_don uuid) returns bigint language plpgsql stable as $$
declare v public.voucher; v_co_so bigint; v_giam bigint;
begin
  select * into v from public.voucher where id = p_voucher;
  if not found then return 0; end if;
  select coalesce(sum(thanh_tien), 0) into v_co_so from public.hoa_don_dong
   where hoa_don_id = p_hoa_don and loai = any (public.voucher_loai_dong(v.gioi_han))
     and (v.gioi_han <> 'tuy_chon' or dich_vu_id = any (v.dich_vu_ids));
  if v.loai_giam = 'phan_tram' then
    v_giam := round(v_co_so * v.gia_tri / 100)::bigint;
    if v.giam_toi_da is not null then v_giam := least(v_giam, v.giam_toi_da); end if;
  else
    v_giam := floor(v.gia_tri)::bigint;
  end if;
  return greatest(least(v_giam, v_co_so), 0);
end $$;

create or replace function public.chot_hoa_don_voucher(p_id uuid, p_nguoi uuid, p_ma text, p_tien_voucher bigint, p_diem int, p_tien_diem bigint) returns void language plpgsql as $$
declare h public.hoa_don; v public.voucher; m public.voucher_ma; v_tong int; v_ma_da int; v_khach_da int; v_tien bigint; v_hang text;
  v_ma text := upper(btrim(coalesce(p_ma, ''))); v_nay date := public.hom_nay();
begin
  if v_ma = '' then
    perform public.chot_hoa_don_doi_diem(p_id, p_nguoi, p_diem, p_tien_diem);
    return;
  end if;
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.trang_thai <> 'nhap' then raise exception 'Hoá đơn % không còn ở trạng thái nháp', h.ma using errcode = 'P0001'; end if;
  select * into m from public.voucher_ma where ma = v_ma;
  if not found then raise exception 'Voucher % không tồn tại', v_ma using errcode = 'P0001'; end if;
  select * into v from public.voucher where id = m.voucher_id for update;
  if v.bi_khoa then raise exception 'Voucher % đang bị khoá', v_ma using errcode = 'P0001'; end if;
  if v.tu_ngay > v_nay then raise exception 'Voucher % chưa đến ngày dùng (từ %)', v_ma, to_char(v.tu_ngay, 'DD/MM/YYYY') using errcode = 'P0001'; end if;
  if v.den_ngay < v_nay then raise exception 'Voucher % đã hết hạn ngày %', v_ma, to_char(v.den_ngay, 'DD/MM/YYYY') using errcode = 'P0001'; end if;
  if v.chi_nhanh_ids is not null and not (h.chi_nhanh_id = any (v.chi_nhanh_ids)) then raise exception 'Voucher % không áp dụng cho chi nhánh của đơn này', v_ma using errcode = 'P0001'; end if;
  if v.ngay_trong_tuan is not null and not (extract(isodow from v_nay)::smallint = any (v.ngay_trong_tuan)) then raise exception 'Voucher % không áp dụng cho ngày hôm nay trong tuần', v_ma using errcode = 'P0001'; end if;
  -- Khung giờ sử dụng (giờ Việt Nam) và loại lịch hẹn (nguồn đặt lịch của lịch gắn với đơn).
  if v.gio_tu is not null and not ((now() at time zone 'Asia/Ho_Chi_Minh')::time between v.gio_tu and v.gio_den) then
    raise exception 'Voucher % chỉ áp dụng trong khung giờ % đến %', v_ma, to_char(v.gio_tu, 'HH24:MI'), to_char(v.gio_den, 'HH24:MI') using errcode = 'P0001';
  end if;
  if v.loai_lich_hen is not null then
    if h.lich_hen_id is null or not coalesce((select l.nguon = any (v.loai_lich_hen) from public.lich_hen l where l.id = h.lich_hen_id), false) then
      raise exception 'Voucher % chỉ áp dụng cho đơn từ lịch hẹn thuộc loại được chọn', v_ma using errcode = 'P0001';
    end if;
  end if;
  -- Lượt đã dùng (trừ lượt đã hoàn): cả voucher, riêng mã này, riêng khách này.
  select coalesce(sum(case loai when 'dung' then 1 else -1 end), 0) into v_tong from public.voucher_luot_dung where voucher_id = v.id;
  select coalesce(sum(case loai when 'dung' then 1 else -1 end), 0) into v_ma_da from public.voucher_luot_dung where ma_id = m.id;
  if v_tong >= v.so_luong or (v.loai_ma = 'nhieu_ma' and v_ma_da >= 1) then raise exception 'Voucher % đã hết mã (hết lượt dùng)', v_ma using errcode = 'P0001'; end if;
  if v.hang_khach is not null or v.khach_moi_cu is not null or v.so_lan_toi_da_khach is not null or v.nhom_khach_ids is not null then
    if h.khach_id is null then raise exception 'Voucher % chỉ áp dụng khi đã chọn khách hàng', v_ma using errcode = 'P0001'; end if;
  end if;
  if v.hang_khach is not null then
    select hang into v_hang from public.v_khach_hang where id = h.khach_id;
    if v_hang is null or not (v_hang = any (v.hang_khach)) then raise exception 'Voucher % không áp dụng cho hạng khách này (hạng %)', v_ma, coalesce(v_hang, 'chưa có') using errcode = 'P0001'; end if;
  end if;
  if v.nhom_khach_ids is not null then
    if not exists (select 1 from public.khach_nhom kn where kn.khach_id = h.khach_id and kn.nhom_id = any (v.nhom_khach_ids)) then
      raise exception 'Voucher % không áp dụng cho nhóm khách của khách này', v_ma using errcode = 'P0001';
    end if;
  end if;
  if v.khach_moi_cu is not null then
    if (exists (select 1 from public.hoa_don x where x.khach_id = h.khach_id and x.trang_thai = 'hoan_thanh' and x.id <> h.id)) <> (v.khach_moi_cu = 'cu') then
      raise exception 'Voucher % chỉ áp dụng cho khách %', v_ma, case v.khach_moi_cu when 'moi' then 'mới' else 'quay lại' end using errcode = 'P0001';
    end if;
  end if;
  if v.so_lan_toi_da_khach is not null then
    select coalesce(sum(case loai when 'dung' then 1 else -1 end), 0) into v_khach_da from public.voucher_luot_dung where voucher_id = v.id and khach_id = h.khach_id;
    if v_khach_da >= v.so_lan_toi_da_khach then raise exception 'Khách này đã dùng voucher % đủ % lần', v_ma, v.so_lan_toi_da_khach using errcode = 'P0001'; end if;
  end if;
  perform public.tinh_lai_hoa_don(p_id);
  select * into h from public.hoa_don where id = p_id;
  if h.tong_hang < v.don_toi_thieu then raise exception 'Voucher % chỉ áp dụng cho đơn từ % đ', v_ma, v.don_toi_thieu using errcode = 'P0001'; end if;
  v_tien := public.tinh_giam_voucher(v.id, p_id);
  if v_tien <= 0 then raise exception 'Voucher % không áp dụng được cho dòng hàng nào của đơn', v_ma using errcode = 'P0001'; end if;
  if p_tien_voucher is distinct from v_tien then raise exception 'Tiền giảm của voucher % không khớp (máy chủ tính % đ)', v_ma, v_tien using errcode = 'P0001'; end if;
  if v_tien + coalesce(p_tien_diem, 0) > h.giam_gia_don then raise exception 'Giảm giá cả đơn nhỏ hơn tổng voucher và tiền đổi điểm' using errcode = 'P0001'; end if;
  insert into public.voucher_luot_dung (voucher_id, ma_id, hoa_don_id, loai, so_tien, khach_id, nguoi_id, ghi_chu)
    values (v.id, m.id, p_id, 'dung', v_tien, h.khach_id, p_nguoi, 'Dùng cho hoá đơn ' || h.ma);
  update public.hoa_don set giam_voucher = v_tien where id = p_id;
  perform public.chot_hoa_don_doi_diem(p_id, p_nguoi, p_diem, p_tien_diem);
end $$;

select public.khoa_tat_ca_bang();
