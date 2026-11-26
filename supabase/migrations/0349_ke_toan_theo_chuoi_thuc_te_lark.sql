-- 0349 — Chuỗi duyệt chỉnh theo 25 phiếu THẬT trên Lark Approval (báo cáo kiểm kê 26/11/2026) và các bước sau duyệt của Base FIN-RPO-01-2026:
-- xếp lịch chi · Thủ quỹ lên lệnh chi · Kế toán tổng hợp điền bút toán Nợ/Có rồi đóng hồ sơ · trả về "Cần bổ sung chứng từ" + gửi lại lần N.
-- Người duyệt vẫn ghi theo chức danh (không gán người thật); chỉ anh Nam sửa chuỗi (xem 0348).

-- Chức danh tài chính thêm: Kế toán tổng hợp, Kế toán viên.
alter table public.nhan_vien drop constraint if exists nhan_vien_chuc_danh_tai_chinh_check;
alter table public.nhan_vien add constraint nhan_vien_chuc_danh_tai_chinh_check check (chuc_danh_tai_chinh is null or chuc_danh_tai_chinh in
  ('ke_toan_truong', 'ke_toan_tong_hop', 'ke_toan_vien', 'ke_toan_thu', 'ke_toan_chi', 'ke_toan_vat_tu', 'thu_quy', 'giam_doc_cong_ty', 'giam_doc_chi_nhanh'));

-- Chuỗi mặc định theo phiếu thật: QL chi nhánh → KT tổng hợp → KTT → Giám đốc (CHỈ từ ngưỡng; phiếu dưới ngưỡng bỏ bước này).
delete from public.quy_trinh_duyet_buoc where quy_trinh_ma in ('thanh_toan', 'tam_ung', 'hoan_ung', 'hoan_khach', 'mua_sam');
insert into public.quy_trinh_duyet_buoc (quy_trinh_ma, thu_tu, ten, nguoi_duyet_loai, nguoi_duyet_gia_tri, du_phong_vai_tro, nguong_quy_tac, kiem_han_muc, sla_ngay)
select q.ma, b.thu_tu, b.ten, b.loai, b.gia_tri, b.du_phong, b.nguong, b.han_muc, 1
from public.quy_trinh_duyet q
join (values
  (1, 'Quản lý chi nhánh xác nhận', 'quan_ly_chi_nhanh', null, '{}'::text[], null, false),
  (2, 'Kế toán tổng hợp kiểm tra hồ sơ', 'chuc_danh', 'ke_toan_tong_hop', '{ke_toan}'::text[], null, false),
  (3, 'Kế toán trưởng duyệt', 'chuc_danh', 'ke_toan_truong', '{ke_toan}'::text[], null, true),
  (4, 'Giám đốc duyệt (từ ngưỡng)', 'chuc_danh', 'giam_doc_cong_ty', '{chu}'::text[], 'chi_giam_doc', true)
) as b (thu_tu, ten, loai, gia_tri, du_phong, nguong, han_muc) on q.ma in ('thanh_toan', 'tam_ung', 'hoan_ung');
insert into public.quy_trinh_duyet_buoc (quy_trinh_ma, thu_tu, ten, nguoi_duyet_loai, nguoi_duyet_gia_tri, du_phong_vai_tro, kiem_han_muc, sla_ngay) values
  ('hoan_khach', 1, 'Quản lý chi nhánh xác nhận', 'quan_ly_chi_nhanh', null, '{}', false, 1),
  ('hoan_khach', 2, 'Kế toán thu đối soát', 'chuc_danh', 'ke_toan_thu', '{ke_toan}', false, 1),
  ('hoan_khach', 3, 'Kế toán tổng hợp kiểm tra', 'chuc_danh', 'ke_toan_tong_hop', '{ke_toan}', false, 1),
  ('hoan_khach', 4, 'Kế toán trưởng kiểm tra', 'chuc_danh', 'ke_toan_truong', '{ke_toan}', true, 1),
  ('hoan_khach', 5, 'Giám đốc duyệt', 'chuc_danh', 'giam_doc_cong_ty', '{chu}', true, 1),
  ('mua_sam', 1, 'Quản lý chi nhánh xác nhận', 'quan_ly_chi_nhanh', null, '{}', false, 1),
  ('mua_sam', 2, 'Kế toán tổng hợp kiểm tra', 'chuc_danh', 'ke_toan_tong_hop', '{ke_toan}', false, 1),
  ('mua_sam', 3, 'Kế toán trưởng duyệt', 'chuc_danh', 'ke_toan_truong', '{ke_toan}', true, 1),
  ('mua_sam', 4, 'Giám đốc duyệt', 'chuc_danh', 'giam_doc_cong_ty', '{chu}', true, 1);

