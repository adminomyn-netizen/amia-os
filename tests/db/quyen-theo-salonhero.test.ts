import { describe, expect, it } from "vitest";
import { locMenu } from "../../src/lib/nav";
import { QUYEN_THEO_VAI_TRO, VAI_TRO, coQuyen, quyenHieuLuc, type Quyen, type VaiTro } from "../../src/lib/quyen";

// Đối chiếu quyền từng vai trò AMIA OS với SalonHero (đọc 29/10/2026, xem sao-luu/bang-lech-quyen-29-10.md).
// Phần "khoá" là chỗ SalonHero rộng hơn nhưng CHƯA nới (tiền, xuất Excel, xoá, đăng ký tự do): đổi thì phải được chị Lâm duyệt.
const nguoi = (vaiTro: VaiTro, rieng?: string[] | null) => ({ vaiTro, quyen: quyenHieuLuc(vaiTro, rieng) });
const co = (v: VaiTro, q: Quyen) => coQuyen(nguoi(v), q);
const ten = (v: VaiTro) => locMenu(nguoi(v)).map((m) => m.ten);

describe("quyền theo SalonHero: các điểm khoá (không nới)", () => {
  it("Nhân viên (đăng ký tự do) chỉ có noibo.dung; Nhà đầu tư không có khách, bán hàng, lịch", () => {
    expect(QUYEN_THEO_VAI_TRO.nhan_vien).toEqual(["noibo.dung"]);
    for (const q of QUYEN_THEO_VAI_TRO.nha_dau_tu) expect(q.startsWith("khach.") || q.startsWith("ban.") || q.startsWith("lich.")).toBe(false);
    expect(QUYEN_THEO_VAI_TRO.nha_dau_tu).toEqual(["tongquan.xem", "baocao.xem", "baocao.tien"]);
  });
  it("quyền hệ thống chỉ Chủ và Kỹ thuật (Kế toán SalonHero có tạo người dùng nhưng AMIA không nới)", () => {
    expect(VAI_TRO.filter((v) => co(v, "hethong.phanquyen"))).toEqual(["chu", "ky_thuat"]);
  });
  it("quyền nhạy cảm về tiền không nới: chỉ các vai này xem số tiền, sổ quỹ, lương, huỷ hoá đơn", () => {
    const vai = (q: Quyen) => VAI_TRO.filter((v) => co(v, q));
    expect(vai("baocao.tien")).toEqual(["chu", "ky_thuat", "quan_ly", "thu_ngan", "ke_toan", "nha_dau_tu"]);
    expect(vai("quy.xem")).toEqual(["chu", "ky_thuat", "quan_ly", "ke_toan"]);
    expect(vai("quy.ghi")).toEqual(["chu", "ky_thuat", "quan_ly", "ke_toan"]);
    expect(vai("ban.huy")).toEqual(["chu", "ky_thuat", "quan_ly"]);
    expect(vai("the.dieuchinh")).toEqual(["chu", "ky_thuat", "quan_ly"]);
    expect(vai("khach.nhap")).toEqual(["chu", "ky_thuat", "quan_ly"]);
  });
});
