-- Chị Thúy / chị Lâm 17/11/2026: "làm thế nào chị kiểm soát được nhân sự tích vật tư hay không, lỡ làm mà không tích thì sao".
-- Lúc chuyên viên bấm Kết thúc, ghi lại số bước quy trình (kèm vật tư gợi ý) đã tích / tổng số bước của khách trong ngày.
-- Quản lý thấy chuông + nhãn "Thiếu bước" ở tab Cả chi nhánh hôm nay. null = dịch vụ chưa có quy trình hoặc lượt trước 17/11.
alter table public.buoi_cho_lam add column if not exists buoc_xong smallint, add column if not exists buoc_tong smallint;
create index if not exists buoi_cho_lam_thieu_buoc_idx on public.buoi_cho_lam (chi_nhanh_id, ngay) where buoc_xong < buoc_tong;

-- Quy trình chị Lâm chốt (Flora chuyển 17/11/2026): vật tư cấp TRƯỚC khi làm. Chuyên viên tích "Đã nhận đủ vật tư" thì mới bấm Bắt đầu làm được.
alter table public.buoi_cho_lam add column if not exists vat_tu_luc timestamptz;
