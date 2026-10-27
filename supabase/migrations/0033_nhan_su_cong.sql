-- 0033 — NHÂN SỰ: ca làm, chấm công, phiếu nhân sự (nghỉ, tăng ca, đi trễ, ra ngoài, online, công tác, điều chỉnh công), phép năm, tổng hợp công tháng.
-- Theo Quy định thời gian làm việc của MSC (docs/msc-lark/nhan-su-quy-che.md) và luồng Quản lý ca kíp / chấm công / ngày nghỉ của BeDental.
--  · Công ngày: đủ 2 lượt (vào + ra) = 1, thiếu 1 lượt = 0,5, không có = 0. Khối văn phòng T2–T6 = 1, T7 = 0,5, CN = 0; khối chi nhánh làm cả tuần trừ CN (mỗi người nghỉ 1 ngày/tuần do phân ca).
--  · Phiếu chỉ ảnh hưởng công khi ĐÃ DUYỆT. Nghỉ từ 4 ngày trở lên cần Ban Giám đốc (quyền nghi.duyet_bgd).
--  · Phép năm 1 ngày/tháng, chỉ tính từ ngày vào chính thức (vào chính thức ngày ≤ 15 tính trọn tháng đó).
--  · Khoá tháng chặn sửa chấm công của tháng đó. Mức phạt trễ/về sớm chỉ GỢI Ý, không tự trừ lương (chưa rõ bảng phạt nào đang hiệu lực).

alter table public.nhan_vien
  add column ma_nv text unique,
  add column ngay_vao_lam date,
  add column ngay_vao_chinh_thuc date,
  add column trang_thai_lam text not null default 'dang_lam' check (trang_thai_lam in ('dang_lam', 'tam_nghi', 'nghi_viec', 'khoa')),
  add column khung_lam_viec text not null default 'chi_nhanh' check (khung_lam_viec in ('van_phong', 'chi_nhanh', 'khong_cham_cong')),
  add column vai_tro_chuyen_mon text[] not null default '{}';

update public.nhan_vien set khung_lam_viec = case when vai_tro in ('quan_ly', 'ke_toan', 'marketing') then 'van_phong' when vai_tro in ('ky_thuat', 'nha_dau_tu') then 'khong_cham_cong' else 'chi_nhanh' end;
update public.nhan_vien set trang_thai_lam = 'khoa' where not hoat_dong;
update public.nhan_vien n set ma_nv = 'NV' || lpad(x.rn::text, 4, '0') from (select id, row_number() over (order by tao_luc, id) rn from public.nhan_vien) x where x.id = n.id;
insert into public.dem_ma (khoa, so) values ('nv', (select count(*) from public.nhan_vien)) on conflict (khoa) do update set so = excluded.so;
create function public.gan_ma_nv() returns trigger language plpgsql as $$
begin
  if new.ma_nv is null then new.ma_nv := 'NV' || lpad(public.so_tiep_theo('nv')::text, 4, '0'); end if;
  return new;
end $$;
create trigger nhan_vien_ma_nv before insert on public.nhan_vien for each row execute function public.gan_ma_nv();

create table public.ca_lam (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  gio_vao time not null,
  gio_ra time not null,
  nghi_phut int not null default 0 check (nghi_phut >= 0),
  dung_sai_phut int not null default 0 check (dung_sai_phut >= 0),
  gio_chuan numeric(4, 2) not null default 8,
  hoat_dong boolean not null default true,
  check (gio_ra > gio_vao)
);
insert into public.ca_lam (ma, ten, gio_vao, gio_ra, nghi_phut) values
  ('VP_HC', 'Hành chính (văn phòng)', '08:00', '17:00', 60),
  ('CN_DAI', 'Khối chi nhánh (trực tiếp)', '08:00', '18:30', 0),
  ('ONLINE_1', 'Bán trực tuyến ca 1', '08:00', '18:30', 0),
  ('ONLINE_2', 'Bán trực tuyến ca 2', '19:00', '22:00', 0);
