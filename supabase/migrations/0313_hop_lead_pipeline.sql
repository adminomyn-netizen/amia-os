-- 0313 — HỘP LEAD DẠNG PIPELINE (M3, docs/bedental/DOI-CHIEU-10-11.md mục 1.1 + 1.7; màn BeDental ở docs/bedental/marketing.md mục 2).
-- Giữ nguyên dữ liệu cũ: lead.trang_thai_lien_he vẫn là "kết quả liên hệ"; thêm GIAI ĐOẠN (cột kanban tự cấu hình) và KẾT QUẢ open/won/lost suy ra từ giai đoạn.
--   lead_giai_doan     cột kanban: tên, màu, thứ tự, SLA phút, Thắng/Thua cố định, ngừng dùng, phiên bản chống sửa đồng thời (hàm lead_gd_cau_hinh)
--   lead_ly_do_thua    danh mục lý do thua (thay chữ tự do khi đóng thua; lead.ly_do cũ vẫn giữ)
--   lead_hoat_dong     dòng thời gian (chỉ thêm): hệ thống tự ghi tạo / phụ trách / đổi giai đoạn / mở lại / gắn khách; người ghi tay Ghi chú / Gọi / Nhắn tin
--   lead_nguoi_ho_tro  người hỗ trợ (nhiều người) bên cạnh người phụ trách
--   lead_tac_vu        tác vụ theo lead, mỗi tác vụ có một dòng cong_viec (Nơi làm việc › Việc cần làm), trạng thái hai bên tự khớp
--   lead_nhac          nhắc việc theo lead (nội dung, thời điểm, nhắc ai); hiện ở chuông/Trang chủ khi đến giờ
--   lead_tep           tệp theo lead (≤ 5 tệp tải tay; nguon 'chat' để sau này tệp từ Hộp chat tự vào, không tính 5), kho riêng tư 'lead-tep'
--   nguon_lead.loai    Nguồn ngoài / Đối tác
--   chi_nhanh.phu_trach_lead_id  Phụ trách lead theo chi nhánh: lead mới chưa có người phụ trách tự giao người này (trigger, áp cho mọi nơi tạo lead)
--   v_lead_ds          view đọc danh sách: số tác vụ mở, nhắc sớm nhất, số tệp, mảng người hỗ trợ (để lọc)
-- Chạy lại nhiều lần không hỏng (if not exists / create or replace / drop trigger if exists / on conflict do nothing).
set lock_timeout = '4s';

-- 1. Cột kanban ─────────────────────────────────────────────────────────────
create table if not exists public.lead_giai_doan (
  id uuid primary key default gen_random_uuid(),
  ma text unique,                         -- khoá cố định của 6 cột mặc định (moi, dang_lien_he, tiem_nang, da_dat_lich, thang, thua); cột tự thêm để null
  ten text not null check (length(trim(ten)) between 1 and 60),
  mau text not null default '#8a8f98' check (mau ~ '^#[0-9a-fA-F]{6}$'),
  thu_tu int not null default 0,
  sla_phut int check (sla_phut is null or sla_phut between 1 and 525600),
  la_thang boolean not null default false,
  la_thua boolean not null default false,
  dang_dung boolean not null default true,
  phien_ban int not null default 1,       -- phiên bản cấu hình = max(phien_ban) toàn bảng; mỗi lần sửa tăng 1
  tao_luc timestamptz not null default now(),
  check (not (la_thang and la_thua)),
  check (dang_dung or not (la_thang or la_thua))
);
create unique index if not exists lead_giai_doan_ten_uq on public.lead_giai_doan (lower(trim(ten)));
create unique index if not exists lead_giai_doan_thang_uq on public.lead_giai_doan (la_thang) where la_thang;
create unique index if not exists lead_giai_doan_thua_uq on public.lead_giai_doan (la_thua) where la_thua;
insert into public.lead_giai_doan (ma, ten, mau, thu_tu, sla_phut, la_thang, la_thua) values
  ('moi', 'Mới', '#3b82f6', 1, 15, false, false),
  ('dang_lien_he', 'Đang liên hệ', '#d97706', 2, 1440, false, false),
  ('tiem_nang', 'Tiềm năng', '#8b5cf6', 3, 4320, false, false),
  ('da_dat_lich', 'Đã đặt lịch', '#14a394', 4, null, false, false),
  ('thang', 'Thắng', '#16a34a', 100, null, true, false),
  ('thua', 'Thua/Đóng', '#9ca3af', 101, null, false, true)
