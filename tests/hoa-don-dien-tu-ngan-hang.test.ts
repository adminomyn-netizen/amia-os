import { describe, expect, it } from "vitest";
import { chuThu, docNhomLoc, ghiNhomLoc, khopNhomLoc, nhomCuaNganHang, tomTatThu } from "../src/lib/hoa-don-dien-tu-ngan-hang";

const k = (phuong_thuc: string, so_tien: number, ngan_hang: string | null = null, loai = "thu") => ({ loai, phuong_thuc, so_tien, ngan_hang });
const dv = (n: number) => String(n);

describe("đọc bộ lọc ngân hàng trên đường dẫn", () => {
  it("không có → mặc định Techcombank + Vietcombank", () => {
    expect(docNhomLoc(undefined)).toEqual(["tech", "vcb"]);
    expect(docNhomLoc("")).toEqual(["tech", "vcb"]);
  });
  it("all → không lọc; danh sách → đúng nhóm hợp lệ, bỏ trùng và mã lạ", () => {
    expect(docNhomLoc("all")).toBeNull();
    expect(docNhomLoc("khac,tm,khac,xyz")).toEqual(["khac", "tm"]);
    expect(docNhomLoc("xyz")).toEqual(["tech", "vcb"]);
    expect(ghiNhomLoc(null)).toBe("all");
    expect(ghiNhomLoc(["tech", "tm"])).toBe("tech,tm");
  });
});

describe("gom thanh toán của một hoá đơn", () => {
  it("nhóm theo ngân hàng đã chuẩn hoá, cộng nhiều khoản cùng ngân hàng", () => {
    const t = tomTatThu([k("chuyen_khoan", 1000, "Ngân hàng Techcombank"), k("quet_the", 500, "Techcombank"), k("chuyen_khoan", 200, "Ngân hàng Vietcombank"), k("tien_mat", 300)]);
    expect(t.nganHang).toEqual([{ ten: "Techcombank", tien: 1500 }, { ten: "Vietcombank", tien: 200 }]);
    expect(t.tienMat).toBe(300);
    expect(t.nhom).toEqual(["tech", "vcb", "tm"]);
  });
  it("chuyển khoản chưa rõ ngân hàng rơi vào nhóm Ngân hàng khác", () => {
    const t = tomTatThu([k("chuyen_khoan", 900)]);
    expect(t.nganHang).toEqual([{ ten: null, tien: 900 }]);
    expect(t.nhom).toEqual(["khac"]);
    expect(nhomCuaNganHang(null)).toBe("khac");
    expect(nhomCuaNganHang("Ngân hàng Sacombank")).toBe("khac");
    expect(nhomCuaNganHang("VCB")).toBe("vcb");
  });
  it("hoàn tiền trừ vào ngân hàng; về 0 thì không còn thuộc nhóm đó", () => {
    const t = tomTatThu([k("chuyen_khoan", 1000, "Techcombank"), k("chuyen_khoan", 1000, "Techcombank", "hoan"), k("tien_mat", 50)]);
    expect(t.nganHang).toEqual([]);
    expect(t.nhom).toEqual(["tm"]);
  });
  it("trừ thẻ tiền không thuộc nhóm nào; hoá đơn chưa thu gì không thuộc nhóm nào", () => {
    expect(tomTatThu([k("the_tien", 800)]).nhom).toEqual([]);
    expect(tomTatThu([]).nhom).toEqual([]);
  });
  it("khớp lọc: null lấy hết; ngược lại cần trùng ít nhất một nhóm", () => {
    const tc = tomTatThu([k("chuyen_khoan", 1000, "Techcombank")]), kh = tomTatThu([k("chuyen_khoan", 1000, "BIDV")]), khong = tomTatThu([]);
    expect(khopNhomLoc(tc, ["tech", "vcb"])).toBe(true);
    expect(khopNhomLoc(kh, ["tech", "vcb"])).toBe(false);
    expect(khopNhomLoc(kh, ["khac"])).toBe(true);
    expect(khopNhomLoc(khong, ["tech", "vcb"])).toBe(false);
    expect(khopNhomLoc(khong, null)).toBe(true);
  });
  it("chữ hiện trong dòng nêu từng ngân hàng", () => {
    expect(chuThu(tomTatThu([k("chuyen_khoan", 1000, "Techcombank"), k("chuyen_khoan", 200), k("tien_mat", 30), k("the_tien", 5)]), dv)).toEqual(["Techcombank 1000", "Ngân hàng chưa rõ 200", "Tiền mặt 30", "Trừ thẻ tiền 5"]);
  });
});
