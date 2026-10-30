import { describe, expect, it } from "vitest";
import { canhBaoDinhMuc, phanTichDinhMuc, tinhGiaVonDinhMuc } from "../src/lib/dinh-muc";

const r = (so_luong: number, gia: number | null, chon = false, nhom: string | null = "A", san_pham_id = "s") => ({ san_pham_id, so_luong, chon_theo_chi_dinh: chon, nhom_cap: nhom, gia_nhap_don_vi: gia });

describe("giá vốn vật tư theo định mức", () => {
  it("cộng cố định riêng, phương án bác sĩ chọn riêng (MFU: 7 đầu liệt kê không phải đều dùng hết)", () => {
    const k = tinhGiaVonDinhMuc([r(20, 2156), r(1, 3250), r(300, 2144, true), r(200, 1965, true), r(200, 1495, true)]);
    expect(k.coDinh).toBe(20 * 2156 + 3250);
    expect(k.phuongAnTong).toBe(300 * 2144 + 200 * 1965 + 200 * 1495);
    expect(k.phuongAnLonNhat).toBe(300 * 2144);
    expect(k.coDinhThieuGia).toBe(0);
  });
  it("vật tư thiếu giá nhập tính 0 và được đếm, không bịa số", () => {
    const k = tinhGiaVonDinhMuc([r(5, 100), r(2, null), r(10, null, true)]);
    expect(k).toMatchObject({ coDinh: 500, coDinhThieuGia: 1, phuongAnTong: 0, phuongAnThieuGia: 1 });
  });
  it("không có dòng nào thì bằng 0", () => { expect(tinhGiaVonDinhMuc([])).toEqual({ coDinh: 0, coDinhThieuGia: 0, phuongAnTong: 0, phuongAnLonNhat: 0, phuongAnThieuGia: 0 }); });
  it("số thập phân: 0,5 ml × 3.000", () => { expect(tinhGiaVonDinhMuc([r(0.5, 3000)]).coDinh).toBe(1500); });
});

describe("cảnh báo màn định mức", () => {
  it("vật tư không phải nhóm A bị phiếu cấp bỏ qua; thiếu giá; cấp cố định chưa đủ tồn", () => {
    const ton = new Map([["a", 100], ["b", 0], ["c", 5]]);
    const cb = canhBaoDinhMuc([r(10, 100, false, "A", "a"), r(1, null, false, "A", "b"), r(3, 50, false, "C", "c")], ton);
    expect(cb.map((c) => c.ma).sort()).toEqual(["chua_co_ton", "khong_nhom_a", "thieu_gia"]);
    expect(cb.find((c) => c.ma === "chua_co_ton")!.soDong).toBe(1);
  });
  it("đủ nhóm A, đủ giá, đủ tồn thì không có cảnh báo; phương án bác sĩ chọn không đòi tồn cố định", () => {
    expect(canhBaoDinhMuc([r(10, 100, false, "A", "a"), r(300, 5, true, "A", "z")], new Map([["a", 50]]))).toEqual([]);
  });
});

describe("dán định mức từ bảng tính", () => {
  const dv = [{ id: "d1", ma: "CSDCNC.30", ten: "MFU PRO Basic" }, { id: "d2", ma: "X2", ten: "Peel da" }];
  const sp = [{ id: "s1", ma: "VT-1", ten: "Đầu MFU N4.5" }, { id: "s2", ma: "VT-2", ten: "Kem gây tê" }];
  it("khớp theo mã hoặc tên, không phân biệt hoa thường và dấu; cột 4 là theo chỉ định", () => {
    const k = phanTichDinhMuc("Dịch vụ\tVật tư\tSố lượng\tTheo chỉ định\nCSDCNC.30\tđầu mfu n4.5\t300\t1\nmfu pro basic\tVT-2\t20,5\t0", dv, sp);
    expect(k.loi).toEqual([]);
    expect(k.rows).toEqual([{ dich_vu_id: "d1", san_pham_id: "s1", so_luong: 300, chon_theo_chi_dinh: true }, { dich_vu_id: "d1", san_pham_id: "s2", so_luong: 20.5, chon_theo_chi_dinh: false }]);
  });
  it("dòng lỗi được liệt kê, dòng tốt vẫn giữ", () => {
    const k = phanTichDinhMuc("Peel da\tVT-2\t5\nKhông có\tVT-2\t5\nPeel da\tKhông có\t5\nPeel da\tVT-1\tabc\nPeel da\tVT-1", dv, sp);
    expect(k.rows).toHaveLength(1);
    expect(k.loi).toHaveLength(4);
    expect(k.loi[0]).toMatch(/Dòng 2.*không có dịch vụ/);
    expect(k.loi[3]).toMatch(/Dòng 5.*ít nhất 3 cột/);
  });
  it("trùng cặp thì lấy dòng cuối; tên mơ hồ bắt dùng mã", () => {
    expect(phanTichDinhMuc("Peel da\tVT-2\t5\nPeel da\tVT-2\t7", dv, sp).rows).toEqual([{ dich_vu_id: "d2", san_pham_id: "s2", so_luong: 7, chon_theo_chi_dinh: false }]);
    const mo = phanTichDinhMuc("Peel\tVT-2\t5", [{ id: "a", ma: "A", ten: "Peel" }, { id: "b", ma: "B", ten: "PEEL" }], sp);
    expect(mo.rows).toEqual([]); expect(mo.loi[0]).toMatch(/trùng nhiều mục/);
  });
});
