-- 0328 — "Xoá" ở khung Chờ thanh toán cho HOÁ ĐƠN ĐÃ MỞ LẠI ĐỂ SỬA (chị Lâm 10/11/2026: "xoá đơn chứ em"):
-- không xoá hoá đơn đã chốt, mà BỎ SỬA = trả hoá đơn về đã chốt y như trước khi mở lại.
-- Cách làm (sổ cái chỉ ghi thêm, không sửa/xoá dòng cũ):
--   1) Các khoản thu mà mo_lai_hoa_don đã đảo (dòng 'hoan' ghi từ lúc mở lại) → ghi lại một dòng 'thu' mới, cùng hình thức, cùng tài khoản nhận, CÙNG NGÀY khoản gốc.
--      Dòng ghi lại KHÔNG gắn dao_cua_id (cột này chỉ dành cho dòng đảo; mo_lai/huy_hoa_don coi 'thu' có dao_cua_id là dòng lạ), ghi số phiếu gốc ở ghi chú.
--   2) Các lần xoá nợ mà mo_lai_hoa_don đã huỷ (huy_xoa_no) → ghi lại 'xoa_no' cùng số tiền, cùng ngày.
--   3) chot_hoa_don như một lần chốt lại không đổi gì (dòng hàng chưa bị đụng tới khi chưa bấm Chốt ở Thu ngân): cấp lại thẻ đã thu hồi, xuất kho lại, cộng điểm, hoa hồng — y như đường chốt lại thường.
-- Chặn: còn khoản thu nào chưa bị đảo (mở lại đã đảo hết khoản cũ, nên đó là khoản thu MỚI ghi sau lúc mở lại) → không bỏ sửa được (chốt lại ở Thu ngân hoặc huỷ hoá đơn).
-- Quyền kiểm ở máy chủ app (ban.sua hoặc ban.huy) trước khi gọi; hàm chỉ service_role gọi được.
create or replace function public.bo_sua_hoa_don(p_id uuid, p_nguoi uuid)
returns jsonb language plpgsql set search_path to 'public', 'pg_temp' as $$
declare h public.hoa_don; r record; v_thu int := 0; v_tien bigint := 0; v_xoa int := 0;
begin
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.trang_thai <> 'nhap' or h.mo_lai_luc is null then
    raise exception 'Hoá đơn % không ở trạng thái đang sửa (có thể đã chốt lại ở máy khác). Tải lại trang.', h.ma using errcode = 'P0001';
  end if;
  if h.la_lich_su or h.la_so_du_dau then raise exception 'Hoá đơn % chuyển từ SalonHero, không bỏ sửa ở AMIA được', h.ma using errcode = 'P0001'; end if;
  if exists (select 1 from public.ky_ke_toan where thang = to_char(h.ngay_hd, 'YYYY-MM') and trang_thai = 'da_khoa') then
    raise exception 'Tháng %/% đã khoá sổ, không bỏ sửa hoá đơn % được', to_char(h.ngay_hd, 'MM'), to_char(h.ngay_hd, 'YYYY'), h.ma using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.thanh_toan t
     where t.hoa_don_id = p_id and t.loai = 'thu'
       and not exists (select 1 from public.thanh_toan x where x.dao_cua_id = t.id)
  ) then
    raise exception 'Hoá đơn % đã có khoản thu mới sau khi mở sửa: không bỏ sửa được. Mở đơn ở Thu ngân để chốt lại, hoặc huỷ hoá đơn ở trang hoá đơn.', h.ma using errcode = 'P0001';
  end if;

  -- 1) Ghi lại các khoản thu mà LẦN MỞ LẠI NÀY đã đảo: dòng đảo do mo_lai_hoa_don ghi có tao_luc = now() của giao dịch mở lại = đúng mo_lai_luc
  --    (dòng đảo của lần mở lại cũ hơn, hay của lần chốt lại lỗi giữa chừng, có giờ khác nên không bị lấy).
  for r in
    select o.* from public.thanh_toan hx join public.thanh_toan o on o.id = hx.dao_cua_id
     where hx.hoa_don_id = p_id and hx.loai = 'hoan' and hx.tao_luc = h.mo_lai_luc and o.loai = 'thu'
     order by o.tao_luc
  loop
    insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, the_id, ngan_hang, tai_khoan_id, loai_vi, ngay, nguoi_id, ghi_chu)
    values (p_id, 'thu', r.phuong_thuc, r.so_tien, r.the_id, r.ngan_hang, r.tai_khoan_id, r.loai_vi, r.ngay, p_nguoi, 'Ghi lại PT' || r.so_phieu || ' do bỏ sửa hoá đơn ' || h.ma);
    v_thu := v_thu + 1; v_tien := v_tien + r.so_tien;
  end loop;

  -- 2) Ghi lại các lần xoá nợ mà lần mở lại này đã huỷ.
  for r in
    select o.* from public.hoa_don_dieu_chinh_no y join public.hoa_don_dieu_chinh_no o on o.id = y.dao_cua_id
     where y.hoa_don_id = p_id and y.loai = 'huy_xoa_no' and y.tao_luc = h.mo_lai_luc
     order by o.id
  loop
    insert into public.hoa_don_dieu_chinh_no (hoa_don_id, loai, so_tien, ly_do, nguoi_id, ngay)
    values (p_id, 'xoa_no', r.so_tien, left('Ghi lại do bỏ sửa hoá đơn: ' || r.ly_do, 500), p_nguoi, r.ngay);
    v_xoa := v_xoa + 1;
  end loop;
  perform public.tinh_lai_hoa_don(p_id);

  -- 3) Chốt lại như cũ (giữ mã, ngày, dòng hàng).
  perform public.chot_hoa_don(p_id, p_nguoi);
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (p_nguoi, 'bo_sua_hoa_don', 'hoa_don', p_id, jsonb_build_object('ma', h.ma, 'mo_lai_luc', h.mo_lai_luc, 'so_khoan_thu_ghi_lai', v_thu, 'tien_thu_ghi_lai', v_tien, 'so_lan_xoa_no_ghi_lai', v_xoa));
  return jsonb_build_object('ma', h.ma, 'so_khoan_thu', v_thu, 'tien', v_tien, 'so_xoa_no', v_xoa);
end $$;
revoke all on function public.bo_sua_hoa_don(uuid, uuid) from public, anon, authenticated;
grant execute on function public.bo_sua_hoa_don(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
