-- 0320 (đổi số từ 0319 vì 0319 đã dùng cho mốc phục vụ). Lịch hẹn (chị Lâm 10/11/2026):
-- (1) Loại lịch chọn lúc tạo: Tư vấn khách mới / Khách liệu trình / Làm dịch vụ lẻ / Tái khám / Bảo hành. Lịch cũ để NULL.
-- (2) Lịch sử sửa lịch hẹn cho Quản lý / Leader, Kỹ thuật, Chủ xem: mỗi lần tạo / sửa / đổi lịch / đổi trạng thái / huỷ ghi 1 dòng (ai, lúc nào, trường nào từ gì sang gì).
--     Ghi bằng trigger nên không sót đường nào. Người sửa: ứng dụng đặt cột `sua_boi` trong chính câu UPDATE/INSERT (máy chủ dùng service_role nên auth.uid() rỗng);
--     trigger đọc rồi XOÁ ô đó (ô một lần) để lần ghi sau không mượn tên người trước. Ghi thẳng bằng kết nối Postgres (script đồng bộ đêm) = "Đồng bộ SalonHero".
--     Dịch vụ và khách đi cùng nằm ở bảng con (xoá rồi thêm lại) nên ứng dụng tự ghi dòng cho phần đó.

alter table public.lich_hen add column if not exists loai_lich text
  check (loai_lich is null or loai_lich in ('tu_van_moi','lieu_trinh','dich_vu_le','tai_kham','bao_hanh'));
alter table public.lich_hen add column if not exists sua_boi uuid references public.nhan_vien (id);
comment on column public.lich_hen.loai_lich is 'Loại lịch: tu_van_moi (Tư vấn khách mới), lieu_trinh (Khách liệu trình), dich_vu_le (Làm dịch vụ lẻ), tai_kham (Tái khám / kiểm tra), bao_hanh (Bảo hành / chăm sóc lại). NULL = lịch cũ.';
comment on column public.lich_hen.sua_boi is 'Ô một lần: người thực hiện câu ghi hiện tại; trigger lich_hen_zz_lich_su đọc rồi đặt lại NULL.';

create table if not exists public.lich_hen_lich_su (
  id bigint generated always as identity primary key,
  lich_id uuid not null,
  chi_nhanh_id uuid,
  khach_id uuid,
  luc timestamptz not null default now(),
  nguoi_id uuid references public.nhan_vien (id),
  nguoi_ten text not null,
  hanh_dong text not null check (hanh_dong in ('tao','sua','doi_lich','doi_trang_thai','huy')),
  thay_doi jsonb not null default '[]'::jsonb
);
create index if not exists lich_hen_lich_su_lich_idx on public.lich_hen_lich_su (lich_id, luc desc);
create index if not exists lich_hen_lich_su_luc_idx on public.lich_hen_lich_su (chi_nhanh_id, luc desc);
alter table public.lich_hen_lich_su enable row level security; -- không chính sách nào: chỉ máy chủ (service_role) đọc/ghi, cổng xem theo vai nằm ở ứng dụng
revoke all on public.lich_hen_lich_su from anon, authenticated;
drop trigger if exists lich_hen_lich_su_chi_them on public.lich_hen_lich_su;
create trigger lich_hen_lich_su_chi_them before update or delete on public.lich_hen_lich_su
  for each row execute function public.chi_them_dong();

