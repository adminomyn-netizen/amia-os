import { describe, expect, it } from "vitest";
import { dienMau, emailHopLe, giaiMaThu, maHoaThu, MAU_THEO_BUOC } from "@/lib/email-tuyen-dung";

describe("email tuyển dụng", () => {
  it("điền biến, biến lạ hoặc rỗng thì bỏ trống", () => {
    expect(dienMau("Chào {{ten}}, vị trí {{ vi_tri }}, hẹn {{ngay_phong_van}}{{la}}.", { ten: "An", vi_tri: "Lễ tân", ngay_phong_van: null })).toBe("Chào An, vị trí Lễ tân, hẹn .");
  });
  it("mã hoá rồi giải mã ra đúng, sai khoá thì null, mỗi lần mã hoá khác nhau", () => {
    const a = maHoaThu("abcd efgh ijkl mnop", "khoa-1");
    expect(a).not.toContain("abcd");
    expect(giaiMaThu(a, "khoa-1")).toBe("abcd efgh ijkl mnop");
    expect(giaiMaThu(a, "khoa-2")).toBeNull();
    expect(giaiMaThu("rac", "khoa-1")).toBeNull();
    expect(maHoaThu("x", "k")).not.toBe(maHoaThu("x", "k"));
  });
  it("kiểm email và ánh xạ bước", () => {
    expect(emailHopLe("a@b.vn")).toBe(true);
    expect(emailHopLe("a b@c.vn")).toBe(false);
    expect(emailHopLe("abc")).toBe(false);
    expect(MAU_THEO_BUOC["Vòng 1"]).toBeUndefined();
    expect(MAU_THEO_BUOC["Nhận việc"]).toBe("chao_mung");
  });
});
