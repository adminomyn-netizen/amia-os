-- Như Lark (REMOVE_REPEAT): chức danh chỉ có đúng người lập giữ thì bước đó tự qua, không bắt người lập tự duyệt phiếu của mình.
-- Chỉ bỏ qua khi còn ít nhất một bước khác để người khác duyệt; hết bước thì giữ nguyên (Kỹ thuật duyệt thay được).
create or replace function public.tao_buoc_duyet(p_de_xuat uuid) returns int language plpgsql as $$
declare d public.de_xuat; g public.de_xuat; v_tien bigint; n int := 0; b record; v_cho int;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if exists (select 1 from public.de_xuat_buoc_duyet where de_xuat_id = d.id) then return 0; end if;
  if not exists (select 1 from public.quy_trinh_duyet where ma = d.loai and hoat_dong) then return 0; end if;
  v_tien := coalesce(d.so_tien, 0);
  if d.loai = 'hoan_ung' then
    select * into g from public.de_xuat where id = d.de_xuat_goc_id;
    v_tien := greatest(v_tien - coalesce(g.so_tien, 0), 0);
  end if;
  for b in
    select s.*, q.nguong_tien from public.quy_trinh_duyet_buoc s left join public.quy_tac_duyet q on q.ma = s.nguong_quy_tac
    where s.quy_trinh_ma = d.loai order by s.thu_tu
  loop
    if b.nguong_quy_tac is not null and v_tien < b.nguong_tien then continue; end if;
    insert into public.de_xuat_buoc_duyet (de_xuat_id, thu_tu, ten, nguoi_duyet_loai, nguoi_duyet_gia_tri, du_phong_vai_tro, kiem_han_muc, sla_ngay, han_xu_ly)
      values (d.id, b.thu_tu, b.ten, b.nguoi_duyet_loai, b.nguoi_duyet_gia_tri, b.du_phong_vai_tro, b.kiem_han_muc, b.sla_ngay, null);
    n := n + 1;
  end loop;
  -- bước chức danh mà người giữ chức danh chỉ có người lập → tự qua
  update public.de_xuat_buoc_duyet s
     set trang_thai = 'da_duyet', nguoi_id = d.nguoi_gui_id, luc = now(), ghi_chu = 'Tự qua: người lập đồng thời là người duyệt bước này (như Lark)'
   where s.de_xuat_id = d.id and s.nguoi_duyet_loai = 'chuc_danh'
     and exists (select 1 from public.nhan_vien h where h.chuc_danh_tai_chinh = s.nguoi_duyet_gia_tri and h.hoat_dong)
     and not exists (select 1 from public.nhan_vien h where h.chuc_danh_tai_chinh = s.nguoi_duyet_gia_tri and h.hoat_dong and h.id <> d.nguoi_gui_id)
     and exists (select 1 from public.de_xuat_buoc_duyet o where o.de_xuat_id = d.id and o.id <> s.id and o.trang_thai = 'cho'
                  and not (o.nguoi_duyet_loai = 'chuc_danh'
                           and exists (select 1 from public.nhan_vien h where h.chuc_danh_tai_chinh = o.nguoi_duyet_gia_tri and h.hoat_dong)
                           and not exists (select 1 from public.nhan_vien h where h.chuc_danh_tai_chinh = o.nguoi_duyet_gia_tri and h.hoat_dong and h.id <> d.nguoi_gui_id)));
  select min(thu_tu) into v_cho from public.de_xuat_buoc_duyet where de_xuat_id = d.id and trang_thai = 'cho';
  if v_cho is not null then
    update public.de_xuat_buoc_duyet set han_xu_ly = public.hom_nay() + sla_ngay where de_xuat_id = d.id and thu_tu = v_cho;
  end if;
  return n;
end $$;
revoke all on function public.tao_buoc_duyet(uuid) from public, anon, authenticated;
select public.khoa_tat_ca_bang();
