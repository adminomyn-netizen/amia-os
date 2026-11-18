-- 0341 — HỘP THƯ LẤY TIN MESSENGER QUA PANCAKE (chị Lâm 18/11/2026: "kết nối tới facebook meta suite để lấy tin nhắn về đây cho dễ theo dõi").
-- Tin fanpage AMIA kéo từ API công khai Pancake (scripts/pancake/dong-bo-hop-thu.mjs, chạy trên Mac theo lịch). CHỈ ĐỌC: trả lời khách vẫn làm trên Pancake.
-- Chỉ THÊM cột, không đổi dữ liệu cũ, không đụng tiền / thẻ / kho.
set lock_timeout = '4s';

-- nguon: 'pancake' = hội thoại đồng bộ từ Pancake (ma_ngoai = mã hội thoại Pancake); null = webhook trực tiếp (sau này).
alter table public.hop_thu_hoi_thoai add column if not exists nguon text check (nguon is null or nguon in ('pancake'));
-- SĐT khách để lại trong hội thoại (số gần nhất, đã chuẩn 0xxxxxxxxx) — để gắn hồ sơ khách.
alter table public.hop_thu_hoi_thoai add column if not exists sdt text check (sdt is null or sdt ~ '^0[0-9]{9,10}$');

-- Mã tin bên ngoài để đồng bộ lại nhiều lần không chép trùng.
alter table public.hop_thu_tin add column if not exists ma_ngoai text check (ma_ngoai is null or char_length(ma_ngoai) between 1 and 300);
create unique index if not exists hop_thu_tin_ma_ngoai_uq on public.hop_thu_tin (hoi_thoai_id, ma_ngoai) where ma_ngoai is not null;
