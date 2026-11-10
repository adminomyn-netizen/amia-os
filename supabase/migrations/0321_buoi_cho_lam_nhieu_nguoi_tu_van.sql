-- 0321 — LUỒNG THU NGÂN → CHUYÊN VIÊN TRỊ LIỆU + NHIỀU NGƯỜI LÀM MỘT BUỔI + TƯ VẤN TRONG BUỔI (chị Lâm 10/11/2026).
-- CHỈ THÊM: không sửa thuc_hien_buoi / huy_buoi / tao_phieu_theo_buoi, không đổi báo cáo cũ, không đụng dữ liệu cũ.
--
-- 1) buoi_cho_lam = hàng chờ bàn giao. Thu ngân/lễ tân bấm "Chuyển cho chuyên viên trị liệu" → 1 dòng 'cho_lam'.
--    Dòng này KHÔNG phải buổi: chưa trừ buổi, chưa ghi doanh thu, chưa ra phiếu vật tư, báo cáo không đọc bảng này.
--    Chuyên viên bấm Bắt đầu làm → 'dang_lam'; Đã làm xong → hàm xong_buoi_cho gọi ĐÚNG thuc_hien_buoi có sẵn (trừ buổi + sổ cái)
--    trong cùng giao dịch, khoá dòng chờ nên bấm hai lần không trừ hai buổi. Trả lại thu ngân / Huỷ: chỉ đổi trạng thái dòng chờ.
-- 2) buoi_nhan_vien = danh sách người làm (vai 'thuc_hien') và người tư vấn (vai 'tu_van') của một buổi.
--    buoi_thuc_hien.nv_thuc_hien_id vẫn là NGƯỜI CHÍNH (người đầu tiên) → mọi báo cáo/hoa hồng cũ giữ nguyên.
--    ti_le ghi theo đúng quy tắc chia đều của hoá đơn (chiaDeuTi: 33,33/33,33/33,34) để sau này báo cáo dùng, hiện chưa báo cáo nào đọc.
-- 3) Nội dung tư vấn trong buổi ghi thành một PHIẾU TƯ VẤN (0105) như quy trình tư vấn: tình trạng da → "Đặt vấn đề",
--    khuyến nghị / sản phẩm, dịch vụ đề xuất → "Phân tích", kết quả 'cho_chot'; thêm cột phieu_tu_van.buoi_id để biết phiếu ra từ buổi nào.
set lock_timeout = '4s';

create table public.buoi_cho_lam (
  id uuid primary key default gen_random_uuid(),
  the_id uuid not null references public.the_khach (id),
  khach_id uuid not null references public.khach_hang (id),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  dich_vu_id uuid not null references public.dich_vu (id),
  nv_ids uuid[] not null check (cardinality(nv_ids) between 1 and 7),
  bac_si_id uuid references public.nhan_vien (id),
  lich_hen_id uuid references public.lich_hen (id),
  ngay date not null default public.hom_nay(),
  tham_so jsonb not null default '{}'::jsonb,
  ghi_chu text check (ghi_chu is null or char_length(ghi_chu) <= 1000),
  tu_van_ids uuid[] not null default '{}' check (cardinality(tu_van_ids) <= 5),
  tu_van_tinh_trang text check (tu_van_tinh_trang is null or char_length(tu_van_tinh_trang) <= 1000),
  tu_van_de_xuat text check (tu_van_de_xuat is null or char_length(tu_van_de_xuat) <= 1000),
  ke_tiep_ngay date,
  ke_tiep_noi_dung text check (ke_tiep_noi_dung is null or char_length(ke_tiep_noi_dung) <= 300),
  trang_thai text not null default 'cho_lam' check (trang_thai in ('cho_lam', 'dang_lam', 'xong', 'tra_lai', 'huy')),
  chuyen_boi uuid references public.nhan_vien (id),
  chuyen_luc timestamptz not null default now(),
  bat_dau_luc timestamptz,
  bat_dau_boi uuid references public.nhan_vien (id),
  xong_luc timestamptz,
  xu_ly_boi uuid references public.nhan_vien (id),
  buoi_id uuid unique references public.buoi_thuc_hien (id),
  ly_do text check (ly_do is null or char_length(ly_do) <= 300),
  cap_nhat_luc timestamptz not null default now(),
  constraint buoi_cho_lam_xong_co_buoi check (trang_thai <> 'xong' or buoi_id is not null),
  constraint buoi_cho_lam_tra_huy_co_ly_do check (trang_thai not in ('tra_lai', 'huy') or char_length(btrim(coalesce(ly_do, ''))) > 0)
);
create index buoi_cho_lam_ngay_idx on public.buoi_cho_lam (chi_nhanh_id, ngay);
create index buoi_cho_lam_mo_idx on public.buoi_cho_lam using gin (nv_ids) where trang_thai in ('cho_lam', 'dang_lam');
-- Một thẻ + một dịch vụ chỉ có một lượt đang chờ/đang làm (chống thu ngân bấm chuyển hai lần).
create unique index buoi_cho_lam_mot_luot_idx on public.buoi_cho_lam (the_id, dich_vu_id) where trang_thai in ('cho_lam', 'dang_lam');

