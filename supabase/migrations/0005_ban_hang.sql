-- 0005 — BÁN HÀNG: hoá đơn, dòng hàng, chia người, thanh toán nhiều lần, thẻ khách (sổ cái), buổi thực hiện.
-- Doanh thu hoá đơn = tong_hang − giam_gia_don (không gồm VAT, tip). Tiền thu = Σ thanh_toan 'thu' − Σ 'hoan'.

create table public.hoa_don (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  khach_id uuid references public.khach_hang (id),
  lich_hen_id uuid references public.lich_hen (id),
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap','hoan_thanh','huy')),
  ngay_hd date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  giam_gia_don bigint not null default 0 check (giam_gia_don >= 0),
  vat_pct numeric(5,2) not null default 0 check (vat_pct >= 0 and vat_pct <= 100),
  phu_phi bigint not null default 0 check (phu_phi >= 0),
  tip bigint not null default 0 check (tip >= 0),
  tong_hang bigint not null default 0,
  vat_tien bigint not null default 0,
  tong_phai_thu bigint not null default 0,
  da_thu bigint not null default 0,
  con_no bigint not null default 0,
  nguoi_lap_id uuid not null references public.nhan_vien (id),
  nguoi_gioi_thieu_id uuid references public.khach_hang (id),
  ghi_chu text,
  ly_do_huy text,
  tao_luc timestamptz not null default now(),
  chot_luc timestamptz,
  huy_luc timestamptz
);
create index hoa_don_ngay_idx on public.hoa_don (chi_nhanh_id, ngay_hd);
create index hoa_don_khach_idx on public.hoa_don (khach_id, ngay_hd desc);
create index hoa_don_no_idx on public.hoa_don (con_no) where con_no > 0 and trang_thai = 'hoan_thanh';

create table public.hoa_don_dong (
  id uuid primary key default gen_random_uuid(),
  hoa_don_id uuid not null references public.hoa_don (id) on delete cascade,
  loai text not null check (loai in ('dich_vu','san_pham','goi_the')),
  dich_vu_id uuid references public.dich_vu (id),
  san_pham_id uuid references public.san_pham (id),
  goi_id uuid references public.goi_the (id),
  ten text not null,
  so_luong int not null default 1 check (so_luong > 0),
  don_gia bigint not null check (don_gia >= 0),
  giam_gia bigint not null default 0 check (giam_gia >= 0),
  thanh_tien bigint generated always as (so_luong::bigint * don_gia - giam_gia) stored,
  tao_luc timestamptz not null default now(),
  constraint dong_chi_mot_tham_chieu check (
    (loai = 'dich_vu' and dich_vu_id is not null and san_pham_id is null and goi_id is null) or
    (loai = 'san_pham' and san_pham_id is not null and dich_vu_id is null and goi_id is null) or
    (loai = 'goi_the' and goi_id is not null and dich_vu_id is null and san_pham_id is null)),
  constraint dong_giam_khong_qua_gia check (giam_gia <= so_luong::bigint * don_gia)
);
create index hoa_don_dong_hd_idx on public.hoa_don_dong (hoa_don_id);

-- Người hưởng từng dòng theo vai (phục vụ / tư vấn / bán), chia % khi nhiều người. Mỗi (dòng, vai) cộng đủ 100 khi chốt đơn.
create table public.dong_nhan_vien (
  dong_id uuid not null references public.hoa_don_dong (id) on delete cascade,
  nhan_vien_id uuid not null references public.nhan_vien (id),
  vai text not null check (vai in ('phuc_vu','tu_van','ban')),
  ti_le numeric(5,2) not null check (ti_le > 0 and ti_le <= 100),
  primary key (dong_id, nhan_vien_id, vai)
);

