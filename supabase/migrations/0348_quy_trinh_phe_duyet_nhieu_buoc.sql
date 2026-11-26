-- 0348 — QUY TRÌNH PHÊ DUYỆT NHIỀU BƯỚC (bê từ Approval của Lark MSC: Đề nghị thanh toán / tạm ứng / hoàn ứng / hoàn trả khách / mua sắm).
-- Chuỗi bước theo SOP tài chính MSC (docs/msc-lark/tai-chinh-cung-ung-quan-ly-viec.md mục 2.5): QL đơn vị xác nhận → KT chi kiểm tra → KTT → Giám đốc công ty (từ ngưỡng).
-- Mỗi đề xuất COPY chuỗi bước tại lúc gửi (sửa quy trình sau đó không đổi đề xuất đang chạy). Đề xuất cũ không có bước thì chạy luồng 1 cấp như trước.
-- Chỉ MỘT người sửa được quy trình: cau_hinh 'quy_trinh_duyet.nguoi_sua' (nhan_vien.id, cách nhau dấu phẩy) — mọi hành động sửa kiểm ở server action và ghi nhật ký.
-- Người thật KHÔNG gán ở đây: bước ghi theo chức danh tài chính; chưa ai giữ chức danh thì vai trò dự phòng được duyệt, anh Nam gán chức danh ở Nhân viên.

create table public.quy_trinh_duyet (
  ma text primary key check (ma in ('thanh_toan', 'tam_ung', 'hoan_ung', 'hoan_khach', 'mua_sam')),
  ten text not null,
  ma_lark text,
  mo_ta text,
  hoat_dong boolean not null default true,
  cap_nhat_luc timestamptz not null default now(),
  cap_nhat_boi uuid references public.nhan_vien (id)
);

create table public.quy_trinh_duyet_buoc (
  id uuid primary key default gen_random_uuid(),
  quy_trinh_ma text not null references public.quy_trinh_duyet (ma) on delete cascade,
  thu_tu int not null check (thu_tu > 0),
  ten text not null,
  nguoi_duyet_loai text not null check (nguoi_duyet_loai in ('chuc_danh', 'vai_tro', 'quan_ly_chi_nhanh', 'nhan_vien')),
  nguoi_duyet_gia_tri text,
  du_phong_vai_tro text[] not null default '{}',
  nguong_quy_tac text references public.quy_tac_duyet (ma),
  kiem_han_muc boolean not null default false,
  sla_ngay int not null default 1 check (sla_ngay between 0 and 30),
  unique (quy_trinh_ma, thu_tu),
  check ((nguoi_duyet_loai = 'quan_ly_chi_nhanh') = (nguoi_duyet_gia_tri is null))
);

create table public.de_xuat_buoc_duyet (
  id uuid primary key default gen_random_uuid(),
  de_xuat_id uuid not null references public.de_xuat (id) on delete cascade,
  thu_tu int not null,
  ten text not null,
  nguoi_duyet_loai text not null,
  nguoi_duyet_gia_tri text,
  du_phong_vai_tro text[] not null default '{}',
  kiem_han_muc boolean not null default false,
  sla_ngay int not null default 1,
  han_xu_ly date,
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'da_duyet', 'tu_choi')),
  nguoi_id uuid references public.nhan_vien (id),
  luc timestamptz,
  ghi_chu text,
  duyet_thay boolean not null default false,
  unique (de_xuat_id, thu_tu)
);
create index de_xuat_buoc_duyet_cho_idx on public.de_xuat_buoc_duyet (de_xuat_id) where trang_thai = 'cho';

create table public.quy_trinh_duyet_nhat_ky (
  id uuid primary key default gen_random_uuid(),
  luc timestamptz not null default now(),
  nguoi_id uuid not null references public.nhan_vien (id),
  hanh_dong text not null,
  quy_trinh_ma text,
  truoc jsonb,
  sau jsonb,
  ly_do text
);

-- Các trường của form Lark mà đề xuất chưa có.
alter table public.de_xuat
  add column bo_phan text,
  add column so_tai_khoan text,
  add column chu_tai_khoan text,
  add column ngan_hang text,
  add column link_dinh_kem text;

-- Người được sửa quy trình: chỉ anh Nam (Kỹ thuật).
insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('quy_trinh_duyet.nguoi_sua', '56679c06-7e3f-4796-b05e-9b380d9b29f4', 'Chỉ nhân viên có id trong danh sách này (anh Nam) được sửa quy trình phê duyệt, ngưỡng duyệt, chức danh tài chính và hạn mức duyệt. Chị Lâm chốt 26/11/2026.');

