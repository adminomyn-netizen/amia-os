-- 0310 — PHIẾU VẬT TƯ THEO BUỔI (07/11/2026, quản lý cơ sở yêu cầu).
-- Thu ngân ghi buổi thẻ (chọn dịch vụ khách làm hôm nay) → hệ thống ra 1 phiếu vật tư cho buổi đó với ĐỦ dòng định mức của dịch vụ.
-- Chuyên viên trị liệu (KTV) PHẢI kiểm tên + số lượng, được sửa số, thêm, bỏ dòng (định mức chưa chuẩn), rồi bấm "Xác nhận đã kiểm".
-- Cuối ngày kho/quản lý bấm "Chốt cuối ngày": phiếu ĐÃ xác nhận mới được xuất kho (giống cap_phieu) và chuyển "đã làm, chờ đối chiếu".
-- Luồng cũ (bác sĩ chỉ định → kho cấp → KTV nhận → làm xong → đối chiếu) giữ nguyên: không định nghĩa lại hàm cũ nào.
-- Chạy lại nhiều lần không hỏng (if not exists / create or replace / drop trigger if exists).
set lock_timeout = '4s';

-- 1. Cột mới của phiếu
alter table public.phieu_cap alter column bac_si_id drop not null;       -- phiếu theo buổi có thể không có bác sĩ chỉ định (giữ khoá ngoại)
alter table public.phieu_cap add column if not exists buoi_id uuid references public.buoi_thuc_hien (id);
alter table public.phieu_cap add column if not exists xac_nhan_boi uuid references public.nhan_vien (id);
alter table public.phieu_cap add column if not exists xac_nhan_luc timestamptz;
alter table public.phieu_cap add column if not exists sua_boi uuid references public.nhan_vien (id);  -- người sửa dòng gần nhất (định mức chưa chuẩn: biết ai đổi số)
alter table public.phieu_cap add column if not exists sua_luc timestamptz;
create unique index if not exists phieu_cap_buoi_uq on public.phieu_cap (buoi_id) where buoi_id is not null;
-- Phiếu bác sĩ chỉ định (không gắn buổi) vẫn BẮT BUỘC có bác sĩ như trước.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'phieu_cap_bac_si_hoac_buoi' and conrelid = 'public.phieu_cap'::regclass) then
    alter table public.phieu_cap add constraint phieu_cap_bac_si_hoac_buoi check (bac_si_id is not null or buoi_id is not null);
  end if;
end $$;

-- 2. Chốt chặn trạng thái của phiếu theo buổi: chỉ đi cho_cap → huy, hoặc cho_cap → da_lam (khi đã có KTV xác nhận) → da_doi_chieu.
--    Nhờ vậy cap_phieu / nhan_phieu / hoan_tat_phieu của luồng bác sĩ không chạy nhầm trên phiếu theo buổi (lỗi thì cả giao dịch huỷ, kể cả dòng sổ kho).
create or replace function public.trg_phieu_buoi_trang_thai() returns trigger language plpgsql as $$
begin
  if new.buoi_id is null or new.trang_thai is not distinct from old.trang_thai then return new; end if;
  if old.trang_thai = 'cho_cap' and new.trang_thai = 'huy' then return new; end if;
  if old.trang_thai = 'cho_cap' and new.trang_thai = 'da_lam' then
    if new.xac_nhan_luc is null then raise exception 'Phiếu % chưa được chuyên viên trị liệu xác nhận, chưa chốt được', new.ma using errcode = 'P0001'; end if;
    return new;
  end if;
  if old.trang_thai = 'da_lam' and new.trang_thai = 'da_doi_chieu' then return new; end if;
  raise exception 'Phiếu % là phiếu vật tư theo buổi: chuyên viên trị liệu xác nhận rồi chốt cuối ngày, không đi theo bước kho cấp / nhận', new.ma using errcode = 'P0001';
end $$;
drop trigger if exists phieu_buoi_trang_thai on public.phieu_cap;
create trigger phieu_buoi_trang_thai before update on public.phieu_cap
  for each row execute function public.trg_phieu_buoi_trang_thai();

