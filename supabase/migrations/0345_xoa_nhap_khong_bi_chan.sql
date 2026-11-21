-- 21/11: đơn tạo dở (thanh toán lỗi / mất mạng) phải tự xoá được nháp.
-- Trước đây xoá hoá đơn nháp kéo theo xoá dòng hàng; lúc đó hoá đơn cha đã mất nên trigger đọc ra trạng thái rỗng
-- và báo "Hoá đơn đã chốt hoặc đã huỷ" → nháp không xoá được, để lại đơn nháp rác (HD000039–041 của khách Phương Thảo).
create or replace function public.trg_dong_hoa_don_nhap() returns trigger language plpgsql as $$
declare v_hd uuid; v_tt text; v_ls boolean;
begin
  if current_setting('amia.go_dot', true) = 'on' then return coalesce(old, new); end if;
  v_hd := coalesce(new.hoa_don_id, old.hoa_don_id);
  select trang_thai, la_lich_su into v_tt, v_ls from public.hoa_don where id = v_hd;
  if not found and tg_op = 'DELETE' then return old; end if;
  if v_ls is not true and v_tt is distinct from 'nhap' then
    raise exception 'Hoá đơn đã chốt hoặc đã huỷ, không sửa dòng hàng được' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create or replace function public.trg_dong_nv_chi_khi_nhap() returns trigger language plpgsql as $$
declare v_tt text; v_ls boolean;
begin
  if current_setting('amia.go_dot', true) = 'on' then return coalesce(old, new); end if;
  select h.trang_thai, h.la_lich_su into v_tt, v_ls from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
   where d.id = coalesce(new.dong_id, old.dong_id);
  if not found and tg_op = 'DELETE' then return old; end if;
  if v_ls is not true and v_tt is distinct from 'nhap' then
    raise exception 'Hoá đơn đã chốt hoặc đã huỷ, không đổi người hưởng được' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;