update public.ca_lam set gio_chuan = 3 where ma = 'ONLINE_2';

-- Lịch làm: mỗi người một dòng mỗi ngày (ca_id null + nghi = ngày nghỉ được xếp).
create table public.phan_ca (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  ca_id uuid references public.ca_lam (id),
  nghi boolean not null default false,
  unique (nhan_vien_id, ngay),
  check (nghi = (ca_id is null))
);
create index phan_ca_ngay_idx on public.phan_ca (ngay);

create table public.cham_cong (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  vao timestamptz,
  ra timestamptz,
  ca_id uuid references public.ca_lam (id),
  phuong_thuc text not null default 'web' check (phuong_thuc in ('web', 'thu_cong')),
  tre_phut int not null default 0 check (tre_phut >= 0),
  ve_som_phut int not null default 0 check (ve_som_phut >= 0),
  cong numeric(2, 1) not null default 0 check (cong in (0, 0.5, 1)),
  loi text check (loi is null or loi in ('di_muon', 'quen_cham_cong', 'ly_do_cong_viec', 'ly_do_khac')),
  ghi_chu text,
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now(),
  unique (nhan_vien_id, ngay),
  check (vao is not null or ra is not null)
);
create index cham_cong_ngay_idx on public.cham_cong (ngay);

create table public.ngay_le (
  ngay date primary key,
  ten text not null
);
insert into public.ngay_le (ngay, ten) values ('2027-01-01', 'Tết Dương lịch');

