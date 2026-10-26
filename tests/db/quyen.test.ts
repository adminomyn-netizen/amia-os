import { describe, expect, it } from "vitest";
import { QUYEN_THEO_VAI_TRO, VAI_TRO, coQuyen } from "../../src/lib/quyen";

describe("ma trận quyền", () => {
  it("chỉ Kỹ thuật nắm phân quyền hệ thống, và có mọi quyền khác", () => {
    const nam = VAI_TRO.filter((v) => coQuyen(v, "hethong.phanquyen"));
    expect(nam).toEqual(["ky_thuat"]);
    for (const q of QUYEN_THEO_VAI_TRO.chu) expect(coQuyen("ky_thuat", q)).toBe(true);
  });
});
