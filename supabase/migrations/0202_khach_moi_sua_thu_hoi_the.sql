-- 0202 — (câu 15) cờ "Khách mới" gắn cố định lên lịch hẹn lúc tạo, như SalonHero (is_new_customer).
--        (câu 8, 9) chuẩn bị: Sửa thẻ (hạn / chủ thẻ / giá 1 buổi) và Thu hồi thẻ là hàm Postgres 1 giao dịch, có khoá dòng, ghi sổ cái thẻ.
-- Chỉ thêm cột / hàm / trigger / giá trị kiểm; không đổi kiểu dữ liệu cũ.

-- ───────── Câu 15: Khách mới ─────────
-- Luật (suy từ dữ liệu SalonHero, 3.475/3.475 lịch "mới" khớp): lịch là "khách mới" nếu lúc tạo khách CHƯA có lịch hẹn nào khác và CHƯA có hoá đơn hoàn thành.
-- Gắn 1 lần ở BEFORE INSERT, không tính lại khi sửa lịch. Ai chèn sẵn giá trị (vd đồng bộ từ SalonHero mang cờ gốc) thì giữ nguyên.
alter table public.lich_hen add column if not exists khach_moi boolean;
comment on column public.lich_hen.khach_moi is 'Khách mới lúc tạo lịch (gắn 1 lần, không tính lại): chưa có lịch hẹn nào khác và chưa có hoá đơn hoàn thành. Lịch chuyển từ SalonHero giữ cờ gốc is_new_customer.';

create or replace function public.trg_lich_hen_khach_moi() returns trigger language plpgsql as $$
begin
  if new.khach_moi is null and new.khach_id is not null then
    new.khach_moi := not exists (select 1 from public.lich_hen l where l.khach_id = new.khach_id and l.id is distinct from new.id)
                 and not exists (select 1 from public.hoa_don h where h.khach_id = new.khach_id and h.trang_thai = 'hoan_thanh');
  end if;
  return new;
end $$;
revoke all on function public.trg_lich_hen_khach_moi() from public, anon, authenticated;
drop trigger if exists lich_hen_khach_moi on public.lich_hen;
create trigger lich_hen_khach_moi before insert on public.lich_hen for each row execute function public.trg_lich_hen_khach_moi();

-- Lọc Khách mới / quay lại ở Lịch sử lịch hẹn theo chi nhánh + khoảng ngày (đã có lich_hen_chi_nhanh theo bat_dau); không cần chỉ mục riêng cho cờ.

-- ───────── Câu 8 / 9: sổ cái thẻ thêm loại 'sua_the' (0 buổi, 0 tiền) ─────────
alter table public.the_so_cai drop constraint if exists the_so_cai_loai_check;
alter table public.the_so_cai add constraint the_so_cai_loai_check
  check (loai in ('cap','dung_buoi','hoan_buoi','dieu_chinh','nap','tru_tien','hoan_tien','thu_hoi','khoa','mo_khoa','sua_the'));
alter table public.the_so_cai add constraint the_so_cai_sua_the_khong_doi_so check (loai <> 'sua_the' or (so_buoi = 0 and so_tien = 0));

