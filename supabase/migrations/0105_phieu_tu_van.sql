-- 0105 — PHIẾU TƯ VẤN THEO PHỄU (học từ phần mềm VTTech, chị Flora chọn 28/10/2026). CHỈ THÊM: không đụng bảng/hàm cũ.
-- Mỗi lần tư vấn một khách là một phiếu: đặt vấn đề → phân tích → chứng minh → kết quả (chờ chốt / chốt / không chốt), kèm tư vấn viên,
-- dịch vụ/gói quan tâm, báo giá dự kiến, ngày hẹn quay lại, lý do không chốt. "Nhu cầu phát sinh" = các nhu cầu khách nói thêm, mỗi nhu cầu một dòng (chỉ thêm).
-- Phiếu không xoá được; mọi lần ghi hoặc sửa đều để dấu vết trong nhat_ky_truy_cap (giá trị cũ → mới) ngay ở DB.
create table public.phieu_tu_van (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  khach_id uuid not null references public.khach_hang (id),
  chi_nhanh_id uuid references public.chi_nhanh (id),
  tu_van_vien_id uuid not null references public.nhan_vien (id),
  ngay_tu_van date not null default public.hom_nay(),
  dich_vu_id uuid references public.dich_vu (id),
  goi_quan_tam text check (goi_quan_tam is null or char_length(goi_quan_tam) <= 200),
  dat_van_de text check (dat_van_de is null or char_length(dat_van_de) <= 1000),
  phan_tich text check (phan_tich is null or char_length(phan_tich) <= 1000),
  chung_minh text check (chung_minh is null or char_length(chung_minh) <= 1000),
  ket_qua text not null default 'cho_chot' check (ket_qua in ('cho_chot', 'chot', 'khong_chot')),
  bao_gia bigint not null default 0 check (bao_gia >= 0),
  ngay_hen_lai date,
  ly_do_khong_chot text check (ly_do_khong_chot is null or char_length(ly_do_khong_chot) <= 500),
  nguoi_ghi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  sua_luc timestamptz,
  constraint phieu_tu_van_khong_chot_can_ly_do check (ket_qua <> 'khong_chot' or char_length(btrim(coalesce(ly_do_khong_chot, ''))) > 0)
);
create index phieu_tu_van_khach_idx on public.phieu_tu_van (khach_id, ngay_tu_van desc);
create index phieu_tu_van_ngay_idx on public.phieu_tu_van (ngay_tu_van, chi_nhanh_id);
create index phieu_tu_van_tvv_idx on public.phieu_tu_van (tu_van_vien_id, ngay_tu_van);

