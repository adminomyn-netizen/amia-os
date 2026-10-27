-- 0030 — NƠI LÀM VIỆC (theo BeDental "Nơi làm việc"): việc cần hoàn thành, báo cáo ngày, wiki công ty, đề xuất (mua sắm / thanh toán / tạm ứng) và Trung tâm phê duyệt.
-- Đề xuất đi một chiều: chờ duyệt → đã duyệt → đã thực hiện (chi sổ quỹ với thanh toán / tạm ứng; lập đơn mua với mua sắm). Từ chối / huỷ là trạng thái cuối.
-- "Thực hiện chi" chạy trong MỘT giao dịch (khoá dòng đề xuất) để hai người bấm cùng lúc không chi hai lần.

create table public.cong_viec (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null,
  mo_ta text,
  nguoi_giao_id uuid not null references public.nhan_vien (id),
  nguoi_nhan_id uuid not null references public.nhan_vien (id),
  han date,
  uu_tien text not null default 'thuong' check (uu_tien in ('thap', 'thuong', 'cao')),
  trang_thai text not null default 'moi' check (trang_thai in ('moi', 'dang_lam', 'xong', 'huy')),
  ket_qua text,
  hoan_thanh_luc timestamptz,
  tao_luc timestamptz not null default now()
);
create index cong_viec_nhan_idx on public.cong_viec (nguoi_nhan_id, trang_thai);
create index cong_viec_giao_idx on public.cong_viec (nguoi_giao_id, trang_thai);

create table public.bao_cao_ngay (
  id uuid primary key default gen_random_uuid(),
  nhan_vien_id uuid not null references public.nhan_vien (id),
  ngay date not null,
  da_lam text not null,
  vuong text,
  ke_hoach text,
  nguoi_nop_id uuid not null references public.nhan_vien (id),
  cap_nhat_luc timestamptz not null default now(),
  unique (nhan_vien_id, ngay)
);

create table public.wiki_bai (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null,
  nhom text not null default 'Chung',
  noi_dung text not null,
  ghim boolean not null default false,
  cong_khai boolean not null default true,
  nguoi_id uuid not null references public.nhan_vien (id),
  cap_nhat_luc timestamptz not null default now(),
  tao_luc timestamptz not null default now()
);

create table public.de_xuat (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  loai text not null check (loai in ('mua_sam', 'thanh_toan', 'tam_ung')),
  tieu_de text not null,
  noi_dung text,
  so_tien bigint check (so_tien is null or so_tien > 0),
  doi_tuong text,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  nguoi_gui_id uuid not null references public.nhan_vien (id),
  han_duyet date,
  trang_thai text not null default 'cho_duyet' check (trang_thai in ('cho_duyet', 'da_duyet', 'da_thuc_hien', 'tu_choi', 'huy')),
  nguoi_duyet_id uuid references public.nhan_vien (id),
  duyet_luc timestamptz,
  ly_do text,
  so_quy_id uuid references public.so_quy (id),
  don_mua_id uuid references public.don_mua (id),
  tao_luc timestamptz not null default now(),
  check (loai = 'mua_sam' or so_tien is not null)
);
create index de_xuat_tt_idx on public.de_xuat (trang_thai, tao_luc desc);
create index de_xuat_gui_idx on public.de_xuat (nguoi_gui_id);

-- Chi theo đề xuất đã duyệt: ghi sổ quỹ + đánh dấu đã thực hiện cùng một giao dịch.
create function public.chi_theo_de_xuat(p_de_xuat uuid, p_quy uuid, p_loai_thu_chi uuid, p_ngay date, p_nguoi uuid) returns void language plpgsql as $$
declare d public.de_xuat; v_quy uuid; v_lt uuid; v_ma text; v_id uuid; v_ten text;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if d.loai = 'mua_sam' then raise exception 'Đề xuất mua sắm không chi trực tiếp — hãy lập đơn mua.'; end if;
  if d.trang_thai <> 'da_duyet' then raise exception 'Đề xuất chưa được duyệt hoặc đã thực hiện.'; end if;
  select id into v_quy from public.quy where id = p_quy and hoat_dong and chi_nhanh_id = d.chi_nhanh_id;
  if v_quy is null then raise exception 'Quỹ không hợp lệ cho chi nhánh của đề xuất.'; end if;
  select id into v_lt from public.loai_thu_chi where id = p_loai_thu_chi and huong = 'chi' and hoat_dong and not he_thong;
  if v_lt is null then raise exception 'Phân loại chi không hợp lệ.'; end if;
  select ho_ten into v_ten from public.nhan_vien where id = d.nguoi_gui_id;
  v_ma := 'PC' || lpad(public.so_tiep_theo('so_quy_PC')::text, 6, '0');
  insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguoi_id)
    values (v_ma, p_ngay, v_quy, 'chi', d.so_tien, v_lt, (case d.loai when 'tam_ung' then 'Tạm ứng lương: ' else 'Thanh toán: ' end) || d.tieu_de, coalesce(d.doi_tuong, v_ten), p_nguoi)
    returning id into v_id;
  update public.de_xuat set trang_thai = 'da_thuc_hien', so_quy_id = v_id where id = d.id;
end $$;
revoke all on function public.chi_theo_de_xuat(uuid, uuid, uuid, date, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
