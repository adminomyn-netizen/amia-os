-- 0054 — Chat nổi: nhờ sửa app đi qua nhánh riêng rồi mới "Duyệt đưa lên" (loại 'duyet'). Cả hai chỉ Chủ và Kỹ thuật làm được (khoá theo vai trò chụp lúc gửi).
alter table public.chat_tin drop constraint chat_tin_loai_check;
alter table public.chat_tin add constraint chat_tin_loai_check check (loai in ('hoi', 'sua', 'duyet'));
alter table public.chat_tin drop constraint chat_tin_sua_chi_chu_va_ky_thuat;
alter table public.chat_tin add constraint chat_tin_sua_chi_chu_va_ky_thuat check (loai = 'hoi' or vai = 'agent' or vai_tro_chup in ('chu', 'ky_thuat'));
alter table public.chat_tin add column nhanh_sua text, add column da_duyet_luc timestamptz;
select public.khoa_tat_ca_bang();
