-- 0080 — THẺ GIẢM GIÁ / VOUCHER ở Thu ngân, theo SalonHero (menu Cài đặt › "Thẻ giảm giá", màn Thu ngân › "Thẻ giảm giá/voucher (Chọn thẻ)").
-- Mô hình SalonHero: một voucher = một chương trình (tên, thời gian, giá trị Tiền/Phần trăm, giảm tối đa, số lượng phát hành, loại mã "1 mã dùng nhiều lần"
-- hoặc "Nhiều mã (mỗi mã 1 lần)", giới hạn áp dụng, đơn tối thiểu, số lần dùng tối đa cho 1 khách, hạng khách, khách cũ/mới, chi nhánh, ngày trong tuần,
-- hiển thị trên tìm kiếm thu ngân, mô tả) và có một hoặc nhiều MÃ (bảng voucher_ma).
-- Chưa làm (ghi ở sao-luu/chi-chinh-sau.md): giới hạn "Tùy chọn" từng dịch vụ, nhóm khách hàng, loại lịch hẹn, khung giờ sử dụng; mỗi đơn dùng một voucher.
-- Cách tính giống đổi điểm (0067): tiền voucher được CỘNG vào hoa_don.giam_gia_don và ghi riêng ở hoa_don.giam_voucher; đơn không voucher tính y hệt trước.
-- Lượt dùng ghi vào sổ riêng voucher_luot_dung (chỉ thêm dòng). Kiểm hạn / hết mã / sai chi nhánh / sai ngày / sai hạng / lượt mỗi khách / sai số tiền ở CHÍNH hàm chốt đơn
-- (khoá dòng voucher để hai máy cùng dùng lượt cuối không cùng qua). Huỷ hoá đơn thì tự hoàn lượt đúng một lần.
-- Lưu ý nghiệp vụ: phần giảm của voucher nằm trong giam_gia_don nên được chia theo tỉ lệ cho MỌI dòng của đơn khi tính giá trị buổi thẻ và doanh số nhân viên (giống giảm giá cả đơn nhập tay).

create table public.voucher (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  tu_ngay date not null,
  den_ngay date not null,
  loai_giam text not null check (loai_giam in ('tien', 'phan_tram')),
  gia_tri numeric(12, 2) not null check (gia_tri > 0),
  giam_toi_da bigint check (giam_toi_da is null or giam_toi_da > 0),
  so_luong int not null check (so_luong > 0 and so_luong <= 100000),      -- số lượng phát hành: số lượt dùng (1 mã nhiều lần) hoặc số mã (mỗi mã 1 lần)
  loai_ma text not null check (loai_ma in ('mot_ma', 'nhieu_ma')),
  gioi_han text not null default 'tong_don' check (gioi_han in ('tong_don', 'dich_vu_the', 'san_pham', 'the', 'dich_vu', 'dich_vu_san_pham')),
  don_toi_thieu bigint not null default 0 check (don_toi_thieu >= 0),
  so_lan_toi_da_khach int check (so_lan_toi_da_khach is null or so_lan_toi_da_khach > 0),
  hang_khach text[],                                                      -- null = mọi hạng (tên trong hang_khach)
  khach_moi_cu text check (khach_moi_cu is null or khach_moi_cu in ('moi', 'cu')),
  chi_nhanh_ids uuid[],                                                   -- null = mọi chi nhánh
  ngay_trong_tuan smallint[],                                             -- 1 = Thứ 2 … 7 = Chủ nhật; null = mọi ngày
  hien_thi_tim_kiem text not null default 'co' check (hien_thi_tim_kiem in ('co', 'khong', 'tu_dong')),
  mo_ta text,
  bi_khoa boolean not null default false,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  sua_luc timestamptz,
  constraint voucher_phan_tram_hop_le check (loai_giam <> 'phan_tram' or gia_tri <= 100),
  constraint voucher_ngay_hop_le check (tu_ngay <= den_ngay)
);

create table public.voucher_ma (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.voucher (id),
  ma text not null check (ma ~ '^[A-Z0-9]{3,30}$'),                       -- SalonHero: chỉ chữ cái không dấu và chữ số
  tao_luc timestamptz not null default now()
);
create unique index voucher_ma_uq on public.voucher_ma (ma);
create index voucher_ma_voucher_idx on public.voucher_ma (voucher_id);

create table public.voucher_luot_dung (
  id bigint generated always as identity primary key,
  voucher_id uuid not null references public.voucher (id),
  ma_id uuid not null references public.voucher_ma (id),
  hoa_don_id uuid not null,               -- không khoá ngoại (như khach_diem_so): xoá đơn nháp / gỡ đợt nhập không bị chặn
  loai text not null check (loai in ('dung', 'hoan')),
  so_tien bigint not null check (so_tien >= 0),
  khach_id uuid references public.khach_hang (id),
  nguoi_id uuid references public.nhan_vien (id),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);