-- Chuông thông báo cập nhật tức thời khi có khách được chuyển / đổi trạng thái (0021 chỉ gắn cho danh sách bảng cũ).
create trigger bao_canh_bao_doi after insert or update or delete on public.buoi_cho_lam
  for each statement execute function public.bao_canh_bao_doi();

-- Mã chuông mới "buoicho" (khách chờ làm của tôi) phải lưu được trạng thái đã đọc: thêm vào danh sách 0316, giữ nguyên các mã cũ.
alter table public.thong_bao_trang_thai drop constraint if exists thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam', 'tonam', 'tdyc', 'tduv', 'tdtin', 'knai', 'bchung', 'lead', 'leadnhac', 'buoicho'));

create table public.buoi_nhan_vien (
  buoi_id uuid not null references public.buoi_thuc_hien (id),
  nhan_vien_id uuid not null references public.nhan_vien (id),
  vai text not null check (vai in ('thuc_hien', 'tu_van')),
  thu_tu smallint not null default 1,
  ti_le numeric(5,2) not null check (ti_le > 0 and ti_le <= 100),
  tao_luc timestamptz not null default now(),
  primary key (buoi_id, nhan_vien_id, vai)
);
create index buoi_nhan_vien_nv_idx on public.buoi_nhan_vien (nhan_vien_id, vai);
create trigger buoi_nhan_vien_chi_them before update or delete on public.buoi_nhan_vien
  for each row execute function public.chi_them_dong();

alter table public.phieu_tu_van add column if not exists buoi_id uuid references public.buoi_thuc_hien (id);
create index if not exists phieu_tu_van_buoi_idx on public.phieu_tu_van (buoi_id) where buoi_id is not null;

