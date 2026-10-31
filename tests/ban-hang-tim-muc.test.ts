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