-- Trạng thái mới: cần bổ sung chứng từ (trả về người lập, gửi lại lần N); bước "trả về".
alter table public.de_xuat drop constraint if exists de_xuat_trang_thai_check;
alter table public.de_xuat add constraint de_xuat_trang_thai_check check (trang_thai in ('cho_duyet', 'can_bo_sung', 'da_duyet', 'da_thuc_hien', 'tu_choi', 'huy'));
alter table public.de_xuat_buoc_duyet drop constraint if exists de_xuat_buoc_duyet_trang_thai_check;
alter table public.de_xuat_buoc_duyet add constraint de_xuat_buoc_duyet_trang_thai_check check (trang_thai in ('cho', 'da_duyet', 'tu_choi', 'tra_ve'));

-- Trường của phiếu Lark còn thiếu + bước sau duyệt.
alter table public.de_xuat
  add column khoan_chi text,
  add column hinh_thuc_chi text check (hinh_thuc_chi is null or hinh_thuc_chi in ('chuyen_khoan', 'tien_mat', 'tien_mat_quy')),
  add column phan_loai_vat text check (phan_loai_vat is null or phan_loai_vat in ('co_vat', 'khong_vat', 'chua_ro')),
  add column hang_muc jsonb,
  add column but_toan jsonb,
  add column ngay_du_kien_chi date,
  add column dong_ho_so_luc timestamptz,
  add column nguoi_dong_ho_so_id uuid references public.nhan_vien (id),
  add column lan_gui int not null default 1;

-- Danh mục tài khoản kế toán (Thông tư 133) để chọn khi điền bút toán. Chỉ là danh mục tra cứu, chưa ràng buộc nghiệp vụ nào.
create table public.tai_khoan_ke_toan (
  so_hieu text primary key,
  ten text not null,
  nhom text not null,
  hoat_dong boolean not null default true
);
insert into public.tai_khoan_ke_toan (so_hieu, ten, nhom) values
  ('111', 'Tiền mặt', 'Tiền'), ('112', 'Tiền gửi ngân hàng', 'Tiền'),
  ('131', 'Phải thu của khách hàng', 'Phải thu'), ('138', 'Phải thu khác', 'Phải thu'), ('141', 'Tạm ứng', 'Tạm ứng'),
  ('211', 'Tài sản cố định hữu hình', 'Tài sản'), ('242', 'Chi phí chờ phân bổ', 'Tài sản'),
  ('311', 'Vay và nợ thuê tài chính', 'Phải trả'), ('331', 'Phải trả cho người bán', 'Phải trả'), ('333', 'Thuế và các khoản phải nộp Nhà nước', 'Thuế'),
  ('334', 'Phải trả người lao động', 'Phải trả'), ('338', 'Phải trả, phải nộp khác', 'Phải trả'),
  ('511', 'Doanh thu bán hàng và cung cấp dịch vụ', 'Doanh thu'), ('611', 'Mua hàng', 'Chi phí'), ('641', 'Chi phí bán hàng', 'Chi phí'), ('642', 'Chi phí quản lý doanh nghiệp', 'Chi phí');

