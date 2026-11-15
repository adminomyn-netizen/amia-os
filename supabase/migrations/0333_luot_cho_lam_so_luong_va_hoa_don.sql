-- 0333 — LƯỢT "KHÁCH CHỜ LÀM" (buoi_cho_lam, 0321): TRỪ NHIỀU BUỔI MỘT LƯỢT + LƯỢT TỪ HOÁ ĐƠN DỊCH VỤ (quản lý cơ sở 15/11/2026).
-- CHỈ THÊM / NỚI: không xoá cột, không đổi thuc_hien_buoi / ghi_nguoi_buoi / tao_phieu_theo_buoi, không đụng dữ liệu cũ (lượt cũ so_luong = 1).
--
-- 1) so_luong: một thẻ, một dịch vụ, NHIỀU người cùng làm (vd 3 người nhóm cùng làm "chăm sóc da AC" trên một thẻ → trừ 3 buổi).
--    Kết thúc gọi ĐÚNG thuc_hien_buoi so_luong lần (mỗi lần 1 buổi + 1 dòng sổ cái -1, sổ cái chỉ ghi thêm); thẻ không đủ buổi thì cả giao dịch huỷ.
--    buoi_id = buổi đầu (giữ ràng buộc cũ), buoi_ids = mọi buổi của lượt. Chỉ mục một-lượt-mở (the_id, dich_vu_id) giữ nguyên.
-- 2) Lượt từ hoá đơn dịch vụ: hoá đơn có dòng DỊCH VỤ (khách trả tiền, không trừ thẻ) → mỗi dòng một lượt cho chuyên viên trị liệu
--    xác nhận (Bắt đầu làm / Kết thúc). Lượt này the_id = null, gắn hoa_don_id + hoa_don_dong_id.
--    Kết thúc lượt hoá đơn CHỈ đóng lượt: không trừ thẻ, không sổ cái, không tạo buổi (doanh thu đã nằm ở hoá đơn — tạo buổi sẽ đếm trùng "Buổi đã làm").
set lock_timeout = '4s';

alter table public.buoi_cho_lam add column if not exists so_luong int not null default 1;
alter table public.buoi_cho_lam add column if not exists buoi_ids uuid[] not null default '{}';
alter table public.buoi_cho_lam add column if not exists hoa_don_id uuid references public.hoa_don (id);
-- Sửa hoá đơn (mở lại về nháp) xoá rồi ghi lại dòng: lượt giữ lại, chỉ mất liên kết dòng.
alter table public.buoi_cho_lam add column if not exists hoa_don_dong_id uuid references public.hoa_don_dong (id) on delete set null;
alter table public.buoi_cho_lam alter column the_id drop not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'buoi_cho_lam_so_luong_check' and conrelid = 'public.buoi_cho_lam'::regclass) then
    alter table public.buoi_cho_lam add constraint buoi_cho_lam_so_luong_check check (so_luong between 1 and 99);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'buoi_cho_lam_the_hoac_hoa_don' and conrelid = 'public.buoi_cho_lam'::regclass) then
    alter table public.buoi_cho_lam add constraint buoi_cho_lam_the_hoac_hoa_don check (the_id is not null or hoa_don_id is not null);
  end if;
end $$;
-- Lượt hoá đơn xong không có buổi: nới ràng buộc "xong phải có buổi" cho riêng lượt không thẻ.
alter table public.buoi_cho_lam drop constraint if exists buoi_cho_lam_xong_co_buoi;
alter table public.buoi_cho_lam add constraint buoi_cho_lam_xong_co_buoi check (trang_thai <> 'xong' or buoi_id is not null or the_id is null);
create index if not exists buoi_cho_lam_hoa_don_idx on public.buoi_cho_lam (hoa_don_id) where hoa_don_id is not null;

create or replace function public.xong_buoi_cho(p_id uuid, p_nv uuid[], p_bac_si uuid, p_tham_so jsonb, p_ghi_chu text,
  p_tu_van uuid[], p_tinh_trang text, p_de_xuat text, p_nguoi uuid)
returns uuid language plpgsql as $$
declare c public.buoi_cho_lam; v_nv uuid[]; v_buoi uuid; v_dau uuid; v_ds uuid[] := '{}'; i int;
begin
  select * into c from public.buoi_cho_lam where id = p_id for update;
  if not found then raise exception 'Không có lượt chờ làm này' using errcode = 'P0001'; end if;
  if c.trang_thai not in ('cho_lam', 'dang_lam') then raise exception 'Lượt này đã xử lý rồi (đã xong / trả lại / huỷ)' using errcode = 'P0001'; end if;
  v_nv := case when cardinality(coalesce(p_nv, '{}')) > 0 then p_nv else c.nv_ids end;
  if c.the_id is null then
    -- Lượt từ hoá đơn dịch vụ: chuyên viên xác nhận đã làm. Không thẻ, không sổ cái, không buổi.
    update public.buoi_cho_lam set trang_thai = 'xong', nv_ids = v_nv, bac_si_id = coalesce(p_bac_si, c.bac_si_id), tham_so = coalesce(p_tham_so, c.tham_so),
      ghi_chu = coalesce(nullif(btrim(coalesce(p_ghi_chu, '')), ''), c.ghi_chu), xong_luc = now(), xu_ly_boi = p_nguoi, cap_nhat_luc = now(),
      bat_dau_luc = coalesce(bat_dau_luc, now()) where id = p_id;
    return null;
  end if;
  for i in 1..greatest(c.so_luong, 1) loop
    v_buoi := public.thuc_hien_buoi(c.the_id, c.dich_vu_id, v_nv[1], coalesce(p_bac_si, c.bac_si_id), c.lich_hen_id, public.hom_nay(),
      coalesce(p_tham_so, c.tham_so), coalesce(nullif(btrim(coalesce(p_ghi_chu, '')), ''), c.ghi_chu), p_nguoi);
    -- Tư vấn / phiếu tư vấn chỉ ghi vào buổi đầu (một lần tư vấn cho cả lượt); người làm ghi cho mọi buổi.
    if i = 1 then
      v_dau := v_buoi;
      perform public.ghi_nguoi_buoi(v_buoi, v_nv, case when p_tu_van is null then c.tu_van_ids else p_tu_van end,
        coalesce(p_tinh_trang, c.tu_van_tinh_trang), coalesce(p_de_xuat, c.tu_van_de_xuat), p_nguoi);
    else
      perform public.ghi_nguoi_buoi(v_buoi, v_nv, '{}'::uuid[], null, null, p_nguoi);
    end if;
    v_ds := v_ds || v_buoi;
  end loop;
  update public.buoi_cho_lam set trang_thai = 'xong', buoi_id = v_dau, buoi_ids = v_ds, xong_luc = now(), xu_ly_boi = p_nguoi, cap_nhat_luc = now(),
    bat_dau_luc = coalesce(bat_dau_luc, now()) where id = p_id;
  return v_dau;
end $$;

reset lock_timeout;
select public.khoa_tat_ca_bang();
