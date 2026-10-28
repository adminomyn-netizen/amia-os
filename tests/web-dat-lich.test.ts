import { describe, expect, it } from "vitest";
import { docWebDatLich, dongWebDatLich, loiWebDatLich, WEB_MAC_DINH } from "@/lib/web-dat-lich";

describe("Web đặt Lịch (tuỳ chọn như SalonHero)", () => {
  it("chưa có dòng nào thì dùng mặc định; trang đang khoá vì dat_online.mo chưa phải 1", () => {
    expect(docWebDatLich(null)).toEqual(WEB_MAC_DINH);
    expect(WEB_MAC_DINH).toMatchObject({ doiTuong: "ca", khungPhut: 15, toiDaLuot: 10, thoiLuongPhut: 30, trangThai: "chua_xac_nhan", mau: "#207f7e", hienBuoi: true, amThanh: true, chonKtv: false });
  });
  it("ba tuỳ chọn có hiệu lực dùng ĐÚNG khoá cũ của trang /dat-lich, không có bản sao", () => {
    const d = dongWebDatLich({ ...WEB_MAC_DINH, baoTruocPhut: 0, toiDaNgay: 30, khoaTrang: false });
    const m = new Map(d.map((x) => [x.khoa, x.gia_tri]));
    expect(m.get("dat_online.bao_truoc_phut")).toBe("0"); expect(m.get("dat_online.toi_da_ngay")).toBe("30"); expect(m.get("dat_online.mo")).toBe("1");
    expect(dongWebDatLich({ ...WEB_MAC_DINH, khoaTrang: true }).find((x) => x.khoa === "dat_online.mo")?.gia_tri).toBe("0");
  });
  it("ghi rồi đọc lại ra đúng giá trị", () => {
    const moi = { ...WEB_MAC_DINH, baoTruocPhut: 240, toiDaNgay: 14, khoaTrang: false, chonKtv: true, hienGia: true, doiTuong: "nu", khungPhut: 30, toiDaLuot: 4, trangThai: "da_xac_nhan", ngonNgu: "en", mau: "#112233", emailNhan: ["a@b.vn"], amThanh: false };
    expect(docWebDatLich(dongWebDatLich(moi))).toEqual(moi);
  });
  it("JSON hỏng hoặc giá trị lạ thì rơi về mặc định, không ném lỗi", () => {
    expect(docWebDatLich([{ khoa: "dat_online.tuy_chon", gia_tri: "{hỏng" }, { khoa: "dat_online.bao_truoc_phut", gia_tri: "abc" }])).toEqual(WEB_MAC_DINH);
    expect(docWebDatLich([{ khoa: "dat_online.tuy_chon", gia_tri: JSON.stringify({ doiTuong: "khac", mau: "đỏ", emailNhan: ["x", "ok@a.vn"] }) }])).toMatchObject({ doiTuong: "ca", mau: "#207f7e", emailNhan: ["ok@a.vn"] });
  });
  it("kiểm tra đầu vào", () => {
    expect(loiWebDatLich(WEB_MAC_DINH)).toBe("");
    expect(loiWebDatLich({ ...WEB_MAC_DINH, toiDaNgay: 61 })).toMatch(/60 ngày/);
    expect(loiWebDatLich({ ...WEB_MAC_DINH, baoTruocPhut: -1 })).toMatch(/10\.080/);
    expect(loiWebDatLich({ ...WEB_MAC_DINH, mau: "đỏ" })).toMatch(/Màu/);
    expect(loiWebDatLich({ ...WEB_MAC_DINH, emailNhan: ["sai"] })).toMatch(/Email/);
    expect(loiWebDatLich({ ...WEB_MAC_DINH, toiDaLuot: 0 })).toMatch(/lượt/);
  });
});
