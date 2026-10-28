import { describe, expect, it } from "vitest";
import { chuanHoaTen, khoaTen, loiMa, loiMaVach, loiTen, tienToTheoNhom, vanDeSanPham } from "../../src/lib/san-pham";

describe("quy ước mã và tên sản phẩm", () => {
  it("mã: hợp lệ và không hợp lệ", () => {
    for (const ma of ["MP-0012", "8809445612616", "VT-B64CC2E4", "851713006229_2"]) expect(loiMa(ma)).toBeNull();
    for (const ma of ["THUOC 3", "ab", "mp-01", "", "MP 0012"]) expect(loiMa(ma)).not.toBeNull();
  });
  it("mã vạch 8–14 chữ số", () => {
    expect(loiMaVach("")).toBeNull();
    expect(loiMaVach("8809445612616")).toBeNull();
    expect(loiMaVach("12345")).not.toBeNull();
    expect(loiMaVach("88094456126AB")).not.toBeNull();
  });
  it("tên: quá ngắn, toàn hoa, dài quá; tên chuẩn hợp lệ", () => {
    expect(loiTen("Kem")).not.toBeNull();
    expect(loiTen("KEM CHỐNG NẮNG HELIOCARE 360")).not.toBeNull();
    expect(loiTen("x".repeat(121))).not.toBeNull();
    expect(loiTen("Kem chống nắng Heliocare 360 Pigment Solution Fluid SPF50+ 50ml")).toBeNull();
  });
  it("khoá tên bỏ dấu, hoa thường, khoảng trắng; tiền tố theo nhóm", () => {
    expect(khoaTen("  Thuốc  Giảm đau   Efferalgan ")).toBe(khoaTen("thuoc giam dau efferalgan"));
    expect(chuanHoaTen("  a   b  ")).toBe("a b");
    expect(tienToTheoNhom("Thuốc kê cho khách")).toBe("TH");
    expect(tienToTheoNhom("Vật tư tiêu hao")).toBe("VT");
    expect(tienToTheoNhom("Mỹ phẩm Iancell")).toBe("MP");
    expect(tienToTheoNhom(null)).toBe("SP");
  });
  it("rà soát: hàng đang dùng thiếu thông tin bị nêu đủ vấn đề, hàng ngừng dùng thì bỏ qua", () => {
    const sp = { ma: "THUOC 3", ten: "Thuốc", nhom: null, ton_toi_thieu: 0, gia_nhap_don_vi: null, gia_ban: 0, ban_le: true, theo_doi_kho: true, hoat_dong: true, don_vi_mua: null, tieu_hao: false, ma_vach: null };
    expect(vanDeSanPham(sp, true)).toEqual(["ma", "ten", "trung", "nhom", "ton_thieu", "gia_von", "gia_ban", "ma_vach", "don_vi_mua"]);
    expect(vanDeSanPham({ ...sp, hoat_dong: false }, false)).toEqual([]);
  });
});