on conflict (ma) do nothing;

-- 2. Lý do thua ─────────────────────────────────────────────────────────────
create table if not exists public.lead_ly_do_thua (
  id uuid primary key default gen_random_uuid(),
  ma text unique,                          -- khoá cố định cho lý do khớp kết quả liên hệ cũ (sai_sdt, khong_co_nhu_cau, khong_phu_hop, trung_lead, khac)
  ten text not null check (length(trim(ten)) between 1 and 80),
  thu_tu int not null default 0,
  dang_dung boolean not null default true,
  tao_luc timestamptz not null default now()
);
create unique index if not exists lead_ly_do_thua_ten_uq on public.lead_ly_do_thua (lower(trim(ten)));
insert into public.lead_ly_do_thua (ma, ten, thu_tu) values
  ('khong_co_nhu_cau', 'Không có nhu cầu', 1),
  ('gia', 'Giá chưa phù hợp', 2),
  ('noi_khac', 'Đã làm ở nơi khác', 3),
  ('o_xa', 'Ở xa, không tiện đến', 4),
  ('sai_sdt', 'Sai số / không liên lạc được', 5),
  ('khong_phu_hop', 'Không phù hợp dịch vụ', 6),
  ('trung_lead', 'Lead trùng', 7),
  ('khac', 'Lý do khác', 8)
on conflict (ma) do nothing;

-- 3. Nguồn lead: loại Nguồn ngoài / Đối tác; phụ trách lead theo chi nhánh ──
alter table public.nguon_lead add column if not exists loai text not null default 'nguon_ngoai';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'nguon_lead_loai_check' and conrelid = 'public.nguon_lead'::regclass) then
    alter table public.nguon_lead add constraint nguon_lead_loai_check check (loai in ('nguon_ngoai', 'doi_tac'));
    update public.nguon_lead set loai = 'doi_tac' where nhom = 'gioi_thieu';
  end if;
end $$;
alter table public.chi_nhanh add column if not exists phu_trach_lead_id uuid references public.nhan_vien (id);

