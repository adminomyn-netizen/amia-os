// Hình học dùng chung cho biểu đồ tròn (chạy được cả ở máy chủ lẫn trình duyệt).

/** Điểm trên đường tròn: góc tính từ 12 giờ, theo chiều kim đồng hồ. */
export const toaDo = (tam: number, goc: number, r: number) => [tam + r * Math.sin(goc), tam - r * Math.cos(goc)] as const;

/** Đường vẽ một khúc: rTrong <= 0 là khúc bánh (nhọn về tâm), ngược lại là khúc vòng. */
export function cung(tam: number, a0: number, a1: number, rNgoai: number, rTrong: number) {
  const [x0, y0] = toaDo(tam, a0, rNgoai), [x1, y1] = toaDo(tam, a1, rNgoai), lon = a1 - a0 > Math.PI ? 1 : 0;
  if (rTrong <= 0) return `M${tam} ${tam} L${x0} ${y0} A${rNgoai} ${rNgoai} 0 ${lon} 1 ${x1} ${y1} Z`;
  const [x2, y2] = toaDo(tam, a1, rTrong), [x3, y3] = toaDo(tam, a0, rTrong);
  return `M${x0} ${y0} A${rNgoai} ${rNgoai} 0 ${lon} 1 ${x1} ${y1} L${x2} ${y2} A${rTrong} ${rTrong} 0 ${lon} 0 ${x3} ${y3} Z`;
}

/** Kích thước biểu đồ: "chuan" (hộp 200) dùng ở trang Tổng quan, "mong" (hộp 120, vòng dày 16) dùng ở trang chủ. */
export type HinhTron = {
  vb: number;      // cạnh hộp vẽ (viewBox)
  r: number;       // bán kính ngoài
  rTrong: number;  // bán kính trong (0 = bánh đặc)
  lech: number;    // khúc đang chọn tách ra bao nhiêu
  vien: number;    // nét ngăn giữa các khúc
  px: number;      // cạnh hiển thị (px) để kẹp khung chú thích
  yTam: number; coTam: number; yPhu: number; coPhu: number; // chữ ở tâm vòng
};

export const HINH_CHUAN = (vong: boolean): HinhTron => ({ vb: 200, r: 80, rTrong: vong ? 50 : 0, lech: 6, vien: 2, px: 190, yTam: 102, coTam: 22, yPhu: 120, coPhu: 10 });
export const HINH_MONG: HinhTron = { vb: 120, r: 54, rTrong: 38, lech: 3.5, vien: 0, px: 144, yTam: 58, coTam: 15, yPhu: 74, coPhu: 8.5 };

/** Một khúc đã tính sẵn ở máy chủ (toàn chuỗi/số nên đưa sang thành phần trình duyệt được). */
export type KhucTron = {
  nhan: string;
  mau: string;
  a0: number;
  a1: number;
  tien: string;  // giá trị đầy đủ, dùng trong khung chi tiết
  gon: string;   // giá trị gọn, dùng ở chú giải
  pt: string;    // phần trăm đã làm tròn, vd "85%"
  doc: string;   // câu cho trình đọc màn hình, vd "Tiền mặt: 12.500.000 đ, 45%"
  href?: string; // bấm tên ở chú giải thì mở chi tiết
};

/** Làm tròn phần trăm một kiểu cho khung chi tiết, chú giải và trình đọc: ≥10% lấy số nguyên, dưới 10% lấy một số lẻ. */
export function phanTramChu(pt: number) {
  if (pt > 0 && pt < 0.1) return "<0,1%";
  const s = pt >= 10 ? Math.round(pt) : Math.round(pt * 10) / 10;
  return `${s.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}
