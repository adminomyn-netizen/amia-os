-- 0203 — (câu 12 + 22) Nhắc chăm sóc tạo tay như SalonHero: dịch vụ, ngày nhắc, lặp (không lặp / đều theo Ngày-Tuần-Tháng mỗi N, M lần / không đều),
--        người phụ trách, nội dung; trạng thái Chưa thực hiện / Đã thực hiện / Huỷ; "Lưu cài đặt này cho dịch vụ" (quy tắc nhắc gắn từng dịch vụ, KHÔNG có chu kỳ mặc định chung).
--        (câu 8, sửa nhỏ) sổ cái "Sửa thẻ" ghi tiền kiểu Việt Nam 150.000 (trước ghi 150,000).
-- Chỉ thêm cột / hàm; dữ liệu nhắc chuyển từ SalonHero giữ nguyên.

-- ───────── khach_nhac: thêm cột cho nhắc tạo tay ─────────
alter table public.khach_nhac add column if not exists dich_vu_id uuid references public.dich_vu (id) on delete set null;
alter table public.khach_nhac add column if not exists nguoi_phu_trach_id uuid references public.nhan_vien (id) on delete set null;
alter table public.khach_nhac add column if not exists nguoi_tao_id uuid references public.nhan_vien (id) on delete set null;
alter table public.khach_nhac add column if not exists lap_khoang integer check (lap_khoang is null or lap_khoang between 1 and 365);
alter table public.khach_nhac add column if not exists xu_ly_boi uuid references public.nhan_vien (id) on delete set null;
alter table public.khach_nhac add column if not exists xu_ly_luc timestamptz;
comment on column public.khach_nhac.kieu_lap is 'SINGLE (không lặp) / DAY / WEEK / MONTH (lặp đều mỗi lap_khoang) / UNEQUAL (lặp không đều): như SalonHero repeat_type.';
comment on column public.khach_nhac.so_lan_lap is 'Số lần lặp thêm sau lần nhắc đầu (như SalonHero total_repeat): 2 lần nhắc = 1.';
comment on column public.khach_nhac.cac_ngay_nhac is 'Mọi thời điểm nhắc (mảng ISO), lần đầu = ngay_nhac.';
create index if not exists khach_nhac_phu_trach_idx on public.khach_nhac (nguoi_phu_trach_id) where nguoi_phu_trach_id is not null;
create index if not exists idx_fk_khach_nhac_dich_vu_id on public.khach_nhac (dich_vu_id);
create index if not exists idx_fk_khach_nhac_nguoi_tao_id on public.khach_nhac (nguoi_tao_id);
create index if not exists idx_fk_khach_nhac_xu_ly_boi on public.khach_nhac (xu_ly_boi);

-- ───────── dich_vu.quy_tac_nhac: quy tắc nhắc lưu theo từng dịch vụ (SalonHero rule_in_reminder) ─────────
-- Dạng {"kieu":"DAY|WEEK|MONTH|UNEQUAL","moi":N,"so_lan":M,"cac_khoang":[ngày,...]}; so_lan = tổng số lần nhắc (gồm lần đầu).
alter table public.dich_vu add column if not exists quy_tac_nhac jsonb check (quy_tac_nhac is null or jsonb_typeof(quy_tac_nhac) = 'object');
comment on column public.dich_vu.quy_tac_nhac is 'Quy tắc nhắc chăm sóc của dịch vụ (SalonHero rule_in_reminder): hộp Tạo nhắc tự điền khi chọn dịch vụ này.';
-- 7 dịch vụ SalonHero đang có quy tắc (đọc 03/11/2026, sửa lần cuối 2022–2023): 6 thẻ CSD / thẻ giá trị mỗi 1 tuần × 2 lần; Vita Biolight mỗi 10 ngày × 2 lần.
update public.dich_vu set quy_tac_nhac = '{"kieu":"WEEK","moi":1,"so_lan":2,"cac_khoang":[]}'::jsonb where sh_id in (366156, 366145, 366122, 366148, 366147, 366146) and quy_tac_nhac is null;
update public.dich_vu set quy_tac_nhac = '{"kieu":"DAY","moi":10,"so_lan":2,"cac_khoang":[]}'::jsonb where sh_id = 366466 and quy_tac_nhac is null;

