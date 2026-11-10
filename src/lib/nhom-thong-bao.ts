/** Bốn nhóm của chuông thông báo (theo SalonHero: Lịch hẹn / Hoá đơn / Thẻ dịch vụ / Khác).
 * Ánh xạ từ `ma` của cảnh báo AMIA: lịch chưa xác nhận → Lịch hẹn; hoá đơn còn nợ và "hoá đơn chưa về" (đầu vào) quá hạn → Hoá đơn;
 * thẻ liệu trình sắp hết buổi → Thẻ dịch vụ; còn lại (kho, phiếu cấp, văn bản, chấm công, lương, tóm tắt, tuyển dụng, khiếu nại…) → Khác. */
export type NhomThongBao = "lich" | "hoa_don" | "the" | "khac";

export const NHOM_THONG_BAO: { ma: NhomThongBao; nhan: string }[] = [
  { ma: "lich", nhan: "Lịch hẹn" },
  { ma: "hoa_don", nhan: "Hoá đơn" },
  { ma: "the", nhan: "Thẻ dịch vụ" },
  { ma: "khac", nhan: "Khác" },
];

export function nhomCuaThongBao(ma: string): NhomThongBao {
  if (ma === "lich") return "lich";
  if (ma === "no" || ma === "hdv") return "hoa_don";
  if (ma === "the" || ma === "buoicho") return "the";
  return "khac";
}
