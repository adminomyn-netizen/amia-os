-- 0210 — Sửa hoá đơn đã chốt: CHẶN khi đơn đã xuất hoá đơn điện tử (nối đợt 2 việc 4, 03/11/2026).
-- Mốc "đã xuất" = hoa_don.vat_hd_so / vat_hd_luc (0067, 0177: ghi số hoá đơn điện tử ở trang hoá đơn). Sửa đơn đã xuất làm dòng hàng lệch hoá đơn điện tử
-- và mất tên xuất đã sửa (hoa_don_xuat_dong xoá dây chuyền theo dòng) mà không báo → báo rõ lý do, bắt xử lý hoá đơn điện tử trước.
-- Giữ nguyên mọi kiểm khác của 0201 + 0209.

create or replace function public.mo_lai_hoa_don(p_id uuid, p_ly_do text, p_nguoi uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare h public.hoa_don; r record; v_gio numeric;
begin
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Sửa hoá đơn phải ghi lý do' using errcode = 'P0001'; end if;
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.trang_thai <> 'hoan_thanh' then raise exception 'Chỉ sửa được hoá đơn đã hoàn thành (hoá đơn % đang %)', h.ma, h.trang_thai using errcode = 'P0001'; end if;
  if h.la_lich_su or h.la_so_du_dau then
    raise exception 'Hoá đơn % chuyển từ SalonHero, không sửa ở AMIA được (sửa ở SalonHero, đồng bộ sẽ cập nhật)', h.ma using errcode = 'P0001';
  end if;
  if h.vat_hd_so is not null or h.vat_hd_luc is not null then
    raise exception 'Hoá đơn % đã xuất hoá đơn điện tử (số %): không sửa được vì dòng hàng sẽ lệch với hoá đơn điện tử đã phát hành. Lập hoá đơn điện tử điều chỉnh/thay thế ở phần mềm hoá đơn điện tử, xoá số hoá đơn điện tử ở trang hoá đơn rồi mới sửa.',
      h.ma, coalesce(nullif(concat_ws(' ', h.vat_hd_ky_hieu, h.vat_hd_so), ''), 'chưa ghi số') using errcode = 'P0001';
  end if;
  if exists (select 1 from public.ky_ke_toan where thang = to_char(h.ngay_hd, 'YYYY-MM') and trang_thai = 'da_khoa') then
    raise exception 'Tháng %/% đã khoá sổ, không sửa hoá đơn % được', to_char(h.ngay_hd, 'MM'), to_char(h.ngay_hd, 'YYYY'), h.ma using errcode = 'P0001';
  end if;
  v_gio := coalesce(nullif((select gia_tri from public.cau_hinh where khoa = 'hoa_don.khoa_sua_sau_gio'), '')::numeric, 0);
  if v_gio > 0 and h.chot_luc is not null and h.chot_luc < now() - make_interval(secs => (v_gio * 3600)::double precision) then
    raise exception 'Hoá đơn % đã chốt quá % giờ, đã khoá sửa', h.ma, v_gio using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.the_khach t join public.hoa_don_dong d on d.id = t.hoa_don_dong_id
     where d.hoa_don_id = p_id and exists (select 1 from public.the_so_cai c where c.the_id = t.id and c.loai in ('dung_buoi','tru_tien'))
  ) then
    raise exception 'Thẻ bán trong hoá đơn % đã được dùng, không sửa được — điều chỉnh thẻ trước', h.ma using errcode = 'P0001';
  end if;
  if exists (select 1 from public.voucher_luot_dung where hoa_don_id = p_id and loai = 'dung')
     or coalesce((select sum(so_diem) from public.khach_diem_so where hoa_don_id = p_id), 0) < 0 then
    raise exception 'Hoá đơn % có dùng voucher hoặc đổi điểm: chưa sửa được, hãy huỷ rồi lập hoá đơn mới', h.ma using errcode = 'P0001';
  end if;

  -- Khoá sổ (0209): dòng đảo ghi CÙNG NGÀY khoản gốc → mọi khoản sẽ đảo phải nằm ở tháng chưa khoá (kể cả lần thu nợ ở tháng khác ngày hoá đơn).
  select t.so_phieu, t.ngay into r from public.thanh_toan t
   where t.hoa_don_id = p_id and t.loai = 'thu' and t.dao_cua_id is null
     and not exists (select 1 from public.thanh_toan x where x.dao_cua_id = t.id)
     and exists (select 1 from public.ky_ke_toan k where k.thang = to_char(t.ngay, 'YYYY-MM') and k.trang_thai = 'da_khoa')
   order by t.ngay limit 1;
  if found then
    raise exception 'Hoá đơn % có khoản thu PT% ngày % thuộc tháng %/% đã khoá sổ: không sửa được (dòng đảo phải ghi vào ngày đó). Đề nghị kế toán mở lại kỳ trước.',
      h.ma, r.so_phieu, to_char(r.ngay, 'DD/MM/YYYY'), to_char(r.ngay, 'MM'), to_char(r.ngay, 'YYYY') using errcode = 'P0001';
  end if;

  -- Khoản thu: đảo từng dòng còn hiệu lực (chưa bị đảo), cùng ngày dòng gốc.
  for r in
    select t.* from public.thanh_toan t
     where t.hoa_don_id = p_id and t.loai = 'thu' and t.dao_cua_id is null
       and not exists (select 1 from public.thanh_toan x where x.dao_cua_id = t.id)
     order by t.tao_luc
  loop
    insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, the_id, ngan_hang, loai_vi, ngay, nguoi_id, ghi_chu, dao_cua_id)
    values (p_id, 'hoan', r.phuong_thuc, r.so_tien, r.the_id, r.ngan_hang, r.loai_vi, r.ngay, p_nguoi, 'Đảo do sửa hoá đơn: ' || p_ly_do, r.id);
  end loop;

  -- Lần xoá nợ còn hiệu lực → huỷ (để tính lại nợ đúng khi chốt lại).
  insert into public.hoa_don_dieu_chinh_no (hoa_don_id, loai, so_tien, ly_do, dao_cua_id, nguoi_id, ngay)
  select x.hoa_don_id, 'huy_xoa_no', x.so_tien, 'Huỷ do sửa hoá đơn: ' || p_ly_do, x.id, p_nguoi, x.ngay
    from public.hoa_don_dieu_chinh_no x
   where x.hoa_don_id = p_id and x.loai = 'xoa_no'
     and not exists (select 1 from public.hoa_don_dieu_chinh_no y where y.dao_cua_id = x.id);

  -- Thẻ bán trong đơn (chưa dùng): thu hồi về 0, gỡ khỏi dòng hàng (dòng hàng được xoá/sửa khi nháp). Sổ thẻ vẫn giữ hoa_don_id.
  for r in
    select t.id, coalesce(sum(c.so_buoi), 0) as sb, coalesce(sum(c.so_tien), 0) as st
      from public.the_khach t join public.hoa_don_dong d on d.id = t.hoa_don_dong_id
      left join public.the_so_cai c on c.the_id = t.id
     where d.hoa_don_id = p_id group by t.id
  loop
    insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, hoa_don_id, nguoi_id, ghi_chu)
    values (r.id, 'thu_hoi', -r.sb, -r.st, p_id, p_nguoi, 'Thu hồi do sửa hoá đơn ' || h.ma);
    update public.the_khach set trang_thai = 'thu_hoi', hoa_don_dong_id = null where id = r.id;
  end loop;

  -- Kho: trả phần ròng đã xuất của đơn.
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, hoa_don_id, nguoi_id, ghi_chu)
  select chi_nhanh_id, san_pham_id, 'dieu_chinh', -sum(so_luong), p_id, p_nguoi, 'Trả kho do sửa hoá đơn ' || h.ma
    from public.kho_so_cai where hoa_don_id = p_id and loai in ('xuat_ban', 'dieu_chinh')
   group by chi_nhanh_id, san_pham_id having sum(so_luong) <> 0;

  update public.hoa_don set trang_thai = 'nhap', chot_luc = null, mo_lai_luc = now() where id = p_id;
  perform public.tinh_lai_hoa_don(p_id);
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (p_nguoi, 'mo_lai_hoa_don', 'hoa_don', p_id, jsonb_build_object('ma', h.ma, 'ly_do', p_ly_do, 'tong_phai_thu', h.tong_phai_thu, 'da_thu', h.da_thu));
end $$;
revoke all on function public.mo_lai_hoa_don(uuid, text, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
