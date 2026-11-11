import { describe, expect, it } from "vitest";
import { duocKetThucBuoi, duocTruBuoiTrucTiep, VAI_TRO, VAI_TRO_KET_THUC_BUOI, VAI_TRO_TRU_BUOI_TRUC_TIEP } from "@/lib/quyen";

// Chị Lâm 11/11/2026: thu ngân lên đơn → chuyên viên trị liệu Bắt đầu làm → tích bước → Kết thúc mới trừ 1 buổi.
// "Dùng buổi" / "Thực hiện buổi" không còn trừ thẳng: chỉ Chủ / Kỹ thuật trừ trực tiếp để chỉnh sửa.
describe("Trừ buổi trực tiếp (thucHienBuoi) — chỉ Chủ / Kỹ thuật chỉnh sửa", () => {
  it("Chủ và Kỹ thuật được", () => {
    expect(duocTruBuoiTrucTiep({ vaiTro: "chu" })).toBe(true);
    expect(duocTruBuoiTrucTiep({ vaiTro: "ky_thuat" })).toBe(true);
  });
  it("thu ngân, lễ tân, chuyên viên trị liệu và mọi vai khác phải gửi chuyên viên làm", () => {
    for (const v of ["thu_ngan", "le_tan", "ktv", "tu_van", "ke_toan", "quan_ly"] as const) expect(duocTruBuoiTrucTiep({ vaiTro: v })).toBe(false);
    for (const v of VAI_TRO) expect(duocTruBuoiTrucTiep({ vaiTro: v })).toBe(v === "chu" || v === "ky_thuat");
  });
  it("luôn là tập con của người được bấm Kết thúc", () => {
    for (const v of VAI_TRO_TRU_BUOI_TRUC_TIEP) expect(VAI_TRO_KET_THUC_BUOI).toContain(v);
    for (const v of VAI_TRO) if (duocTruBuoiTrucTiep({ vaiTro: v })) expect(duocKetThucBuoi({ vaiTro: v })).toBe(true);
  });
  it("chưa đăng nhập: không", () => {
    expect(duocTruBuoiTrucTiep(null)).toBe(false);
    expect(duocTruBuoiTrucTiep(undefined)).toBe(false);
  });
});
