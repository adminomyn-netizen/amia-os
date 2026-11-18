-- 18/11/2026: 4 mục chuông mới (lichonl, phieu-buoi, buoidl, buoithieu) bấm "đã đọc" bị DB từ chối vì check thiếu mã.
-- Thu quyền PUBLIC trên 2 hàm trigger mới (0335, 0338) theo quy ước dự án.
alter table public.thong_bao_trang_thai drop constraint if exists thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam', 'tonam', 'tdyc', 'tduv', 'tdtin', 'knai', 'bchung', 'lead', 'leadnhac', 'buoicho', 'lichonl', 'phieu-buoi', 'buoidl', 'buoithieu'));

revoke all on function public.chan_chi_nhanh_ngung() from public, anon, authenticated;
revoke all on function public.trg_buoi_cho_lam_gan_lich() from public, anon, authenticated;
