-- 0055 — CHUYỂN SALONHERO A→Z (chị Lâm chốt 28/10/2026): chỗ chứa cho dữ liệu cũ, cờ "lịch sử", mã đợt nhập và hàm gỡ cả đợt.
-- Quy tắc đã chốt: hoá đơn lịch sử CÓ tính vào doanh thu và báo cáo nhưng KHÔNG trừ kho, KHÔNG sinh thông báo, KHÔNG đụng sổ cái thẻ;
-- hoa hồng cũ giữ đúng số SalonHero đã tính (bảng dong_hoa_hong_goc); lịch hẹn của cơ sở cũ gộp vào Vinh (làm ở bộ nhập).
-- Mọi bản ghi do đợt nhập tạo ra mang `nhap_dot` (vd 'SH-2810-01') để gỡ riêng cả đợt bằng public.go_dot_nhap('SH-2810-01').
-- Bản ghi đã CÓ TỪ TRƯỚC mà đợt nhập chỉ CẬP NHẬT (khách, thẻ) thì không gỡ được bằng hàm này — khôi phục từ bản sao lưu trước đợt (scripts/chuyen-salonhero/sao-luu-db.mjs).

-- ───────── Mã đợt nhập ─────────
create table public.nhap_dot (
  ma text primary key,
  mo_ta text,
  tao_luc timestamptz not null default now(),
  go_luc timestamptz,
  so_lieu jsonb
);

-- ───────── Khách: các trường SalonHero còn thiếu ─────────
alter table public.khach_hang
  add column nghe_nghiep text,
  add column cong_ty text,
  add column facebook text,
  add column website text,
  add column chieu_cao_cm numeric(5,1),
  add column can_nang_kg numeric(5,1),
  add column ma_so_thue text,
  add column tinh_thanh text,
  add column quan_huyen text,
  add column quoc_gia text,
  add column sdt_phu text,
  add column ma_the_giay text,
  add column co_so_goc text,
  add column nhap_dot text references public.nhap_dot (ma);
alter table public.khach_ghi_chu add column sh_id bigint unique, add column nhap_dot text references public.nhap_dot (ma);
alter table public.khach_nguoi_than add column nhap_dot text references public.nhap_dot (ma);
alter table public.the_khach add column nhap_dot text references public.nhap_dot (ma);
alter table public.the_so_cai add column nhap_dot text references public.nhap_dot (ma);

-- ───────── Lịch hẹn: trường SalonHero ─────────
alter table public.lich_hen
  add column sh_id bigint unique,
  add column ma_dat_lich text,
  add column nguon_dat text,
  add column xac_nhan_luc timestamptz,
  add column checkin_luc timestamptz,
  add column bat_dau_lam_luc timestamptz,
  add column hoan_thanh_luc timestamptz,
  add column huy_luc timestamptz,
  add column nhan_vien_ten text,
  add column dich_vu_ten text,
  add column so_khach int,
  add column kieu_lap text,
  add column nguoi_tao_ten text,
  add column hoa_don_sh_id bigint,
  add column la_lich_su boolean not null default false,
  add column nhap_dot text references public.nhap_dot (ma);
alter table public.lich_hen_dich_vu add column nhap_dot text references public.nhap_dot (ma);

-- ───────── Hoá đơn lịch sử ─────────
alter table public.hoa_don
  add column la_lich_su boolean not null default false,
  add column sh_ma text,
  add column sh_trang_thai text,
  add column tien_tru_the bigint not null default 0,
  add column giam_voucher bigint not null default 0,
  add column giam_diem bigint not null default 0,
  add column nhap_dot text references public.nhap_dot (ma);
alter table public.hoa_don_dong
  add column sh_id bigint unique,
  add column la_lich_su boolean not null default false,
  add column loai_goc text,
  add column the_khach_sh_id bigint,
  add column nhap_dot text references public.nhap_dot (ma);
-- Dòng của hoá đơn lịch sử có thể trỏ tới dịch vụ/sản phẩm/gói đã bị xoá khỏi danh mục → cho phép không có tham chiếu (tên gốc nằm ở cột ten).
alter table public.hoa_don_dong drop constraint dong_chi_mot_tham_chieu;
alter table public.hoa_don_dong add constraint dong_chi_mot_tham_chieu check (
  la_lich_su or
  (loai = 'dich_vu' and dich_vu_id is not null and san_pham_id is null and goi_id is null) or
  (loai = 'san_pham' and san_pham_id is not null and dich_vu_id is null and goi_id is null) or
  (loai = 'goi_the' and goi_id is not null and dich_vu_id is null and san_pham_id is null));
alter table public.dong_nhan_vien add column nhap_dot text references public.nhap_dot (ma);
alter table public.thanh_toan add column nhap_dot text references public.nhap_dot (ma), add column la_lich_su boolean not null default false;

