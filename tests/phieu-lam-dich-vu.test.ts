import { describe, expect, it } from "vitest";
import { nhanBuoiThu, soBuoiPhieu } from "@/lib/phieu-lam-dich-vu";

describe("soBuoiPhieu", () => {
  it("lượt chờ làm: buổi kế tiếp, còn lại trừ trước 1", () => {
    expect(soBuoiPhieu({ tong: 10, con: 7, daTru: false })).toEqual({ thu: 4, tong: 10, conSau: 6 });
    expect(soBuoiPhieu({ tong: 1, con: 1, daTru: false })).toEqual({ thu: 1, tong: 1, conSau: 0 });
  });
  it("buổi đã làm: lùi theo số buổi làm sau nó", () => {
    expect(soBuoiPhieu({ tong: 10, con: 6, daTru: true, sauDo: 0 })).toEqual({ thu: 4, tong: 10, conSau: 6 });
    expect(soBuoiPhieu({ tong: 10, con: 4, daTru: true, sauDo: 2 })).toEqual({ thu: 4, tong: 10, conSau: 6 });
  });
  it("thẻ không giới hạn: không đánh số", () => {
    expect(soBuoiPhieu({ tong: 999999, con: 999990, daTru: false }).thu).toBeNull();
    expect(nhanBuoiThu({ thu: null, tong: null })).toBe("");
    expect(nhanBuoiThu({ thu: 3, tong: 10 })).toBe("Buổi 3/10");
  });
});
