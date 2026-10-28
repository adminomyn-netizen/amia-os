-- [G3] "Nhân viên phục vụ" như SalonHero (#/operators): danh sách người làm dịch vụ có Nhóm nhân viên và cờ "Hiển thị ở trang đặt lịch".
-- Chỉ thêm 3 cột vào nhan_vien (không đổi cột cũ, không đụng đăng nhập):
--   la_phuc_vu     : người này nằm trong danh sách Nhân viên phục vụ. Gán sẵn cho người SalonHero chuyển sang (sh_id) và kỹ thuật viên/bác sĩ đang làm.
--   nhom_nv        : "Nhóm nhân viên" (SalonHero hiện "Nhóm thợ 1" cho mọi người); gán sẵn cho người trong danh sách.
--   hien_dat_lich  : "Hiển thị ở trang đặt lịch" (mặc định hiện, như SalonHero). Trang /dat-lich hiện CHƯA cho chọn người nên cờ này mới chỉ lưu.
alter table public.nhan_vien
  add column if not exists la_phuc_vu boolean not null default false,
  add column if not exists nhom_nv text,
  add column if not exists hien_dat_lich boolean not null default true;

update public.nhan_vien set la_phuc_vu = true, nhom_nv = 'Nhóm thợ 1'
 where not la_phuc_vu and (sh_id is not null or (hoat_dong and vai_tro in ('ktv', 'bac_si')));
