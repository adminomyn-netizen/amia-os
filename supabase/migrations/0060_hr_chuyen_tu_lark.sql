-- 0060 — NHÂN SỰ: chỗ chứa cho đợt chuyển dữ liệu từ Lark MSC (base HRM-HRIS-01) sang AMIA OS (chị Lâm 28/10/2026: "đẩy FULL phần HR, KHÔNG BỎ SÓT").
-- Mọi bản ghi do đợt chuyển TẠO RA mang `nhap_dot` (vd 'HR-2810-01', bảng nhap_dot từ 0055) → gỡ riêng cả đợt bằng public.go_dot_hr('HR-2810-01').
-- Bản ghi nhan_vien đã có từ trước mà đợt chuyển chỉ CẬP NHẬT (SalonHero) được ghi trạng thái trước-đó vào nhan_vien_ghep_lark để go_dot_hr trả lại nguyên.
-- Tệp đính kèm (ảnh, hợp đồng scan) KHÔNG đưa vào DB: để nguyên trên Lark, chỉ lưu đường dẫn (gói DB có hạn).

-- ───────── Nhân viên: khoá nối với Lark + đơn vị ─────────
alter table public.nhan_vien
  add column lark_open_id text unique,
  add column ma_lark text unique,
  add column don_vi text check (don_vi is null or don_vi in ('MSC', 'AVI', 'ADL')),
  add column phong_ban_goc text,
  add column nhap_dot text references public.nhap_dot (ma);
comment on column public.nhan_vien.lark_open_id is 'Mã tài khoản Lark (open_id) — khoá nối mọi bảng nhân sự Lark.';
comment on column public.nhan_vien.ma_lark is 'Mã nhân viên trong bảng 1.1 của Lark (MSC.0001…), khác ma_nv của AMIA OS.';
comment on column public.nhan_vien.don_vi is 'Nơi làm việc theo Lark: MSC = văn phòng tập đoàn, AVI = AMIA Vinh, ADL = AMIA Đà Lạt.';
comment on column public.nhan_vien.phong_ban_goc is 'Tên phòng ban đúng như trên Lark (vd "Tri liệu AVI"); phong_ban_id là phòng ban chung đã gộp.';

alter table public.phong_ban add column nhap_dot text references public.nhap_dot (ma);
alter table public.chuc_danh_dm add column nhap_dot text references public.nhap_dot (ma);
alter table public.nhan_vien_ho_so add column nhap_dot text references public.nhap_dot (ma);
alter table public.nhan_vien_than_nhan
  add column dien_thoai text,
  add column gioi_tinh text check (gioi_tinh is null or gioi_tinh in ('Nam', 'Nữ')),
  add column nhap_dot text references public.nhap_dot (ma);

-- Người AMIA có sẵn được ghép với bản ghi Lark: lưu giá trị cũ để gỡ đợt thì trả lại, và để chị rà lại việc ghép.
create table public.nhan_vien_ghep_lark (
  nhan_vien_id uuid primary key references public.nhan_vien (id) on delete cascade,
  nhap_dot text not null references public.nhap_dot (ma),
  ma_lark text,
  ly_do text not null check (ly_do in ('ma', 'sdt', 'ten+co_so', 'tay')),
  truoc jsonb not null,
  tao_luc timestamptz not null default now()
);

-- ───────── Hợp đồng lao động ─────────
alter table public.hd_lao_dong add column nhap_dot text references public.nhap_dot (ma);

-- ───────── Điều kiện lương: các khoản Lark có mà AMIA chưa có chỗ ─────────
alter table public.dieu_kien_luong
  add column luong_thoa_thuan bigint check (luong_thoa_thuan is null or luong_thoa_thuan >= 0),
  add column thuong_hieu_qua bigint check (thuong_hieu_qua is null or thuong_hieu_qua >= 0),
  add column quy_nhan_vien bigint check (quy_nhan_vien is null or quy_nhan_vien >= 0),
  add column phu_cap_khac bigint check (phu_cap_khac is null or phu_cap_khac >= 0),
  add column phu_cap_truc_ca bigint check (phu_cap_truc_ca is null or phu_cap_truc_ca >= 0),
  add column he_so_luong numeric(6, 2),
  add column cam_ket_08 boolean,
  add column khung_lam_viec text check (khung_lam_viec is null or khung_lam_viec in ('van_phong', 'chi_nhanh', 'khong_cham_cong')),
  add column ngay_thong_bao_review date,
  add column nhap_dot text references public.nhap_dot (ma);
comment on column public.dieu_kien_luong.luong_thoa_thuan is 'Tổng lương thoả thuận (Lark 1.6). luong_co_ban = Lương CB (BHXH); thuong_hieu_qua = thoả thuận − cơ bản.';

-- ───────── Nghỉ việc ─────────
alter table public.nghi_viec
  add column nhap_dot text references public.nhap_dot (ma),
  add column ma_phieu text unique,
  add column ly_do_goc text,
  add column trang_thai_goc text,
  add column nop_luc date;

-- ───────── Gỡ cả một đợt chuyển nhân sự ─────────
create function public.go_dot_hr(p_dot text) returns jsonb language plpgsql as $$
declare r jsonb := '{}'::jsonb; n int; t text;
  bang text[] := array[
    -- bảng con trước, bảng cha sau
    'hr_luong_ctv', 'hr_thue_lan1', 'hr_ghi_nhan_kd', 'hr_bsc', 'hr_thuong_phat', 'hr_tai_san', 'luong_khoan', 'bang_luong_dong', 'ky_luong',
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
