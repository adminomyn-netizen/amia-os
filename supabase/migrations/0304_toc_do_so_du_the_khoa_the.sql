-- 0304 — Số dư thẻ tính sẵn (0301): chống "ghi đè số cũ" khi 2 giao dịch cùng ghi sổ cho MỘT thẻ cùng lúc (03/11/2026).
-- Ở mức READ COMMITTED, câu insert…on conflict của giao dịch B lấy ảnh chụp lúc bắt đầu câu → không thấy dòng sổ A chưa commit;
-- B chờ khoá dòng the_so_du, A commit, B ghi đè bằng tổng cũ → bảng phụ thiếu dòng của A tới lần đối soát 00:45.
-- Sửa: trước khi tính lại, khoá các dòng the_khach liên quan (FOR NO KEY UPDATE, xếp theo id để không khoá chéo). Giao dịch sau chờ
-- giao dịch trước commit rồi mới tính → câu tính sau có ảnh chụp mới, thấy đủ dòng. Khoá dòng nằm trên bản ghi, không tốn bảng khoá
-- chung (lô 1.000 thẻ của đồng bộ đêm vẫn an toàn). NO KEY UPDATE không đụng khoá KEY SHARE của khoá ngoại khi chèn sổ cái.
create or replace function public.the_so_du_tinh(p_ids uuid[]) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then return; end if;
  perform 1 from public.the_khach where id = any(p_ids) order by id for no key update;
  insert into public.the_so_du (the_id, so_buoi, so_tien)
    select c.the_id, sum(c.so_buoi), sum(c.so_tien) from public.the_so_cai c where c.the_id = any(p_ids) group by c.the_id
  on conflict (the_id) do update set so_buoi = excluded.so_buoi, so_tien = excluded.so_tien
    where (the_so_du.so_buoi, the_so_du.so_tien) is distinct from (excluded.so_buoi, excluded.so_tien);
  delete from public.the_so_du d where d.the_id = any(p_ids) and not exists (select 1 from public.the_so_cai c where c.the_id = d.the_id);
end $$;
revoke all on function public.the_so_du_tinh(uuid[]) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
