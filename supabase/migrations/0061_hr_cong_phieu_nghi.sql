-- 0061 — NHÂN SỰ (đợt Lark, phần 2): chấm công theo ngày, phiếu nghỉ/OT/ra ngoài/online/điều chỉnh công, nghỉ tháng, nghỉ lễ, khảo sát nghỉ việc, cơ cấu đơn vị Lark.
-- Cùng cơ chế mã đợt như 0060 (nhap_dot + go_dot_hr). Không lưu tệp/JSON gốc vào DB.
alter table public.cham_cong drop constraint cham_cong_phuong_thuc_check;
alter table public.cham_cong add constraint cham_cong_phuong_thuc_check check (phuong_thuc in ('web', 'thu_cong', 'lark'));
alter table public.cham_cong add column nhap_dot text references public.nhap_dot (ma);
alter table public.phieu_hr
  add column nhap_dot text references public.nhap_dot (ma),
  add column chi_tiet_goc text,
  add column trang_thai_goc text;
alter table public.dieu_chinh_phep add column nhap_dot text references public.nhap_dot (ma);
alter table public.ngay_le add column nhap_dot text references public.nhap_dot (ma);

-- Kết quả chấm công MỖI NGÀY đúng như Lark (2.3 ∪ 10.3): ca, nhóm chấm công, giờ ca, giờ vào/ra, kết quả (Normal/Late/Lack/…), bổ sung (nghỉ/công tác/quên thẻ).
create table public.hr_cong_lark (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  ma_ket_qua text not null unique,
  ca_ten text,
  nhom_cham_cong text,
  gio_ca_vao timestamptz,
  gio_ca_ra timestamptz,
  vao timestamptz,
  ra timestamptz,
  kq_vao text,
  kq_ra text,
  bu_vao text,
  bu_ra text,
  ngoai_vao boolean,
  ngoai_ra boolean,
  noi_vao text,
  noi_ra text,
  vao_2 timestamptz,
  ra_2 timestamptz,
  tre_ve_som_cong numeric(8, 5),
  nguon text not null check (nguon in ('2.3', '10.3')),
  nhap_dot text references public.nhap_dot (ma)
);
create index hr_cong_lark_nv_idx on public.hr_cong_lark (nhan_vien_id, ngay);

create table public.hr_nghi_thang (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  duyet boolean not null default false,
  khong_duyet boolean not null default false,
  nhap_dot text references public.nhap_dot (ma)
);
create index hr_nghi_thang_idx on public.hr_nghi_thang (nhan_vien_id, ngay);

create table public.hr_nghi_le (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  nhap_dot text references public.nhap_dot (ma)
);
create index hr_nghi_le_idx on public.hr_nghi_le (nhan_vien_id, ngay);

create table public.hr_khao_sat_nghi_viec (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  y_dinh_nghi text,
  ly_do_chinh text,
  yeu_to_giu_chan text,
  danh_gia_quan_ly numeric(4, 1),
  lo_trinh_phat_trien numeric(4, 1),
  y_kien text,
  chi_nhanh text,
  chuc_vu text,
  phong_ban text,
  nhap_dot text references public.nhap_dot (ma)
);

-- Cơ cấu đơn vị đúng như danh bạ Lark (2.2); phong_ban của AMIA là danh mục chung 9 phòng.
create table public.hr_don_vi_lark (
  id uuid primary key default gen_random_uuid(),
  ma_lark text not null unique,
  ten text not null,
  ma_cha text,
  truong_don_vi_id uuid references public.nhan_vien (id) on delete set null,
  thu_tu int,
  hoat_dong boolean not null default true,
  nhap_dot text references public.nhap_dot (ma)
);

-- ───────── Gỡ cả một đợt chuyển nhân sự ─────────
create or replace function public.go_dot_hr(p_dot text) returns jsonb language plpgsql as $$
declare r jsonb := '{}'::jsonb; n int; t text;
  bang text[] := array[
    -- bảng con trước, bảng cha sau
    'hr_khao_sat_nghi_viec', 'hr_don_vi_lark', 'hr_cong_lark', 'ngay_le', 'hr_luong_ctv', 'hr_thue_lan1', 'hr_ghi_nhan_kd', 'hr_bsc', 'hr_thuong_phat', 'hr_tai_san', 'luong_khoan', 'bang_luong_dong', 'ky_luong',
    'hr_nghi_thang', 'hr_nghi_le', 'hr_luot_cham', 'cham_cong', 'phieu_hr', 'dieu_chinh_phep',
    'hd_lao_dong', 'dieu_kien_luong', 'nghi_viec', 'nhan_vien_than_nhan', 'nhan_vien_ho_so'];
begin
  if p_dot !~ '^HR-' then raise exception 'go_dot_hr chỉ gỡ đợt nhân sự (mã HR-…), không phải %', p_dot using errcode = 'P0001'; end if;
  if not exists (select 1 from public.nhap_dot where ma = p_dot) then raise exception 'Không có đợt nhập %', p_dot using errcode = 'P0001'; end if;
  foreach t in array bang loop
    if to_regclass('public.' || t) is not null
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'nhap_dot') then
      execute format('delete from public.%I where nhap_dot = $1', t) using p_dot;
      get diagnostics n = row_count; r := r || jsonb_build_object(t, n);
    end if;
  end loop;
  -- Người có sẵn được ghép: trả các cột về giá trị cũ
  update public.nhan_vien v set
    lark_open_id = g.truoc ->> 'lark_open_id', ma_lark = g.truoc ->> 'ma_lark', don_vi = g.truoc ->> 'don_vi', phong_ban_goc = g.truoc ->> 'phong_ban_goc',
    phong_ban_id = (g.truoc ->> 'phong_ban_id')::uuid, ngay_vao_lam = (g.truoc ->> 'ngay_vao_lam')::date, ngay_vao_chinh_thuc = (g.truoc ->> 'ngay_vao_chinh_thuc')::date,
    ngay_nghi_viec = (g.truoc ->> 'ngay_nghi_viec')::date, email = g.truoc ->> 'email', dien_thoai = g.truoc ->> 'dien_thoai', chuc_danh = g.truoc ->> 'chuc_danh'
   from public.nhan_vien_ghep_lark g where g.nhan_vien_id = v.id and g.nhap_dot = p_dot;
  get diagnostics n = row_count; r := r || jsonb_build_object('nhan_vien_tra_lai', n);
  delete from public.nhan_vien_ghep_lark where nhap_dot = p_dot;
  delete from public.nhan_vien where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('nhan_vien', n);
  delete from public.chuc_danh_dm where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('chuc_danh_dm', n);
  delete from public.phong_ban where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('phong_ban', n);
  update public.nhap_dot set go_luc = now() where ma = p_dot;
  return r;
end $$;
revoke all on function public.go_dot_hr(text) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