-- 3. Ra phiếu cho một buổi: đủ mọi dòng định mức của dịch vụ (cả vật tư cố định lẫn phương án chọn theo chỉ định), số cấp = định mức.
--    Dịch vụ chưa có định mức vẫn ra phiếu 0 dòng để KTV tự thêm. Gọi lại cho cùng buổi thì trả phiếu đã có (không tạo trùng).
--    Lịch hẹn của buổi đã có phiếu bác sĩ chỉ định (chưa huỷ) cho đúng dịch vụ đó → trả phiếu đó, KHÔNG ra phiếu mới (tránh xuất kho 2 lần).
create or replace function public.tao_phieu_theo_buoi(p_buoi uuid, p_nguoi uuid) returns uuid language plpgsql as $$
declare b public.buoi_thuc_hien; v_id uuid; v_ma text; v_ymd text;
begin
  select * into b from public.buoi_thuc_hien where id = p_buoi for update;
  if not found then raise exception 'Không có buổi này' using errcode = 'P0001'; end if;
  if b.trang_thai <> 'da_lam' then raise exception 'Buổi đã huỷ, không ra phiếu vật tư' using errcode = 'P0001'; end if;
  select id into v_id from public.phieu_cap where buoi_id = p_buoi;
  if found then return v_id; end if;
  if b.lich_hen_id is not null then
    select id into v_id from public.phieu_cap
     where lich_hen_id = b.lich_hen_id and dich_vu_id = b.dich_vu_id and khach_id = b.khach_id and buoi_id is null and trang_thai <> 'huy'
     order by tao_luc limit 1;
    if found then return v_id; end if;
  end if;
  v_ymd := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDD');
  v_ma := 'PC-' || v_ymd || '-' || lpad(public.so_tiep_theo('pc-' || v_ymd)::text, 3, '0');
  insert into public.phieu_cap (ma, chi_nhanh_id, lich_hen_id, khach_id, dich_vu_id, bac_si_id, ktv_id, buoi_id, tao_boi)
  values (v_ma, b.chi_nhanh_id, b.lich_hen_id, b.khach_id, b.dich_vu_id, b.bac_si_id, b.nv_thuc_hien_id, b.id, p_nguoi)
  returning id into v_id;
  insert into public.phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, don_gia)
  select v_id, d.san_pham_id, s.nhom_cap, d.so_luong, d.so_luong, s.gia_nhap_don_vi
    from public.dinh_muc d join public.san_pham s on s.id = d.san_pham_id
   where d.dich_vu_id = b.dich_vu_id and d.so_luong > 0;
  return v_id;
end $$;

-- Khoá phiếu theo buổi để sửa dòng: phải là phiếu theo buổi và chưa chốt. Sửa bất kỳ dòng nào → bỏ xác nhận cũ (KTV phải kiểm lại).
create or replace function public.khoa_phieu_buoi_de_sua(p_id uuid) returns public.phieu_cap language plpgsql as $$
declare p public.phieu_cap;
begin
  select * into p from public.phieu_cap where id = p_id for update;
  if not found then raise exception 'Không có phiếu này' using errcode = 'P0001'; end if;
  if p.buoi_id is null then raise exception 'Phiếu % do bác sĩ chỉ định, không sửa dòng ở đây', p.ma using errcode = 'P0001'; end if;
  if p.trang_thai <> 'cho_cap' then raise exception 'Phiếu % đã chốt hoặc đã huỷ, không sửa được', p.ma using errcode = 'P0001'; end if;
  return p;
end $$;

create or replace function public.sua_dong_phieu_buoi(p_dong uuid, p_so_luong numeric, p_nguoi uuid) returns void language plpgsql as $$
declare v_phieu uuid;
begin
  select phieu_id into v_phieu from public.phieu_cap_dong where id = p_dong;
  if not found then raise exception 'Không có dòng vật tư này' using errcode = 'P0001'; end if;
  perform public.khoa_phieu_buoi_de_sua(v_phieu);
  if p_so_luong is null or p_so_luong <= 0 then raise exception 'Số lượng phải lớn hơn 0 (không dùng thì bấm Bỏ dòng)' using errcode = 'P0001'; end if;
  update public.phieu_cap_dong set so_cap = p_so_luong where id = p_dong;
  update public.phieu_cap set xac_nhan_boi = null, xac_nhan_luc = null, sua_boi = p_nguoi, sua_luc = now() where id = v_phieu;
