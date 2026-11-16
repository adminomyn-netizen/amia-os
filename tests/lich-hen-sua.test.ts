import { describe, expect, it } from "vitest";
import { dongDoiDanhSach, goiYLoaiLich, khoaSuaLich, laLoaiLich, LUA_CHON_LOAI_LICH, nhanLoaiLich, quyenSuaLich } from "@/lib/lich-hen-sua";
import { dongThayDoi } from "@/lib/lich-hen-lich-su";
import { MAU_TRANG_THAI } from "@/lib/lich-hen";

describe("quyền sửa lịch hẹn (chị Lâm 10/11)", () => {
  it("ai có quyền sửa lịch đều sửa được mọi lịch (16/11)", () => {
    expect(quyenSuaLich({ vaiTro: "le_tan", nhanVienId: "a" }, { tao_boi: "a" }).duoc).toBe(true);
    expect(quyenSuaLich({ vaiTro: "ktv", nhanVienId: "b" }, { tao_boi: "a" }).duoc).toBe(true);
    for (const v of ["quan_ly", "chu", "thu_ngan", "tu_van"]) expect(quyenSuaLich({ vaiTro: v, nhanVienId: "x" }, { tao_boi: null }).duoc).toBe(true);
  });
});

describe("khoá trường khi sửa", () => {
  it("lịch chưa phục vụ, chưa hoá đơn: không khoá gì", () => {
    for (const t of ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"]) expect(khoaSuaLich(t, false)).toEqual({ gio: false, khach: false, diCung: false, dichVu: false, lyDo: [] });
  });
  it("lịch đã hoàn thành / huỷ: khoá giờ, khách, khách đi cùng; có lý do", () => {
    const k = khoaSuaLich("hoan_thanh", false);
    expect(k.gio && k.khach && k.diCung).toBe(true);
    expect(k.dichVu).toBe(false);
    expect(k.lyDo[0]).toContain("đã hoàn thành");
    expect(khoaSuaLich("huy", false).gio).toBe(true);
  });
  it("có hoá đơn thì khoá dịch vụ", () => {
    const k = khoaSuaLich("cho_phuc_vu", true);
    expect(k.dichVu).toBe(true);
    expect(k.gio).toBe(false);
    expect(k.lyDo.join(" ")).toContain("hoá đơn");
  });
});

describe("loại lịch", () => {
  it("đủ 5 loại, nhận đúng mã", () => {
    expect(LUA_CHON_LOAI_LICH.map((x) => x.gia_tri)).toEqual(["tu_van_moi", "lieu_trinh", "dich_vu_le", "tai_kham", "bao_hanh"]);
    expect(laLoaiLich("tai_kham")).toBe(true);
    expect(laLoaiLich("toString")).toBe(false);
    expect(laLoaiLich("")).toBe(false);
    expect(nhanLoaiLich("lieu_trinh")).toBe("Khách liệu trình");
    expect(nhanLoaiLich(null)).toBe("");
  });
  it("gợi ý: còn thẻ liệu trình → liệu trình; chưa đến lần nào → tư vấn khách mới", () => {
    expect(goiYLoaiLich({ coTheLieuTrinh: true, soLanDen: 0 })).toBe("lieu_trinh");
    expect(goiYLoaiLich({ coTheLieuTrinh: false, soLanDen: 0 })).toBe("tu_van_moi");
    expect(goiYLoaiLich({ coTheLieuTrinh: false, soLanDen: 3 })).toBe("");
  });
});

describe("lịch sử sửa", () => {
  it("dòng đổi danh sách: không đổi (khác thứ tự) thì null", () => {
    expect(dongDoiDanhSach("dich_vu", "Dịch vụ", ["A", "B"], ["B", "A"])).toBeNull();
    expect(dongDoiDanhSach("dich_vu", "Dịch vụ", ["A"], ["A", "C"])).toEqual({ truong: "dich_vu", nhan: "Dịch vụ", cu: "A", moi: "A, C" });
  });
  it("đọc thay_doi an toàn với dữ liệu lạ", () => {
    expect(dongThayDoi(null)).toEqual([]);
    expect(dongThayDoi([{ nhan: "Ghi chú", cu: "a", moi: "b" }, 5, null, { truong: "phong", cu: null, moi: "P1" }])).toEqual([{ nhan: "Ghi chú", cu: "a", moi: "b" }, { nhan: "phong", cu: "", moi: "P1" }]);
    expect(dongThayDoi([{ nhan: "x", cu: "y".repeat(200), moi: "" }], 10)[0].cu).toBe(`${"y".repeat(10)}…`);
  });
});

describe("màu thẻ lưới đậm", () => {
  it("mọi trạng thái có nền đậm và viền trái riêng, chữ trắng ≥ 4,5:1", () => {
    const L = (h: string) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const nen: Record<string, string> = { chua: "#8a6418", da: "#1f5f8b", cho: "#b4410f", dang: "#2e7d32", xong: "#00675b", huy: "#b42318" };
    for (const [, h] of Object.entries(nen)) expect(1.05 / (L(h) + 0.05)).toBeGreaterThanOrEqual(4.5);
    for (const v of Object.values(MAU_TRANG_THAI)) { expect(v.luoi).toMatch(/^border-l-lich-\w+-vien bg-lich-\w+$/); expect(v.dac).toContain("text-white"); }
  });
});
