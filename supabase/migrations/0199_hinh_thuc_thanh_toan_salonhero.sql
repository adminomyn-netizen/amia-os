-- 0199 — Hình thức trả tiền như SalonHero (câu 1, chị Lâm 03/11/2026: "SalonHero làm sao thì làm y vậy").
-- SalonHero (Config.payment_type + wallet_types): Tiền mặt, Quẹt thẻ, Chuyển khoản, Ship COD, Ví điện tử (+ loại ví), Nhiều hình thức (= nhiều dòng thu).
--   Ở Việt Nam hộp Thanh toán hiện 8 ví: ZALO, MOMO, GRAB, VNPAY, SAMSUNG, SHOPEE, VINID, GOTIT (4 ví nước ngoài vẫn nhận khi đồng bộ dữ liệu cũ).
-- Quỹ: tiền mặt → quỹ tiền mặt; quẹt thẻ, chuyển khoản, ví → quỹ ngân hàng (Ship COD: SalonHero KHÔNG cộng vào tồn quỹ nào — xem 0208 của mảng sổ quỹ). v_so_quy đã làm đúng như vậy (tien_mat ↔ tien_mat, còn lại ↔ ngan_hang,
--   trừ thẻ tiền không vào quỹ), nên KHÔNG đổi v_so_quy. Trong quỹ ngân hàng tách theo tài khoản (cột ngan_hang) và theo loại ví (cột loai_vi mới).
-- Chỉ THÊM: nới ràng buộc phương thức, thêm cột loai_vi (dòng cũ = null, hợp lệ), sửa huy_hoa_don để dòng hoàn giữ đúng ngân hàng / loại ví, thêm hàm báo cáo cột ví.

alter table public.thanh_toan drop constraint thanh_toan_phuong_thuc_check;
alter table public.thanh_toan add constraint thanh_toan_phuong_thuc_check
  check (phuong_thuc in ('tien_mat', 'chuyen_khoan', 'quet_the', 'the_tien', 'ship_cod', 'vi_dien_tu'));

alter table public.thanh_toan add column loai_vi text;
alter table public.thanh_toan add constraint thanh_toan_loai_vi_check check (
  (phuong_thuc = 'vi_dien_tu') = (loai_vi is not null)
  and (loai_vi is null or loai_vi in ('ZALO', 'MOMO', 'GRAB', 'VNPAY', 'SAMSUNG', 'SHOPEE', 'VINID', 'GOTIT', 'NETSPAY', 'PAYNOW', 'AIRTEL', 'MTN', 'KHAC')));
comment on column public.thanh_toan.loai_vi is 'Loại ví điện tử (mã SalonHero) khi phuong_thuc = vi_dien_tu; KHAC = ví không rõ loại (dữ liệu cũ).';

-- Huỷ hoá đơn: hoàn theo từng (phương thức, thẻ, ngân hàng, loại ví) để dòng hoàn rơi đúng tài khoản / loại ví trong quỹ ngân hàng.
create or replace function public.huy_hoa_don(p_id uuid, p_ly_do text, p_nguoi uuid)
 returns void language plpgsql set search_path to 'public', 'pg_temp'
as $function$
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
    select phuong_thuc, the_id, ngan_hang, loai_vi, sum(case loai when 'thu' then so_tien else -so_tien end) as rong
      from public.thanh_toan where hoa_don_id = p_id group by phuong_thuc, the_id, ngan_hang, loai_vi
  loop
    if r.rong > 0 then
      insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, the_id, ngan_hang, loai_vi, nguoi_id, ghi_chu)
      values (p_id, 'hoan', r.phuong_thuc, r.rong, r.the_id, r.ngan_hang, r.loai_vi, p_nguoi, 'Hoàn do huỷ hoá đơn: ' || p_ly_do);
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
end $function$;

-- Báo cáo theo ngày: các cột ví như SalonHero (reports/report-daily.html): Momo, VNPay, Shopee Pay, GrabPay, Ví điện tử khác (= tổng ví − 4 ví trên).
-- Ship COD không có cột riêng ở SalonHero; AMIA trả thêm cột ship_cod để Thực thu cộng khớp (trang chỉ hiện khi có số).
-- Hàm riêng, KHÔNG đổi bc_doanh_thu_ngay (trang chủ, tổng quan, xuất Excel đang dùng nó).
create or replace function public.bc_doanh_thu_ngay_vi(p_tu date, p_den date, p_cn uuid default null)
returns table (ngay date, momo bigint, vnpay bigint, shopee bigint, grab bigint, vi_khac bigint, ship_cod bigint)
language sql stable set search_path to 'public', 'pg_temp' as $$
  select t.ngay,
    coalesce(sum(case when t.phuong_thuc = 'vi_dien_tu' and t.loai_vi = 'MOMO' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) end), 0)::bigint,
    coalesce(sum(case when t.phuong_thuc = 'vi_dien_tu' and t.loai_vi = 'VNPAY' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) end), 0)::bigint,
    coalesce(sum(case when t.phuong_thuc = 'vi_dien_tu' and t.loai_vi = 'SHOPEE' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) end), 0)::bigint,
    coalesce(sum(case when t.phuong_thuc = 'vi_dien_tu' and t.loai_vi = 'GRAB' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) end), 0)::bigint,
    coalesce(sum(case when t.phuong_thuc = 'vi_dien_tu' and t.loai_vi not in ('MOMO', 'VNPAY', 'SHOPEE', 'GRAB') then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) end), 0)::bigint,
    coalesce(sum(case when t.phuong_thuc = 'ship_cod' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) end), 0)::bigint
    from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
   where t.ngay between p_tu and p_den and t.phuong_thuc in ('vi_dien_tu', 'ship_cod') and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by t.ngay
$$;
revoke all on function public.bc_doanh_thu_ngay_vi(date, date, uuid) from public, anon, authenticated;

-- Quỹ ngân hàng tách theo tài khoản / loại ví như SalonHero (objectAccountBank, objectWalletTypes): tiền khách trả (bán hàng + trả nợ, trừ hoàn) theo từng
-- (hình thức, ngân hàng nhận, loại ví) trong khoảng ngày. Dòng sổ quỹ ghi tay không có tài khoản nên không tách (trang ghi rõ).
create or replace function public.quy_ngan_hang_tach(p_cn uuid[], p_tu date, p_den date)
returns table (phuong_thuc text, ngan_hang text, loai_vi text, thu bigint, hoan bigint)
language sql stable set search_path to 'public', 'pg_temp' as $$
  select t.phuong_thuc, t.ngan_hang, t.loai_vi,
         coalesce(sum(t.so_tien) filter (where t.loai = 'thu'), 0)::bigint, coalesce(sum(t.so_tien) filter (where t.loai = 'hoan'), 0)::bigint
    from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
   where t.phuong_thuc not in ('tien_mat', 'the_tien', 'ship_cod') and t.ngay between p_tu and p_den and h.chi_nhanh_id = any (p_cn)
   group by 1, 2, 3
$$;
revoke all on function public.quy_ngan_hang_tach(uuid[], date, date) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