end $$;

create or replace function public.them_dong_phieu_buoi(p_phieu uuid, p_san_pham uuid, p_so_luong numeric, p_nguoi uuid) returns uuid language plpgsql as $$
declare p public.phieu_cap; s public.san_pham; v_dm numeric; v_id uuid;
begin
  p := public.khoa_phieu_buoi_de_sua(p_phieu);
  if p_so_luong is null or p_so_luong <= 0 then raise exception 'Số lượng phải lớn hơn 0' using errcode = 'P0001'; end if;
  select * into s from public.san_pham where id = p_san_pham;
  if not found then raise exception 'Không có vật tư này' using errcode = 'P0001'; end if;
  if exists (select 1 from public.phieu_cap_dong where phieu_id = p_phieu and san_pham_id = p_san_pham) then
    raise exception '"%" đã có trên phiếu, sửa số lượng ở dòng đó', s.ten using errcode = 'P0001';
  end if;
  select so_luong into v_dm from public.dinh_muc where dich_vu_id = p.dich_vu_id and san_pham_id = p_san_pham;
  insert into public.phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, don_gia)
  values (p_phieu, p_san_pham, s.nhom_cap, coalesce(v_dm, 0), p_so_luong, s.gia_nhap_don_vi) returning id into v_id;
  update public.phieu_cap set xac_nhan_boi = null, xac_nhan_luc = null, sua_boi = p_nguoi, sua_luc = now() where id = p_phieu;
  return v_id;
end $$;

create or replace function public.xoa_dong_phieu_buoi(p_dong uuid, p_nguoi uuid) returns void language plpgsql as $$
declare v_phieu uuid;
begin
  select phieu_id into v_phieu from public.phieu_cap_dong where id = p_dong;
  if not found then raise exception 'Không có dòng vật tư này' using errcode = 'P0001'; end if;
  perform public.khoa_phieu_buoi_de_sua(v_phieu);
  delete from public.phieu_cap_dong where id = p_dong;
  update public.phieu_cap set xac_nhan_boi = null, xac_nhan_luc = null, sua_boi = p_nguoi, sua_luc = now() where id = v_phieu;
end $$;

-- KTV xác nhận đã kiểm tên + số lượng (cho phép 0 dòng: buổi không dùng vật tư nào).
create or replace function public.xac_nhan_phieu_buoi(p_id uuid, p_nguoi uuid) returns void language plpgsql as $$
begin
  perform public.khoa_phieu_buoi_de_sua(p_id);
  if p_nguoi is null then raise exception 'Thiếu người xác nhận' using errcode = 'P0001'; end if;
  update public.phieu_cap set xac_nhan_boi = p_nguoi, xac_nhan_luc = now() where id = p_id;
end $$;

