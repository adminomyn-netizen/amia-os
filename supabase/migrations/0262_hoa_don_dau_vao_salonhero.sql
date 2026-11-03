-- Hoá đơn đầu vào làm y SalonHero (#/expense-invoice, đợt 3 mục 130–133, 03/11/2026):
--   • Form SalonHero: Ngày HĐ, Tại chi nhánh, Ký hiệu, Số HĐ, Mã số thuế (+ Tra cứu MST), Nhà cung cấp, Địa chỉ, Số điện thoại, Email,
--     Tổng số tiền, Tiền thuế, Thuế suất (10% / 8% / 5% / 0% / KCT / KKKNT), Mã tra cứu, Link tra cứu, Ghi chú, File (PDF, XML, Zip).
--   • Danh sách: Ngày HĐ, NCC, MST, Ký hiệu/Số HĐ, Mã tra cứu, Tổng tiền, Tiền thuế, Thuế suất, Ghi chú, Ngày cập nhật, Tải về.
--   • Lọc chi nhánh + tìm tên công ty/MST + khoảng ngày HĐ; 2 ô tổng (Tổng tiền thuế VAT, Tổng tiền hoá đơn).
-- Bảng hoa_don_dau_vao chỉ app ghi (đồng bộ đêm không đụng). Mọi cột mới đều cho phép trống, không đổi ràng buộc cũ.

alter table public.hoa_don_dau_vao
  add column if not exists chi_nhanh_id uuid references public.chi_nhanh(id),
  add column if not exists thue_suat text check (thue_suat is null or thue_suat in ('10', '8', '5', '0', 'KCT', 'KKKNT')),
  add column if not exists ma_tra_cuu text,
  add column if not exists link_tra_cuu text check (link_tra_cuu is null or link_tra_cuu ~ '^https?://'),
  add column if not exists tep_duong_dan text,
  add column if not exists tep_ten text,
  add column if not exists cap_nhat_luc timestamptz not null default now();

create index if not exists hoa_don_dau_vao_ngay_idx on public.hoa_don_dau_vao (ngay_hd desc, tao_luc desc);
create index if not exists idx_fk_hoa_don_dau_vao_chi_nhanh_id on public.hoa_don_dau_vao (chi_nhanh_id);

-- Ngày cập nhật tự đổi khi sửa dòng.
create or replace function public.hddv_cap_nhat_luc() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.cap_nhat_luc := now(); return new; end $$;
drop trigger if exists hoa_don_dau_vao_cap_nhat on public.hoa_don_dau_vao;
create trigger hoa_don_dau_vao_cap_nhat before update on public.hoa_don_dau_vao for each row execute function public.hddv_cap_nhat_luc();

-- Kho tệp riêng tư cho tệp hoá đơn (PDF, XML, Zip), tối đa 10 MB; tải về qua máy chủ có kiểm quyền (link ký 60 giây).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('hoa-don-dau-vao', 'hoa-don-dau-vao', false, 10485760, array['application/pdf', 'application/xml', 'text/xml', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream'])
    on conflict (id) do update set public = false, file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf', 'application/xml', 'text/xml', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream'];
  end if;
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
