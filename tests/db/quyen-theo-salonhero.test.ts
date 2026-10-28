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

describe("Thu ngân (SalonHero: Thu ngân)", () => {
  it("được đặt/đổi/huỷ lịch như SalonHero, vẫn không xem sổ quỹ, lương, công", () => {
    expect(co("thu_ngan", "lich.sua")).toBe(true);
    for (const q of ["quy.xem", "quy.ghi", "luong.xem", "cong.xem", "cong.sua", "ban.huy"] as const) expect(co("thu_ngan", q)).toBe(false);
    expect(ten("thu_ngan")).toEqual(expect.arrayContaining(["Lịch hẹn", "Bán hàng", "Hoá đơn"]));
  });
});

describe("Bác sĩ (SalonHero: Bác sỹ)", () => {
  it("được thêm/sửa khách như SalonHero; chưa nới số tiền: báo cáo tiền của SalonHero để chị Lâm duyệt", () => {
    expect(co("bac_si", "khach.sua")).toBe(true);
    for (const q of ["baocao.xem", "baocao.tien", "ban.xem", "khach.nhap"] as const) expect(co("bac_si", q)).toBe(false);
    expect(ten("bac_si")).not.toContain("Báo cáo");
  });
});

describe("Kỹ thuật viên (SalonHero: Nhân viên, Tư vấn bán hàng)", () => {
  it("được đặt lịch và thêm/sửa khách như SalonHero; chưa cho bán hàng (thu tiền), vẫn giữ thẻ để thực hiện buổi", () => {
    expect(co("ktv", "lich.sua")).toBe(true);
    expect(co("ktv", "khach.sua")).toBe(true);
    for (const q of ["ban.tao", "ban.xem", "baocao.tien", "quy.xem"] as const) expect(co("ktv", q)).toBe(false);
    expect(co("ktv", "the.xem") && co("ktv", "the.thuchien")).toBe(true);
  });
});

describe("Kế toán (SalonHero: Kế toán)", () => {
  it("xem lịch và thêm/sửa khách như SalonHero; chưa nới: bán hàng, huỷ hoá đơn, sửa danh mục, nhập kho, phân quyền", () => {
    expect(co("ke_toan", "lich.xem")).toBe(true);
    expect(co("ke_toan", "khach.sua")).toBe(true);
    for (const q of ["ban.tao", "ban.huy", "danhmuc.sua", "kho.nhap", "mua.tao", "nhanvien.quanly", "hethong.phanquyen", "lich.sua"] as const) expect(co("ke_toan", q)).toBe(false);
    expect(co("ke_toan", "quy.ghi") && co("ke_toan", "ky.khoa") && co("ke_toan", "luong.sua")).toBe(true);
  });
});

describe("Marketing (SalonHero: Marketing CSKH)", () => {
  it("thêm/sửa khách như SalonHero; chưa nới: xem hoá đơn, xem số tiền, thẻ liệu trình", () => {
    expect(co("marketing", "khach.sua")).toBe(true);
    for (const q of ["ban.xem", "baocao.tien", "the.xem", "lich.sua", "khach.nhap"] as const) expect(co("marketing", q)).toBe(false);
    expect(ten("marketing")).toEqual(expect.arrayContaining(["Marketing", "Báo cáo", "Khách hàng"]));
  });
});

describe("Quản lý, Tư vấn, Thủ kho: đã khớp SalonHero, không đổi", () => {
  it("Tư vấn có lịch, bán hàng, thẻ; Thủ kho chỉ kho, cấp vật tư, mua; Quản lý đủ nghiệp vụ nhưng không phân quyền", () => {
    for (const q of ["khach.sua", "lich.sua", "ban.tao", "the.xem", "lead.xu_ly"] as const) expect(co("tu_van", q)).toBe(true);
    for (const q of ["baocao.tien", "quy.xem", "ban.huy"] as const) expect(co("tu_van", q)).toBe(false);
    expect(co("thu_kho", "kho.nhap") && co("thu_kho", "phieu.cap")).toBe(true);
    for (const q of ["khach.xem", "ban.xem", "baocao.xem"] as const) expect(co("thu_kho", q)).toBe(false);
    expect(co("quan_ly", "baocao.tien")).toBe(true);
    expect(co("quan_ly", "hethong.phanquyen")).toBe(false);
  });
});
