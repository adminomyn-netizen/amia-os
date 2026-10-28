-- 0052 — Sửa 0051: danh sách mã cảnh báo của chuông phải gồm cả 'tdyc', 'tduv', 'tdtin' (tuyển dụng, từ 0047) cùng 'knai', 'bchung' (khiếu nại, biến chứng).
alter table public.thong_bao_trang_thai drop constraint thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam', 'tonam', 'tdyc', 'tduv', 'tdtin', 'knai', 'bchung'));