-- ─── Quy trình mặc định theo SOP (ngưỡng 10 triệu vẫn "chờ xác nhận" ở quy_tac_duyet) ───
insert into public.quy_trinh_duyet (ma, ten, ma_lark, mo_ta) values
  ('thanh_toan', 'Đề nghị thanh toán', 'MSC-ĐNTT', 'Hoàn trả chi phí nhân viên đã tự chi và thanh toán nhà cung cấp. Dưới ngưỡng Kế toán trưởng duyệt cuối; từ ngưỡng thêm Giám đốc công ty.'),
  ('tam_ung', 'Đề nghị tạm ứng', 'MSC-ĐNTU', 'Tạm ứng chi phí công việc (phải hoàn ứng) hoặc tạm ứng lương (trừ vào kỳ lương). Cùng chuỗi duyệt với thanh toán.'),
  ('hoan_ung', 'Đề nghị hoàn ứng', 'MSC-ĐNHU', 'Quyết toán một khoản tạm ứng. Ngưỡng tính trên phần công ty phải chi thêm (chi thực tế trừ số đã ứng).'),
  ('hoan_khach', 'Hoàn trả khách hàng', 'MSC-HTKH', 'Mọi khoản hoàn tiền khách, không phân biệt giá trị, đều lên Giám đốc công ty.'),
  ('mua_sam', 'Đề nghị mua sắm', 'MSC-ĐNMH', 'Mọi đề nghị mua: Kế toán chi → Kế toán trưởng → Giám đốc công ty (không có bậc 10 triệu).');

insert into public.quy_trinh_duyet_buoc (quy_trinh_ma, thu_tu, ten, nguoi_duyet_loai, nguoi_duyet_gia_tri, du_phong_vai_tro, nguong_quy_tac, kiem_han_muc, sla_ngay)
select q.ma, b.thu_tu, b.ten, b.loai, b.gia_tri, b.du_phong, b.nguong, b.han_muc, 1
from public.quy_trinh_duyet q
join (values
  (1, 'Quản lý đơn vị xác nhận', 'quan_ly_chi_nhanh', null, '{}'::text[], null, false),
  (2, 'Kế toán chi kiểm tra hồ sơ', 'chuc_danh', 'ke_toan_chi', '{ke_toan}'::text[], null, false),
  (3, 'Kế toán trưởng duyệt', 'chuc_danh', 'ke_toan_truong', '{ke_toan}'::text[], null, true),
  (4, 'Giám đốc công ty duyệt', 'chuc_danh', 'giam_doc_cong_ty', '{chu}'::text[], 'chi_giam_doc', true)
) as b (thu_tu, ten, loai, gia_tri, du_phong, nguong, han_muc) on q.ma in ('thanh_toan', 'tam_ung', 'hoan_ung');

insert into public.quy_trinh_duyet_buoc (quy_trinh_ma, thu_tu, ten, nguoi_duyet_loai, nguoi_duyet_gia_tri, du_phong_vai_tro, kiem_han_muc, sla_ngay) values
  ('hoan_khach', 1, 'Giám đốc chi nhánh xác nhận', 'chuc_danh', 'giam_doc_chi_nhanh', '{quan_ly}', false, 1),
  ('hoan_khach', 2, 'Kế toán thu đối soát', 'chuc_danh', 'ke_toan_thu', '{ke_toan}', false, 1),
  ('hoan_khach', 3, 'Kế toán chi kiểm tra', 'chuc_danh', 'ke_toan_chi', '{ke_toan}', false, 1),
  ('hoan_khach', 4, 'Kế toán trưởng kiểm tra', 'chuc_danh', 'ke_toan_truong', '{ke_toan}', true, 1),
  ('hoan_khach', 5, 'Giám đốc công ty duyệt', 'chuc_danh', 'giam_doc_cong_ty', '{chu}', true, 1),
  ('mua_sam', 1, 'Kế toán chi kiểm tra', 'chuc_danh', 'ke_toan_chi', '{ke_toan}', false, 1),
  ('mua_sam', 2, 'Kế toán trưởng duyệt', 'chuc_danh', 'ke_toan_truong', '{ke_toan}', true, 1),
  ('mua_sam', 3, 'Giám đốc công ty duyệt', 'chuc_danh', 'giam_doc_cong_ty', '{chu}', true, 1);

