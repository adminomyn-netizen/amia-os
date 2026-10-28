import { describe, expect, it } from "vitest";
import { docThietLapKhac, dongThietLapKhac, loiThietLapKhac, THIET_LAP_KHAC_MAC_DINH } from "@/lib/thiet-lap-khac";

describe("thiết lập khác (VAT, phụ phí, tip, khoá hoá đơn)", () => {
  it("chưa có dòng nào trong cau_hinh thì dùng giá trị SalonHero hiện tại", () => {
    expect(docThietLapKhac(null)).toEqual(THIET_LAP_KHAC_MAC_DINH);
    expect(THIET_LAP_KHAC_MAC_DINH).toMatchObject({ vatCheDo: "tuy_chon", vatPct: 10, khoaHdBat: false, phuPhiPct: 0, tipBat: false });
  });
  it("ghi rồi đọc lại ra đúng giá trị", () => {
    const moi = { vatCheDo: "ap_dung" as const, vatPct: 8, khoaHdBat: true, khoaHdGio: 24, phuPhiCheDo: "tuy_chon" as const, phuPhiPct: 2.5, tipBat: true };
    expect(docThietLapKhac(dongThietLapKhac(moi))).toEqual(moi);
    expect(dongThietLapKhac(moi).every((d) => d.khoa.startsWith("tl.") && d.ghi_chu)).toBe(true);
  });
  it("giá trị hỏng trong DB thì rơi về mặc định, không ném lỗi", () => {
    expect(docThietLapKhac([{ khoa: "tl.vat_che_do", gia_tri: "linh tinh" }, { khoa: "tl.vat_pct", gia_tri: "abc" }])).toEqual(THIET_LAP_KHAC_MAC_DINH);
  });
  it("kiểm tra đầu vào", () => {
    const ok = { ...THIET_LAP_KHAC_MAC_DINH };
    expect(loiThietLapKhac(ok)).toBe("");
    expect(loiThietLapKhac({ ...ok, vatPct: 101 })).toMatch(/VAT/);
    expect(loiThietLapKhac({ ...ok, vatCheDo: "x" as never })).toMatch(/Chế độ/);
    expect(loiThietLapKhac({ ...ok, khoaHdBat: true, khoaHdGio: 0 })).toMatch(/từ 1/);
    expect(loiThietLapKhac({ ...ok, khoaHdGio: 1.5 })).toMatch(/số nguyên/);
    expect(loiThietLapKhac({ ...ok, phuPhiPct: 17 })).toMatch(/Phụ phí/);
  });
});
