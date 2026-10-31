import { describe, expect, it } from "vitest";
import { khopMuc } from "@/lib/ban-hang";

const dv = { ten: "Trẻ hóa da bằng laser", ma: "DV0123", maVach: undefined };
const sp = { ten: "Kem chống nắng", ma: "MP-0007", maVach: "8934567890123" };
describe("khopMuc (ô tìm của thu ngân)", () => {
  it("gõ không dấu vẫn ra tên có dấu", () => { expect(khopMuc(dv, "tre hoa")).toBe(true); expect(khopMuc(dv, "TRẺ HÓA")).toBe(true); });
  it("tìm theo mã, không phân biệt hoa thường", () => { expect(khopMuc(dv, "dv0123")).toBe(true); expect(khopMuc(sp, "mp-0007")).toBe(true); });
  it("tìm theo mã vạch", () => expect(khopMuc(sp, "8934567890123")).toBe(true));
  it("ô tìm trống thì khớp hết", () => { expect(khopMuc(dv, "")).toBe(true); expect(khopMuc(dv, "   ")).toBe(true); });
  it("không khớp thì false", () => { expect(khopMuc(dv, "tiêm")).toBe(false); expect(khopMuc(dv, "9999")).toBe(false); });
  it("chữ đ", () => expect(khopMuc({ ten: "Điều trị nám", ma: "DV1" }, "dieu tri")).toBe(true));
});

import { lamSachDongNhap } from "@/lib/ban-hang";
const U1 = "11111111-1111-4111-8111-111111111111", U2 = "22222222-2222-4222-8222-222222222222";
describe("lamSachDongNhap (đơn nháp)", () => {
  it("giữ dòng hợp lệ và chuẩn hoá số lượng, giảm giá, tỉ lệ", () => {
    const r = lamSachDongNhap([{ loai: "dich_vu", ref: U1, sl: 2.7, giam: -5, nv: { phuc_vu: [{ id: U2, ti: 150 }], tu_van: [], ban: [] } }]);
    expect(r).toEqual([{ loai: "dich_vu", ref: U1, sl: 2, giam: 0, nv: { phuc_vu: [{ id: U2, ti: 100 }], tu_van: [], ban: [] } }]);
  });
  it("bỏ dòng sai loại hoặc sai mã, bỏ người hưởng sai mã", () => {
    const r = lamSachDongNhap([{ loai: "xxx", ref: U1 }, { loai: "san_pham", ref: "abc" }, { loai: "goi_the", ref: U1, sl: 0, nv: { ban: [{ id: "khong-phai-uuid", ti: 50 }] } }]);
    expect(r).toHaveLength(1);
    expect(r[0].sl).toBe(1);
    expect(r[0].nv.ban).toEqual([]);
  });
  it("không phải mảng thì rỗng; cắt tối đa 60 dòng", () => {
    expect(lamSachDongNhap("x")).toEqual([]);
    expect(lamSachDongNhap(Array.from({ length: 80 }, () => ({ loai: "dich_vu", ref: U1 })))).toHaveLength(60);
  });
});