create table public.phieu_hr (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  loai text not null check (loai in ('nghi', 'di_tre_ve_som', 'ra_ngoai', 'lam_online', 'lam_them', 'dieu_chinh_cc', 'cong_tac')),
  loai_nghi text check (loai_nghi is null or loai_nghi in ('phep_nam', 'nghi_khong_luong', 'nghi_che_do', 'nghi_bu', 'nghi_om', 'thai_san')),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  tu_ngay date not null,
  den_ngay date not null,
  so_ngay numeric(4, 1) not null default 1 check (so_ngay > 0),
  so_gio numeric(4, 1) check (so_gio is null or so_gio > 0),
  vao_dieu_chinh time,
  ra_dieu_chinh time,
  loi_cham_cong text check (loi_cham_cong is null or loi_cham_cong in ('di_muon', 'quen_cham_cong', 'ly_do_cong_viec', 'ly_do_khac')),
  ly_do text not null,
  nguoi_nhan_ban_giao_id uuid references public.nhan_vien (id),
  qua_han_bao_truoc boolean not null default false,
  vuot_han_muc boolean not null default false,
  trang_thai text not null default 'cho_duyet' check (trang_thai in ('nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'huy')),
  nguoi_gui_id uuid not null references public.nhan_vien (id),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  ly_do_duyet text,
  tao_luc timestamptz not null default now(),
  check (den_ngay >= tu_ngay),
  check (loai <> 'nghi' or loai_nghi is not null)
);
create index phieu_hr_nv_idx on public.phieu_hr (nhan_vien_id, tu_ngay);
create index phieu_hr_tt_idx on public.phieu_hr (trang_thai, tao_luc desc);

-- Cộng/trừ phép tay (phép tồn năm trước, thưởng phép…) — HCNS ghi, có lý do.
create table public.dieu_chinh_phep (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  nam int not null,
  so_ngay numeric(4, 1) not null check (so_ngay <> 0),
  ly_do text not null,
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);

create table public.bang_cong_thang (
  nam int not null,
  thang int not null check (thang between 1 and 12),
  khoa boolean not null default false,
  khoa_luc timestamptz,
  nguoi_khoa_id uuid references public.nhan_vien (id),
  primary key (nam, thang)
);

create table public.muc_phat_cham_cong (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('tre', 've_som')),
  tu_phut int not null check (tu_phut >= 1),
  den_phut int,
  so_tien bigint not null check (so_tien >= 0),
  trang_thai text not null default 'cho_xac_nhan' check (trang_thai in ('hieu_luc', 'cho_xac_nhan')),
  check (den_phut is null or den_phut >= tu_phut)
);
insert into public.muc_phat_cham_cong (loai, tu_phut, den_phut, so_tien) values
  ('tre', 1, 10, 100000), ('tre', 11, 20, 200000), ('tre', 21, null, 300000),
  ('ve_som', 1, 10, 100000), ('ve_som', 11, 20, 200000), ('ve_som', 21, null, 300000);

-- Chặn sửa chấm công của tháng đã khoá.
create function public.chan_cong_thang_khoa() returns trigger language plpgsql as $$
declare v_ngay date := coalesce(new.ngay, old.ngay);
begin
  if exists (select 1 from public.bang_cong_thang where nam = extract(year from v_ngay)::int and thang = extract(month from v_ngay)::int and khoa) then
    raise exception 'Tháng % đã khoá công, không sửa được chấm công.', to_char(v_ngay, 'MM/YYYY');
  end if;
  return coalesce(new, old);
end $$;
create trigger cham_cong_khoa_thang before insert or update or delete on public.cham_cong for each row execute function public.chan_cong_thang_khoa();

create function public.cong_chuan_thang(p_khung text, p_nam int, p_thang int) returns numeric language sql stable as $$
  select case p_khung when 'khong_cham_cong' then 26::numeric else (
    select coalesce(sum(case when p_khung = 'van_phong' then (case extract(dow from d) when 0 then 0 when 6 then 0.5 else 1 end)
                             else (case extract(dow from d) when 0 then 0 else 1 end) end), 0)
      from generate_series(make_date(p_nam, p_thang, 1), (make_date(p_nam, p_thang, 1) + interval '1 month - 1 day')::date, interval '1 day') d) end
$$;

-- Phép năm còn lại: 1 ngày/tháng từ ngày vào chính thức (≤ 15 tính trọn tháng đó) + điều chỉnh − đã dùng (phiếu nghỉ phép năm đã duyệt).
create function public.so_du_phep(p_nv uuid, p_nam int) returns numeric language plpgsql stable as $$
declare vc date; t_dau int; t_cuoi int; v_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; tich numeric := 0;
begin
  select ngay_vao_chinh_thuc into vc from public.nhan_vien where id = p_nv;
  if vc is not null and extract(year from vc)::int <= p_nam then
    t_dau := case when extract(year from vc)::int < p_nam then 1 else extract(month from vc)::int + (case when extract(day from vc) <= 15 then 0 else 1 end) end;
    t_cuoi := case when p_nam < extract(year from v_nay)::int then 12 when p_nam = extract(year from v_nay)::int then extract(month from v_nay)::int else 0 end;
    tich := greatest(0, t_cuoi - t_dau + 1);
  end if;
  return tich
    + coalesce((select sum(so_ngay) from public.dieu_chinh_phep where nhan_vien_id = p_nv and nam = p_nam), 0)
    - coalesce((select sum(so_ngay) from public.phieu_hr where nhan_vien_id = p_nv and loai = 'nghi' and loai_nghi = 'phep_nam' and trang_thai = 'da_duyet' and extract(year from tu_ngay)::int = p_nam), 0);
end $$;

create function public.tong_hop_cong(p_nam int, p_thang int, p_cn uuid default null)
returns table (nhan_vien_id uuid, khung text, cong_chuan numeric, cong_di_lam numeric, phep_co_luong numeric, nghi_le numeric, cong_tac numeric, nghi_khong_luong numeric,
               so_lan_tre int, phut_tre int, so_lan_ve_som int, phut_ve_som int, ngay_vang int, ot_gio numeric, cong_tinh_luong numeric)
language sql stable as $$
  with k as (select make_date(p_nam, p_thang, 1) as dau, (make_date(p_nam, p_thang, 1) + interval '1 month - 1 day')::date as cuoi),
  nv as (
    select n.id, n.khung_lam_viec as khung from public.nhan_vien n
     where n.hoat_dong and n.trang_thai_lam in ('dang_lam', 'tam_nghi') and n.vai_tro <> 'nha_dau_tu' and (p_cn is null or n.chi_nhanh_id = p_cn)
  ),
  cc as (
    select c.nhan_vien_id, sum(c.cong) as cong, count(*) filter (where c.tre_phut > 0) as lt, coalesce(sum(c.tre_phut), 0) as pt,
           count(*) filter (where c.ve_som_phut > 0) as lv, coalesce(sum(c.ve_som_phut), 0) as pv
      from public.cham_cong c, k where c.ngay between k.dau and k.cuoi group by 1
  ),
  ph as (
    select p.nhan_vien_id,
      sum(x.ov) filter (where p.loai = 'nghi' and p.loai_nghi in ('phep_nam', 'nghi_che_do', 'nghi_bu')) as phep,
      sum(x.ov) filter (where p.loai = 'nghi' and p.loai_nghi = 'nghi_khong_luong') as kl,
      sum(x.ov) filter (where p.loai in ('cong_tac', 'lam_online')) as ct,
      sum(p.so_gio) filter (where p.loai = 'lam_them' and p.tu_ngay between k.dau and k.cuoi) as ot
      from public.phieu_hr p, k,
      lateral (select greatest(0, least(p.den_ngay, k.cuoi) - greatest(p.tu_ngay, k.dau) + 1) * p.so_ngay / (p.den_ngay - p.tu_ngay + 1) as ov) x
     where p.trang_thai = 'da_duyet' and p.tu_ngay <= k.cuoi and p.den_ngay >= k.dau group by 1
  ),
  le as (select count(*)::numeric as so from public.ngay_le l, k where l.ngay between k.dau and k.cuoi and extract(dow from l.ngay) <> 0),
  vg as (
    select pc.nhan_vien_id, count(*)::int as so
      from public.phan_ca pc, k
     where pc.ngay between k.dau and k.cuoi and pc.ngay <= (now() at time zone 'Asia/Ho_Chi_Minh')::date and not pc.nghi
       and not exists (select 1 from public.cham_cong c where c.nhan_vien_id = pc.nhan_vien_id and c.ngay = pc.ngay)
       and not exists (select 1 from public.phieu_hr p where p.nhan_vien_id = pc.nhan_vien_id and p.trang_thai = 'da_duyet' and p.loai in ('nghi', 'cong_tac', 'lam_online') and pc.ngay between p.tu_ngay and p.den_ngay)
       and not exists (select 1 from public.ngay_le l where l.ngay = pc.ngay)
     group by 1
  )
  select nv.id, nv.khung, public.cong_chuan_thang(nv.khung, p_nam, p_thang), coalesce(cc.cong, 0), coalesce(ph.phep, 0),
         case when nv.khung = 'khong_cham_cong' then 0 else (select so from le) end, coalesce(ph.ct, 0), coalesce(ph.kl, 0),
         coalesce(cc.lt, 0)::int, coalesce(cc.pt, 0)::int, coalesce(cc.lv, 0)::int, coalesce(cc.pv, 0)::int, coalesce(vg.so, 0), coalesce(ph.ot, 0),
         coalesce(cc.cong, 0) + coalesce(ph.phep, 0) + coalesce(ph.ct, 0) + (case when nv.khung = 'khong_cham_cong' then 0 else (select so from le) end)
    from nv left join cc on cc.nhan_vien_id = nv.id left join ph on ph.nhan_vien_id = nv.id left join vg on vg.nhan_vien_id = nv.id
$$;

revoke all on function public.so_du_phep(uuid, int), public.tong_hop_cong(int, int, uuid), public.cong_chuan_thang(text, int, int) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
