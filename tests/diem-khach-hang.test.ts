import { describe, expect, it } from "vitest";
import { DIEM_KH_MAC_DINH, docDiemKhachHang, dongDiemKhachHang, loiDiemKhachHang, tiLeMotDiem } from "@/lib/diem-khach-hang";

describe("Điểm khách hàng (như SalonHero)", () => {
  it("chưa có dòng nào: mặc định = SalonHero của AMIA (100.000đ = 1 điểm, 1 điểm = 10.000đ, đổi điểm tắt, mức 0/200/350/500/1.000)", () => {
    const t = docDiemKhachHang(null, null);
    expect(t).toEqual(DIEM_KH_MAC_DINH);
    expect(t.doiBat).toBe(false); expect(t.tichHang["Kim cương"]).toEqual({ tien: 100000, diem: 1 });
    expect(Object.values(t.nguong)).toEqual([0, 200, 350, 500, 1000]);
  });
  it("đọc đúng từ bảng hạng và cau_hinh (khoá diem.doi_* dùng chung với Thu ngân)", () => {
    const t = docDiemKhachHang([{ khoa: "diem.doi_bat", gia_tri: "1" }, { khoa: "diem.doi_tien", gia_tri: "20000" }, { khoa: "diem.nguong_vang", gia_tri: "400" }], [{ hang: "Bạc", tien_moi_diem: "50000", tien_doi_moi_diem: "12000" }]);
    expect(t.doiBat).toBe(true); expect(t.doiMacDinh.tien).toBe(20000); expect(t.nguong["Vàng"]).toBe(400);
    expect(t.tichHang["Bạc"].tien).toBe(50000); expect(t.doiHang["Bạc"].tien).toBe(12000); expect(t.tichHang["Vàng"].tien).toBe(100000);
  });
  it("ghi dòng cau_hinh rồi đọc lại ra đúng giá trị", () => {
    const moi = { ...DIEM_KH_MAC_DINH, tichBat: false, tichSp: false, doiBat: true, doiMacDinh: { tien: 15000, diem: 1 }, tuDongHang: false, nguong: { ...DIEM_KH_MAC_DINH.nguong, "Bạch kim": 600 } };
    expect(docDiemKhachHang(dongDiemKhachHang(moi), null)).toEqual({ ...moi, tichHang: DIEM_KH_MAC_DINH.tichHang, doiHang: DIEM_KH_MAC_DINH.doiHang });
  });
  it("cặp X đồng = Y điểm phải chia hết, nhập 20.000.000 = 200 ra 100.000đ/điểm", () => {
    expect(tiLeMotDiem({ tien: 20_000_000, diem: 200 })).toBe(100000);
    expect(tiLeMotDiem({ tien: 100000, diem: 3 })).toBeNull();
    expect(tiLeMotDiem({ tien: 100000, diem: 0 })).toBeNull();
  });
  it("kiểm tra đầu vào", () => {
    const ok = DIEM_KH_MAC_DINH;
    expect(loiDiemKhachHang(ok)).toBe("");
    expect(loiDiemKhachHang({ ...ok, tichHang: { ...ok.tichHang, Bạc: { tien: 500, diem: 1 } } })).toMatch(/Bạc/);
    expect(loiDiemKhachHang({ ...ok, doiHang: { ...ok.doiHang, Vàng: { tien: 100, diem: 3 } } })).toMatch(/Vàng/);
    expect(loiDiemKhachHang({ ...ok, doiMacDinh: { tien: 50, diem: 1 } })).toMatch(/100đ/);
    expect(loiDiemKhachHang({ ...ok, nguong: { ...ok.nguong, Vàng: 100 } })).toMatch(/tăng dần/);
    expect(loiDiemKhachHang({ ...ok, nguong: { ...ok.nguong, Thường: 5 } })).toMatch(/Thường/);
  });
});