-- 4. Chốt cuối ngày theo chi nhánh + NGÀY LÀM của buổi (buổi có thể ghi lùi ngày).
--    Mỗi phiếu đã xác nhận: xuất kho y như cap_phieu (kiểm tồn, khoá theo vật tư, dòng sổ 'cap_ca' âm), so_tra = 0 (dùng thật = số đã xác nhận),
--    trạng thái 'da_lam' → hiện ở tab "Đối chiếu ngày" như ca thường, quản lý vẫn bấm "Đã đối chiếu" được.
--    Mỗi phiếu chạy trong khối riêng: một phiếu thiếu tồn không làm hỏng cả ngày, phiếu đó giữ nguyên và báo lý do.
--    Trả về {da_chot, chua_xac_nhan:[{id,ma}], loi:[{id,ma,loi}]}.
create or replace function public.chot_phieu_ngay(p_chi_nhanh uuid, p_ngay date, p_nguoi uuid) returns jsonb language plpgsql as $$
declare p record; r record; v_ton numeric; v_dem int := 0; v_loi jsonb := '[]'::jsonb; v_chua jsonb; v_xong timestamptz;
begin
  if p_chi_nhanh is null or p_ngay is null then raise exception 'Chọn chi nhánh và ngày cần chốt' using errcode = 'P0001'; end if;
  -- Giờ "làm xong" nằm trong đúng ngày chốt để tab đối chiếu theo ngày không lệch khi chốt sau nửa đêm.
  v_xong := least(now(), ((p_ngay + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') - interval '1 second');
  for p in
    select pc.id, pc.ma from public.phieu_cap pc join public.buoi_thuc_hien b on b.id = pc.buoi_id
     where pc.chi_nhanh_id = p_chi_nhanh and b.ngay_lam = p_ngay and b.trang_thai = 'da_lam'
       and pc.trang_thai = 'cho_cap' and pc.xac_nhan_luc is not null
     order by pc.tao_luc
  loop
    begin
      perform 1 from public.phieu_cap where id = p.id and trang_thai = 'cho_cap' and xac_nhan_luc is not null for update;
      if not found then continue; end if;
      for r in select d.*, s.ten from public.phieu_cap_dong d join public.san_pham s on s.id = d.san_pham_id where d.phieu_id = p.id order by d.san_pham_id loop
        perform pg_advisory_xact_lock(hashtext(p_chi_nhanh::text || r.san_pham_id::text));
        v_ton := public.ton_kho(p_chi_nhanh, r.san_pham_id);
        if v_ton < r.so_cap then raise exception 'Kho không đủ "%": còn %, cần xuất %', r.ten, trim_scale(v_ton), trim_scale(r.so_cap) using errcode = 'P0001'; end if;
        insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, phieu_cap_id, nguoi_id, ghi_chu)
        values (p_chi_nhanh, r.san_pham_id, 'cap_ca', -r.so_cap, r.don_gia, p.id, p_nguoi, 'Xuất theo phiếu buổi ' || p.ma || ' (chốt ngày)');
      end loop;
      update public.phieu_cap_dong set so_tra = 0 where phieu_id = p.id;
      update public.phieu_cap set trang_thai = 'da_lam', cap_boi = p_nguoi, cap_luc = now(),
             nhan_boi = xac_nhan_boi, nhan_luc = xac_nhan_luc, lam_xong_luc = v_xong
       where id = p.id;
      v_dem := v_dem + 1;
    exception when others then
      v_loi := v_loi || jsonb_build_array(jsonb_build_object('id', p.id, 'ma', p.ma, 'loi', sqlerrm));
    end;
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('id', pc.id, 'ma', pc.ma) order by pc.tao_luc), '[]'::jsonb) into v_chua
    from public.phieu_cap pc join public.buoi_thuc_hien b on b.id = pc.buoi_id
   where pc.chi_nhanh_id = p_chi_nhanh and b.ngay_lam = p_ngay and b.trang_thai = 'da_lam'
     and pc.trang_thai = 'cho_cap' and pc.xac_nhan_luc is null;
  return jsonb_build_object('da_chot', v_dem, 'chua_xac_nhan', v_chua, 'loi', v_loi);
end $$;

-- 5. Huỷ buổi → huỷ luôn phiếu theo buổi CHƯA chốt (chưa xuất kho nên không phải hoàn kho). Phiếu đã chốt giữ nguyên (vật tư đã xuất, quản lý tự điều chỉnh kho nếu cần).
create or replace function public.trg_buoi_huy_phieu() returns trigger language plpgsql as $$
begin
  if new.trang_thai = 'huy' and old.trang_thai is distinct from 'huy' then
    update public.phieu_cap set trang_thai = 'huy', ly_do_huy = 'Huỷ buổi: ' || coalesce(new.ly_do_huy, '')
     where buoi_id = new.id and trang_thai = 'cho_cap';
  end if;
  return new;
end $$;
drop trigger if exists buoi_huy_phieu on public.buoi_thuc_hien;
create trigger buoi_huy_phieu after update on public.buoi_thuc_hien
  for each row execute function public.trg_buoi_huy_phieu();

reset lock_timeout;
select public.khoa_tat_ca_bang();
