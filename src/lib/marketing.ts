export const TT_LIEN_HE: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  lead_moi: { ten: "Lead mới", kieu: "cho" }, da_lien_he: { ten: "Đã liên hệ", kieu: "cho" }, da_xac_nhan_nhu_cau: { ten: "Đã xác nhận nhu cầu", kieu: "tot" }, hen_goi_lai: { ten: "Hẹn gọi lại", kieu: "cho" },
  da_dat_lich: { ten: "Đã đặt lịch", kieu: "tot" }, khong_nghe_may: { ten: "Không nghe máy", kieu: "cho" }, sai_sdt: { ten: "Sai số điện thoại", kieu: "loi" }, khong_co_nhu_cau: { ten: "Không có nhu cầu", kieu: "tram" },
  khong_phu_hop: { ten: "Không phù hợp", kieu: "tram" }, trung_lead: { ten: "Trùng lead", kieu: "tram" }, da_chuyen_chi_nhanh: { ten: "Đã chuyển chi nhánh", kieu: "tot" }, da_ket_thuc: { ten: "Đã kết thúc", kieu: "tram" },
};
/** Kết quả chọn được khi ghi một lần liên hệ (không gồm lead mới / trùng lead — trùng đánh dấu riêng). */
export const KET_QUA_LIEN_HE = ["da_lien_he", "da_xac_nhan_nhu_cau", "hen_goi_lai", "da_dat_lich", "khong_nghe_may", "sai_sdt", "khong_co_nhu_cau", "khong_phu_hop", "da_chuyen_chi_nhanh", "da_ket_thuc"] as const;
/** Kết thúc lead: bắt buộc ghi lý do chuẩn (SOP: không xoá lead để làm đẹp KPI). */
export const CAN_LY_DO = ["sai_sdt", "khong_co_nhu_cau", "khong_phu_hop", "da_ket_thuc"];
export const TT_PHAN_BO: Record<string, string> = {
  cho_tiep_nhan: "Chờ tiếp nhận", cho_kiem_tra: "Chờ kiểm tra", cho_phan_bo: "Chờ phân bổ", da_phan_bo: "Đã phân bổ", da_xac_nhan: "Đã xác nhận", cho_bo_sung: "Chờ bổ sung", lead_trung: "Lead trùng", khong_hop_le: "Không hợp lệ",
};
export const KENH_LIEN_HE: Record<string, string> = { goi: "Gọi điện", zalo: "Zalo", sms: "SMS", truc_tiep: "Trực tiếp", khac: "Khác" };
export const MUC_TIEU: Record<string, string> = { branding: "Branding", slogan: "Slogan", khuyen_mai: "Khuyến mãi", thong_diep: "Thông điệp" };
export const TT_CHIEN_DICH: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  nhap: { ten: "Nháp", kieu: "tram" }, cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" }, dang_chay: { ten: "Đang chạy", kieu: "tot" }, tam_dung: { ten: "Tạm dừng", kieu: "cho" }, ket_thuc: { ten: "Kết thúc", kieu: "tram" },
};
export const LOAI_NOI_DUNG: Record<string, string> = { video: "Video", bai_viet: "Bài viết", anh: "Ảnh / thiết kế", khac: "Khác" };
export const TT_DUYET_ND: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  nhap: { ten: "Đang làm", kieu: "tram" }, cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" }, chua_dat: { ten: "Chưa đạt", kieu: "loi" },
};
export const LOAI_DOI_TAC: Record<string, string> = { ctv: "Cộng tác viên", khach_cu: "Khách cũ giới thiệu", kol: "KOL / KOC", khac: "Khác" };
/** Quá 5 phút chưa có người xác nhận lead thì vào danh sách cảnh báo (SOP SALES-PROC-01). */
export const PHUT_XAC_NHAN = 5;
