-- 0280 — VAI TRÒ THEO TỪNG CHI NHÁNH (như SalonHero #/staff "Quyền chi nhánh": mỗi chi nhánh một vai hoặc "Không có quyền").
-- Mô hình: nhan_vien.chi_nhanh_id + nhan_vien.vai_tro vẫn là CHI NHÁNH CHÍNH và vai ở đó (HR, chấm công, đồng bộ đêm, thông báo đẩy... đọc như cũ).
--   - chi_nhanh_id NULL = mọi chi nhánh, một vai (như cũ). Bảng dưới bị bỏ qua.
--   - chi_nhanh_id có giá trị = chỉ vào được chi nhánh chính + các chi nhánh THÊM ghi ở bảng dưới, mỗi nơi một vai.
-- Không chép dòng nào cho người hiện có: ai chưa có dòng thêm thì hành vi KHÔNG ĐỔI (một chi nhánh, vai cũ).
-- Chủ / Kỹ thuật không gán theo chi nhánh (luôn theo hồ sơ chính; để "Mọi chi nhánh" thì thấy mọi chi nhánh như cũ).
create table public.nhan_vien_chi_nhanh (
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  chi_nhanh_id uuid not null references public.chi_nhanh (id) on delete cascade,
  vai_tro text not null check (vai_tro in ('quan_ly', 'nhan_su', 'le_tan', 'thu_ngan', 'tu_van', 'bac_si', 'ktv', 'thu_kho', 'ke_toan', 'marketing', 'nha_dau_tu', 'nhan_vien')),
  nguoi_sua_id uuid references public.nhan_vien (id) on delete set null,
  cap_nhat_luc timestamptz not null default now(),
  primary key (nhan_vien_id, chi_nhanh_id)
);
create index nhan_vien_chi_nhanh_cn_idx on public.nhan_vien_chi_nhanh (chi_nhanh_id);
comment on table public.nhan_vien_chi_nhanh is 'Vai trò của một người ở chi nhánh THÊM (ngoài chi nhánh chính nhan_vien.chi_nhanh_id). Người có chi_nhanh_id NULL (mọi chi nhánh) hoặc Chủ/Kỹ thuật: bảng này bị bỏ qua.';

-- Vai hiệu lực của một người tại một chi nhánh (NULL = không có quyền ở đó). Cùng luật với src/lib/vai-chi-nhanh.ts.
create function public.vai_tai_chi_nhanh(p_nv uuid, p_cn uuid) returns text language sql stable as $$
  select case
    when n.id is null or not n.hoat_dong then null
    when n.chi_nhanh_id is null or n.chi_nhanh_id = p_cn then n.vai_tro
    when n.vai_tro in ('chu', 'ky_thuat') then null
    else (select g.vai_tro from public.nhan_vien_chi_nhanh g where g.nhan_vien_id = n.id and g.chi_nhanh_id = p_cn)
  end
  from (select 1) d left join public.nhan_vien n on n.id = p_nv;
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
