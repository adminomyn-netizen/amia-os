-- 0106 — ĐÁNH GIÁ SAU ĐIỀU TRỊ: khách Hài lòng / Không hài lòng + lý do (học từ VTTech, chị Flora chọn 28/10/2026). CHỈ THÊM.
-- KHÁC "đánh giá sao nhân viên" (0082, từng người phục vụ): đây là cảm nhận của khách về CẢ LẦN điều trị, mỗi lần một đánh giá.
--  · Một lần điều trị = một hoá đơn hoàn thành có dịch vụ; lịch hẹn hoàn thành chưa có hoá đơn hoàn thành thì đánh giá theo lịch. Một lịch và hoá đơn của nó không bị đánh giá hai lần.
--  · "Không hài lòng" TỰ tạo một khiếu nại mới (trạng thái "mới tiếp nhận") và nối hai chiều; sửa lại không tạo khiếu nại thứ hai. Dấu hiệu y khoa vẫn đi đường "Báo dấu hiệu bất thường" (không có lý do y khoa ở đây).
--  · Sửa được, mỗi lần ghi hoặc sửa đều có nhật ký cũ → mới ở DB; không xoá.
create table public.danh_gia_sau_dieu_tri (
  id uuid primary key default gen_random_uuid(),
  hoa_don_id uuid references public.hoa_don (id),
  lich_hen_id uuid references public.lich_hen (id),
  khach_id uuid not null references public.khach_hang (id),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  ket_qua text not null check (ket_qua in ('hai_long', 'khong_hai_long')),
  ly_do text check (ly_do is null or ly_do in ('ket_qua', 'thai_do', 'cho_doi', 'gia', 'tu_van', 've_sinh', 'khac')),
  ghi_chu text check (ghi_chu is null or char_length(ghi_chu) <= 1000),
  khieu_nai_id uuid references public.khieu_nai (id),
  nguoi_ghi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  sua_luc timestamptz,
  constraint dgsdt_mot_doi_tuong check ((hoa_don_id is null) <> (lich_hen_id is null)),
  constraint dgsdt_khong_hai_long_can_ly_do check (ket_qua <> 'khong_hai_long' or ly_do is not null)
);
create unique index dgsdt_mot_lan_hoa_don on public.danh_gia_sau_dieu_tri (hoa_don_id) where hoa_don_id is not null;
create unique index dgsdt_mot_lan_lich on public.danh_gia_sau_dieu_tri (lich_hen_id) where lich_hen_id is not null;
create index dgsdt_khach_idx on public.danh_gia_sau_dieu_tri (khach_id, tao_luc desc);
create index dgsdt_ket_qua_idx on public.danh_gia_sau_dieu_tri (ket_qua, tao_luc desc);
-- Liên kết ngược từ khiếu nại về đánh giá đã sinh ra nó.
alter table public.khieu_nai add column danh_gia_sau_dt_id uuid references public.danh_gia_sau_dieu_tri (id);

create function public.trg_dgsdt_kiem_tra() returns trigger language plpgsql as $$
declare h record; l record;
begin
  if tg_op = 'UPDATE' then
    if new.hoa_don_id is distinct from old.hoa_don_id or new.lich_hen_id is distinct from old.lich_hen_id or new.khach_id <> old.khach_id then
      raise exception 'Không đổi lần điều trị hay khách của một đánh giá' using errcode = 'P0001';
    end if;
    new.sua_luc := now();
    return new;
  end if;
  if new.hoa_don_id is not null then
    select * into h from public.hoa_don where id = new.hoa_don_id;
    if h.trang_thai is distinct from 'hoan_thanh' or h.khach_id is null or h.la_so_du_dau then raise exception 'Chỉ đánh giá sau điều trị trên hoá đơn đã hoàn thành của một khách' using errcode = 'P0001'; end if;
    if not exists (select 1 from public.hoa_don_dong d where d.hoa_don_id = h.id and d.loai = 'dich_vu') then raise exception 'Hoá đơn này không có dịch vụ nào để đánh giá sau điều trị' using errcode = 'P0001'; end if;
    if h.lich_hen_id is not null and exists (select 1 from public.danh_gia_sau_dieu_tri x where x.lich_hen_id = h.lich_hen_id) then
      raise exception 'Lần điều trị này đã được đánh giá ở lịch hẹn' using errcode = 'P0001';
    end if;
    new.khach_id := h.khach_id; new.chi_nhanh_id := h.chi_nhanh_id;
  else
    select * into l from public.lich_hen where id = new.lich_hen_id;
    if l.trang_thai is distinct from 'hoan_thanh' then raise exception 'Chỉ đánh giá sau điều trị trên lịch hẹn đã hoàn thành' using errcode = 'P0001'; end if;
    if exists (select 1 from public.hoa_don d where d.lich_hen_id = l.id and d.trang_thai = 'hoan_thanh') then
      raise exception 'Lịch hẹn này đã có hoá đơn hoàn thành: đánh giá ở hoá đơn' using errcode = 'P0001';
    end if;
    new.khach_id := l.khach_id; new.chi_nhanh_id := l.chi_nhanh_id;
  end if;
  return new;
end $$;
create trigger dgsdt_kiem_tra before insert or update on public.danh_gia_sau_dieu_tri for each row execute function public.trg_dgsdt_kiem_tra();

