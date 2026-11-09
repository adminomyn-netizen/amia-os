-- Gộp nhóm khách trùng tên chỉ khác chữ hoa/thường (chị Lâm 9/11/2026: gộp về "Luxury").
-- LUXURY (SalonHero tag 4576) → Luxury (tag 8106): chuyển hết khách (giữ ngày gắn sớm nhất), xoá nhóm thừa.
-- Rồi chặn hẳn ở DB: không thể có 2 nhóm cùng tên khi bỏ qua chữ hoa/thường và khoảng trắng đầu/cuối.
do $$
declare
  giu uuid := 'f8eccbb6-fd4f-4646-a811-0051fa0d5520'; -- Luxury
  bo  uuid := '4f54d5b9-ae25-4928-a6f4-45db5ef29baf'; -- LUXURY
begin
  if exists (select 1 from public.nhom_khach where id = bo) then
    -- khách đã ở cả 2 nhóm: giữ ngày gắn sớm hơn
    update public.khach_nhom g set gan_luc = least(g.gan_luc, b.gan_luc), nhap_dot = coalesce(g.nhap_dot, b.nhap_dot)
      from public.khach_nhom b where g.nhom_id = giu and b.nhom_id = bo and b.khach_id = g.khach_id;
    -- khách chỉ ở nhóm bỏ: chuyển sang nhóm giữ
    insert into public.khach_nhom (khach_id, nhom_id, gan_luc, nhap_dot)
      select khach_id, giu, gan_luc, nhap_dot from public.khach_nhom where nhom_id = bo
      on conflict (khach_id, nhom_id) do nothing;
    update public.nhom_khach set mo_ta = 'Chuyển từ SalonHero (tag 8106 Luxury + tag 4576 LUXURY, gộp 9/11/2026)' where id = giu;
    delete from public.nhom_khach where id = bo; -- khach_nhom của nhóm bỏ xoá theo (đã chép sang nhóm giữ ở trên)
  end if;
end $$;

create unique index if not exists nhom_khach_ten_khong_trung on public.nhom_khach (lower(btrim(ten)));
