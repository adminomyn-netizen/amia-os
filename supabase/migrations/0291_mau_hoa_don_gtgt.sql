-- 0291 — MẪU HOÁ ĐƠN GTGT lập ngay trong AMIA OS (đợt 4, 03/11/2026).
-- Chị Lâm: "hoá đơn điện tử để sau, hoặc làm mẫu hoá đơn trực tiếp trên app mình để nó từ app mình đi ra luôn, sau chỉ cần đẩy mẫu hoá đơn lên".
-- SalonHero có màn "Kết nối H.đơn Đ.tử" (Viettel SInvoice / MISA / CyberBill / Hilo) nhưng tài khoản AMIA CHƯA cài kết nối nào (getTaxInvoiceSettingList = []).
-- Nên AMIA dựng hoá đơn GTGT theo mẫu chuẩn + XML theo cấu trúc HĐĐT của Tổng cục Thuế (QĐ 1450/QĐ-TCT), CHƯA gửi nhà cung cấp, chưa ký số, chưa có mã CQT.
--   • hddt_nguoi_ban : thông tin người bán theo chi nhánh (tên đơn vị, MST, địa chỉ, ký hiệu, mẫu số, thuế suất mặc định). Để TRỐNG cho chị điền — không bịa.
--   • hddt_day_so     : bộ đếm số hoá đơn theo (MST, mẫu số, ký hiệu). Số đã cấp không dùng lại (huỷ thì giữ số, có dấu vết).
--   • hoa_don_gtgt_nhap: nháp thông tin người mua (loại, MST/CCCD, tên đơn vị, địa chỉ, người mua, SĐT, email) + thuế suất — như hộp "Khởi tạo hoá đơn điện tử" của SalonHero.
--   • hoa_don_gtgt    : hoá đơn ĐÃ XUẤT — ảnh chụp đầy đủ (người bán, người mua, dòng hàng, tổng, bằng chữ, XML) vì đồng bộ đêm có thể ghi lại dòng của đơn SalonHero.
--     hoa_don_id null được (on delete set null) để lệnh xoá thử của đồng bộ đêm (tự kiểm, luôn rollback) không vấp khoá ngoại; mã hoá đơn giữ ở ma_hoa_don.
--   • Xuất = hddt_xuat(): khoá dãy số, cấp số, ghi ảnh chụp, ghi hoa_don.vat_hd_* (chính mốc mà 0210 dùng để KHOÁ SỬA ĐƠN và ngăn "Đã xuất" đang đọc).
--   • Huỷ = hddt_huy(): giữ số, ghi lý do/người/lúc, gỡ vat_hd_* để đơn quay về "Cần xuất".
-- Không đụng cột/ràng buộc nào của hoa_don mà đồng bộ đêm ghi (chỉ đọc hoa_don, và cập nhật vat_hd_* như trang Hoá đơn điện tử vẫn làm).

create table if not exists public.hddt_nguoi_ban (
  chi_nhanh_id uuid primary key references public.chi_nhanh(id) on delete cascade,
  ten_don_vi text, ma_so_thue text, dia_chi text, dien_thoai text, email text, so_tai_khoan text, ngan_hang text,
  mau_so text not null default '1', ky_hieu text, thue_suat text not null default '10',
  sua_boi uuid, sua_luc timestamptz not null default now(),
  constraint hddt_nguoi_ban_mau_so check (mau_so ~ '^[1-6]$'),
  constraint hddt_nguoi_ban_ky_hieu check (ky_hieu is null or ky_hieu ~ '^[CKM][0-9]{2}[TDLMNBGH][A-Z0-9]{2}$'),
  constraint hddt_nguoi_ban_thue_suat check (thue_suat in ('0', '5', '8', '10', 'KCT', 'KKKNT'))
);

create table if not exists public.hddt_day_so (
  ma_so_thue text not null, mau_so text not null, ky_hieu text not null, so_cuoi integer not null default 0,
  primary key (ma_so_thue, mau_so, ky_hieu)
);

create table if not exists public.hoa_don_gtgt_nhap (
  hoa_don_id uuid primary key references public.hoa_don(id) on delete cascade,
  loai_nguoi_mua text not null default 'ca_nhan' check (loai_nguoi_mua in ('doanh_nghiep', 'ca_nhan', 'khach_le')),
  ma_so_thue text, cccd text, ten_don_vi text, dia_chi text, ho_ten_nguoi_mua text, dien_thoai text, email text,
  thue_suat text check (thue_suat is null or thue_suat in ('0', '5', '8', '10', 'KCT', 'KKKNT')),
  hinh_thuc_tt text, ghi_chu text,
  sua_boi uuid, sua_luc timestamptz not null default now()
);

