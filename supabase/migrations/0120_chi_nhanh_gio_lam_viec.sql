-- [G2] Quản lý chi nhánh + Giờ làm việc theo từng chi nhánh (đối chiếu SalonHero #/locations).
-- Chỉ thêm cột nhỏ vào chi_nhanh (2 dòng dữ liệu), không có bảng mới, không đổi dữ liệu cũ.
--  • mo_ta / thanh_pho / phuong_quan: các ô trong hộp "Sửa thông tin chi nhánh" của SalonHero.
--  • hien_dat_lich: "Hiện thị ở web đặt lịch" (mặc định hiện). Tắt thì /dat-lich không cho chọn chi nhánh đó.
--  • gio_lam_viec: giờ mở/đóng riêng theo thứ, null = dùng giờ chung ở cua_hang.gio_lam_viec.
--    Dạng {"t2":{"mo":"08:00","dong":"20:00"},"cn":{"nghi":true}}; thứ nào không có khoá thì dùng giờ chung.
alter table public.chi_nhanh
  add column if not exists mo_ta text,
  add column if not exists thanh_pho text,
  add column if not exists phuong_quan text,
  add column if not exists hien_dat_lich boolean not null default true,
  add column if not exists gio_lam_viec jsonb;

alter table public.chi_nhanh drop constraint if exists chi_nhanh_gio_lam_viec_dang;
alter table public.chi_nhanh add constraint chi_nhanh_gio_lam_viec_dang check (gio_lam_viec is null or jsonb_typeof(gio_lam_viec) = 'object');

-- Khung giờ trống cho khách đặt online: giờ mở/đóng/ngày nghỉ lấy theo chi nhánh trước, thiếu thì dùng giờ chung của cơ sở.
-- Ngoài ra chi nhánh tắt "Hiện thị ở web đặt lịch" thì không có khung giờ nào. Phần còn lại giữ NGUYÊN như 0075.
create or replace function public.gio_trong_online(p_cn uuid, p_ngay date, p_phut int) returns setof text language plpgsql stable as $$
declare
  v_gl jsonb; v_cn jsonb; v_ng jsonb; v_mo time; v_dong time; v_t time; v_bd timestamptz; v_kt timestamptz;
  v_som timestamptz; v_muon timestamptz; v_thu text;
begin
  if p_phut is null or p_phut < 5 or p_phut > 480 then return; end if;
  if (select coalesce(gia_tri, '0') from public.cau_hinh where khoa = 'dat_online.mo') is distinct from '1' then return; end if;
  if not exists (select 1 from public.chi_nhanh where id = p_cn and hoat_dong and hien_dat_lich) then return; end if;
  select gio_lam_viec into v_gl from public.cua_hang where id = 1;
  select gio_lam_viec into v_cn from public.chi_nhanh where id = p_cn;
  v_thu := (array['t2', 't3', 't4', 't5', 't6', 't7', 'cn'])[extract(isodow from p_ngay)::int];
  v_ng := case when jsonb_typeof(v_cn -> v_thu) = 'object' then v_cn -> v_thu end;
  if coalesce(v_ng ->> 'nghi', 'false') = 'true' then return; end if;
  if v_ng is null and coalesce(v_gl -> 'nghi', '[]'::jsonb) ? v_thu then return; end if;
  v_mo := coalesce(nullif(v_ng ->> 'mo', ''), nullif(v_gl ->> 'mo', ''), '08:00')::time;
  v_dong := coalesce(nullif(v_ng ->> 'dong', ''), nullif(v_gl ->> 'dong', ''), '20:00')::time;
  v_som := now() + make_interval(mins => coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.bao_truoc_phut'), 120));
  v_muon := now() + make_interval(days => coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.toi_da_ngay'), 60));
  v_t := v_mo;
  while v_t < v_dong loop
    exit when (p_ngay::timestamp + v_t + make_interval(mins => p_phut)) > (p_ngay::timestamp + v_dong);
    v_bd := (p_ngay::timestamp + v_t) at time zone 'Asia/Ho_Chi_Minh';
    v_kt := v_bd + make_interval(mins => p_phut);
    if v_bd >= v_som and v_bd <= v_muon and public.con_cho_online(p_cn, v_bd, v_kt) then
      return next to_char(v_t, 'HH24:MI');
    end if;
    v_t := v_t + interval '30 minutes';
  end loop;
end $$;