create or replace function public.lich_hen_gt(p_truong text, p_v text) returns text language plpgsql stable set search_path = public, pg_temp as $$
begin
  if p_v is null or p_v = '' then return ''; end if;
  return case p_truong
    when 'nhan_vien_id' then coalesce((select ho_ten from public.nhan_vien where id = p_v::uuid), p_v)
    when 'khach_id' then coalesce((select ho_ten || coalesce(' (' || ma || ')', '') from public.khach_hang where id = p_v::uuid), p_v)
    when 'chi_nhanh_id' then coalesce((select ten from public.chi_nhanh where id = p_v::uuid), p_v)
    when 'trang_thai' then case p_v when 'chua_xac_nhan' then 'Chưa xác nhận' when 'da_xac_nhan' then 'Đã xác nhận' when 'cho_phuc_vu' then 'Chờ phục vụ'
      when 'dang_phuc_vu' then 'Đang phục vụ' when 'hoan_thanh' then 'Hoàn thành' when 'huy' then 'Đã huỷ' when 'khong_den' then 'Khách không đến' else p_v end
    when 'loai_lich' then case p_v when 'tu_van_moi' then 'Tư vấn khách mới' when 'lieu_trinh' then 'Khách liệu trình' when 'dich_vu_le' then 'Làm dịch vụ lẻ'
      when 'tai_kham' then 'Tái khám / kiểm tra' when 'bao_hanh' then 'Bảo hành / chăm sóc lại' else p_v end
    when 'bat_dau' then to_char(p_v::timestamptz at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY')
    when 'ket_thuc' then to_char(p_v::timestamptz at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY')
    when 'checkin_luc' then to_char(p_v::timestamptz at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY')
    else p_v end;
end $$;

create or replace function public.trg_lich_hen_zz_lich_su() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  truong text[] := array['khach_id','chi_nhanh_id','bat_dau','ket_thuc','trang_thai','loai_lich','nhan_vien_id','phong','nguon','ghi_chu','so_khach','ly_do_huy','checkin_luc'];
  nhan text[] := array['Khách hàng','Chi nhánh','Giờ bắt đầu','Giờ kết thúc','Trạng thái','Loại lịch','Người thực hiện','Phòng / giường','Nguồn đặt lịch','Ghi chú','Số khách','Lý do huỷ','Giờ đến'];
  jo jsonb; jn jsonb; doi jsonb := '[]'::jsonb; i int; cu text; moi text; hd text; ten text; claims text;
begin
  if new.sua_boi is not null then
    ten := (select ho_ten from public.nhan_vien where id = new.sua_boi);
  else
    claims := nullif(current_setting('request.jwt.claims', true), '');
    ten := case when claims is null then 'Đồng bộ SalonHero' else 'Hệ thống' end;
  end if;
  jn := to_jsonb(new);
  if tg_op = 'INSERT' then
    for i in 1 .. array_length(truong, 1) loop
      moi := jn ->> truong[i];
      if moi is not null and moi <> '' and truong[i] not in ('ly_do_huy','checkin_luc') then
        doi := doi || jsonb_build_object('truong', truong[i], 'nhan', nhan[i], 'cu', '', 'moi', public.lich_hen_gt(truong[i], moi));
      end if;
    end loop;
    hd := 'tao';
  else
    jo := to_jsonb(old);
    for i in 1 .. array_length(truong, 1) loop
      cu := jo ->> truong[i]; moi := jn ->> truong[i];
      if cu is distinct from moi and not (coalesce(cu, '') = '' and coalesce(moi, '') = '') then
        doi := doi || jsonb_build_object('truong', truong[i], 'nhan', nhan[i], 'cu', public.lich_hen_gt(truong[i], cu), 'moi', public.lich_hen_gt(truong[i], moi));
      end if;
    end loop;
    if jsonb_array_length(doi) = 0 then new.sua_boi := null; return new; end if;
    hd := case when new.trang_thai is distinct from old.trang_thai then (case when new.trang_thai = 'huy' then 'huy' else 'doi_trang_thai' end)
               when new.bat_dau is distinct from old.bat_dau or new.ket_thuc is distinct from old.ket_thuc then 'doi_lich' else 'sua' end;
  end if;
  insert into public.lich_hen_lich_su (lich_id, chi_nhanh_id, khach_id, nguoi_id, nguoi_ten, hanh_dong, thay_doi)
  values (new.id, new.chi_nhanh_id, new.khach_id, new.sua_boi, coalesce(ten, 'Không rõ'), hd, doi);
  new.sua_boi := null;
  return new;
end $$;

-- Trigger BEFORE chạy theo thứ tự tên: "lich_hen_zz_…" chạy SAU các trigger BEFORE khác (khoá ca, khách mới, đối tác, CTV) nên thấy giá trị cuối cùng.
-- Trên INSERT: id đã có (mặc định gen_random_uuid chạy trước trigger).
drop trigger if exists lich_hen_zz_lich_su on public.lich_hen;
create trigger lich_hen_zz_lich_su before insert or update on public.lich_hen
  for each row execute function public.trg_lich_hen_zz_lich_su();

-- Cổng cấu trúc (0009): mọi bảng FORCE RLS + chính sách chặn hết cho anon/authenticated; hàm không cấp cho PUBLIC.
alter table public.lich_hen_lich_su force row level security;
drop policy if exists chan_het on public.lich_hen_lich_su;
create policy chan_het on public.lich_hen_lich_su for all to anon, authenticated using (false) with check (false);
revoke execute on function public.lich_hen_gt(text, text) from public, anon, authenticated;
revoke execute on function public.trg_lich_hen_zz_lich_su() from public, anon, authenticated;