-- ───────── Danh sách "Lịch nhắc chăm sóc": nhắc có MỘT lần nhắc rơi vào khoảng ngày (nhắc lặp xét từng lần) ─────────
-- Nhắc không lặp (SINGLE / trống) chỉ xét ngay_nhac (dữ liệu SalonHero cũ có cac_ngay_nhac lạ ở nhắc không lặp).
create or replace function public.nhac_cham_soc_loc(
  p_cn uuid default null, p_tu date default null, p_den date default null, p_tt text default null,
  p_phu_trach uuid default null, p_lim integer default 50, p_off integer default 0
) returns table (id uuid, khach_id uuid, ngay timestamptz, so_lan integer, tong bigint)
language sql stable set search_path = public as $$
  with lan as (
    select n.id, n.khach_id,
      case when coalesce(n.kieu_lap, 'SINGLE') = 'SINGLE' or jsonb_typeof(n.cac_ngay_nhac) is distinct from 'array' then array[n.ngay_nhac]
           else array(select (x #>> '{}')::timestamptz from jsonb_array_elements(n.cac_ngay_nhac) x) end as cac
    from public.khach_nhac n
    where (p_cn is null or n.chi_nhanh_id = p_cn)
      and (p_tt is null or p_tt = '' or n.trang_thai = p_tt)
      and (p_phu_trach is null or n.nguoi_phu_trach_id = p_phu_trach)
  ), khop as (
    select l.id, l.khach_id, min(t) as ngay, cardinality(l.cac) as so_lan
    from lan l cross join lateral unnest(l.cac) t
    where t is not null
      and (p_tu is null or t >= (p_tu::timestamp at time zone 'Asia/Ho_Chi_Minh'))
      and (p_den is null or t < ((p_den + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh'))
    group by l.id, l.khach_id, l.cac
  )
  select k.id, k.khach_id, k.ngay, k.so_lan, count(*) over () as tong
  from khop k order by k.ngay, k.id
  limit greatest(1, least(coalesce(p_lim, 50), 200)) offset greatest(0, coalesce(p_off, 0));
$$;

-- ───────── Câu 8: định dạng tiền kiểu Việt Nam trong ghi chú sổ cái "Sửa thẻ" ─────────
create or replace function public.sua_the(
  p_the uuid, p_nguoi uuid,
  p_doi_han boolean default false, p_han date default null,
  p_doi_chu boolean default false, p_khach uuid default null,
  p_doi_gia boolean default false, p_gia bigint default null,
  p_doi_ghi_chu boolean default false, p_ghi_chu text default null,
  p_ly_do text default null
) returns void language plpgsql as $$
declare t public.the_khach; k_cu record; k_moi record; v_doi text[] := '{}';
begin
  select * into t from public.the_khach where id = p_the for update;
  if not found then raise exception 'Không tìm thấy thẻ' using errcode = 'P0001'; end if;
  if t.trang_thai = 'thu_hoi' then raise exception 'Thẻ đã thu hồi, không sửa được' using errcode = 'P0001'; end if;

  if p_doi_han and p_han is distinct from t.han_dung then
    if p_han is not null and p_han < t.ngay_cap then raise exception 'Hạn thẻ không được trước ngày cấp (%)', to_char(t.ngay_cap, 'DD/MM/YYYY') using errcode = 'P0001'; end if;
    v_doi := v_doi || format('Hạn: %s → %s', coalesce(to_char(t.han_dung, 'DD/MM/YYYY'), 'không hạn'), coalesce(to_char(p_han, 'DD/MM/YYYY'), 'không hạn'));
    update public.the_khach set han_dung = p_han where id = p_the;
  end if;

  if p_doi_chu and p_khach is not null and p_khach is distinct from t.khach_id then
    select id, ho_ten, ma, chi_nhanh_id into k_moi from public.khach_hang where id = p_khach;
    if not found then raise exception 'Không tìm thấy khách hàng mới' using errcode = 'P0001'; end if;
    if k_moi.chi_nhanh_id is distinct from t.chi_nhanh_id then raise exception 'Chủ thẻ mới phải là khách cùng chi nhánh với thẻ' using errcode = 'P0001'; end if;
    select id, ho_ten, ma into k_cu from public.khach_hang where id = t.khach_id;
    v_doi := v_doi || format('Chủ thẻ: %s (%s) → %s (%s)', coalesce(k_cu.ho_ten, '?'), coalesce(k_cu.ma, '?'), k_moi.ho_ten, coalesce(k_moi.ma, ''));
    update public.the_khach set khach_id = p_khach where id = p_the;
  end if;

  if p_doi_gia and p_gia is distinct from t.gia_tri_buoi then
    if p_gia is null or p_gia < 0 then raise exception 'Giá 1 buổi phải là số tiền không âm' using errcode = 'P0001'; end if;
    v_doi := v_doi || format('Giá 1 buổi: %s → %s', replace(to_char(coalesce(t.gia_tri_buoi, 0), 'FM999,999,999,999'), ',', '.'), replace(to_char(p_gia, 'FM999,999,999,999'), ',', '.'));
    update public.the_khach set gia_tri_buoi = p_gia where id = p_the;
  end if;

  if p_doi_ghi_chu and coalesce(nullif(trim(p_ghi_chu), ''), '') is distinct from coalesce(t.ghi_chu, '') then
    v_doi := v_doi || format('Ghi chú: %s → %s', coalesce(nullif(t.ghi_chu, ''), '(trống)'), coalesce(nullif(trim(p_ghi_chu), ''), '(trống)'));
    update public.the_khach set ghi_chu = nullif(trim(p_ghi_chu), '') where id = p_the;
  end if;

  if cardinality(v_doi) = 0 then raise exception 'Chưa có gì thay đổi' using errcode = 'P0001'; end if;
  insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, nguoi_id, ghi_chu)
  values (p_the, 'sua_the', 0, 0, p_nguoi, left(array_to_string(v_doi, ' · ') || coalesce(' · Lý do: ' || nullif(trim(p_ly_do), ''), ''), 1000));
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