create table public.the_khach (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  khach_id uuid not null references public.khach_hang (id),
  goi_id uuid not null references public.goi_the (id),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  loai text not null check (loai in ('lan','tien')),
  hoa_don_dong_id uuid references public.hoa_don_dong (id),
  so_buoi_tong int,
  tong_tien bigint,
  -- Doanh thu ghi nhận cho MỖI buổi = giá thực trả ÷ số buổi (đã chia phần giảm giá cả đơn).
  gia_tri_buoi bigint not null default 0,
  cap_tay boolean not null default false,
  ngay_cap date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  han_dung date,
  trang_thai text not null default 'hoat_dong' check (trang_thai in ('hoat_dong','khoa','thu_hoi')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index the_khach_khach_idx on public.the_khach (khach_id);

create table public.buoi_thuc_hien (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id),
  the_id uuid references public.the_khach (id),
  dich_vu_id uuid not null references public.dich_vu (id),
  lich_hen_id uuid references public.lich_hen (id),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  ngay_lam date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  nv_thuc_hien_id uuid not null references public.nhan_vien (id),
  bac_si_id uuid references public.nhan_vien (id),
  -- Tham số thực tế của ca: số shot, số line, vùng, đầu tip... (định mức tính theo đây ở phiếu cấp)
  tham_so jsonb not null default '{}'::jsonb,
  doanh_thu_buoi bigint not null default 0,
  trang_thai text not null default 'da_lam' check (trang_thai in ('da_lam','huy')),
  ghi_chu text,
  ly_do_huy text,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  huy_luc timestamptz
);
create index buoi_ngay_idx on public.buoi_thuc_hien (chi_nhanh_id, ngay_lam);
create index buoi_the_idx on public.buoi_thuc_hien (the_id);

-- SỔ CÁI THẺ (chỉ thêm dòng): số buổi còn = Σ so_buoi, số dư thẻ tiền = Σ so_tien.
create table public.the_so_cai (
  id bigint generated always as identity primary key,
  the_id uuid not null references public.the_khach (id),
  loai text not null check (loai in ('cap','dung_buoi','hoan_buoi','dieu_chinh','nap','tru_tien','hoan_tien','thu_hoi')),
  so_buoi int not null default 0,
  so_tien bigint not null default 0,
  buoi_id uuid references public.buoi_thuc_hien (id),
  hoa_don_id uuid references public.hoa_don (id),
  ghi_chu text,
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index the_so_cai_the_idx on public.the_so_cai (the_id);
create trigger the_so_cai_chi_them before update or delete on public.the_so_cai
  for each row execute function public.chi_them_dong();

create table public.thanh_toan (
  id uuid primary key default gen_random_uuid(),
  hoa_don_id uuid not null references public.hoa_don (id),
  loai text not null default 'thu' check (loai in ('thu','hoan')),
  phuong_thuc text not null check (phuong_thuc in ('tien_mat','chuyen_khoan','quet_the','the_tien')),
  so_tien bigint not null check (so_tien > 0),
  the_id uuid references public.the_khach (id),
  ngay date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  nguoi_id uuid not null references public.nhan_vien (id),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
create index thanh_toan_hd_idx on public.thanh_toan (hoa_don_id);
create index thanh_toan_ngay_idx on public.thanh_toan (ngay, phuong_thuc);
create trigger thanh_toan_chi_them before update or delete on public.thanh_toan
  for each row execute function public.chi_them_dong();

-- ───────── Tính lại tổng hoá đơn ─────────
create function public.tinh_lai_hoa_don(p_id uuid) returns void language plpgsql as $$
declare h public.hoa_don; v_hang bigint; v_vat bigint; v_thu bigint; v_phai bigint;
begin
  select * into h from public.hoa_don where id = p_id;
  if not found then return; end if;
  select coalesce(sum(thanh_tien), 0) into v_hang from public.hoa_don_dong where hoa_don_id = p_id;
  v_vat := round((greatest(v_hang - h.giam_gia_don, 0)) * h.vat_pct / 100.0)::bigint;
  v_phai := greatest(v_hang - h.giam_gia_don, 0) + v_vat + h.phu_phi + h.tip;
  select coalesce(sum(case loai when 'thu' then so_tien else -so_tien end), 0) into v_thu from public.thanh_toan where hoa_don_id = p_id;
  update public.hoa_don set tong_hang = v_hang, vat_tien = v_vat, tong_phai_thu = v_phai, da_thu = v_thu, con_no = v_phai - v_thu where id = p_id;
end $$;

create function public.trg_dong_hoa_don_nhap() returns trigger language plpgsql as $$
declare v_hd uuid; v_tt text;
begin
  v_hd := coalesce(new.hoa_don_id, old.hoa_don_id);
  select trang_thai into v_tt from public.hoa_don where id = v_hd;
  if v_tt is distinct from 'nhap' then
    raise exception 'Hoá đơn đã chốt hoặc đã huỷ, không sửa dòng hàng được' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;
create trigger hoa_don_dong_chi_khi_nhap before insert or update or delete on public.hoa_don_dong
  for each row execute function public.trg_dong_hoa_don_nhap();

create function public.trg_dong_tinh_lai() returns trigger language plpgsql as $$
begin
  perform public.tinh_lai_hoa_don(coalesce(new.hoa_don_id, old.hoa_don_id));
  return null;
end $$;
create trigger hoa_don_dong_tinh_lai after insert or update or delete on public.hoa_don_dong
  for each row execute function public.trg_dong_tinh_lai();

create function public.trg_dong_nv_chi_khi_nhap() returns trigger language plpgsql as $$
declare v_tt text;
begin
  select h.trang_thai into v_tt from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
   where d.id = coalesce(new.dong_id, old.dong_id);
  if v_tt is distinct from 'nhap' then
    raise exception 'Hoá đơn đã chốt hoặc đã huỷ, không đổi người hưởng được' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;
create trigger dong_nhan_vien_chi_khi_nhap before insert or update or delete on public.dong_nhan_vien
  for each row execute function public.trg_dong_nv_chi_khi_nhap();

-- ───────── Kiểm tra + ghi sổ khi có thanh toán ─────────
create function public.trg_thanh_toan_truoc() returns trigger language plpgsql as $$
declare h public.hoa_don; t public.the_khach; v_du bigint;
begin
  select * into h from public.hoa_don where id = new.hoa_don_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
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
create trigger thanh_toan_kiem_tra before insert on public.thanh_toan
  for each row execute function public.trg_thanh_toan_truoc();

create function public.trg_thanh_toan_sau() returns trigger language plpgsql as $$
begin
  if new.phuong_thuc = 'the_tien' then
    insert into public.the_so_cai (the_id, loai, so_tien, hoa_don_id, nguoi_id, ghi_chu)
    values (new.the_id, case new.loai when 'thu' then 'tru_tien' else 'hoan_tien' end,
            case new.loai when 'thu' then -new.so_tien else new.so_tien end, new.hoa_don_id, new.nguoi_id, new.ghi_chu);
  end if;
  perform public.tinh_lai_hoa_don(new.hoa_don_id);
  return null;
end $$;
create trigger thanh_toan_ghi_so after insert on public.thanh_toan
  for each row execute function public.trg_thanh_toan_sau();