-- Mỗi hoá đơn dùng tối đa một voucher: một dòng "dung" và (nếu huỷ) một dòng "hoan".
create unique index voucher_luot_hd_loai_uq on public.voucher_luot_dung (hoa_don_id, loai);
create index voucher_luot_voucher_idx on public.voucher_luot_dung (voucher_id, khach_id);
create index voucher_luot_ma_idx on public.voucher_luot_dung (ma_id);
create trigger voucher_luot_dung_chi_them before update or delete on public.voucher_luot_dung
  for each row execute function public.chi_them_dong();

-- Loại dòng hàng mà voucher áp dụng (cột "Giới hạn dịch vụ áp dụng" của SalonHero). Cùng bảng với src/lib/ban-hang.ts (GIOI_HAN_VOUCHER).
create function public.voucher_loai_dong(p_gioi_han text) returns text[] language sql immutable as $$
  select case p_gioi_han
    when 'dich_vu_the' then array['dich_vu', 'goi_the']
    when 'san_pham' then array['san_pham']
    when 'the' then array['goi_the']
    when 'dich_vu' then array['dich_vu']
    when 'dich_vu_san_pham' then array['dich_vu', 'san_pham']
    else array['dich_vu', 'goi_the', 'san_pham'] end $$;

-- Tiền giảm của một voucher cho một hoá đơn, tính từ CÁC DÒNG HÀNG (thành tiền sau giảm giá dòng).
-- Phần trăm: làm tròn đồng, chặn bởi giam_toi_da; tiền: không quá phần tiền hàng áp dụng. "Tổng giá trị đơn hàng" = mọi dòng. Trả 0 nếu không có dòng nào áp dụng.
create function public.tinh_giam_voucher(p_voucher uuid, p_hoa_don uuid) returns bigint language plpgsql stable as $$
declare v public.voucher; v_co_so bigint; v_giam bigint;
begin
  select * into v from public.voucher where id = p_voucher;
  if not found then return 0; end if;
  select coalesce(sum(thanh_tien), 0) into v_co_so from public.hoa_don_dong
   where hoa_don_id = p_hoa_don and loai = any (public.voucher_loai_dong(v.gioi_han));
  if v.loai_giam = 'phan_tram' then
    v_giam := round(v_co_so * v.gia_tri / 100)::bigint;
    if v.giam_toi_da is not null then v_giam := least(v_giam, v.giam_toi_da); end if;
  else
    v_giam := floor(v.gia_tri)::bigint;
  end if;
  return greatest(least(v_giam, v_co_so), 0);
end $$;

-- Chốt hoá đơn có voucher (và có thể cả đổi điểm). Không đổi chữ ký của chot_hoa_don / chot_hoa_don_doi_diem: hàm này kiểm voucher, ghi lượt, rồi gọi hàm đổi điểm.
-- Máy chủ đã cộng tiền voucher vào giam_gia_don lúc tạo đơn (vì thanh toán ghi TRƯỚC khi chốt); ở đây tính lại và đối chiếu, lệch thì không chốt.
create function public.chot_hoa_don_voucher(p_id uuid, p_nguoi uuid, p_ma text, p_tien_voucher bigint, p_diem int, p_tien_diem bigint) returns void language plpgsql as $$
declare h public.hoa_don; v public.voucher; m public.voucher_ma; v_tong int; v_ma_da int; v_khach_da int; v_tien bigint; v_hang text;
  v_ma text := upper(btrim(coalesce(p_ma, ''))); v_nay date := public.hom_nay();