-- ─── Sinh chuỗi bước cho một đề xuất (gọi ngay sau khi gửi). Trả số bước đã tạo (0 = quy trình tắt/trống → luồng 1 cấp cũ). ───
create function public.tao_buoc_duyet(p_de_xuat uuid) returns int language plpgsql as $$
declare d public.de_xuat; g public.de_xuat; v_tien bigint; n int := 0; b record;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if exists (select 1 from public.de_xuat_buoc_duyet where de_xuat_id = d.id) then return 0; end if;
  if not exists (select 1 from public.quy_trinh_duyet where ma = d.loai and hoat_dong) then return 0; end if;
  v_tien := coalesce(d.so_tien, 0);
  if d.loai = 'hoan_ung' then
    select * into g from public.de_xuat where id = d.de_xuat_goc_id;
    v_tien := greatest(v_tien - coalesce(g.so_tien, 0), 0);
  end if;
  for b in
    select s.*, q.nguong_tien from public.quy_trinh_duyet_buoc s left join public.quy_tac_duyet q on q.ma = s.nguong_quy_tac
    where s.quy_trinh_ma = d.loai order by s.thu_tu
  loop
    if b.nguong_quy_tac is not null and v_tien < b.nguong_tien then continue; end if;
    insert into public.de_xuat_buoc_duyet (de_xuat_id, thu_tu, ten, nguoi_duyet_loai, nguoi_duyet_gia_tri, du_phong_vai_tro, kiem_han_muc, sla_ngay, han_xu_ly)
      values (d.id, b.thu_tu, b.ten, b.nguoi_duyet_loai, b.nguoi_duyet_gia_tri, b.du_phong_vai_tro, b.kiem_han_muc, b.sla_ngay, case when n = 0 then public.hom_nay() + b.sla_ngay end);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Duyệt bước hiện tại. Việc ai được duyệt kiểm ở server action; hàm này khoá dòng và chỉ cho bước ĐANG TỚI LƯỢT (hai người bấm cùng lúc chỉ một lần thắng).
create function public.duyet_buoc_de_xuat(p_buoc uuid, p_nguoi uuid, p_thay boolean, p_ghi_chu text) returns void language plpgsql as $$
declare s public.de_xuat_buoc_duyet; d public.de_xuat; v_tiep int; v_hien int;
begin
  select * into s from public.de_xuat_buoc_duyet where id = p_buoc;
  if not found then raise exception 'Không tìm thấy bước duyệt.'; end if;
  select * into d from public.de_xuat where id = s.de_xuat_id for update;
  if d.trang_thai <> 'cho_duyet' then raise exception 'Đề xuất không ở trạng thái chờ duyệt.'; end if;
  select min(thu_tu) into v_hien from public.de_xuat_buoc_duyet where de_xuat_id = d.id and trang_thai = 'cho';
  if s.trang_thai <> 'cho' or s.thu_tu <> v_hien then raise exception 'Bước này không còn là bước đang chờ duyệt.'; end if;
  update public.de_xuat_buoc_duyet set trang_thai = 'da_duyet', nguoi_id = p_nguoi, luc = now(), duyet_thay = p_thay, ghi_chu = nullif(p_ghi_chu, '') where id = s.id;
  select min(thu_tu) into v_tiep from public.de_xuat_buoc_duyet where de_xuat_id = d.id and trang_thai = 'cho';
  if v_tiep is null then
    update public.de_xuat set trang_thai = 'da_duyet', nguoi_duyet_id = p_nguoi, duyet_luc = now(), ly_do = null where id = d.id;
  else
    update public.de_xuat_buoc_duyet set han_xu_ly = public.hom_nay() + sla_ngay where de_xuat_id = d.id and thu_tu = v_tiep;
  end if;
end $$;

create function public.tu_choi_buoc_de_xuat(p_buoc uuid, p_nguoi uuid, p_thay boolean, p_ly_do text) returns void language plpgsql as $$
declare s public.de_xuat_buoc_duyet; d public.de_xuat; v_hien int;
begin
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Nhập lý do từ chối.'; end if;
  select * into s from public.de_xuat_buoc_duyet where id = p_buoc;
  if not found then raise exception 'Không tìm thấy bước duyệt.'; end if;
  select * into d from public.de_xuat where id = s.de_xuat_id for update;
  if d.trang_thai <> 'cho_duyet' then raise exception 'Đề xuất không ở trạng thái chờ duyệt.'; end if;
  select min(thu_tu) into v_hien from public.de_xuat_buoc_duyet where de_xuat_id = d.id and trang_thai = 'cho';
  if s.trang_thai <> 'cho' or s.thu_tu <> v_hien then raise exception 'Bước này không còn là bước đang chờ duyệt.'; end if;
  update public.de_xuat_buoc_duyet set trang_thai = 'tu_choi', nguoi_id = p_nguoi, luc = now(), duyet_thay = p_thay, ghi_chu = p_ly_do where id = s.id;
  update public.de_xuat set trang_thai = 'tu_choi', nguoi_duyet_id = p_nguoi, duyet_luc = now(), ly_do = p_ly_do where id = d.id;