-- Sửa thẻ (SalonHero "Sửa thẻ", quyền memberCards.update): hạn dùng, chủ thẻ, giá 1 buổi làm dịch vụ, ghi chú.
-- Không đụng số buổi / số dư. Mỗi lần sửa ghi 1 dòng sổ cái 'sua_the' (0, 0) kèm "cũ → mới" để biết ai sửa gì, lúc nào.
-- p_doi_han / p_doi_chu / p_doi_gia / p_doi_ghi_chu = có sửa mục đó không (cho phép xoá hạn → không hạn, xoá ghi chú).
create or replace function public.sua_the(
  p_the uuid, p_nguoi uuid,
  p_doi_han boolean default false, p_han date default null,
  p_doi_chu boolean default false, p_khach uuid default null,
  p_doi_gia boolean default false, p_gia bigint default null,
  p_doi_ghi_chu boolean default false, p_ghi_chu text default null,
  p_ly_do text default null
) returns void language plpgsql as $$
declare t public.the_khach; k_cu record; k_moi record; v_doi text[] := '{}';
begin
  select * into t from public.the_khach where id = p_the for update;
  if not found then raise exception 'Không tìm thấy thẻ' using errcode = 'P0001'; end if;
  if t.trang_thai = 'thu_hoi' then raise exception 'Thẻ đã thu hồi, không sửa được' using errcode = 'P0001'; end if;

  if p_doi_han and p_han is distinct from t.han_dung then
    if p_han is not null and p_han < t.ngay_cap then raise exception 'Hạn thẻ không được trước ngày cấp (%)', to_char(t.ngay_cap, 'DD/MM/YYYY') using errcode = 'P0001'; end if;
    v_doi := v_doi || format('Hạn: %s → %s', coalesce(to_char(t.han_dung, 'DD/MM/YYYY'), 'không hạn'), coalesce(to_char(p_han, 'DD/MM/YYYY'), 'không hạn'));
    update public.the_khach set han_dung = p_han where id = p_the;
  end if;

  if p_doi_chu and p_khach is not null and p_khach is distinct from t.khach_id then
    select id, ho_ten, ma, chi_nhanh_id into k_moi from public.khach_hang where id = p_khach;
    if not found then raise exception 'Không tìm thấy khách hàng mới' using errcode = 'P0001'; end if;
    if k_moi.chi_nhanh_id is distinct from t.chi_nhanh_id then raise exception 'Chủ thẻ mới phải là khách cùng chi nhánh với thẻ' using errcode = 'P0001'; end if;
    select id, ho_ten, ma into k_cu from public.khach_hang where id = t.khach_id;
    v_doi := v_doi || format('Chủ thẻ: %s (%s) → %s (%s)', coalesce(k_cu.ho_ten, '?'), coalesce(k_cu.ma, '?'), k_moi.ho_ten, coalesce(k_moi.ma, ''));
    update public.the_khach set khach_id = p_khach where id = p_the;
  end if;

  if p_doi_gia and p_gia is distinct from t.gia_tri_buoi then
    if p_gia is null or p_gia < 0 then raise exception 'Giá 1 buổi phải là số tiền không âm' using errcode = 'P0001'; end if;
    v_doi := v_doi || format('Giá 1 buổi: %s → %s', to_char(coalesce(t.gia_tri_buoi, 0), 'FM999G999G999G999'), to_char(p_gia, 'FM999G999G999G999'));
    update public.the_khach set gia_tri_buoi = p_gia where id = p_the;
  end if;

  if p_doi_ghi_chu and coalesce(nullif(trim(p_ghi_chu), ''), '') is distinct from coalesce(t.ghi_chu, '') then
    v_doi := v_doi || format('Ghi chú: %s → %s', coalesce(nullif(t.ghi_chu, ''), '(trống)'), coalesce(nullif(trim(p_ghi_chu), ''), '(trống)'));
    update public.the_khach set ghi_chu = nullif(trim(p_ghi_chu), '') where id = p_the;
  end if;

  if cardinality(v_doi) = 0 then raise exception 'Chưa có gì thay đổi' using errcode = 'P0001'; end if;
  insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu)
  values (p_the, 'sua_the', 0, 0, p_nguoi, left(array_to_string(v_doi, ' · ') || coalesce(' · Lý do: ' || nullif(trim(p_ly_do), ''), ''), 1000));
end $$;
revoke all on function public.sua_the(uuid, uuid, boolean, date, boolean, uuid, boolean, bigint, boolean, text, text) from public, anon, authenticated;

-- Thu hồi thẻ (SalonHero: is_revoked + "lý do thu hồi", KHÔNG hoàn tiền, không đụng quỹ / hoá đơn; thẻ đã thu hồi không cấp lại được).
-- Số buổi / số dư giữ nguyên trong sổ (như 1.453 thẻ thu hồi chuyển từ SalonHero); tình trạng thẻ thành "Đã thu hồi" nên không dùng được nữa.
create or replace function public.thu_hoi_the(p_the uuid, p_ly_do text, p_nguoi uuid) returns void language plpgsql as $$
declare t public.the_khach;
begin
  if length(coalesce(trim(p_ly_do), '')) < 3 then raise exception 'Nhập lý do thu hồi thẻ (ít nhất 3 ký tự)' using errcode = 'P0001'; end if;
  select * into t from public.the_khach where id = p_the for update;
  if not found then raise exception 'Không tìm thấy thẻ' using errcode = 'P0001'; end if;
  if t.trang_thai = 'thu_hoi' then raise exception 'Thẻ này đã thu hồi rồi' using errcode = 'P0001'; end if;
  update public.the_khach set trang_thai = 'thu_hoi' where id = p_the;
  insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu) values (p_the, 'thu_hoi', 0, 0, p_nguoi, left(trim(p_ly_do), 500));
end $$;
revoke all on function public.thu_hoi_the(uuid, text, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
