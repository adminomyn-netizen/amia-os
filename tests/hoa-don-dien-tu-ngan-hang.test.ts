import { describe, expect, it } from "vitest";
import { chuThu, chuyenNhomLoc, CHUA_RO, docNhomLoc, dsNhomLoc, ghiNhomLoc, KHAC, khopNhomLoc, locMacDinh, nhomCuaNganHang, tenTaiKhoan, TIEN_MAT, tomTatThu } from "../src/lib/hoa-don-dien-tu-ngan-hang";

const TK = ["OCB", "Techcombank", "Vietcombank"]; // danh sách tài khoản nhận tiền lấy từ Cài đặt, không cố định trong mã
const k = (phuong_thuc: string, so_tien: number, ngan_hang: string | null = null, loai = "thu") => ({ loai, phuong_thuc, so_tien, ngan_hang });
const dv = (n: number) => String(n);

describe("danh sách chip và bộ lọc mặc định đọc từ danh sách tài khoản", () => {
  it("chip = từng tài khoản + Ngân hàng khác + chưa rõ + Tiền mặt; đổi danh sách thì chip đổi theo", () => {
    expect(dsNhomLoc(TK).map((n) => n.ma)).toEqual(["OCB", "Techcombank", "Vietcombank", KHAC, CHUA_RO, TIEN_MAT]);
    expect(dsNhomLoc(["ACB"]).map((n) => n.ma)).toEqual(["ACB", KHAC, CHUA_RO, TIEN_MAT]);
    expect(dsNhomLoc([]).map((n) => n.ma)).toEqual([KHAC, CHUA_RO, TIEN_MAT]);
  });
  it("tên tài khoản: tên ngắn, bỏ trùng, giữ thứ tự", () => {
    expect(tenTaiKhoan([{ ngan_hang: "Ngân hàng OCB" }, { ngan_hang: "Ngân hàng Techcombank" }, { ngan_hang: "Techcombank" }, { ngan_hang: "Ngân hàng Vietcombank" }])).toEqual(TK);
  });
  it("không có ?nh → chọn cả các tài khoản và nhóm chưa rõ (coi là vào tài khoản công ty)", () => {
    expect(docNhomLoc(undefined, TK)).toEqual(["OCB", "Techcombank", "Vietcombank", CHUA_RO]);
    expect(locMacDinh(["ACB"])).toEqual(["ACB", CHUA_RO]);
  });
  it("all → không lọc; danh sách → chỉ mã còn tồn tại, bỏ trùng; toàn mã lạ → mặc định", () => {
    expect(docNhomLoc("all", TK)).toBeNull();
    expect(docNhomLoc("Techcombank,_tm,Techcombank,xyz", TK)).toEqual(["Techcombank", TIEN_MAT]);
    expect(docNhomLoc("BIDV", TK)).toEqual(locMacDinh(TK)); // BIDV không còn trong danh sách
    expect(ghiNhomLoc(null)).toBe("all");
    expect(ghiNhomLoc(["OCB", TIEN_MAT])).toBe("OCB,_tm");
  });
  it("bấm chip: từ Tất cả chỉ chọn nó; bỏ chip cuối thì về Tất cả; thêm thì giữ thứ tự chip", () => {
    expect(chuyenNhomLoc(null, "Techcombank", TK)).toEqual(["Techcombank"]);
    expect(chuyenNhomLoc(["Techcombank"], "Techcombank", TK)).toBeNull();
    expect(chuyenNhomLoc([TIEN_MAT], "OCB", TK)).toEqual(["OCB", TIEN_MAT]);
  });
});

describe("gom thanh toán của một hoá đơn", () => {
  it("nhóm theo ngân hàng đã chuẩn hoá, cộng nhiều khoản cùng ngân hàng", () => {
    const t = tomTatThu([k("chuyen_khoan", 1000, "Ngân hàng Techcombank"), k("quet_the", 500, "Techcombank"), k("chuyen_khoan", 200, "Ngân hàng Vietcombank"), k("tien_mat", 300)], TK);
    expect(t.nganHang).toEqual([{ ten: "Techcombank", tien: 1500 }, { ten: "Vietcombank", tien: 200 }]);
    expect(t.tienMat).toBe(300);
    expect(t.nhom).toEqual(["Techcombank", "Vietcombank", TIEN_MAT]);
  });
  it("tài khoản OCB cũng lọc được; ngân hàng ngoài danh sách là Ngân hàng khác; chưa rõ ngân hàng là tài khoản công ty (chưa rõ)", () => {
    expect(tomTatThu([k("chuyen_khoan", 900, "Ngân hàng OCB")], TK).nhom).toEqual(["OCB"]);
    expect(tomTatThu([k("chuyen_khoan", 900, "Ngân hàng Sacombank")], TK).nhom).toEqual([KHAC]);
    const chua = tomTatThu([k("chuyen_khoan", 900)], TK);
    expect(chua.nganHang).toEqual([{ ten: null, tien: 900 }]);
    expect(chua.nhom).toEqual([CHUA_RO]);
    expect(nhomCuaNganHang("VCB", TK)).toBe("Vietcombank");
    expect(nhomCuaNganHang(null, TK)).toBe(CHUA_RO);
  });
  it("xoá một tài khoản khỏi danh sách thì khoản cũ của nó thành Ngân hàng khác", () => {
    expect(tomTatThu([k("chuyen_khoan", 900, "OCB")], ["Techcombank", "Vietcombank"]).nhom).toEqual([KHAC]);
  });
  it("hoàn tiền trừ vào ngân hàng; về 0 thì không còn thuộc nhóm đó", () => {
    const t = tomTatThu([k("chuyen_khoan", 1000, "Techcombank"), k("chuyen_khoan", 1000, "Techcombank", "hoan"), k("tien_mat", 50)], TK);
    expect(t.nganHang).toEqual([]);
    expect(t.nhom).toEqual([TIEN_MAT]);
  });
  it("trừ thẻ tiền hoặc chưa thu gì không thuộc nhóm nào", () => {
    expect(tomTatThu([k("the_tien", 800)], TK).nhom).toEqual([]);
    expect(tomTatThu([], TK).nhom).toEqual([]);
  });
  it("khớp lọc: null lấy hết; ngược lại cần trùng ít nhất một nhóm", () => {
    const tc = tomTatThu([k("chuyen_khoan", 1000, "Techcombank")], TK), kh = tomTatThu([k("chuyen_khoan", 1000, "BIDV")], TK), khong = tomTatThu([], TK);
    expect(khopNhomLoc(tc, locMacDinh(TK))).toBe(true);
    expect(khopNhomLoc(kh, locMacDinh(TK))).toBe(false);
    expect(khopNhomLoc(kh, [KHAC])).toBe(true);
    expect(khopNhomLoc(khong, locMacDinh(TK))).toBe(false);
    expect(khopNhomLoc(khong, null)).toBe(true);
  });
  it("chữ hiện trong dòng nêu từng ngân hàng", () => {
    expect(chuThu(tomTatThu([k("chuyen_khoan", 1000, "Techcombank"), k("chuyen_khoan", 200), k("tien_mat", 30), k("the_tien", 5)], TK), dv)).toEqual(["Techcombank 1000", "Tài khoản công ty (chưa rõ) 200", "Tiền mặt 30", "Trừ thẻ tiền 5"]);
  });
});