create function public.trg_dgsdt_nhat_ky() returns trigger language plpgsql as $$
begin
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (new.nguoi_ghi_id, case tg_op when 'INSERT' then 'ghi_danh_gia_sau_dt' else 'sua_danh_gia_sau_dt' end, 'danh_gia_sau_dieu_tri', new.id,
    jsonb_build_object('khach_id', new.khach_id, 'hoa_don_id', new.hoa_don_id, 'lich_hen_id', new.lich_hen_id,
      'truoc', case tg_op when 'UPDATE' then jsonb_build_object('ket_qua', old.ket_qua, 'ly_do', old.ly_do, 'ghi_chu', old.ghi_chu) end,
      'sau', jsonb_build_object('ket_qua', new.ket_qua, 'ly_do', new.ly_do, 'ghi_chu', new.ghi_chu)));
  return null;
end $$;
create trigger dgsdt_nhat_ky after insert or update on public.danh_gia_sau_dieu_tri for each row execute function public.trg_dgsdt_nhat_ky();
create trigger dgsdt_khong_xoa before delete on public.danh_gia_sau_dieu_tri for each row execute function public.chi_them_dong();

-- Ghi hoặc sửa đánh giá của một lần điều trị (hoá đơn HOẶC lịch hẹn), và nếu "không hài lòng" mà chưa có khiếu nại thì tạo khiếu nại — tất cả trong một giao dịch.
create function public.ghi_danh_gia_sau_dieu_tri(p_hoa_don uuid, p_lich uuid, p_ket_qua text, p_ly_do text, p_ghi_chu text, p_nguoi uuid)
returns table (r_danh_gia_id uuid, r_khieu_nai_id uuid, r_khieu_nai_moi boolean, r_chi_nhanh_id uuid)
language plpgsql as $$
declare
  d public.danh_gia_sau_dieu_tri; v_kn uuid; v_moi boolean := false; v_loai text; v_nhan text; v_dv uuid;
  v_ly text := nullif(btrim(coalesce(p_ly_do, '')), ''); v_gc text := nullif(btrim(coalesce(p_ghi_chu, '')), '');
begin
  if p_nguoi is null then raise exception 'Thiếu người ghi nhận' using errcode = 'P0001'; end if;
  if (p_hoa_don is null) = (p_lich is null) then raise exception 'Chọn một hoá đơn hoặc một lịch hẹn để đánh giá' using errcode = 'P0001'; end if;
  if p_ket_qua = 'khong_hai_long' and v_ly is null then raise exception 'Chọn lý do khách không hài lòng' using errcode = 'P0001'; end if;
  if p_ket_qua = 'hai_long' then v_ly := null; end if;
  select * into d from public.danh_gia_sau_dieu_tri x where (p_hoa_don is not null and x.hoa_don_id = p_hoa_don) or (p_lich is not null and x.lich_hen_id = p_lich);
  if d.id is null then
    insert into public.danh_gia_sau_dieu_tri (hoa_don_id, lich_hen_id, ket_qua, ly_do, ghi_chu, nguoi_ghi_id, khach_id)
    values (p_hoa_don, p_lich, p_ket_qua, v_ly, v_gc, p_nguoi, '00000000-0000-0000-0000-000000000000')
    returning * into d;
  elsif d.ket_qua is distinct from p_ket_qua or d.ly_do is distinct from v_ly or d.ghi_chu is distinct from v_gc then
    update public.danh_gia_sau_dieu_tri set ket_qua = p_ket_qua, ly_do = v_ly, ghi_chu = v_gc, nguoi_ghi_id = p_nguoi where id = d.id returning * into d;
  end if;
  v_kn := d.khieu_nai_id;
  if d.ket_qua = 'khong_hai_long' and v_kn is null then
    v_loai := case d.ly_do when 'thai_do' then 'thai_do' when 'gia' then 'tai_chinh' else 'dich_vu' end;
    v_nhan := case d.ly_do when 'ket_qua' then 'Kết quả chưa như mong đợi' when 'thai_do' then 'Thái độ nhân viên' when 'cho_doi' then 'Chờ đợi lâu' when 'gia' then 'Giá / chi phí'
                           when 'tu_van' then 'Tư vấn chưa rõ' when 've_sinh' then 'Không gian / vệ sinh' else 'Lý do khác' end;
    if d.hoa_don_id is not null then
      select dd.dich_vu_id into v_dv from public.hoa_don_dong dd where dd.hoa_don_id = d.hoa_don_id and dd.loai = 'dich_vu' and dd.dich_vu_id is not null order by dd.tao_luc limit 1;
    else
      select lv.dich_vu_id into v_dv from public.lich_hen_dich_vu lv where lv.lich_id = d.lich_hen_id limit 1;
    end if;
    insert into public.khieu_nai (ma, khach_id, chi_nhanh_id, kenh, loai, noi_dung, dich_vu_id, hoa_don_id, nguoi_tiep_nhan_id, danh_gia_sau_dt_id)
    values ('KN' || lpad(public.so_tiep_theo('kn')::text, 6, '0'), d.khach_id, d.chi_nhanh_id, 'truc_tiep', v_loai,
      'Khách không hài lòng sau điều trị. Lý do: ' || v_nhan || coalesce('. Ghi chú: ' || d.ghi_chu, '') || '. (Tự tạo từ đánh giá sau điều trị.)', v_dv, d.hoa_don_id, p_nguoi, d.id)
    returning id into v_kn;
    update public.danh_gia_sau_dieu_tri set khieu_nai_id = v_kn where id = d.id;
    v_moi := true;
    insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
    values (p_nguoi, 'tao_khieu_nai_tu_danh_gia', 'khieu_nai', v_kn, jsonb_build_object('danh_gia_id', d.id, 'ly_do', d.ly_do));
  end if;
  return query select d.id, v_kn, v_moi, d.chi_nhanh_id;
end $$;

select public.khoa_tat_ca_bang();