-- 4. Cột mới của lead ───────────────────────────────────────────────────────
alter table public.lead add column if not exists giai_doan_id uuid references public.lead_giai_doan (id);
alter table public.lead add column if not exists email text;
alter table public.lead add column if not exists gia_tri_du_kien bigint not null default 0;
alter table public.lead add column if not exists ket_qua text not null default 'open';
alter table public.lead add column if not exists ly_do_thua_id uuid references public.lead_ly_do_thua (id);
alter table public.lead add column if not exists giai_doan_luc timestamptz not null default now();  -- lúc vào giai đoạn hiện tại (tính SLA cột)
alter table public.lead add column if not exists dong_luc timestamptz;                              -- lúc thành Thắng/Thua
alter table public.lead add column if not exists sua_boi uuid references public.nhan_vien (id);     -- người sửa gần nhất (để dòng thời gian ghi đúng người)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lead_ket_qua_check' and conrelid = 'public.lead'::regclass) then
    alter table public.lead add constraint lead_ket_qua_check check (ket_qua in ('open', 'won', 'lost'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lead_email_check' and conrelid = 'public.lead'::regclass) then
    alter table public.lead add constraint lead_email_check check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lead_gia_tri_check' and conrelid = 'public.lead'::regclass) then
    alter table public.lead add constraint lead_gia_tri_check check (gia_tri_du_kien >= 0);
  end if;
end $$;

-- Kết quả liên hệ → giai đoạn mặc định (dùng khi chuyển dữ liệu cũ và khi ghi liên hệ).
create or replace function public.lead_gd_theo_lien_he(p text) returns text language sql immutable set search_path = '' as $$
  select case
    when p in ('da_lien_he', 'hen_goi_lai', 'khong_nghe_may', 'da_chuyen_chi_nhanh') then 'dang_lien_he'
    when p = 'da_xac_nhan_nhu_cau' then 'tiem_nang'
    when p = 'da_dat_lich' then 'da_dat_lich'
    when p in ('sai_sdt', 'khong_co_nhu_cau', 'khong_phu_hop', 'trung_lead', 'da_ket_thuc') then 'thua'
    else null end
$$;
create or replace function public.lead_ly_do_theo_lien_he(p text) returns text language sql immutable set search_path = '' as $$
  select case p when 'sai_sdt' then 'sai_sdt' when 'khong_co_nhu_cau' then 'khong_co_nhu_cau' when 'khong_phu_hop' then 'khong_phu_hop' when 'trung_lead' then 'trung_lead' else 'khac' end
$$;

-- Chuyển dữ liệu cũ (lead chưa có giai đoạn).
update public.lead l set
  giai_doan_id = coalesce((select g.id from public.lead_giai_doan g where g.ma = public.lead_gd_theo_lien_he(l.trang_thai_lien_he)),
                          (select g.id from public.lead_giai_doan g where g.ma = 'moi')),
  ly_do_thua_id = case when public.lead_gd_theo_lien_he(l.trang_thai_lien_he) = 'thua' or l.trang_thai_phan_bo in ('lead_trung', 'khong_hop_le')
                       then (select r.id from public.lead_ly_do_thua r where r.ma = case when l.trang_thai_phan_bo = 'lead_trung' then 'trung_lead' else public.lead_ly_do_theo_lien_he(l.trang_thai_lien_he) end) end
where l.giai_doan_id is null;
update public.lead l set giai_doan_id = (select g.id from public.lead_giai_doan g where g.ma = 'thua')
where l.trang_thai_phan_bo in ('lead_trung', 'khong_hop_le') and l.giai_doan_id <> (select g.id from public.lead_giai_doan g where g.ma = 'thua');
update public.lead l set ket_qua = case when g.la_thang then 'won' when g.la_thua then 'lost' else 'open' end,
  dong_luc = case when g.la_thang or g.la_thua then coalesce(l.dong_luc, l.cap_nhat_luc) end
from public.lead_giai_doan g where g.id = l.giai_doan_id;
alter table public.lead alter column giai_doan_id set not null;

-- Một số điện thoại chỉ có một lead đang mở hoặc đã thắng (lead thua / trùng / không hợp lệ thì tạo lại được). Thay chỉ mục 0036.
drop index if exists public.lead_sdt_dang_mo;
create unique index if not exists lead_sdt_con_mo on public.lead (sdt) where ket_qua <> 'lost' and trang_thai_phan_bo not in ('lead_trung', 'khong_hop_le');
create index if not exists lead_gd_idx on public.lead (giai_doan_id, cap_nhat_luc desc);
create index if not exists lead_owner_idx on public.lead (owner_id, ket_qua);

-- 5. Dòng thời gian ─────────────────────────────────────────────────────────
create table if not exists public.lead_hoat_dong (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.lead (id) on delete restrict,
  loai text not null check (loai in ('tao', 'phu_trach', 'doi_giai_doan', 'mo_lai', 'gan_khach', 'ghi_chu', 'goi', 'nhan_tin', 'tac_vu', 'nhac', 'tep', 'ho_tro')),
  noi_dung text,
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index if not exists lead_hoat_dong_lead_idx on public.lead_hoat_dong (lead_id, tao_luc desc);
drop trigger if exists lead_hoat_dong_chi_them on public.lead_hoat_dong;
create trigger lead_hoat_dong_chi_them before update or delete on public.lead_hoat_dong for each row execute function public.chi_them_dong();

-- 6. Người hỗ trợ ───────────────────────────────────────────────────────────
create table if not exists public.lead_nguoi_ho_tro (
  lead_id uuid not null references public.lead (id) on delete restrict,
  nhan_vien_id uuid not null references public.nhan_vien (id),
  them_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  primary key (lead_id, nhan_vien_id)
);
create index if not exists lead_ho_tro_nv_idx on public.lead_nguoi_ho_tro (nhan_vien_id);

-- 7. Tác vụ ─────────────────────────────────────────────────────────────────
create table if not exists public.lead_tac_vu (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id) on delete restrict,
  ten text not null check (length(trim(ten)) between 1 and 200),
  giao_cho_id uuid not null references public.nhan_vien (id),
  han date,
  trang_thai text not null default 'mo' check (trang_thai in ('mo', 'xong', 'huy')),
  nguon text not null default 'tay' check (nguon in ('tay', 'ai')),   -- 'ai' để dành cho tác vụ do Nhân viên AI tạo (M2/AI chat)
  cong_viec_id uuid unique references public.cong_viec (id),          -- dòng ở Nơi làm việc › Việc cần làm
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  dong_boi uuid references public.nhan_vien (id),
  dong_luc timestamptz
);
create index if not exists lead_tac_vu_lead_idx on public.lead_tac_vu (lead_id, trang_thai);
create index if not exists lead_tac_vu_nv_idx on public.lead_tac_vu (giao_cho_id, trang_thai);

-- 8. Nhắc việc ──────────────────────────────────────────────────────────────
create table if not exists public.lead_nhac (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id) on delete restrict,
  noi_dung text not null check (length(trim(noi_dung)) between 1 and 500),
  nhac_luc timestamptz not null,
  nhac_cho_id uuid not null references public.nhan_vien (id),
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'xong', 'huy')),
  da_bao_luc timestamptz,                                              -- để dành: lúc đã gửi thông báo đẩy (bộ gửi theo giờ chưa có)
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  dong_luc timestamptz
);
create index if not exists lead_nhac_lead_idx on public.lead_nhac (lead_id, trang_thai);
create index if not exists lead_nhac_nv_idx on public.lead_nhac (nhac_cho_id, trang_thai, nhac_luc);

