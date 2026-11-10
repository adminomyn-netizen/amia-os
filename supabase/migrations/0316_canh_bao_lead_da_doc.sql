-- Hộp Lead (0313) thêm 2 loại cảnh báo "lead" (lead chưa ai nhận) và "leadnhac" (nhắc việc lead đến giờ) nhưng chưa thêm vào danh sách mã
-- được lưu trạng thái đã đọc → bấm "đã đọc" bị từ chối. Thêm 2 mã, giữ nguyên các mã cũ.
alter table public.thong_bao_trang_thai drop constraint if exists thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam', 'tonam', 'tdyc', 'tduv', 'tdtin', 'knai', 'bchung', 'lead', 'leadnhac'));
