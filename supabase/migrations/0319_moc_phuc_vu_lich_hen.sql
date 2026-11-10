-- Quá giờ dịch vụ (chị Lâm 10/11/2026): tự ghi mốc BẮT ĐẦU LÀM và mốc HOÀN THÀNH của lịch hẹn tạo trong AMIA OS,
-- để chuông "quá giờ" biết ca đã làm bao lâu và báo cáo "Thời gian dịch vụ" có số thực tế.
-- Cột bat_dau_lam_luc / hoan_thanh_luc đã có từ 0055 (SalonHero) nhưng app chưa ghi. Chỉ THÊM trigger + chỉ mục, không đổi dữ liệu cũ.
--  · chuyển sang 'dang_phuc_vu'  → bat_dau_lam_luc = now(), xoá hoan_thanh_luc (mở lại ca thì tính lại từ đầu)
--  · chuyển sang 'hoan_thanh'    → hoan_thanh_luc = now()
--  · 'dang_phuc_vu' → 'cho_phuc_vu' (bấm nhầm mở ca) → bỏ mốc bắt đầu
-- Câu lệnh tự đặt giá trị cho cột (vd đồng bộ SalonHero) thì giữ nguyên; lịch lịch sử SalonHero (la_lich_su / nhap_dot) không đụng tới.
-- Trigger riêng, không sửa trg_lich_hen_khoa_ca (0310).
create or replace function public.trg_lich_hen_moc_phuc_vu() returns trigger language plpgsql as $$
begin
  if new.la_lich_su or new.nhap_dot is not null or new.trang_thai is not distinct from old.trang_thai then
    return new;
  end if;
  if new.trang_thai = 'dang_phuc_vu' then
    if new.bat_dau_lam_luc is not distinct from old.bat_dau_lam_luc then new.bat_dau_lam_luc := now(); end if;
    if new.hoan_thanh_luc is not distinct from old.hoan_thanh_luc then new.hoan_thanh_luc := null; end if;
  elsif new.trang_thai = 'hoan_thanh' then
    if new.hoan_thanh_luc is not distinct from old.hoan_thanh_luc then new.hoan_thanh_luc := now(); end if;
  elsif new.trang_thai = 'cho_phuc_vu' and old.trang_thai = 'dang_phuc_vu' then
    if new.bat_dau_lam_luc is not distinct from old.bat_dau_lam_luc then new.bat_dau_lam_luc := null; end if;
  end if;
  return new;
end $$;

drop trigger if exists lich_hen_moc_phuc_vu on public.lich_hen;
create trigger lich_hen_moc_phuc_vu before update of trang_thai on public.lich_hen
  for each row execute function public.trg_lich_hen_moc_phuc_vu();

-- Chuông quá giờ hỏi "ca đang làm của chi nhánh" — chỉ mục nhỏ, chỉ chứa lịch app đang phục vụ.
create index if not exists lich_hen_dang_phuc_vu_idx on public.lich_hen (chi_nhanh_id, bat_dau)
  where trang_thai = 'dang_phuc_vu' and not la_lich_su;

select public.khoa_tat_ca_bang();