begin
  if v_ma = '' then
    perform public.chot_hoa_don_doi_diem(p_id, p_nguoi, p_diem, p_tien_diem);
    return;
  end if;
  select * into h from public.hoa_don where id = p_id for update;
  if not found then raise exception 'Không có hoá đơn này' using errcode = 'P0001'; end if;
  if h.trang_thai <> 'nhap' then raise exception 'Hoá đơn % không còn ở trạng thái nháp', h.ma using errcode = 'P0001'; end if;
  select * into m from public.voucher_ma where ma = v_ma;
  if not found then raise exception 'Voucher % không tồn tại', v_ma using errcode = 'P0001'; end if;
  select * into v from public.voucher where id = m.voucher_id for update;
  if v.bi_khoa then raise exception 'Voucher % đang bị khoá', v_ma using errcode = 'P0001'; end if;
  if v.tu_ngay > v_nay then raise exception 'Voucher % chưa đến ngày dùng (từ %)', v_ma, to_char(v.tu_ngay, 'DD/MM/YYYY') using errcode = 'P0001'; end if;
  if v.den_ngay < v_nay then raise exception 'Voucher % đã hết hạn ngày %', v_ma, to_char(v.den_ngay, 'DD/MM/YYYY') using errcode = 'P0001'; end if;
  if v.chi_nhanh_ids is not null and not (h.chi_nhanh_id = any (v.chi_nhanh_ids)) then raise exception 'Voucher % không áp dụng cho chi nhánh của đơn này', v_ma using errcode = 'P0001'; end if;
  if v.ngay_trong_tuan is not null and not (extract(isodow from v_nay)::smallint = any (v.ngay_trong_tuan)) then raise exception 'Voucher % không áp dụng cho ngày hôm nay trong tuần', v_ma using errcode = 'P0001'; end if;
  -- Lượt đã dùng (trừ lượt đã hoàn): cả voucher, riêng mã này, riêng khách này.
  select coalesce(sum(case loai when 'dung' then 1 else -1 end), 0) into v_tong from public.voucher_luot_dung where voucher_id = v.id;
  select coalesce(sum(case loai when 'dung' then 1 else -1 end), 0) into v_ma_da from public.voucher_luot_dung where ma_id = m.id;
  if v_tong >= v.so_luong or (v.loai_ma = 'nhieu_ma' and v_ma_da >= 1) then raise exception 'Voucher % đã hết mã (hết lượt dùng)', v_ma using errcode = 'P0001'; end if;
  if v.hang_khach is not null or v.khach_moi_cu is not null or v.so_lan_toi_da_khach is not null then
    if h.khach_id is null then raise exception 'Voucher % chỉ áp dụng khi đã chọn khách hàng', v_ma using errcode = 'P0001'; end if;
  end if;
  if v.hang_khach is not null then
    select hang into v_hang from public.v_khach_hang where id = h.khach_id;
    if v_hang is null or not (v_hang = any (v.hang_khach)) then raise exception 'Voucher % không áp dụng cho hạng khách này (hạng %)', v_ma, coalesce(v_hang, 'chưa có') using errcode = 'P0001'; end if;
  end if;
  if v.khach_moi_cu is not null then
    if (exists (select 1 from public.hoa_don x where x.khach_id = h.khach_id and x.trang_thai = 'hoan_thanh' and x.id <> h.id)) <> (v.khach_moi_cu = 'cu') then
      raise exception 'Voucher % chỉ áp dụng cho khách %', v_ma, case v.khach_moi_cu when 'moi' then 'mới' else 'quay lại' end using errcode = 'P0001';
    end if;
  end if;
  if v.so_lan_toi_da_khach is not null then
    select coalesce(sum(case loai when 'dung' then 1 else -1 end), 0) into v_khach_da from public.voucher_luot_dung where voucher_id = v.id and khach_id = h.khach_id;
    if v_khach_da >= v.so_lan_toi_da_khach then raise exception 'Khách này đã dùng voucher % đủ % lần', v_ma, v.so_lan_toi_da_khach using errcode = 'P0001'; end if;
  end if;
  perform public.tinh_lai_hoa_don(p_id);
  select * into h from public.hoa_don where id = p_id;
  if h.tong_hang < v.don_toi_thieu then raise exception 'Voucher % chỉ áp dụng cho đơn từ % đ', v_ma, v.don_toi_thieu using errcode = 'P0001'; end if;
  v_tien := public.tinh_giam_voucher(v.id, p_id);
  if v_tien <= 0 then raise exception 'Voucher % không áp dụng được cho dòng hàng nào của đơn', v_ma using errcode = 'P0001'; end if;
  if p_tien_voucher is distinct from v_tien then raise exception 'Tiền giảm của voucher % không khớp (máy chủ tính % đ)', v_ma, v_tien using errcode = 'P0001'; end if;
  if v_tien + coalesce(p_tien_diem, 0) > h.giam_gia_don then raise exception 'Giảm giá cả đơn nhỏ hơn tổng voucher và tiền đổi điểm' using errcode = 'P0001'; end if;
  insert into public.voucher_luot_dung (voucher_id, ma_id, hoa_don_id, loai, so_tien, khach_id, nguoi_id, ghi_chu)
    values (v.id, m.id, p_id, 'dung', v_tien, h.khach_id, p_nguoi, 'Dùng cho hoá đơn ' || h.ma);
  update public.hoa_don set giam_voucher = v_tien where id = p_id;
  perform public.chot_hoa_don_doi_diem(p_id, p_nguoi, p_diem, p_tien_diem);
end $$;

-- Huỷ hoá đơn (bằng tay hay tự huỷ khi lỗi) → hoàn lượt voucher đúng một lần.
create function public.trg_hoan_voucher_khi_huy() returns trigger language plpgsql as $$
begin
  if new.trang_thai = 'huy' and old.trang_thai <> 'huy' then
    insert into public.voucher_luot_dung (voucher_id, ma_id, hoa_don_id, loai, so_tien, khach_id, ghi_chu)
    select d.voucher_id, d.ma_id, d.hoa_don_id, 'hoan', d.so_tien, d.khach_id, 'Hoàn lượt do huỷ hoá đơn ' || new.ma
      from public.voucher_luot_dung d
     where d.hoa_don_id = new.id and d.loai = 'dung'
       and not exists (select 1 from public.voucher_luot_dung x where x.hoa_don_id = new.id and x.loai = 'hoan');
  end if;
  return null;
end $$;
create trigger hoa_don_hoan_voucher after update of trang_thai on public.hoa_don
  for each row execute function public.trg_hoan_voucher_khi_huy();

select public.khoa_tat_ca_bang();