end $$;

revoke all on function public.tao_buoc_duyet(uuid), public.duyet_buoc_de_xuat(uuid, uuid, boolean, text), public.tu_choi_buoc_de_xuat(uuid, uuid, boolean, text) from public, anon, authenticated;

-- Chi tiền: người chi không được là BẤT KỲ người duyệt nào của đề xuất (trước đây chỉ so với người duyệt cuối).
create or replace function public.chi_theo_de_xuat(p_de_xuat uuid, p_quy uuid, p_loai_thu_chi uuid, p_ngay date, p_nguoi uuid, p_bo_qua_kiem boolean default false) returns void language plpgsql as $$
declare d public.de_xuat; g public.de_xuat; v_quy uuid; v_lt uuid; v_ma text; v_id uuid; v_ten text; v_chenh bigint; v_tien bigint; v_huong text;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if d.loai = 'mua_sam' then raise exception 'Đề xuất mua sắm không chi trực tiếp — hãy lập đơn mua.'; end if;
  if d.trang_thai <> 'da_duyet' then raise exception 'Đề xuất chưa được duyệt hoặc đã thực hiện.'; end if;
  if not p_bo_qua_kiem and (d.nguoi_duyet_id = p_nguoi or exists (select 1 from public.de_xuat_buoc_duyet where de_xuat_id = d.id and nguoi_id = p_nguoi and trang_thai = 'da_duyet')) then
    raise exception 'Người duyệt không tự thực hiện chi cùng đề xuất.';
  end if;
  select id into v_quy from public.quy where id = p_quy and hoat_dong and chi_nhanh_id = d.chi_nhanh_id;
  if v_quy is null then raise exception 'Quỹ không hợp lệ cho chi nhánh của đề xuất.'; end if;
  select ho_ten into v_ten from public.nhan_vien where id = d.nguoi_gui_id;
  v_tien := d.so_tien; v_huong := 'chi';
  if d.loai = 'hoan_ung' then
    select * into g from public.de_xuat where id = d.de_xuat_goc_id;
    if g.trang_thai <> 'da_thuc_hien' or g.loai <> 'tam_ung' or g.loai_tam_ung <> 'chi_phi' then raise exception 'Chỉ hoàn ứng cho tạm ứng chi phí đã chi.'; end if;
    v_chenh := d.so_tien - g.so_tien;
    v_tien := abs(v_chenh);
    v_huong := case when v_chenh > 0 then 'chi' else 'thu' end;
  end if;
  if v_tien > 0 then
    if v_huong = 'chi' then
      if d.loai = 'hoan_khach' then select id into v_lt from public.loai_thu_chi where ten = 'Hoàn tiền khách';
      elsif d.loai = 'tam_ung' and d.loai_tam_ung = 'luong' then select id into v_lt from public.loai_thu_chi where ten like 'Chi phí nhân sự%' limit 1;
      else select id into v_lt from public.loai_thu_chi where id = p_loai_thu_chi and huong = 'chi' and hoat_dong and not he_thong; end if;
    else
      select id into v_lt from public.loai_thu_chi where ten = 'Thu khác';
    end if;
    if v_lt is null then raise exception 'Phân loại không hợp lệ.'; end if;
    v_ma := (case v_huong when 'chi' then 'PC' else 'PT' end) || lpad(public.so_tiep_theo('so_quy_' || (case v_huong when 'chi' then 'PC' else 'PT' end))::text, 6, '0');
    insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguoi_id)
      values (v_ma, p_ngay, v_quy, v_huong, v_tien, v_lt,
        (case d.loai when 'tam_ung' then (case d.loai_tam_ung when 'luong' then 'Tạm ứng lương: ' else 'Tạm ứng chi phí: ' end) when 'hoan_ung' then 'Hoàn ứng ' || d.ma || ': ' when 'hoan_khach' then 'Hoàn trả khách: ' else 'Thanh toán: ' end) || d.tieu_de,
        coalesce(d.doi_tuong, v_ten), p_nguoi)
      returning id into v_id;
  end if;
  update public.de_xuat set trang_thai = 'da_thuc_hien', so_quy_id = v_id where id = d.id;
end $$;

select public.khoa_tat_ca_bang();
