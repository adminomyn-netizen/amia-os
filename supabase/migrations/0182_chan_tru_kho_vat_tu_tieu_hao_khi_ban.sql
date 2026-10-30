-- 0182 — Kho bước 3/3 (chị Lâm 30/10/2026): vật tư tiêu hao dùng trong ca chỉ được XUẤT qua PHIẾU CẤP (trước ca), không trừ kho lần nữa khi chốt hoá đơn.
-- chot_hoa_don vốn chỉ trừ dòng hàng loại 'san_pham' (hàng bán) và POS chỉ cho chọn hàng ban_le; thêm chốt chặn ở sổ kho: dòng 'xuat_ban' (bán, số âm) của
-- mặt hàng tiêu hao KHÔNG bán lẻ bị từ chối, để dù có đường nào lọt vào hoá đơn cũng không trừ kho đôi. Mặt hàng vừa bán lẻ vừa tiêu hao (vd VT0225 thuốc giảm đau)
-- vẫn bán được vì bán thật là một lần xuất khác với liều dùng trong ca. Dòng dương (hoàn kho khi huỷ) không bị chặn.

create function public.trg_kho_chan_ban_vat_tu_tieu_hao() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_ten text;
begin
  if new.loai = 'xuat_ban' and new.so_luong < 0 then
    select s.ten into v_ten from public.san_pham s where s.id = new.san_pham_id and s.tieu_hao and not s.ban_le;
    if found then
      raise exception '"%" là vật tư tiêu hao dùng trong ca, kho đã trừ lúc cấp theo phiếu. Không bán và không trừ kho qua hoá đơn.', v_ten using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger kho_chan_ban_vat_tu_tieu_hao before insert on public.kho_so_cai
  for each row execute function public.trg_kho_chan_ban_vat_tu_tieu_hao();

select public.khoa_tat_ca_bang();
