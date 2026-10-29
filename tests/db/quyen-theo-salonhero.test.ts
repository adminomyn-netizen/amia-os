import { describe, expect, it } from "vitest";
import { QUYEN_THEO_VAI_TRO, VAI_TRO, coQuyen, quyenHieuLuc, type Quyen, type VaiTro } from "../../src/lib/quyen";
import { QUYEN_TU_SH, VAI_SH_CUA_AMIA } from "../../src/lib/quyen-salonhero";
import { SH_MA_TRAN, SH_VAI } from "../../src/lib/quyen-salonhero-du-lieu";

// Chị Lâm chốt 29/10/2026: quyền AMIA OS làm Y HỆT SalonHero, bê nguyên toàn bộ, không cắt quyền rộng.
// Nguồn duy nhất: ma trận SalonHero (227 quyền × 10 vai). Mọi quyền AMIA có ánh xạ phải BẰNG đúng ma trận, từng ô.
const nguoi = (vaiTro: VaiTro) => ({ vaiTro, quyen: quyenHieuLuc(vaiTro, null) });

describe("ma trận SalonHero đủ 227 quyền × 10 vai", () => {
  it("mỗi vai có đúng 227 khoá", () => {
    expect(SH_VAI.length).toBe(10);
    for (const v of SH_VAI) expect(Object.keys(SH_MA_TRAN[v]).length).toBe(227);
  });
});

describe("AMIA = SalonHero, từng ô", () => {
  for (const [amia, sh] of Object.entries(VAI_SH_CUA_AMIA) as [VaiTro, (typeof SH_VAI)[number]][]) {
    it(`${amia} ⇔ ${sh}: mọi quyền có ánh xạ bằng đúng SalonHero (bật khi có BẤT KỲ khoá bật)`, () => {
      for (const [q, khoa] of Object.entries(QUYEN_TU_SH) as [Quyen, string[]][]) {
        const sh_co = khoa.some((k) => SH_MA_TRAN[sh][k] === true);
        expect(coQuyen(nguoi(amia), q), `${amia} ${q} (${khoa.join("|")})`).toBe(sh_co);
      }
    });
  }
  it("quyền hệ thống chỉ Chủ và Kỹ thuật", () => {
    expect(VAI_TRO.filter((v) => coQuyen(nguoi(v), "hethong.phanquyen"))).toEqual(["chu", "ky_thuat"]);
  });
  it("Chủ và Kỹ thuật có đủ mọi quyền mới của SalonHero (xuất Excel, SĐT/email khách, giảm giá, sửa HĐ khoá, xem toàn cơ sở, tip)", () => {
    for (const v of ["chu", "ky_thuat"] as const) for (const q of ["khach.xuat", "khach.sdt", "khach.email", "lich.xuat", "ban.giamgia", "ban.sua_khoa", "ban.toan_co_so", "ban.tip"] as const) expect(coQuyen(nguoi(v), q)).toBe(true);
  });
  it("Nhân viên đăng ký tự do (Cộng tác viên chưa có tài khoản) vẫn chỉ noibo.dung", () => {
    expect(QUYEN_THEO_VAI_TRO.nhan_vien).toEqual(["noibo.dung"]);
  });
});
