-- 0044 — TỔNG HỢP HIỆU SUẤT TUẦN / THÁNG / NĂM
-- Mỗi kỳ một dòng (Thứ Hai: tuần trước · ngày 1: tháng trước · 1/1: năm trước), do /api/cron/nhac-cham-cong ghi một lần rồi báo qua chuông và thông báo đẩy.
-- Chuông thêm ba loại: tomtat_tuan, tomtat_thang, tomtat_nam (mỗi loại một dòng trạng thái đã đọc).
create table public.tong_hop_hieu_suat (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('tuan', 'thang', 'nam')),
  ky text not null,
  tieu_de text not null,
  noi_dung text not null,
  chi_tiet jsonb not null default '{}'::jsonb,
  tao_luc timestamptz not null default now(),
  unique (loai, ky)
);

alter table public.thong_bao_trang_thai drop constraint thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam'));

select public.khoa_tat_ca_bang();
