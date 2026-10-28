-- 0082 — ĐÁNH GIÁ NHÂN VIÊN THEO ĐƠN HÀNG (SalonHero: Báo cáo › "Đánh giá nhân viên", cột Ngày · Mã hóa đơn · Tên Nhân Viên · Đánh giá · Ý kiến đánh giá · Dịch vụ đã thực hiện).
-- Sau khi hoá đơn hoàn thành, thu ngân/lễ tân ghi 1–5 sao + ý kiến cho từng nhân viên PHỤC VỤ trong đơn. Mỗi cặp (hoá đơn, nhân viên) chỉ một đánh giá, sửa được; mỗi lần ghi hoặc sửa
-- đều để dấu vết trong nhat_ky_truy_cap (giá trị cũ → mới) ngay ở DB. Chỉ đánh giá được nhân viên có mặt ở vai Phục vụ của hoá đơn đã hoàn thành.
create table public.danh_gia_nhan_vien (
  id uuid primary key default gen_random_uuid(),
  hoa_don_id uuid not null references public.hoa_don (id),
  nhan_vien_id uuid not null references public.nhan_vien (id),
  diem smallint not null check (diem between 1 and 5),
  y_kien text check (y_kien is null or char_length(y_kien) <= 1000),
  nguoi_ghi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  sua_luc timestamptz,
  constraint danh_gia_mot_cap unique (hoa_don_id, nhan_vien_id)
);
create index danh_gia_nhan_vien_idx on public.danh_gia_nhan_vien (nhan_vien_id, tao_luc desc);

create function public.trg_danh_gia_kiem_tra() returns trigger language plpgsql as $$
declare v_tt text;
begin
  select trang_thai into v_tt from public.hoa_don where id = new.hoa_don_id;
  if v_tt is distinct from 'hoan_thanh' then raise exception 'Chỉ đánh giá nhân viên trên hoá đơn đã hoàn thành' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.dong_nhan_vien dnv join public.hoa_don_dong d on d.id = dnv.dong_id
                  where d.hoa_don_id = new.hoa_don_id and dnv.nhan_vien_id = new.nhan_vien_id and dnv.vai = 'phuc_vu') then
    raise exception 'Nhân viên này không phải người phục vụ của hoá đơn' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' then
    if new.hoa_don_id <> old.hoa_don_id or new.nhan_vien_id <> old.nhan_vien_id then raise exception 'Không đổi hoá đơn hay nhân viên của một đánh giá' using errcode = 'P0001'; end if;
    new.sua_luc := now();
  end if;
  return new;
end $$;
create trigger danh_gia_kiem_tra before insert or update on public.danh_gia_nhan_vien
  for each row execute function public.trg_danh_gia_kiem_tra();

create function public.trg_danh_gia_nhat_ky() returns trigger language plpgsql as $$
begin
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (new.nguoi_ghi_id, case tg_op when 'INSERT' then 'ghi_danh_gia_nv' else 'sua_danh_gia_nv' end, 'danh_gia_nhan_vien', new.id,
    jsonb_build_object('hoa_don_id', new.hoa_don_id, 'nhan_vien_id', new.nhan_vien_id,
      'truoc', case tg_op when 'UPDATE' then jsonb_build_object('diem', old.diem, 'y_kien', old.y_kien) end,
      'sau', jsonb_build_object('diem', new.diem, 'y_kien', new.y_kien)));
  return null;
end $$;
create trigger danh_gia_nhat_ky after insert or update on public.danh_gia_nhan_vien
  for each row execute function public.trg_danh_gia_nhat_ky();
-- Đánh giá là dữ liệu ghi nhận: không xoá (sửa điểm thì có nhật ký).
create trigger danh_gia_khong_xoa before delete on public.danh_gia_nhan_vien
  for each row execute function public.chi_them_dong();

select public.khoa_tat_ca_bang();
