import { describe, expect, it } from "vitest";
import { canKeu, CHU_KY_NHAC_MS, donDaBao, mocBatDau, mocQuaGio, nhanPhut, phamViQuaGio, phutQuaGio, thoiLuongChuan, tinhThucTe, tongPhutDichVu } from "@/lib/qua-gio";

const BD = "2026-11-10T07:00:00.000Z"; // 14:00 giờ VN
const phut = (n: number) => Date.parse(BD) + n * 60_000;

describe("thời lượng chuẩn", () => {
  it("lấy tổng thời lượng dịch vụ trong danh mục × số lượng", () => {
    expect(tongPhutDichVu([{ thoi_luong_phut: 45 }, { thoi_luong_phut: 30, so_luong: 2 }, { thoi_luong_phut: null }])).toBe(105);
    expect(thoiLuongChuan({ phutDichVu: 105, batDau: BD, ketThuc: new Date(phut(60)).toISOString() })).toBe(105);
  });
  it("dịch vụ chưa có thời lượng → khoảng giờ đã đặt; khách đi cùng lâu hơn thì lấy khách lâu nhất", () => {
    expect(thoiLuongChuan({ phutDichVu: 0, batDau: BD, ketThuc: new Date(phut(60)).toISOString() })).toBe(60);
    expect(thoiLuongChuan({ phutDichVu: 45, batDau: BD, ketThuc: new Date(phut(60)).toISOString(), khachDiCung: [90, null] })).toBe(90);
  });
});

describe("mốc bắt đầu", () => {
  it("có mốc bấm Đang phục vụ thì dùng mốc đó", () => {
    expect(mocBatDau({ bat_dau_lam_luc: "2026-11-10T07:10:00Z", bat_dau: BD, checkin_luc: null })).toEqual({ batDau: "2026-11-10T07:10:00Z", uocTinh: false });
  });
  it("chưa có mốc: lấy giờ muộn hơn giữa giờ hẹn và giờ khách đến (ước tính)", () => {
    expect(mocBatDau({ bat_dau_lam_luc: null, bat_dau: BD, checkin_luc: "2026-11-10T07:20:00Z" })).toEqual({ batDau: "2026-11-10T07:20:00Z", uocTinh: true });
    expect(mocBatDau({ bat_dau_lam_luc: null, bat_dau: BD, checkin_luc: "2026-11-10T06:50:00Z" })).toEqual({ batDau: BD, uocTinh: true });
  });
});

describe("quá giờ và nhắc lại", () => {
  const ca = { batDau: BD, chuanPhut: 60 };
  it("chưa tới giờ chuẩn thì chưa quá, vượt thì đếm phút quá", () => {
    expect(mocQuaGio(ca)).toBe(phut(60));
    expect(phutQuaGio(ca, phut(59))).toBe(0);
    expect(phutQuaGio(ca, phut(72.5))).toBe(12);
  });
  it("kêu ngay khi quá giờ, rồi mỗi 5 phút, dừng khi bấm Đã biết", () => {
    expect(canKeu(ca, undefined, phut(59))).toBe(false);
    expect(canKeu(ca, undefined, phut(60))).toBe(true);
    expect(canKeu(ca, { keu: phut(60) }, phut(63))).toBe(false);
    expect(canKeu(ca, { keu: phut(60) }, phut(60) + CHU_KY_NHAC_MS)).toBe(true);
    expect(canKeu(ca, { keu: phut(60), biet: true }, phut(90))).toBe(false);
  });
  it("tải lại trang không kêu lặp: đã kêu trong chu kỳ thì thôi; ca đã xong bị dọn khỏi kho", () => {
    expect(canKeu(ca, { keu: phut(61) }, phut(62))).toBe(false);
    expect(donDaBao({ a: { keu: 1 }, b: { biet: true } }, ["b"])).toEqual({ b: { biet: true } });
  });
});

describe("ai được báo", () => {
  it("chủ / quản lý / lễ tân thấy cả chi nhánh; chuyên viên trị liệu chỉ ca mình; chỉ xem không nhận", () => {
    expect(phamViQuaGio({ vaiTro: "le_tan", quyen: ["lich.xem"] })).toBe("chi_nhanh");
    expect(phamViQuaGio({ vaiTro: "quan_ly", quyen: ["lich.xem"] })).toBe("chi_nhanh");
    expect(phamViQuaGio({ vaiTro: "ktv", quyen: ["lich.xem"] })).toBe("cua_toi");
    expect(phamViQuaGio({ vaiTro: "chi_xem", quyen: ["lich.xem"] })).toBe("khong");
    expect(phamViQuaGio({ vaiTro: "ke_toan", quyen: [] })).toBe("khong");
  });
});

describe("báo cáo", () => {
  it("thực tế và quá giờ từ mốc bắt đầu – kết thúc; thiếu mốc thì không tính", () => {
    expect(tinhThucTe({ batDauLam: BD, ketThucLam: new Date(phut(75)).toISOString(), chuanPhut: 60 })).toEqual({ thucTe: 75, qua: 15 });
    expect(tinhThucTe({ batDauLam: BD, ketThucLam: new Date(phut(50)).toISOString(), chuanPhut: 60 })).toEqual({ thucTe: 50, qua: 0 });
    expect(tinhThucTe({ batDauLam: null, ketThucLam: BD, chuanPhut: 60 })).toEqual({ thucTe: null, qua: null });
  });
  it("nhãn phút dễ đọc", () => {
    expect(nhanPhut(12)).toBe("12 phút");
    expect(nhanPhut(65)).toBe("1 giờ 05 phút");
    expect(nhanPhut(120)).toBe("2 giờ");
  });
});