create table if not exists public.hoa_don_gtgt (
  id uuid primary key default gen_random_uuid(),
  hoa_don_id uuid references public.hoa_don(id) on delete set null,
  ma_hoa_don text not null, chi_nhanh_id uuid,
  trang_thai text not null default 'da_xuat' check (trang_thai in ('da_xuat', 'da_huy')),
  ma_so_thue_ban text not null, mau_so text not null, ky_hieu text not null, so integer not null, ngay_lap date not null,
  nguoi_ban jsonb not null, noi_dung jsonb not null, xml text,
  nguoi_xuat uuid, xuat_luc timestamptz not null default now(),
  huy_boi uuid, huy_luc timestamptz, ly_do_huy text,
  unique (ma_so_thue_ban, mau_so, ky_hieu, so)
);
create unique index if not exists hoa_don_gtgt_mot_ban_dang_xuat on public.hoa_don_gtgt (hoa_don_id) where trang_thai = 'da_xuat';
create index if not exists hoa_don_gtgt_ngay on public.hoa_don_gtgt (ngay_lap desc);

-- Xuất hoá đơn: p_noi_dung = { nguoi_mua: {...}, dong: [...], tong: {...}, thue_suat, hinh_thuc_tt } do máy chủ dựng từ đơn (hàm thuần, có test).
-- p_cn = chi nhánh của người xuất (null = văn phòng chung, xuất được mọi chi nhánh).
create or replace function public.hddt_xuat(p_hoa_don uuid, p_nguoi uuid, p_cn uuid, p_ngay date, p_noi_dung jsonb)
returns table (id uuid, so integer, ky_hieu text, mau_so text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare h public.hoa_don; b public.hddt_nguoi_ban; v_so integer; v_id uuid; v_ky text;
begin
  select * into h from public.hoa_don x where x.id = p_hoa_don for update;
  if not found or (p_cn is not null and h.chi_nhanh_id is distinct from p_cn) then raise exception 'Không tìm thấy hoá đơn.' using errcode = 'P0001'; end if;
  if h.trang_thai <> 'hoan_thanh' then raise exception 'Chỉ xuất hoá đơn GTGT cho hoá đơn đã hoàn thành (hoá đơn % đang %).', h.ma, h.trang_thai using errcode = 'P0001'; end if;
  if h.la_so_du_dau then raise exception 'Hoá đơn % là số dư nợ đầu kỳ, không xuất hoá đơn GTGT.', h.ma using errcode = 'P0001'; end if;
  if h.vat_hd_so is not null or h.vat_hd_luc is not null then
    raise exception 'Hoá đơn % đã ghi hoá đơn điện tử (số %). Gỡ số đó trước nếu muốn lập lại trong app.', h.ma, coalesce(h.vat_hd_so, 'chưa ghi số') using errcode = 'P0001';
  end if;
  if exists (select 1 from public.hoa_don_gtgt g where g.hoa_don_id = h.id and g.trang_thai = 'da_xuat') then
    raise exception 'Hoá đơn % đã xuất hoá đơn GTGT.', h.ma using errcode = 'P0001';
  end if;
  v_ky := to_char(h.ngay_hd, 'YYYY-MM');
  if exists (select 1 from public.ky_ke_toan k where k.thang = v_ky and k.trang_thai = 'da_khoa') then
    raise exception 'Kỳ kế toán tháng %/% đã khoá, không xuất thêm được.', to_char(h.ngay_hd, 'MM'), to_char(h.ngay_hd, 'YYYY') using errcode = 'P0001';
  end if;
  select * into b from public.hddt_nguoi_ban n where n.chi_nhanh_id = h.chi_nhanh_id;
  if not found or coalesce(trim(b.ten_don_vi), '') = '' or coalesce(trim(b.ma_so_thue), '') = '' or coalesce(trim(b.dia_chi), '') = '' or coalesce(b.ky_hieu, '') = '' then
    raise exception 'Chưa đủ thông tin người bán của chi nhánh này (tên đơn vị, mã số thuế, địa chỉ, ký hiệu hoá đơn). Điền ở Hoá đơn điện tử › Thông tin người bán.' using errcode = 'P0001';
  end if;
  if p_noi_dung is null or jsonb_typeof(p_noi_dung -> 'dong') <> 'array' or jsonb_array_length(p_noi_dung -> 'dong') = 0 then
    raise exception 'Hoá đơn không có dòng hàng để xuất.' using errcode = 'P0001';
  end if;
  insert into public.hddt_day_so as d (ma_so_thue, mau_so, ky_hieu) values (b.ma_so_thue, b.mau_so, b.ky_hieu) on conflict do nothing;
  update public.hddt_day_so d set so_cuoi = d.so_cuoi + 1
   where d.ma_so_thue = b.ma_so_thue and d.mau_so = b.mau_so and d.ky_hieu = b.ky_hieu returning d.so_cuoi into v_so;
  if v_so > 99999999 then raise exception 'Ký hiệu % đã hết dãy số (tối đa 8 chữ số). Đăng ký ký hiệu mới.', b.ky_hieu using errcode = 'P0001'; end if;
  insert into public.hoa_don_gtgt (hoa_don_id, ma_hoa_don, chi_nhanh_id, ma_so_thue_ban, mau_so, ky_hieu, so, ngay_lap, nguoi_ban, noi_dung, nguoi_xuat)
  values (h.id, h.ma, h.chi_nhanh_id, b.ma_so_thue, b.mau_so, b.ky_hieu, v_so, coalesce(p_ngay, (now() at time zone 'Asia/Ho_Chi_Minh')::date),
          jsonb_build_object('ten', b.ten_don_vi, 'mst', b.ma_so_thue, 'dia_chi', b.dia_chi, 'dien_thoai', b.dien_thoai, 'email', b.email, 'so_tai_khoan', b.so_tai_khoan, 'ngan_hang', b.ngan_hang),
          p_noi_dung, p_nguoi)
  returning hoa_don_gtgt.id into v_id;
  update public.hoa_don x set vat_hd_so = v_so::text, vat_hd_ky_hieu = b.ky_hieu, vat_hd_mau_so = b.mau_so,
         vat_hd_ngay = coalesce(p_ngay, (now() at time zone 'Asia/Ho_Chi_Minh')::date), vat_hd_luc = now(), vat_hd_nguoi_id = p_nguoi, vat_hd_tra_cuu = null
   where x.id = h.id;
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (p_nguoi, 'xuat_hd_gtgt', 'hoa_don', h.id, jsonb_build_object('so', v_so, 'ky_hieu', b.ky_hieu, 'mau_so', b.mau_so, 'gtgt_id', v_id));
  return query select v_id, v_so, b.ky_hieu, b.mau_so;
end $$;

-- Huỷ hoá đơn GTGT đã xuất trong app: giữ số (không cấp lại), ghi lý do; gỡ vat_hd_* để đơn quay về "Cần xuất" và mở khoá sửa đơn.
create or replace function public.hddt_huy(p_id uuid, p_nguoi uuid, p_cn uuid, p_ly_do text)
returns void language plpgsql set search_path = public, pg_temp as $$
declare g public.hoa_don_gtgt;
begin
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Huỷ hoá đơn GTGT phải ghi lý do.' using errcode = 'P0001'; end if;
  select * into g from public.hoa_don_gtgt x where x.id = p_id for update;
  if not found or (p_cn is not null and g.chi_nhanh_id is distinct from p_cn) then raise exception 'Không tìm thấy hoá đơn GTGT.' using errcode = 'P0001'; end if;
  if g.trang_thai <> 'da_xuat' then raise exception 'Hoá đơn GTGT này đã huỷ trước đó.' using errcode = 'P0001'; end if;
  update public.hoa_don_gtgt x set trang_thai = 'da_huy', huy_boi = p_nguoi, huy_luc = now(), ly_do_huy = trim(p_ly_do) where x.id = g.id;
  if g.hoa_don_id is not null then
    update public.hoa_don x set vat_hd_so = null, vat_hd_ky_hieu = null, vat_hd_mau_so = null, vat_hd_ngay = null, vat_hd_luc = null, vat_hd_nguoi_id = null, vat_hd_tra_cuu = null
     where x.id = g.hoa_don_id and x.vat_hd_so = g.so::text and x.vat_hd_ky_hieu = g.ky_hieu;
  end if;
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (p_nguoi, 'huy_hd_gtgt', 'hoa_don', g.hoa_don_id, jsonb_build_object('so', g.so, 'ky_hieu', g.ky_hieu, 'ly_do', trim(p_ly_do), 'gtgt_id', g.id));
end $$;

revoke all on function public.hddt_xuat(uuid, uuid, uuid, date, jsonb) from public, anon, authenticated;
revoke all on function public.hddt_huy(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.hddt_xuat(uuid, uuid, uuid, date, jsonb) to service_role;
grant execute on function public.hddt_huy(uuid, uuid, uuid, text) to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
