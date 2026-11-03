-- Chuông thông báo: nút "Tắt tiếng" của từng người dùng (chỉ tắt âm/rung trên thiết bị của chính người đó;
-- thông báo vẫn hiện, thông báo đẩy của người khác không đổi). Thuần thêm cột.
alter table public.nhan_vien add column if not exists tat_tieng_thong_bao boolean not null default false;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