-- Hoa hồng SalonHero đã tính cho từng dòng/người: giữ ĐÚNG số cũ, không tính lại.
create table public.dong_hoa_hong_goc (
  id bigint generated always as identity primary key,
  dong_id uuid not null references public.hoa_don_dong (id) on delete cascade,
  vai text not null check (vai in ('phuc_vu', 'tu_van', 'ban', 'gioi_thieu')),
  vi_tri smallint not null default 1,
  nhan_vien_id uuid references public.nhan_vien (id),
  sh_nhan_vien_id bigint,
  ten_nguoi text,
  gia_tri numeric(18, 2) not null default 0,
  kieu text,
  phan_tram numeric(8, 3),
  nhap_dot text references public.nhap_dot (ma)
);
create index dong_hoa_hong_goc_dong_idx on public.dong_hoa_hong_goc (dong_id);
create index dong_hoa_hong_goc_nv_idx on public.dong_hoa_hong_goc (nhan_vien_id);

create index hoa_don_nhap_dot_idx on public.hoa_don (nhap_dot) where nhap_dot is not null;
create index hoa_don_dong_nhap_dot_idx on public.hoa_don_dong (nhap_dot) where nhap_dot is not null;
create index thanh_toan_nhap_dot_idx on public.thanh_toan (nhap_dot) where nhap_dot is not null;
create index lich_hen_nhap_dot_idx on public.lich_hen (nhap_dot) where nhap_dot is not null;
create index khach_hang_nhap_dot_idx on public.khach_hang (nhap_dot) where nhap_dot is not null;
create index hoa_don_lich_su_ngay_idx on public.hoa_don (ngay_hd) where la_lich_su;

-- ───────── Tính lại hoá đơn: hoá đơn lịch sử giữ nguyên số SalonHero ─────────
create or replace function public.tinh_lai_hoa_don(p_id uuid) returns void language plpgsql as $$
declare h public.hoa_don; v_hang bigint; v_vat bigint; v_thu bigint; v_phai bigint;
begin
  select * into h from public.hoa_don where id = p_id;
  if not found then return; end if;
  if h.la_so_du_dau or h.la_lich_su then
    v_hang := h.tong_hang; v_vat := h.vat_tien; v_phai := h.tong_phai_thu;
  else
    select coalesce(sum(thanh_tien), 0) into v_hang from public.hoa_don_dong where hoa_don_id = p_id;
    v_vat := round((greatest(v_hang - h.giam_gia_don, 0)) * h.vat_pct / 100.0)::bigint;
    v_phai := greatest(v_hang - h.giam_gia_don, 0) + v_vat + h.phu_phi + h.tip;
  end if;
  select coalesce(sum(case loai when 'thu' then so_tien else -so_tien end), 0) into v_thu from public.thanh_toan where hoa_don_id = p_id;
  update public.hoa_don set tong_hang = v_hang, vat_tien = v_vat, tong_phai_thu = v_phai, da_thu = v_thu, con_no = v_phai - v_thu where id = p_id;
end $$;

-- Hoá đơn lịch sử: sửa dòng/người hưởng được khi nhập (đơn đã "hoàn thành"); lúc gỡ đợt thì xoá được.
create or replace function public.trg_dong_hoa_don_nhap() returns trigger language plpgsql as $$
declare v_hd uuid; v_tt text; v_ls boolean;
begin
  if current_setting('amia.go_dot', true) = 'on' then return coalesce(old, new); end if;
  v_hd := coalesce(new.hoa_don_id, old.hoa_don_id);
  select trang_thai, la_lich_su into v_tt, v_ls from public.hoa_don where id = v_hd;
  if v_ls is not true and v_tt is distinct from 'nhap' then
    raise exception 'Hoá đơn đã chốt hoặc đã huỷ, không sửa dòng hàng được' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

create or replace function public.trg_dong_nv_chi_khi_nhap() returns trigger language plpgsql as $$
declare v_tt text; v_ls boolean;
begin
  if current_setting('amia.go_dot', true) = 'on' then return coalesce(old, new); end if;
  select h.trang_thai, h.la_lich_su into v_tt, v_ls from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
   where d.id = coalesce(new.dong_id, old.dong_id);
  if v_ls is not true and v_tt is distinct from 'nhap' then
    raise exception 'Hoá đơn đã chốt hoặc đã huỷ, không đổi người hưởng được' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

