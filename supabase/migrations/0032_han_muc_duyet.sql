-- 0032 — HẠN MỨC DUYỆT, QUY TẮC DUYỆT, HOÀN ỨNG / HOÀN TRẢ KHÁCH (theo SOP tài chính MSC: docs/msc-lark/tai-chinh-cung-ung-quan-ly-viec.md).
-- Hạn mức duyệt là của TỪNG NGƯỜI (null = theo vai trò: Kỹ thuật/Quản lý không giới hạn, vai trò khác 0). Ngưỡng 10 triệu của SOP là tham số
-- ở bảng quy_tac_duyet (đang "chờ xác nhận" vì Base TC-OPS-01 ghi "chưa có số"); người duyệt phải có hạn mức ≥ số tiền đề xuất.
-- Người duyệt không tự thực hiện chi cùng đề xuất (trừ Kỹ thuật). Một khoản tạm ứng ↔ đúng một hoàn ứng; chênh lệch tự thành chi thêm hoặc thu lại.
alter table public.nhan_vien
  add column han_muc_duyet bigint check (han_muc_duyet is null or han_muc_duyet >= 0),
  add column chuc_danh_tai_chinh text check (chuc_danh_tai_chinh is null or chuc_danh_tai_chinh in
    ('ke_toan_truong', 'ke_toan_thu', 'ke_toan_chi', 'ke_toan_vat_tu', 'thu_quy', 'giam_doc_cong_ty', 'giam_doc_chi_nhanh'));

create table public.quy_tac_duyet (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  nguong_tien bigint not null check (nguong_tien >= 0),
  mo_ta text,
  trang_thai text not null default 'cho_xac_nhan' check (trang_thai in ('hieu_luc', 'cho_xac_nhan')),
  cap_nhat_luc timestamptz not null default now()
);
insert into public.quy_tac_duyet (ma, ten, nguong_tien, mo_ta, trang_thai) values
  ('chi_giam_doc', 'Chi cần Giám đốc duyệt từ mức', 10000000, 'Dưới ngưỡng: Kế toán trưởng duyệt cuối. Từ ngưỡng trở lên: Giám đốc duyệt. Chờ chị Lâm chốt vì Base TC-OPS-01 ghi "chưa có số".', 'cho_xac_nhan'),
  ('tu_chi_nho', 'Tự chi trước (đã có chủ trương) dưới mức', 2000000, 'Khoản nhỏ nhân viên tự chi trước rồi xin hoàn, cần phê duyệt chủ trương đính kèm.', 'cho_xac_nhan'),
  ('bao_gia_2', 'Cần ít nhất 2 báo giá từ mức', 20000000, 'Mua hàng trên mức này cần tối thiểu 2 báo giá.', 'hieu_luc'),
  ('bao_gia_3', 'Cần ít nhất 3 báo giá từ mức', 30000000, 'Mua hàng trên mức này cần tối thiểu 3 báo giá.', 'hieu_luc');

alter table public.de_xuat drop constraint if exists de_xuat_loai_check;
alter table public.de_xuat drop constraint if exists de_xuat_check;
alter table public.de_xuat
  add constraint de_xuat_loai_check check (loai in ('mua_sam', 'thanh_toan', 'tam_ung', 'hoan_ung', 'hoan_khach')),
  add constraint de_xuat_tien_check check (loai = 'mua_sam' or so_tien is not null),
  add column ngay_can_chi date,
  add column de_xuat_goc_id uuid references public.de_xuat (id),
  add column ly_do_hoan text;
create unique index de_xuat_hoan_ung_mot on public.de_xuat (de_xuat_goc_id) where de_xuat_goc_id is not null and trang_thai not in ('tu_choi', 'huy');
alter table public.de_xuat add constraint de_xuat_hoan_ung_goc check ((loai = 'hoan_ung') = (de_xuat_goc_id is not null));

-- Thay hàm chi theo đề xuất: thêm cờ bỏ qua kiểm "người duyệt ≠ người chi" (chỉ truyền true cho Kỹ thuật), hỗ trợ hoàn ứng và hoàn trả khách.
drop function public.chi_theo_de_xuat(uuid, uuid, uuid, date, uuid);
create function public.chi_theo_de_xuat(p_de_xuat uuid, p_quy uuid, p_loai_thu_chi uuid, p_ngay date, p_nguoi uuid, p_bo_qua_kiem boolean default false) returns void language plpgsql as $$
declare d public.de_xuat; g public.de_xuat; v_quy uuid; v_lt uuid; v_ma text; v_id uuid; v_ten text; v_chenh bigint; v_tien bigint; v_huong text;
begin
  select * into d from public.de_xuat where id = p_de_xuat for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if d.loai = 'mua_sam' then raise exception 'Đề xuất mua sắm không chi trực tiếp — hãy lập đơn mua.'; end if;
  if d.trang_thai <> 'da_duyet' then raise exception 'Đề xuất chưa được duyệt hoặc đã thực hiện.'; end if;
  if not p_bo_qua_kiem and d.nguoi_duyet_id = p_nguoi then raise exception 'Người duyệt không tự thực hiện chi cùng đề xuất.'; end if;
  select id into v_quy from public.quy where id = p_quy and hoat_dong and chi_nhanh_id = d.chi_nhanh_id;
  if v_quy is null then raise exception 'Quỹ không hợp lệ cho chi nhánh của đề xuất.'; end if;
  select ho_ten into v_ten from public.nhan_vien where id = d.nguoi_gui_id;
  v_tien := d.so_tien; v_huong := 'chi';
  if d.loai = 'hoan_ung' then
    select * into g from public.de_xuat where id = d.de_xuat_goc_id;
    if g.trang_thai <> 'da_thuc_hien' or g.loai <> 'tam_ung' then raise exception 'Khoản tạm ứng gốc chưa chi hoặc không hợp lệ.'; end if;
    v_chenh := d.so_tien - g.so_tien;   -- >0: công ty chi thêm; <0: nhân viên hoàn lại; =0: bằng nhau
    v_tien := abs(v_chenh);
    v_huong := case when v_chenh > 0 then 'chi' else 'thu' end;
  end if;
  if v_tien > 0 then
    if v_huong = 'chi' then
      if d.loai = 'hoan_khach' then select id into v_lt from public.loai_thu_chi where ten = 'Hoàn tiền khách';
      else select id into v_lt from public.loai_thu_chi where id = p_loai_thu_chi and huong = 'chi' and hoat_dong and not he_thong; end if;
    else
      select id into v_lt from public.loai_thu_chi where ten = 'Thu khác';
    end if;
    if v_lt is null then raise exception 'Phân loại không hợp lệ.'; end if;
    v_ma := (case v_huong when 'chi' then 'PC' else 'PT' end) || lpad(public.so_tiep_theo('so_quy_' || (case v_huong when 'chi' then 'PC' else 'PT' end))::text, 6, '0');
    insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguoi_id)
      values (v_ma, p_ngay, v_quy, v_huong, v_tien, v_lt,
        (case d.loai when 'tam_ung' then 'Tạm ứng lương: ' when 'hoan_ung' then 'Hoàn ứng ' || d.ma || ': ' when 'hoan_khach' then 'Hoàn trả khách: ' else 'Thanh toán: ' end) || d.tieu_de,
        coalesce(d.doi_tuong, v_ten), p_nguoi)
      returning id into v_id;
  end if;
  update public.de_xuat set trang_thai = 'da_thuc_hien', so_quy_id = v_id where id = d.id;
end $$;
revoke all on function public.chi_theo_de_xuat(uuid, uuid, uuid, date, uuid, boolean) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
