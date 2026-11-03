import { describe, expect, it } from "vitest";
import { docGioiHan, docWebDatLich, dongWebDatLich, loiWebDatLich, thoiLuongMacDinh, WEB_MAC_DINH } from "@/lib/web-dat-lich";

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
  it("bảng giới hạn số lịch đặt + ảnh bìa: đọc lại đúng, dòng hỏng bị loại, kiểm giờ/số", () => {
    const gh = [{ tu: "08:00", den: "10:00", so: 2, thu: ["t2", "cn"], cn: null }];
    const moi = { ...WEB_MAC_DINH, gioiHanRieng: gh, anhBia: "dat-lich/abc.jpg" };
    expect(docWebDatLich(dongWebDatLich(moi))).toEqual(moi);
    expect(docGioiHan([{ tu: "8h", den: "10:00", so: 1 }, { tu: "09:00", den: "11:00", so: 1, thu: ["t9", "t3"], cn: "khong-phai-uuid" }, "x"])).toEqual([{ tu: "09:00", den: "11:00", so: 1, thu: ["t3"], cn: null }]);
    expect(docWebDatLich([{ khoa: "dat_online.tuy_chon", gia_tri: JSON.stringify({ anhBia: "../bi-mat.jpg" }) }]).anhBia).toBeNull();
    expect(loiWebDatLich({ ...WEB_MAC_DINH, gioiHanRieng: [{ tu: "10:00", den: "09:00", so: 1, thu: [], cn: null }] })).toMatch(/sau giờ bắt đầu/);
    expect(loiWebDatLich({ ...WEB_MAC_DINH, gioiHanRieng: [{ tu: "08:00", den: "09:00", so: 100, thu: [], cn: null }] })).toMatch(/0 đến 99/);
  });
  it("thời lượng mặc định 0 phút thì lịch dài 30 phút như SalonHero", () => {
    expect(thoiLuongMacDinh({ ...WEB_MAC_DINH, thoiLuongPhut: 0 })).toBe(30);
    expect(thoiLuongMacDinh({ ...WEB_MAC_DINH, thoiLuongPhut: 90 })).toBe(90);
  });
});