-- Thanh toán của hoá đơn lịch sử: không kiểm vượt số phải thu, không động tới sổ cái thẻ (số dư thẻ lấy thẳng từ SalonHero).
create or replace function public.trg_thanh_toan_truoc() returns trigger language plpgsql as $$
declare h public.hoa_don; t public.the_khach; v_du bigint;
begin
  select * into h from public.hoa_don where id = new.hoa_don_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.la_lich_su then new.la_lich_su := true; return new; end if;
  if h.trang_thai = 'huy' then raise exception 'Hoá đơn đã huỷ, không ghi thanh toán được' using errcode = 'P0001'; end if;
  if new.loai = 'thu' then
    if new.so_tien > h.tong_phai_thu - h.da_thu then
      raise exception 'Số thu % vượt phần còn phải thu % của hoá đơn %', new.so_tien, h.tong_phai_thu - h.da_thu, h.ma using errcode = 'P0001';
    end if;
  else
    if new.so_tien > h.da_thu then raise exception 'Hoàn vượt số đã thu của hoá đơn %', h.ma using errcode = 'P0001'; end if;
  end if;
  if new.phuong_thuc = 'the_tien' then
    if new.the_id is null then raise exception 'Trả bằng thẻ tiền phải chọn thẻ' using errcode = 'P0001'; end if;
    select * into t from public.the_khach where id = new.the_id for update;
    if not found or t.loai <> 'tien' then raise exception 'Đây không phải thẻ tiền' using errcode = 'P0001'; end if;
    if t.khach_id is distinct from h.khach_id then raise exception 'Thẻ không thuộc khách của hoá đơn' using errcode = 'P0001'; end if;
    if new.loai = 'thu' then
      if t.trang_thai <> 'hoat_dong' then raise exception 'Thẻ tiền đang bị khoá hoặc thu hồi' using errcode = 'P0001'; end if;
      if t.han_dung is not null and t.han_dung < new.ngay then raise exception 'Thẻ tiền đã hết hạn' using errcode = 'P0001'; end if;
      select coalesce(sum(so_tien), 0) into v_du from public.the_so_cai where the_id = t.id;
      if v_du < new.so_tien then raise exception 'Thẻ tiền chỉ còn % đ, không đủ trừ %', v_du, new.so_tien using errcode = 'P0001'; end if;
    end if;
  elsif new.the_id is not null then
    raise exception 'Chỉ thanh toán bằng thẻ tiền mới gắn thẻ' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.trg_thanh_toan_sau() returns trigger language plpgsql as $$
begin
  if new.la_lich_su then
    perform public.tinh_lai_hoa_don(new.hoa_don_id);
    return null;
  end if;
  if new.phuong_thuc = 'the_tien' then
    insert into public.the_so_cai (the_id, loai, so_tien, hoa_don_id, nguoi_id, ghi_chu)
    values (new.the_id, case new.loai when 'thu' then 'tru_tien' else 'hoan_tien' end,
            case new.loai when 'thu' then -new.so_tien else new.so_tien end, new.hoa_don_id, new.nguoi_id, new.ghi_chu);
  end if;
  perform public.tinh_lai_hoa_don(new.hoa_don_id);
  return null;
end $$;

-- Hoá đơn công nợ đầu kỳ và hoá đơn lịch sử đều không huỷ được từ giao diện (sai thì ghi nhận điều chỉnh).
create or replace function public.trg_khong_huy_no_dau() returns trigger language plpgsql as $$
begin
  if (old.la_so_du_dau or old.la_lich_su) and new.trang_thai = 'huy' and old.trang_thai <> 'huy' then
    raise exception 'Hoá đơn chuyển từ SalonHero không huỷ được; sai số thì ghi nhận bằng thanh toán điều chỉnh' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Sổ cái chỉ thêm dòng — trừ khi đang gỡ cả một đợt nhập (go_dot_nhap bật cờ trong đúng giao dịch của nó).
create or replace function public.chi_them_dong() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' and current_setting('amia.go_dot', true) = 'on' then return old; end if;
  raise exception 'Bảng % chỉ được thêm dòng, không sửa hay xoá (sổ cái)', tg_table_name using errcode = 'P0001';
end $$;

-- ───────── Gỡ cả một đợt nhập (chỉ bản ghi do đợt TẠO RA; bản ghi chỉ được cập nhật thì khôi phục từ bản sao lưu) ─────────
create function public.go_dot_nhap(p_dot text) returns jsonb language plpgsql as $$
declare r jsonb := '{}'::jsonb; n int;
begin
  if not exists (select 1 from public.nhap_dot where ma = p_dot) then raise exception 'Không có đợt nhập %', p_dot using errcode = 'P0001'; end if;
  perform set_config('amia.go_dot', 'on', true);
  delete from public.dong_hoa_hong_goc where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('dong_hoa_hong_goc', n);
  delete from public.dong_nhan_vien where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('dong_nhan_vien', n);
  delete from public.thanh_toan where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('thanh_toan', n);
  delete from public.hoa_don_dong where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('hoa_don_dong', n);
  delete from public.hoa_don where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('hoa_don', n);
  delete from public.lich_hen_dich_vu where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('lich_hen_dich_vu', n);
  delete from public.lich_hen where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('lich_hen', n);
  delete from public.the_so_cai where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('the_so_cai', n);
  delete from public.the_khach where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('the_khach', n);
  delete from public.khach_ghi_chu where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_ghi_chu', n);
  delete from public.khach_nguoi_than where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_nguoi_than', n);
  delete from public.khach_hang where nhap_dot = p_dot; get diagnostics n = row_count; r := r || jsonb_build_object('khach_hang', n);
  update public.nhap_dot set go_luc = now() where ma = p_dot;
  return r;
end $$;

select public.khoa_tat_ca_bang();