-- Lịch sử mỗi đề xuất (duyệt, từ chối, trả về, gửi lại, bút toán, đóng hồ sơ).
create table public.de_xuat_lich_su (
  id uuid primary key default gen_random_uuid(),
  de_xuat_id uuid not null references public.de_xuat (id) on delete cascade,
  luc timestamptz not null default now(),
  nguoi_id uuid references public.nhan_vien (id),
  hanh_dong text not null,
  buoc_ten text,
  ghi_chu text
);
create index de_xuat_lich_su_dx_idx on public.de_xuat_lich_su (de_xuat_id, luc);

-- Duyệt bước: bước cuối xong thì tự xếp lịch chi (như workflow 6.3/6.4 của Lark): ngày dự kiến chi = ngày cần chi, thiếu thì ngày mai.
create or replace function public.duyet_buoc_de_xuat(p_buoc uuid, p_nguoi uuid, p_thay boolean, p_ghi_chu text) returns void language plpgsql as $$
declare s public.de_xuat_buoc_duyet; d public.de_xuat; v_tiep int; v_hien int;
begin
  select * into s from public.de_xuat_buoc_duyet where id = p_buoc;
  if not found then raise exception 'Không tìm thấy bước duyệt.'; end if;
  select * into d from public.de_xuat where id = s.de_xuat_id for update;
  if d.trang_thai <> 'cho_duyet' then raise exception 'Đề xuất không ở trạng thái chờ duyệt.'; end if;
  select min(thu_tu) into v_hien from public.de_xuat_buoc_duyet where de_xuat_id = d.id and trang_thai = 'cho';
  if s.trang_thai <> 'cho' or s.thu_tu <> v_hien then raise exception 'Bước này không còn là bước đang chờ duyệt.'; end if;
  update public.de_xuat_buoc_duyet set trang_thai = 'da_duyet', nguoi_id = p_nguoi, luc = now(), duyet_thay = p_thay, ghi_chu = nullif(p_ghi_chu, '') where id = s.id;
  insert into public.de_xuat_lich_su (de_xuat_id, nguoi_id, hanh_dong, buoc_ten, ghi_chu) values (d.id, p_nguoi, case when p_thay then 'duyet_thay' else 'duyet' end, s.ten, nullif(p_ghi_chu, ''));
  select min(thu_tu) into v_tiep from public.de_xuat_buoc_duyet where de_xuat_id = d.id and trang_thai = 'cho';
  if v_tiep is null then
    update public.de_xuat set trang_thai = 'da_duyet', nguoi_duyet_id = p_nguoi, duyet_luc = now(), ly_do = null,
      ngay_du_kien_chi = greatest(coalesce(d.ngay_can_chi, public.hom_nay() + 1), public.hom_nay()) where id = d.id;
  else
    update public.de_xuat_buoc_duyet set han_xu_ly = public.hom_nay() + sla_ngay where de_xuat_id = d.id and thu_tu = v_tiep;
  end if;
end $$;

create or replace function public.tu_choi_buoc_de_xuat(p_buoc uuid, p_nguoi uuid, p_thay boolean, p_ly_do text) returns void language plpgsql as $$
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
  insert into public.de_xuat_lich_su (de_xuat_id, nguoi_id, hanh_dong, buoc_ten, ghi_chu) values (d.id, p_nguoi, 'tu_choi', s.ten, p_ly_do);
end $$;