-- 9. Tệp ────────────────────────────────────────────────────────────────────
create table if not exists public.lead_tep (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id) on delete restrict,
  ten text not null,
  duong_dan text not null unique,
  mime text,
  kich_thuoc bigint not null default 0,
  nhan text not null default 'khac' check (nhan in ('truoc', 'sau', 'khac')),   -- Trước điều trị / Sau điều trị / Khác
  nguon text not null default 'tai_tay' check (nguon in ('tai_tay', 'chat')),
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index if not exists lead_tep_lead_idx on public.lead_tep (lead_id);
create or replace function public.trg_lead_tep_gioi_han() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.nguon = 'tai_tay' then
    perform 1 from public.lead where id = new.lead_id for update;  -- hai người tải cùng lúc không vượt 5
    if (select count(*) from public.lead_tep where lead_id = new.lead_id and nguon = 'tai_tay') >= 5 then
      raise exception 'Mỗi lead tối đa 5 tệp tải tay. Xoá bớt tệp cũ trước.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists lead_tep_gioi_han on public.lead_tep;
create trigger lead_tep_gioi_han before insert on public.lead_tep for each row execute function public.trg_lead_tep_gioi_han();

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('lead-tep', 'lead-tep', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
    on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
  end if;
end $$;

-- 10. Trigger của lead ──────────────────────────────────────────────────────
-- TRƯỚC khi ghi: giai đoạn mặc định, giao người phụ trách theo chi nhánh, giai đoạn theo kết quả liên hệ, kết quả open/won/lost luôn suy ra từ giai đoạn.
create or replace function public.trg_lead_truoc_ghi() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare g public.lead_giai_doan; ht public.lead_giai_doan; v_pt uuid; v_ma text;
begin
  if tg_op = 'INSERT' then
    if new.giai_doan_id is null then
      v_ma := case when new.trang_thai_phan_bo in ('lead_trung', 'khong_hop_le') then 'thua' else public.lead_gd_theo_lien_he(new.trang_thai_lien_he) end;
      select id into new.giai_doan_id from public.lead_giai_doan where ma = v_ma and dang_dung;
      if new.giai_doan_id is null then
        select id into new.giai_doan_id from public.lead_giai_doan where dang_dung and not la_thang and not la_thua order by thu_tu limit 1;
      end if;
    end if;
    if new.owner_id is null then
      select c.phu_trach_lead_id into v_pt from public.chi_nhanh c join public.nhan_vien n on n.id = c.phu_trach_lead_id and n.hoat_dong where c.id = new.chi_nhanh_id;
      if v_pt is not null then
        new.owner_id := v_pt;
        if new.trang_thai_phan_bo in ('cho_tiep_nhan', 'cho_phan_bo') then new.trang_thai_phan_bo := 'da_phan_bo'; end if;
      end if;
    end if;
    new.giai_doan_luc := now();
  else
    -- Ghi liên hệ (đổi kết quả) mà không tự chọn giai đoạn: đẩy lead tiến lên cột tương ứng, không lùi, không tự ra khỏi Thắng/Thua.
    if new.giai_doan_id is not distinct from old.giai_doan_id and (new.trang_thai_lien_he is distinct from old.trang_thai_lien_he or new.trang_thai_phan_bo is distinct from old.trang_thai_phan_bo) then
      select * into ht from public.lead_giai_doan where id = old.giai_doan_id;
      v_ma := case when new.trang_thai_phan_bo in ('lead_trung', 'khong_hop_le') and old.trang_thai_phan_bo is distinct from new.trang_thai_phan_bo then 'thua'
                   when new.trang_thai_lien_he is distinct from old.trang_thai_lien_he then public.lead_gd_theo_lien_he(new.trang_thai_lien_he) end;
      if v_ma is not null and not (ht.la_thang or ht.la_thua) then
        select * into g from public.lead_giai_doan where ma = v_ma and dang_dung;
        if g.id is not null and (g.la_thua or g.thu_tu > ht.thu_tu) then
          new.giai_doan_id := g.id;
          if g.la_thua and new.ly_do_thua_id is null then
            select id into new.ly_do_thua_id from public.lead_ly_do_thua
              where ma = case when new.trang_thai_phan_bo = 'lead_trung' then 'trung_lead' else public.lead_ly_do_theo_lien_he(new.trang_thai_lien_he) end;
          end if;
        end if;
      end if;
    end if;
    if new.giai_doan_id is distinct from old.giai_doan_id then new.giai_doan_luc := now(); end if;
    new.cap_nhat_luc := now();
  end if;

  select * into g from public.lead_giai_doan where id = new.giai_doan_id;
  if g.id is null then raise exception 'Không tìm thấy giai đoạn của lead.' using errcode = 'P0001'; end if;
  if (tg_op = 'INSERT' or new.giai_doan_id is distinct from old.giai_doan_id) and not g.dang_dung then
    raise exception 'Cột "%" đã ngừng dùng.', g.ten using errcode = 'P0001';
  end if;
  new.ket_qua := case when g.la_thang then 'won' when g.la_thua then 'lost' else 'open' end;
  if new.ket_qua = 'open' then new.dong_luc := null; new.ly_do_thua_id := null;
  elsif tg_op = 'INSERT' or new.giai_doan_id is distinct from old.giai_doan_id then new.dong_luc := now();
  end if;
  if new.ket_qua = 'lost' and new.ly_do_thua_id is null and coalesce(trim(new.ly_do), '') = '' then
    raise exception 'Chọn lý do thua trước khi chuyển lead sang cột Thua.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists lead_truoc_ghi on public.lead;
create trigger lead_truoc_ghi before insert or update on public.lead for each row execute function public.trg_lead_truoc_ghi();

-- SAU khi ghi: tự ghi dòng thời gian.
create or replace function public.trg_lead_sau_ghi() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_nguoi uuid := coalesce(new.sua_boi, new.tao_boi); v_cu text; v_moi text; v_ld text; v_ten text;
begin
  if tg_op = 'INSERT' then
    insert into public.lead_hoat_dong (lead_id, loai, noi_dung, nguoi_id) values (new.id, 'tao', 'Tạo lead', new.tao_boi);
    if new.owner_id is not null then
      select ho_ten into v_ten from public.nhan_vien where id = new.owner_id;
      insert into public.lead_hoat_dong (lead_id, loai, noi_dung, nguoi_id)
      values (new.id, 'phu_trach', case when new.owner_id = new.tao_boi then 'Nhận lead' else 'Giao cho ' || coalesce(v_ten, '') end, new.tao_boi);
    end if;
    return null;
  end if;
  if new.owner_id is distinct from old.owner_id then
    select ho_ten into v_ten from public.nhan_vien where id = new.owner_id;
    insert into public.lead_hoat_dong (lead_id, loai, noi_dung, nguoi_id)
    values (new.id, 'phu_trach', case when new.owner_id is null then 'Bỏ người phụ trách' when new.owner_id = v_nguoi then 'Nhận lead' else 'Giao cho ' || coalesce(v_ten, '') end, v_nguoi);
  end if;
  if new.giai_doan_id is distinct from old.giai_doan_id then
    select ten into v_cu from public.lead_giai_doan where id = old.giai_doan_id;
    select ten into v_moi from public.lead_giai_doan where id = new.giai_doan_id;
    if new.ket_qua = 'lost' then select ten into v_ld from public.lead_ly_do_thua where id = new.ly_do_thua_id; end if;
    insert into public.lead_hoat_dong (lead_id, loai, noi_dung, nguoi_id)
    values (new.id, case when old.ket_qua <> 'open' and new.ket_qua = 'open' then 'mo_lai' else 'doi_giai_doan' end,
            case when old.ket_qua <> 'open' and new.ket_qua = 'open' then 'Mở lại lead: ' else 'Đổi giai đoạn: ' end || coalesce(v_cu, '') || ' → ' || coalesce(v_moi, '')
              || case when new.ket_qua = 'lost' then ' · Lý do: ' || coalesce(v_ld, new.ly_do, '') else '' end, v_nguoi);
  end if;
  if new.khach_id is not null and old.khach_id is null then
    insert into public.lead_hoat_dong (lead_id, loai, noi_dung, nguoi_id) values (new.id, 'gan_khach', 'Gắn hồ sơ khách', v_nguoi);
  end if;
  return null;
end $$;
drop trigger if exists lead_sau_ghi on public.lead;
create trigger lead_sau_ghi after insert or update on public.lead for each row execute function public.trg_lead_sau_ghi();

-- Hoạt động ghi tay / tác vụ / nhắc / tệp làm mới "cập nhật lúc" của lead (mức chăm sóc tính theo đây).
create or replace function public.trg_lead_hoat_dong_cap_nhat() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.loai in ('ghi_chu', 'goi', 'nhan_tin', 'tac_vu', 'nhac', 'tep', 'ho_tro') then
    update public.lead set cap_nhat_luc = now() where id = new.lead_id;
  end if;
  return null;
end $$;
drop trigger if exists lead_hoat_dong_cap_nhat on public.lead_hoat_dong;
create trigger lead_hoat_dong_cap_nhat after insert on public.lead_hoat_dong for each row execute function public.trg_lead_hoat_dong_cap_nhat();

-- Người hỗ trợ: không trùng người phụ trách; gỡ người còn tác vụ / nhắc việc mở thì chặn.
create or replace function public.trg_lead_ho_tro() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if exists (select 1 from public.lead where id = new.lead_id and owner_id = new.nhan_vien_id) then
      raise exception 'Người này đang phụ trách lead.' using errcode = 'P0001';
    end if;
    return new;
  end if;
  if exists (select 1 from public.lead_tac_vu t join public.lead l on l.id = t.lead_id where t.lead_id = old.lead_id and t.giao_cho_id = old.nhan_vien_id and t.trang_thai = 'mo' and l.owner_id is distinct from old.nhan_vien_id)
     or exists (select 1 from public.lead_nhac n join public.lead l on l.id = n.lead_id where n.lead_id = old.lead_id and n.nhac_cho_id = old.nhan_vien_id and n.trang_thai = 'cho' and l.owner_id is distinct from old.nhan_vien_id) then
    raise exception 'Người này còn tác vụ hoặc nhắc việc chưa xử lý — hãy chuyển hoặc hủy trước.' using errcode = 'P0001';
  end if;
  return old;
end $$;
drop trigger if exists lead_ho_tro_kiem on public.lead_nguoi_ho_tro;
create trigger lead_ho_tro_kiem before insert or delete on public.lead_nguoi_ho_tro for each row execute function public.trg_lead_ho_tro();

-- Tác vụ / nhắc chỉ giao cho người phụ trách hoặc người hỗ trợ của lead.
create or replace function public.trg_lead_giao_trong_lead() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v uuid := case when tg_table_name = 'lead_tac_vu' then (to_jsonb(new) ->> 'giao_cho_id')::uuid else (to_jsonb(new) ->> 'nhac_cho_id')::uuid end;
begin
  if not exists (select 1 from public.lead where id = new.lead_id and owner_id = v)
     and not exists (select 1 from public.lead_nguoi_ho_tro where lead_id = new.lead_id and nhan_vien_id = v) then
    raise exception 'Chỉ giao cho người phụ trách hoặc người hỗ trợ của lead.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists lead_tac_vu_giao on public.lead_tac_vu;
create trigger lead_tac_vu_giao before insert on public.lead_tac_vu for each row execute function public.trg_lead_giao_trong_lead();
drop trigger if exists lead_nhac_giao on public.lead_nhac;
create trigger lead_nhac_giao before insert on public.lead_nhac for each row execute function public.trg_lead_giao_trong_lead();

-- Tác vụ ↔ Việc cần làm: đóng bên nào thì bên kia khớp theo (điều kiện chặn vòng lặp).
create or replace function public.trg_lead_tac_vu_khop_viec() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.cong_viec_id is not null and new.trang_thai is distinct from old.trang_thai and new.trang_thai in ('xong', 'huy') then
    update public.cong_viec set trang_thai = new.trang_thai, hoan_thanh_luc = case when new.trang_thai = 'xong' then coalesce(hoan_thanh_luc, now()) else hoan_thanh_luc end
    where id = new.cong_viec_id and trang_thai not in ('xong', 'huy');
  end if;
  return null;
end $$;
drop trigger if exists lead_tac_vu_khop_viec on public.lead_tac_vu;
create trigger lead_tac_vu_khop_viec after update of trang_thai on public.lead_tac_vu for each row execute function public.trg_lead_tac_vu_khop_viec();
create or replace function public.trg_cong_viec_khop_lead() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.trang_thai is distinct from old.trang_thai and new.trang_thai in ('xong', 'huy') then
    update public.lead_tac_vu set trang_thai = new.trang_thai, dong_luc = now(), dong_boi = coalesce(dong_boi, new.nguoi_nhan_id)
    where cong_viec_id = new.id and trang_thai = 'mo';
  end if;
  return null;
end $$;
drop trigger if exists cong_viec_khop_lead on public.cong_viec;
create trigger cong_viec_khop_lead after update of trang_thai on public.cong_viec for each row execute function public.trg_cong_viec_khop_lead();

-- 11. Sửa cấu hình cột (một giao dịch, khoá, kiểm phiên bản) ────────────────
-- p_thao_tac: them | sua | len | xuong | ngung | dung_lai. Trả phiên bản mới.
create or replace function public.lead_gd_cau_hinh(p_phien_ban int, p_thao_tac text, p_id uuid, p_ten text, p_mau text, p_sla int)
returns int language plpgsql set search_path = public, pg_temp as $$
declare v_hien int; v_moi int; g public.lead_giai_doan; k public.lead_giai_doan; v_con int; v_ten text := nullif(trim(coalesce(p_ten, '')), '');
begin
  perform pg_advisory_xact_lock(hashtext('lead_giai_doan_cau_hinh'));
  select coalesce(max(phien_ban), 0) into v_hien from public.lead_giai_doan;
  if p_phien_ban is distinct from v_hien then
    raise exception 'Cấu hình cột vừa được người khác thay đổi. Tải lại trang rồi sửa tiếp.' using errcode = 'P0001';
  end if;
  v_moi := v_hien + 1;
  if p_mau is not null and p_mau !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Màu chưa hợp lệ.' using errcode = 'P0001'; end if;
  if p_sla is not null and (p_sla < 1 or p_sla > 525600) then raise exception 'SLA tính bằng phút, từ 1 đến 525600.' using errcode = 'P0001'; end if;
  if p_thao_tac = 'them' then
    if v_ten is null then raise exception 'Nhập tên cột.' using errcode = 'P0001'; end if;
    if exists (select 1 from public.lead_giai_doan where lower(trim(ten)) = lower(v_ten)) then raise exception 'Tên cột đã có.' using errcode = 'P0001'; end if;
    insert into public.lead_giai_doan (ten, mau, thu_tu, sla_phut, phien_ban)
    values (v_ten, coalesce(p_mau, '#8a8f98'), (select coalesce(max(thu_tu), 0) + 1 from public.lead_giai_doan where not la_thang and not la_thua), p_sla, v_moi);
    return v_moi;
  end if;
  select * into g from public.lead_giai_doan where id = p_id for update;
  if g.id is null then raise exception 'Không tìm thấy cột.' using errcode = 'P0001'; end if;
  if p_thao_tac = 'sua' then
    if v_ten is null then raise exception 'Nhập tên cột.' using errcode = 'P0001'; end if;
    if exists (select 1 from public.lead_giai_doan where lower(trim(ten)) = lower(v_ten) and id <> g.id) then raise exception 'Tên cột đã có.' using errcode = 'P0001'; end if;
    update public.lead_giai_doan set ten = v_ten, mau = coalesce(p_mau, mau), sla_phut = p_sla, phien_ban = v_moi where id = g.id;
  elsif p_thao_tac in ('len', 'xuong') then
    if g.la_thang or g.la_thua then raise exception 'Cột Thắng và Thua luôn ở cuối.' using errcode = 'P0001'; end if;
    if p_thao_tac = 'len' then
      select * into k from public.lead_giai_doan where not la_thang and not la_thua and thu_tu < g.thu_tu order by thu_tu desc limit 1;
    else
      select * into k from public.lead_giai_doan where not la_thang and not la_thua and thu_tu > g.thu_tu order by thu_tu asc limit 1;
    end if;
    if k.id is null then raise exception 'Cột đã ở vị trí đầu hoặc cuối.' using errcode = 'P0001'; end if;
    update public.lead_giai_doan set thu_tu = k.thu_tu, phien_ban = v_moi where id = g.id;
    update public.lead_giai_doan set thu_tu = g.thu_tu, phien_ban = v_moi where id = k.id;
  elsif p_thao_tac = 'ngung' then
    if g.la_thang or g.la_thua then raise exception 'Không ngừng dùng được cột Thắng hoặc Thua.' using errcode = 'P0001'; end if;
    select count(*) into v_con from public.lead where giai_doan_id = g.id;
    if v_con > 0 then raise exception 'Cột còn % lead — hãy chuyển hết trước.', v_con using errcode = 'P0001'; end if;
    if (select count(*) from public.lead_giai_doan where dang_dung and not la_thang and not la_thua and id <> g.id) = 0 then
      raise exception 'Cần giữ ít nhất một cột đang mở.' using errcode = 'P0001';
    end if;
    update public.lead_giai_doan set dang_dung = false, phien_ban = v_moi where id = g.id;
  elsif p_thao_tac = 'dung_lai' then
    update public.lead_giai_doan set dang_dung = true, phien_ban = v_moi where id = g.id;
  else
    raise exception 'Thao tác không hợp lệ.' using errcode = 'P0001';
  end if;
  return v_moi;
end $$;

-- 12. View danh sách (đếm tác vụ mở, nhắc sớm nhất, tệp, người hỗ trợ) ─────
create or replace view public.v_lead_ds with (security_invoker = true) as
select l.*,
  (select count(*) from public.lead_tac_vu t where t.lead_id = l.id and t.trang_thai = 'mo')::int as so_tac_vu_mo,
  (select count(*) from public.lead_nhac n where n.lead_id = l.id and n.trang_thai = 'cho')::int as so_nhac_cho,
  (select min(n.nhac_luc) from public.lead_nhac n where n.lead_id = l.id and n.trang_thai = 'cho') as nhac_som_nhat,
  (select count(*) from public.lead_tep f where f.lead_id = l.id)::int as so_tep,
  coalesce((select array_agg(h.nhan_vien_id) from public.lead_nguoi_ho_tro h where h.lead_id = l.id), '{}'::uuid[]) as ho_tro_ids
from public.lead l;

revoke all on function public.lead_gd_cau_hinh(int, text, uuid, text, text, int) from public, anon, authenticated;
grant execute on function public.lead_gd_cau_hinh(int, text, uuid, text, text, int) to service_role;

select public.khoa_tat_ca_bang();
revoke all on public.v_lead_ds from anon, authenticated;
grant select on public.v_lead_ds to service_role;
notify pgrst, 'reload schema';