-- Ghi người làm + người tư vấn + phiếu tư vấn của MỘT buổi đã làm. Không đụng số buổi, tiền, sổ cái.
-- p_nv: người làm (người đầu = người chính, phải trùng nv_thuc_hien_id của buổi). p_tu_van: người tư vấn (người đầu đứng tên phiếu).
create function public.ghi_nguoi_buoi(p_buoi uuid, p_nv uuid[], p_tu_van uuid[], p_tinh_trang text, p_de_xuat text, p_nguoi uuid)
returns uuid language plpgsql as $$
declare b public.buoi_thuc_hien; v_nv uuid[]; v_tv uuid[]; n int; i int; v_phieu uuid;
begin
  select * into b from public.buoi_thuc_hien where id = p_buoi;
  if not found then raise exception 'Không có buổi này' using errcode = 'P0001'; end if;
  -- Bỏ trùng, giữ thứ tự; người chính luôn đứng đầu.
  select coalesce(array_agg(x order by o), '{}') into v_nv from (select distinct on (x) x, o from unnest(array[b.nv_thuc_hien_id] || coalesce(p_nv, '{}')) with ordinality as t(x, o) where x is not null order by x, o) s;
  select coalesce(array_agg(x order by o), '{}') into v_tv from (select distinct on (x) x, o from unnest(coalesce(p_tu_van, '{}')) with ordinality as t(x, o) where x is not null order by x, o) s;
  if cardinality(v_nv) > 7 then raise exception 'Tối đa 7 người làm một buổi' using errcode = 'P0001'; end if;
  if cardinality(v_tv) > 5 then raise exception 'Tối đa 5 người tư vấn' using errcode = 'P0001'; end if;
  if exists (select 1 from unnest(v_nv || v_tv) x where not exists (select 1 from public.nhan_vien where id = x)) then
    raise exception 'Có người làm / người tư vấn không còn trong danh sách nhân viên' using errcode = 'P0001';
  end if;
  -- Chia đều như hoá đơn: mỗi người round(100/n, 2), người cuối nhận phần lẻ cho đủ 100.
  n := cardinality(v_nv);
  for i in 1..n loop
    insert into public.buoi_nhan_vien (buoi_id, nhan_vien_id, vai, thu_tu, ti_le)
    values (p_buoi, v_nv[i], 'thuc_hien', i, case when i < n then round(100.0 / n, 2) else 100 - round(100.0 / n, 2) * (n - 1) end)
    on conflict do nothing;
  end loop;
  n := cardinality(v_tv);
  for i in 1..n loop
    insert into public.buoi_nhan_vien (buoi_id, nhan_vien_id, vai, thu_tu, ti_le)
    values (p_buoi, v_tv[i], 'tu_van', i, case when i < n then round(100.0 / n, 2) else 100 - round(100.0 / n, 2) * (n - 1) end)
    on conflict do nothing;
  end loop;
  p_tinh_trang := nullif(btrim(coalesce(p_tinh_trang, '')), '');
  p_de_xuat := nullif(btrim(coalesce(p_de_xuat, '')), '');
  if p_tinh_trang is not null or p_de_xuat is not null then
    if cardinality(v_tv) = 0 then raise exception 'Có nội dung tư vấn thì chọn người tư vấn' using errcode = 'P0001'; end if;
    select id into v_phieu from public.phieu_tu_van where buoi_id = p_buoi limit 1;
    if v_phieu is null then
      insert into public.phieu_tu_van (ma, khach_id, chi_nhanh_id, tu_van_vien_id, ngay_tu_van, dich_vu_id, dat_van_de, phan_tich, ket_qua, nguoi_ghi_id, buoi_id)
      values ('TV' || lpad(public.so_tiep_theo('tv')::text, 6, '0'), b.khach_id, b.chi_nhanh_id, v_tv[1], b.ngay_lam, b.dich_vu_id,
              left(p_tinh_trang, 1000), left(p_de_xuat, 1000), 'cho_chot', p_nguoi, p_buoi)
      returning id into v_phieu;
    end if;
  end if;
  return v_phieu;
end $$;

-- Chuyên viên bấm "Đã làm xong" trên một khách chờ làm: trừ buổi bằng thuc_hien_buoi có sẵn + ghi người làm/tư vấn, MỘT giao dịch.
-- Dòng chờ bị khoá (for update) và phải đang 'cho_lam'/'dang_lam' → bấm hai lần thì lần sau báo lỗi, không trừ thêm buổi.
create function public.xong_buoi_cho(p_id uuid, p_nv uuid[], p_bac_si uuid, p_tham_so jsonb, p_ghi_chu text,
  p_tu_van uuid[], p_tinh_trang text, p_de_xuat text, p_nguoi uuid)
returns uuid language plpgsql as $$
declare c public.buoi_cho_lam; v_nv uuid[]; v_buoi uuid;
begin
  select * into c from public.buoi_cho_lam where id = p_id for update;
  if not found then raise exception 'Không có lượt chờ làm này' using errcode = 'P0001'; end if;
  if c.trang_thai not in ('cho_lam', 'dang_lam') then raise exception 'Lượt này đã xử lý rồi (đã xong / trả lại / huỷ)' using errcode = 'P0001'; end if;
  v_nv := case when cardinality(coalesce(p_nv, '{}')) > 0 then p_nv else c.nv_ids end;
  v_buoi := public.thuc_hien_buoi(c.the_id, c.dich_vu_id, v_nv[1], coalesce(p_bac_si, c.bac_si_id), c.lich_hen_id, public.hom_nay(),
    coalesce(p_tham_so, c.tham_so), coalesce(nullif(btrim(coalesce(p_ghi_chu, '')), ''), c.ghi_chu), p_nguoi);
  perform public.ghi_nguoi_buoi(v_buoi, v_nv, case when p_tu_van is null then c.tu_van_ids else p_tu_van end,
    coalesce(p_tinh_trang, c.tu_van_tinh_trang), coalesce(p_de_xuat, c.tu_van_de_xuat), p_nguoi);
  update public.buoi_cho_lam set trang_thai = 'xong', buoi_id = v_buoi, xong_luc = now(), xu_ly_boi = p_nguoi, cap_nhat_luc = now(),
    bat_dau_luc = coalesce(bat_dau_luc, now()) where id = p_id;
  return v_buoi;
end $$;

reset lock_timeout;
select public.khoa_tat_ca_bang();
