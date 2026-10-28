import { describe, expect, it } from "vitest";
import { lapPhieuThuNo, TOI_DA_DON_THU_NO, type HoaDonNo } from "../src/lib/thu-no";

const hd = (id: string, o: Partial<HoaDonNo> = {}): HoaDonNo => ({ id, ma: `#${id}`, trang_thai: "hoan_thanh", con_no: 1000, chi_nhanh_id: "cn1", ...o });

describe("lập phiếu thu nợ nhiều hoá đơn (nút Trả nợ)", () => {
  it("thu nốt toàn bộ số còn nợ của từng hoá đơn, bỏ trùng", () => {
    const kq = lapPhieuThuNo(["a", "b", "a"], [hd("a", { con_no: "9900000" }), hd("b", { con_no: 500 })], null);
    expect(kq).toEqual({ dong: [{ hoa_don_id: "a", ma: "#a", so_tien: 9900000 }, { hoa_don_id: "b", ma: "#b", so_tien: 500 }], tong: 9900500 });
  });
  it("không chọn gì, chọn quá nhiều: từ chối", () => {
    expect(lapPhieuThuNo([], [], null)).toEqual({ loi: "Chọn ít nhất một hoá đơn còn nợ." });
    const nhieu = Array.from({ length: TOI_DA_DON_THU_NO + 1 }, (_, i) => `h${i}`);
    expect(lapPhieuThuNo(nhieu, nhieu.map((i) => hd(i)), null).loi).toMatch(/tối đa 50/);
  });
  it("một hoá đơn sai thì cả phiếu bị từ chối (không thu dở dang)", () => {
    expect(lapPhieuThuNo(["a", "x"], [hd("a")], null).loi).toMatch(/không tồn tại/);
    expect(lapPhieuThuNo(["a", "b"], [hd("a"), hd("b", { trang_thai: "huy" })], null).loi).toMatch(/#b.*huỷ/);
    expect(lapPhieuThuNo(["a", "b"], [hd("a"), hd("b", { con_no: 0 })], null).loi).toMatch(/#b không còn nợ/);
  });
  it("người bị giới hạn chi nhánh không thu được hoá đơn chi nhánh khác", () => {
    expect(lapPhieuThuNo(["a"], [hd("a", { chi_nhanh_id: "cn2" })], "cn1").loi).toMatch(/không thuộc chi nhánh/);
    expect(lapPhieuThuNo(["a"], [hd("a", { chi_nhanh_id: "cn1" })], "cn1").loi).toBeUndefined();
  });
});
