-- 0027 — SỔ QUỸ thu/chi (theo BeDental, bỏ phần nha khoa). Chỉ THÊM bảng/view mới.
-- Quỹ: mỗi chi nhánh có 1 quỹ tiền mặt và 1 quỹ ngân hàng. Tiền khách trả (thanh_toan: tiền mặt → quỹ tiền mặt; chuyển khoản/quẹt thẻ → quỹ ngân hàng;
-- trừ thẻ tiền KHÔNG phải tiền vào quỹ) tự vào sổ quỹ qua view; khoản thu/chi tay, chuyển quỹ và đảo phiếu ghi ở so_quy (sổ cái: chỉ thêm dòng).
create table public.quy (
  id uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  loai text not null check (loai in ('tien_mat', 'ngan_hang')),
  ten text not null,
  so_du_dau bigint not null default 0,
  da_nhap_so_du boolean not null default false,
  hoat_dong boolean not null default true,
  tao_luc timestamptz not null default now(),
  unique (chi_nhanh_id, loai)
);
insert into public.quy (chi_nhanh_id, loai, ten) select id, 'tien_mat', 'Quỹ tiền mặt · ' || ten from public.chi_nhanh;
insert into public.quy (chi_nhanh_id, loai, ten) select id, 'ngan_hang', 'Quỹ ngân hàng · ' || ten from public.chi_nhanh;

create table public.loai_thu_chi (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique,
  huong text not null check (huong in ('thu', 'chi')),
  he_thong boolean not null default false,
  thu_tu int not null default 0,
  hoat_dong boolean not null default true
);
insert into public.loai_thu_chi (ten, huong, he_thong, thu_tu) values
  ('Bán hàng', 'thu', true, 0), ('Thu khác', 'thu', false, 1),
  ('Chi phí nhân sự (lương, thưởng, bảo hiểm)', 'chi', false, 1), ('Marketing (quảng cáo, in ấn)', 'chi', false, 2),
  ('Mặt bằng, thuê văn phòng', 'chi', false, 3), ('Vật tư, nguyên vật liệu, hàng hoá', 'chi', false, 4),
  ('Chi nhà cung cấp', 'chi', false, 5), ('Chi vận hành (điện, nước, cúng, ship…)', 'chi', false, 6),
  ('Chi phí khác', 'chi', false, 7), ('Hoàn tiền khách', 'chi', true, 8);

create table public.so_quy (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ngay date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  quy_id uuid not null references public.quy (id),
  -- thu/chi: tiền vào/ra quỹ vì hoạt động; nap/rut: tiền chuyển giữa 2 quỹ (chuyển quỹ ghi 1 dòng rut + 1 dòng nap cùng nhom_chuyen).
  loai text not null check (loai in ('thu', 'chi', 'nap', 'rut')),
  so_tien bigint not null check (so_tien > 0),
  loai_thu_chi_id uuid references public.loai_thu_chi (id),
  noi_dung text not null,
  doi_tuong text,
  nguon text not null default 'thu_cong' check (nguon in ('thu_cong', 'chuyen_quy', 'dao_phieu')),
  nhom_chuyen uuid,
  phieu_goc_id uuid references public.so_quy (id),
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  check (nguon <> 'dao_phieu' or phieu_goc_id is not null)
);
create unique index so_quy_chi_dao_mot_lan on public.so_quy (phieu_goc_id) where phieu_goc_id is not null;
create index so_quy_quy_ngay_idx on public.so_quy (quy_id, ngay);
create trigger so_quy_chi_them before update or delete on public.so_quy
  for each row execute function public.chi_them_dong();

create view public.v_so_quy with (security_invoker = true) as
  select s.id::text as id, s.ma, s.ngay, s.quy_id, q.chi_nhanh_id, q.loai as loai_quy, s.loai, s.so_tien,
         case when s.loai in ('thu', 'nap') then s.so_tien else -s.so_tien end as bien_dong,
         lt.ten as loai_thu_chi, s.noi_dung, s.doi_tuong, s.nguon, s.nguoi_id, s.tao_luc, s.phieu_goc_id,
         exists (select 1 from public.so_quy d where d.phieu_goc_id = s.id) as da_dao, true as sua_duoc
    from public.so_quy s
    join public.quy q on q.id = s.quy_id
    left join public.loai_thu_chi lt on lt.id = s.loai_thu_chi_id
  union all
  select t.id::text, h.ma, t.ngay, q.id, h.chi_nhanh_id, q.loai,
         case t.loai when 'thu' then 'thu' else 'chi' end, t.so_tien,
         case t.loai when 'thu' then t.so_tien else -t.so_tien end,
         case t.loai when 'thu' then 'Bán hàng' else 'Hoàn tiền khách' end,
         case t.loai when 'thu' then 'Thu tiền hoá đơn ' else 'Hoàn tiền hoá đơn ' end || h.ma, null, 'ban_hang', t.nguoi_id, t.tao_luc, null, false, false
    from public.thanh_toan t
    join public.hoa_don h on h.id = t.hoa_don_id
    join public.quy q on q.chi_nhanh_id = h.chi_nhanh_id
     and q.loai = case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end
   where t.phuong_thuc <> 'the_tien';

select public.khoa_tat_ca_bang();
