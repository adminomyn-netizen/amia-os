// Đánh giá sau điều trị: khách Hài lòng / Không hài lòng + lý do (migration 0106). Khác đánh giá sao từng nhân viên của hoá đơn (0082).
// Tự thiết kế theo mục "đánh giá sau điều trị" của VTTech (chưa đối chiếu giao diện gốc). Không có lý do y khoa: dấu hiệu bất thường đi đường "Báo dấu hiệu bất thường".
import type { Truong } from "@/components/ui/BieuMau";

export const LY_DO_KHONG_HAI_LONG: Record<string, string> = {
  ket_qua: "Kết quả chưa như mong đợi", thai_do: "Thái độ nhân viên", cho_doi: "Chờ đợi lâu", gia: "Giá / chi phí", tu_van: "Tư vấn chưa rõ", ve_sinh: "Không gian / vệ sinh", khac: "Lý do khác",
};
export const KET_QUA_DG: Record<string, { ten: string; kieu: "tot" | "loi" }> = { hai_long: { ten: "Hài lòng", kieu: "tot" }, khong_hai_long: { ten: "Không hài lòng", kieu: "loi" } };

export const truongSauDieuTri = (): Truong[] => [
  { ten: "ket_qua", nhan: "Khách cảm thấy", loai: "chon", batBuoc: true, rong: true, luaChon: Object.entries(KET_QUA_DG).map(([gia_tri, v]) => ({ gia_tri, nhan: v.ten })) },
  { ten: "ly_do", nhan: "Lý do không hài lòng", loai: "chon", batBuoc: true, rong: true, hienKhi: { ten: "ket_qua", la: ["khong_hai_long"] }, luaChon: Object.entries(LY_DO_KHONG_HAI_LONG).map(([gia_tri, nhan]) => ({ gia_tri, nhan })),
    ghiChu: "Chọn Không hài lòng thì hệ thống tự tạo một khiếu nại để quản lý xử lý. Nếu khách có dấu hiệu bất thường sau làm, dùng nút Báo dấu hiệu bất thường." },
  { ten: "ghi_chu", nhan: "Ghi chú thêm", loai: "nhieu_dong", rong: true, goiY: "Khách nói gì (ghi đúng lời khách, ngắn gọn)." },
];
