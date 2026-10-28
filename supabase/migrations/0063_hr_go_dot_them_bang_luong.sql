-- 0063 — go_dot_hr gỡ cả bảng hr_luong_lark (bảng này tạo ở 0062 nhưng chưa nằm trong danh sách gỡ).
-- ───────── Gỡ cả một đợt chuyển nhân sự ─────────
create or replace function public.go_dot_hr(p_dot text) returns jsonb language plpgsql as $$
declare r jsonb := '{}'::jsonb; n int; t text;
  bang text[] := array[
    -- bảng con trước, bảng cha sau
    'hr_khao_sat_nghi_viec', 'hr_don_vi_lark', 'hr_cong_lark', 'ngay_le', 'hr_luong_lark', 'hr_luong_ctv', 'hr_thue_lan1', 'hr_ghi_nhan_kd', 'hr_bsc', 'hr_thuong_phat', 'hr_tai_san', 'luong_khoan', 'bang_luong_dong', 'ky_luong',
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