create table public.phieu_tu_van_nhu_cau (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.phieu_tu_van (id),
  noi_dung text not null check (char_length(btrim(noi_dung)) between 1 and 300),
  nguoi_ghi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index phieu_tu_van_nhu_cau_idx on public.phieu_tu_van_nhu_cau (phieu_id, tao_luc);

create function public.trg_phieu_tu_van_kiem_tra() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if new.khach_id <> old.khach_id or new.ma <> old.ma then raise exception 'Không đổi khách hay mã của phiếu tư vấn' using errcode = 'P0001'; end if;
    new.sua_luc := now();
  end if;
  if new.chi_nhanh_id is null then
    select chi_nhanh_id into new.chi_nhanh_id from public.khach_hang where id = new.khach_id;
  end if;
  if new.ket_qua <> 'khong_chot' then new.ly_do_khong_chot := nullif(btrim(coalesce(new.ly_do_khong_chot, '')), ''); end if;
  return new;
end $$;
create trigger phieu_tu_van_kiem_tra before insert or update on public.phieu_tu_van
  for each row execute function public.trg_phieu_tu_van_kiem_tra();

create function public.trg_phieu_tu_van_nhat_ky() returns trigger language plpgsql as $$
declare
  v jsonb := jsonb_build_object('ket_qua', new.ket_qua, 'bao_gia', new.bao_gia, 'tu_van_vien_id', new.tu_van_vien_id, 'dich_vu_id', new.dich_vu_id,
    'goi_quan_tam', new.goi_quan_tam, 'dat_van_de', new.dat_van_de, 'phan_tich', new.phan_tich, 'chung_minh', new.chung_minh,
    'ngay_hen_lai', new.ngay_hen_lai, 'ly_do_khong_chot', new.ly_do_khong_chot);
begin
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (new.nguoi_ghi_id, case tg_op when 'INSERT' then 'ghi_phieu_tu_van' else 'sua_phieu_tu_van' end, 'phieu_tu_van', new.id,
    jsonb_build_object('khach_id', new.khach_id, 'ma', new.ma, 'sau', v,
      'truoc', case tg_op when 'UPDATE' then jsonb_build_object('ket_qua', old.ket_qua, 'bao_gia', old.bao_gia, 'tu_van_vien_id', old.tu_van_vien_id, 'dich_vu_id', old.dich_vu_id,
        'goi_quan_tam', old.goi_quan_tam, 'dat_van_de', old.dat_van_de, 'phan_tich', old.phan_tich, 'chung_minh', old.chung_minh,
        'ngay_hen_lai', old.ngay_hen_lai, 'ly_do_khong_chot', old.ly_do_khong_chot) end));
  return null;
end $$;
create trigger phieu_tu_van_nhat_ky after insert or update on public.phieu_tu_van
  for each row execute function public.trg_phieu_tu_van_nhat_ky();

create function public.trg_phieu_tu_van_nhu_cau_nhat_ky() returns trigger language plpgsql as $$
begin
  insert into public.nhat_ky_truy_cap (nguoi_id, hanh_dong, doi_tuong, doi_tuong_id, chi_tiet)
  values (new.nguoi_ghi_id, 'them_nhu_cau_tu_van', 'phieu_tu_van', new.phieu_id, jsonb_build_object('noi_dung', new.noi_dung));
  return null;
end $$;
create trigger phieu_tu_van_nhu_cau_nhat_ky after insert on public.phieu_tu_van_nhu_cau
  for each row execute function public.trg_phieu_tu_van_nhu_cau_nhat_ky();

-- Phiếu và nhu cầu là dữ liệu ghi nhận: không xoá, nhu cầu chỉ thêm (sửa phiếu thì có nhật ký).
create trigger phieu_tu_van_khong_xoa before delete on public.phieu_tu_van for each row execute function public.chi_them_dong();
create trigger phieu_tu_van_nhu_cau_chi_them before update or delete on public.phieu_tu_van_nhu_cau for each row execute function public.chi_them_dong();

-- Số phiếu: dùng chung cho màn hình, báo cáo và Excel. Tỉ lệ chốt = số phiếu chốt / TỔNG số phiếu trong khoảng (phiếu còn chờ chốt tính vào mẫu số).
create function public.bc_ti_le_chot(p_tu date, p_den date, p_cn uuid default null)
returns table (tu_van_vien_id uuid, so_phieu bigint, cho_chot bigint, chot bigint, khong_chot bigint, tong_bao_gia_chot bigint, tong_bao_gia bigint)
language sql stable as $$
  select p.tu_van_vien_id, count(*), count(*) filter (where p.ket_qua = 'cho_chot'), count(*) filter (where p.ket_qua = 'chot'), count(*) filter (where p.ket_qua = 'khong_chot'),
         coalesce(sum(p.bao_gia) filter (where p.ket_qua = 'chot'), 0)::bigint, coalesce(sum(p.bao_gia), 0)::bigint
    from public.phieu_tu_van p
   where p.ngay_tu_van between p_tu and p_den and (p_cn is null or p.chi_nhanh_id = p_cn)
   group by p.tu_van_vien_id
$$;

select public.khoa_tat_ca_bang();
