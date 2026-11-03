-- 0241 (đợt 3, nhóm B): Dịch vụ — tab "Tùy chọn giá" như SalonHero (hộp dịch vụ):
--  • "Thêm tùy chọn dịch vụ theo nhân viên": chọn nhân viên + Giá cộng thêm (option type2)
--  • "Thêm tùy chọn dịch vụ khác": Tên dịch vụ bổ sung + Giá cộng thêm (option type1)
-- Tên trùng bị từ chối ("Tên bị trùng"). Lưu = thay cả danh sách của một dịch vụ trong MỘT giao dịch (hàm luu_tuy_chon_gia_dich_vu).
-- Thu ngân đọc bảng này để cộng giá (việc của nhóm Thu ngân).
create table if not exists public.dich_vu_tuy_chon_gia (
  id uuid primary key default gen_random_uuid(),
  dich_vu_id uuid not null references public.dich_vu(id) on delete cascade,
  loai text not null check (loai in ('nhan_vien', 'bo_sung')),
  nhan_vien_id uuid references public.nhan_vien(id) on delete cascade,
  ten text,
  gia_cong_them bigint not null default 0 check (gia_cong_them >= 0),
  thu_tu integer not null default 0,
  tao_luc timestamptz not null default now(),
  check ((loai = 'nhan_vien' and nhan_vien_id is not null and ten is null) or (loai = 'bo_sung' and nhan_vien_id is null and ten is not null and length(btrim(ten)) between 1 and 120))
);
create index if not exists dich_vu_tuy_chon_gia_dv on public.dich_vu_tuy_chon_gia (dich_vu_id);
create unique index if not exists dich_vu_tuy_chon_gia_nv_duy_nhat on public.dich_vu_tuy_chon_gia (dich_vu_id, nhan_vien_id) where loai = 'nhan_vien';
create unique index if not exists dich_vu_tuy_chon_gia_ten_duy_nhat on public.dich_vu_tuy_chon_gia (dich_vu_id, lower(btrim(ten))) where loai = 'bo_sung';
comment on table public.dich_vu_tuy_chon_gia is 'Tùy chọn giá của dịch vụ (SalonHero options type2 = theo nhân viên, type1 = dịch vụ bổ sung). Giá bán = dich_vu.gia + gia_cong_them của tùy chọn được chọn.';

-- p_ds: [{"loai":"nhan_vien","nhan_vien_id":"…","gia_cong_them":100000} | {"loai":"bo_sung","ten":"Thêm vùng cằm","gia_cong_them":200000}, …]
create or replace function public.luu_tuy_chon_gia_dich_vu(p_dich_vu uuid, p_ds jsonb)
returns integer language plpgsql set search_path = public, pg_temp as $$
declare v_n integer := 0; r jsonb; v_loai text; v_ten text; v_nv uuid; v_gia bigint; v_tt integer := 0;
begin
  perform 1 from public.dich_vu where id = p_dich_vu for update;
  if not found then raise exception 'Không tìm thấy dịch vụ.' using errcode = 'P0001'; end if;
  if p_ds is null or jsonb_typeof(p_ds) <> 'array' then raise exception 'Danh sách tùy chọn giá không hợp lệ.' using errcode = 'P0001'; end if;
  if jsonb_array_length(p_ds) > 100 then raise exception 'Tối đa 100 tùy chọn giá cho một dịch vụ.' using errcode = 'P0001'; end if;
  delete from public.dich_vu_tuy_chon_gia where dich_vu_id = p_dich_vu;
  for r in select * from jsonb_array_elements(p_ds) loop
    v_tt := v_tt + 1;
    v_loai := r->>'loai';
    v_gia := coalesce(nullif(r->>'gia_cong_them', '')::bigint, 0);
    if v_gia < 0 then raise exception 'Giá cộng thêm không được âm.' using errcode = 'P0001'; end if;
    if v_loai = 'nhan_vien' then
      v_nv := nullif(r->>'nhan_vien_id', '')::uuid;
      if v_nv is null then raise exception 'Tùy chọn theo nhân viên: chưa chọn nhân viên.' using errcode = 'P0001'; end if;
      if not exists (select 1 from public.nhan_vien where id = v_nv) then raise exception 'Nhân viên trong tùy chọn giá không còn tồn tại.' using errcode = 'P0001'; end if;
      if exists (select 1 from public.dich_vu_tuy_chon_gia where dich_vu_id = p_dich_vu and loai = 'nhan_vien' and nhan_vien_id = v_nv) then raise exception 'Tên bị trùng: một nhân viên chỉ có một tùy chọn giá.' using errcode = 'P0001'; end if;
      insert into public.dich_vu_tuy_chon_gia (dich_vu_id, loai, nhan_vien_id, gia_cong_them, thu_tu) values (p_dich_vu, 'nhan_vien', v_nv, v_gia, v_tt);
    elsif v_loai = 'bo_sung' then
      v_ten := regexp_replace(btrim(coalesce(r->>'ten', '')), '\s+', ' ', 'g');
      if v_ten = '' then raise exception 'Tùy chọn dịch vụ khác: chưa nhập tên dịch vụ bổ sung.' using errcode = 'P0001'; end if;
      if length(v_ten) > 120 then raise exception 'Tên dịch vụ bổ sung tối đa 120 ký tự.' using errcode = 'P0001'; end if;
      if exists (select 1 from public.dich_vu_tuy_chon_gia where dich_vu_id = p_dich_vu and loai = 'bo_sung' and lower(btrim(ten)) = lower(v_ten)) then raise exception 'Tên bị trùng: "%".', v_ten; end if;
      insert into public.dich_vu_tuy_chon_gia (dich_vu_id, loai, ten, gia_cong_them, thu_tu) values (p_dich_vu, 'bo_sung', v_ten, v_gia, v_tt);
    else
      raise exception 'Loại tùy chọn giá không hợp lệ.' using errcode = 'P0001';
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;
revoke all on function public.luu_tuy_chon_gia_dich_vu(uuid, jsonb) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