-- Trả về "Cần bổ sung chứng từ": người lập sửa rồi gửi lại, chuỗi duyệt chạy lại từ bước đầu (lần gửi + 1).
create function public.tra_ve_bo_sung_buoc(p_buoc uuid, p_nguoi uuid, p_thay boolean, p_ly_do text) returns void language plpgsql as $$
declare s public.de_xuat_buoc_duyet; d public.de_xuat; v_hien int;
begin
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Nhập lý do cần bổ sung.'; end if;
  select * into s from public.de_xuat_buoc_duyet where id = p_buoc;
  if not found then raise exception 'Không tìm thấy bước duyệt.'; end if;
  select * into d from public.de_xuat where id = s.de_xuat_id for update;
  if d.trang_thai <> 'cho_duyet' then raise exception 'Đề xuất không ở trạng thái chờ duyệt.'; end if;
  select min(thu_tu) into v_hien from public.de_xuat_buoc_duyet where de_xuat_id = d.id and trang_thai = 'cho';
  if s.trang_thai <> 'cho' or s.thu_tu <> v_hien then raise exception 'Bước này không còn là bước đang chờ duyệt.'; end if;
  update public.de_xuat_buoc_duyet set trang_thai = 'tra_ve', nguoi_id = p_nguoi, luc = now(), duyet_thay = p_thay, ghi_chu = p_ly_do where id = s.id;
  update public.de_xuat set trang_thai = 'can_bo_sung', ly_do = p_ly_do where id = d.id;
  insert into public.de_xuat_lich_su (de_xuat_id, nguoi_id, hanh_dong, buoc_ten, ghi_chu) values (d.id, p_nguoi, 'tra_ve', s.ten, p_ly_do);
end $$;

create function public.gui_lai_de_xuat(p_de_xuat uuid, p_nguoi uuid, p_noi_dung text, p_link text, p_ghi_chu text) returns void language plpgsql as $$
declare d public.de_xuat;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if d.nguoi_gui_id <> p_nguoi then raise exception 'Chỉ người lập được gửi lại đề xuất.'; end if;
  if d.trang_thai <> 'can_bo_sung' then raise exception 'Đề xuất không ở trạng thái cần bổ sung.'; end if;
  update public.de_xuat_buoc_duyet set trang_thai = 'cho', nguoi_id = null, luc = null, ghi_chu = null, duyet_thay = false, han_xu_ly = null where de_xuat_id = d.id;
  update public.de_xuat_buoc_duyet set han_xu_ly = public.hom_nay() + sla_ngay where de_xuat_id = d.id and thu_tu = (select min(thu_tu) from public.de_xuat_buoc_duyet where de_xuat_id = d.id);
  update public.de_xuat set trang_thai = 'cho_duyet', ly_do = null, lan_gui = lan_gui + 1,
    noi_dung = coalesce(nullif(p_noi_dung, ''), noi_dung), link_dinh_kem = coalesce(nullif(p_link, ''), link_dinh_kem) where id = d.id;
  insert into public.de_xuat_lich_su (de_xuat_id, nguoi_id, hanh_dong, ghi_chu) values (d.id, p_nguoi, 'gui_lai', nullif(p_ghi_chu, ''));
end $$;

-- Đóng hồ sơ: sau khi đã chi, Kế toán tổng hợp xác nhận đủ chứng từ + bút toán. Thanh toán / tạm ứng / hoàn ứng bắt buộc có bút toán (QT-DL-04).
create function public.dong_ho_so_de_xuat(p_de_xuat uuid, p_nguoi uuid) returns void language plpgsql as $$
declare d public.de_xuat;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if d.trang_thai <> 'da_thuc_hien' then raise exception 'Chỉ đóng hồ sơ sau khi đã chi.'; end if;
  if d.dong_ho_so_luc is not null then raise exception 'Hồ sơ đã đóng.'; end if;
  if d.loai in ('thanh_toan', 'tam_ung', 'hoan_ung') and d.but_toan is null then raise exception 'Chưa có bút toán Nợ/Có. Điền bút toán trước khi đóng hồ sơ.'; end if;
  update public.de_xuat set dong_ho_so_luc = now(), nguoi_dong_ho_so_id = p_nguoi where id = d.id;
  insert into public.de_xuat_lich_su (de_xuat_id, nguoi_id, hanh_dong) values (d.id, p_nguoi, 'dong_ho_so');
end $$;

revoke all on function public.tra_ve_bo_sung_buoc(uuid, uuid, boolean, text), public.gui_lai_de_xuat(uuid, uuid, text, text, text), public.dong_ho_so_de_xuat(uuid, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
