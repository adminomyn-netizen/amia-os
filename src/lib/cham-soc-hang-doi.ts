// Danh sách chăm sóc tự sinh (migration 0100): nhãn, trạng thái, chi tiết gợi ý. Dùng được cả ở máy chủ lẫn trình duyệt.

export type MaHang = "nhac_lich" | "khong_den" | "huy_lich" | "sau_dieu_tri" | "dinh_ky" | "sinh_nhat" | "den_khong_mua" | "hen_goi_lai";

/** Các hàng đợi theo thứ tự hiện trên trang. `mota` hiện dưới nhãn để nhân viên hiểu cách tính. */
export const HANG: { ma: MaHang; nhan: string; mota: string }[] = [
  { ma: "nhac_lich", nhan: "Nhắc lịch ngày mai", mota: "Khách có lịch hẹn ngày mai (chưa xác nhận hoặc đã xác nhận): gọi nhắc và xác nhận." },
  { ma: "khong_den", nhan: "Hẹn không đến", mota: "Lịch trong ít ngày gần đây bị ghi \"không đến\" mà khách chưa đặt lại: gọi hỏi lý do, hẹn lại." },
  { ma: "huy_lich", nhan: "Huỷ lịch", mota: "Lịch trong ít ngày gần đây bị huỷ mà khách chưa đặt lại: gọi hẹn lại." },
  { ma: "sau_dieu_tri", nhan: "Sau điều trị", mota: "Khách vừa hoàn thành dịch vụ cách đây N ngày (N chỉnh được): hỏi thăm kết quả, nhắc chăm sóc." },
  { ma: "dinh_ky", nhan: "Định kỳ", mota: "Lần đến cuối đã đúng mốc 1, 3, 6 hoặc 12 tháng và khách chưa có lịch sắp tới: gọi mời quay lại." },
  { ma: "sinh_nhat", nhan: "Sinh nhật", mota: "Khách sinh nhật hôm nay hoặc vài ngày tới: gọi/nhắn chúc mừng." },
  { ma: "den_khong_mua", nhan: "Đến mà không mua", mota: "Khách đã đến (lịch hoàn thành) nhưng không có hoá đơn và không trừ thẻ: gọi hỏi thăm, tư vấn lại." },
  { ma: "hen_goi_lai", nhan: "Hẹn gọi lại", mota: "Khách đã hẹn gọi lại đúng ngày hôm nay hoặc đã quá ngày." },
];
export const MA_HANG = HANG.map((h) => h.ma);
export const laMaHang = (v: unknown): v is MaHang => typeof v === "string" && (MA_HANG as string[]).includes(v);
export const nhanHang = (ma: string) => HANG.find((h) => h.ma === ma)?.nhan ?? ma;

/** Loại gốc của một dòng gọi (hàng "hen_goi_lai" vẫn mang loại gốc của nó). */
export const LOAI_GOC = HANG.filter((h) => h.ma !== "hen_goi_lai").map((h) => h.ma);

export type TrangThaiGoi = "da_lien_lac" | "khong_nghe_may" | "hen_goi_lai" | "tu_choi" | "da_dat_lich";
export const TRANG_THAI_GOI: { ma: TrangThaiGoi; nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }[] = [
  { ma: "da_lien_lac", nhan: "Đã liên lạc", kieu: "tot" },
  { ma: "khong_nghe_may", nhan: "Không nghe máy", kieu: "cho" },
  { ma: "hen_goi_lai", nhan: "Hẹn gọi lại", kieu: "cho" },
  { ma: "tu_choi", nhan: "Từ chối", kieu: "loi" },
  { ma: "da_dat_lich", nhan: "Đã đặt lịch", kieu: "tot" },
];
export const nhanTrangThaiGoi = (ma: string | null | undefined) => TRANG_THAI_GOI.find((t) => t.ma === ma);

/** Chi tiết gợi ý theo trạng thái (chọn một, không bắt buộc). */
export const CHI_TIET_GOI: Record<TrangThaiGoi, string[]> = {
  da_lien_lac: ["Khách xác nhận sẽ đến", "Khách cần suy nghĩ thêm", "Đã tư vấn xong", "Khách hài lòng", "Khách phản hồi chưa tốt"],
  khong_nghe_may: ["Chuông reo không bắt máy", "Máy bận / cúp máy", "Tắt máy / ngoài vùng", "Sai số / thuê bao"],
  hen_goi_lai: ["Khách đang bận", "Khách chờ sắp xếp lịch", "Khách cần hỏi người nhà", "Khách nhờ gọi lại sau"],
  tu_choi: ["Chưa có nhu cầu", "Thấy giá cao", "Đã làm nơi khác", "Không tiện đi lại", "Lý do khác"],
  da_dat_lich: ["Đặt lịch qua điện thoại", "Khách tự đặt lịch", "Đổi sang ngày khác"],
};

/** Số dòng mỗi trang của danh sách chăm sóc (tối đa 50, cũng là giới hạn cứng của hàm ds_cham_soc). */
export const DONG_MOI_TRANG = 50;

/** Mức N ngày gợi ý cho hàng "Sau điều trị". */
export const MOC_SAU_DIEU_TRI = [1, 2, 3, 5, 7, 14, 30];

/** Che số điện thoại khi người xem không có quyền xem SĐT (cùng mẫu báo cáo hoa hồng/xuất hoá đơn: quyền khach.xem). */
export const sdtHienThi = (sdt: string | null | undefined, duocXem: boolean) => (!sdt ? "" : duocXem ? sdt : "•••");
/** Chuẩn số cho liên kết tel: (chỉ chữ số và dấu +). */
export const sdtTel = (sdt: string) => sdt.replace(/[^\d+]/g, "");
