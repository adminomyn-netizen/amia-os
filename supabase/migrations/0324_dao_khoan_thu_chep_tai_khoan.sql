-- 0324 — Khoản HOÀN do huỷ hoá đơn / mở lại để sửa / huỷ lần trả nợ chép luôn tài khoản nhận (thanh_toan.tai_khoan_id, 0323) của khoản gốc,
-- để sổ thu tiền theo từng tài khoản tự trừ đúng. Thân hàm lấy NGUYÊN từ DB (pg_get_functiondef, 10/11/2026) — bản mới nhất ở 0201 / 0209 / 0210 —
-- chỉ thêm cột tai_khoan_id vào câu insert (và group by của huy_hoa_don). Không đổi logic khác.

CREATE OR REPLACE FUNCTION public.huy_hoa_don(p_id uuid, p_ly_do text, p_nguoi uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    select phuong_thuc, the_id, ngan_hang, tai_khoan_id, loai_vi, sum(case loai when 'thu' then so_tien else -so_tien end) as rong
      from public.thanh_toan where hoa_don_id = p_id group by phuong_thuc, the_id, ngan_hang, tai_khoan_id, loai_vi
  loop
    if r.rong > 0 then
      insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, the_id, ngan_hang, tai_khoan_id, loai_vi, nguoi_id, ghi_chu)
      values (p_id, 'hoan', r.phuong_thuc, r.rong, r.the_id, r.ngan_hang, r.tai_khoan_id, r.loai_vi, p_nguoi, 'Hoàn do huỷ hoá đơn: ' || p_ly_do);
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
  select chi_nhanh_id, san_pham_id, 'dieu_chinh', -sum(so_luong), p_id, p_nguoi, 'Trả kho do huỷ hoá đơn'
    from public.kho_so_cai where hoa_don_id = p_id and loai in ('xuat_ban', 'dieu_chinh')
   group by chi_nhanh_id, san_pham_id having sum(so_luong) <> 0;

  update public.hoa_don set trang_thai = 'huy', huy_luc = now(), ly_do_huy = p_ly_do where id = p_id;
end $function$;

CREATE OR REPLACE FUNCTION public.huy_lan_tra_no(p_id uuid, p_ref text, p_nguoi uuid, p_ly_do text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare h public.hoa_don; c record; t public.thanh_toan; x public.hoa_don_dieu_chinh_no;
begin
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.trang_thai <> 'hoan_thanh' then raise exception 'Chỉ huỷ lần trả nợ của hoá đơn đã hoàn thành' using errcode = 'P0001'; end if;
  if h.la_lich_su then raise exception 'Hoá đơn % chuyển từ SalonHero (còn đồng bộ tới 15/11): huỷ trả nợ ở SalonHero', coalesce(h.sh_ma, h.ma) using errcode = 'P0001'; end if;
  select * into c from public.lich_su_no_hoa_don(p_id) where la_cuoi;
  if not found then raise exception 'Hoá đơn % chưa có lần trả nợ nào để huỷ', h.ma using errcode = 'P0001'; end if;
  if c.ref is distinct from p_ref then raise exception 'Chỉ huỷ được dòng cuối cùng của lịch sử nợ. Tải lại trang rồi thử lại.' using errcode = 'P0001'; end if;
  if c.loai = 'tra_no' then
    select * into t from public.thanh_toan where id = c.ref::uuid;
    if exists (select 1 from public.ky_ke_toan k where k.thang = to_char(t.ngay, 'YYYY-MM') and k.trang_thai = 'da_khoa') then
      raise exception 'Lần trả nợ PT% ngày % thuộc tháng %/% đã khoá sổ: không huỷ được. Đề nghị kế toán mở lại kỳ trước.',
        t.so_phieu, to_char(t.ngay, 'DD/MM/YYYY'), to_char(t.ngay, 'MM'), to_char(t.ngay, 'YYYY') using errcode = 'P0001';
    end if;
    insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngan_hang, tai_khoan_id, loai_vi, ngay, nguoi_id, dao_cua_id, ghi_chu)
    values (p_id, 'hoan', t.phuong_thuc, t.so_tien, t.ngan_hang, t.tai_khoan_id, t.loai_vi, t.ngay, p_nguoi, t.id,
            'Huỷ lần trả nợ PT' || t.so_phieu || coalesce(': ' || nullif(btrim(p_ly_do), ''), ''));
  else
    select * into x from public.hoa_don_dieu_chinh_no where id = c.ref::bigint;
    insert into public.hoa_don_dieu_chinh_no (hoa_don_id, loai, so_tien, ly_do, dao_cua_id, nguoi_id)
    values (p_id, 'huy_xoa_no', x.so_tien, coalesce(nullif(btrim(p_ly_do), ''), 'Huỷ lần xoá nợ'), x.id, p_nguoi);
    perform public.tinh_lai_hoa_don(p_id);
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.mo_lai_hoa_don(p_id uuid, p_ly_do text, p_nguoi uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
     or coalesce((select sum(so_diem) from public.khach_diem_so where hoa_don_id = p_id and loai = 'doi_diem'), 0) < 0 then
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
    insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, the_id, ngan_hang, tai_khoan_id, loai_vi, ngay, nguoi_id, ghi_chu, dao_cua_id)
    values (p_id, 'hoan', r.phuong_thuc, r.so_tien, r.the_id, r.ngan_hang, r.tai_khoan_id, r.loai_vi, r.ngay, p_nguoi, 'Đảo do sửa hoá đơn: ' || p_ly_do, r.id);
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
end $function$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
