import { describe, expect, it } from "vitest";
import { dsNganHangNhan, nganHangChonSan, nganHangKhoanThu, type TaiKhoanNhan } from "../src/lib/ban-hang";

const tk = (ten: string, o: Partial<TaiKhoanNhan> = {}): TaiKhoanNhan => ({ ten, chiNhanhId: null, cx: true, qt: true, macDinh: false, ...o });

describe("ô Ngân hàng nhận ở Thu ngân", () => {
  it("bảng chưa có tài khoản nào thì dùng danh sách mặc định", () => {
    expect(dsNganHangNhan([], "vinh", "chuyen_khoan")).toEqual(["OCB", "Techcombank", "Vietcombank", "Khác"]);
  });
  it("lấy tài khoản đang dùng của chi nhánh (hoặc chung), tên ngắn, tài khoản mặc định lên đầu, có Khác ở cuối", () => {
    const ds = dsNganHangNhan([tk("Ngân hàng Vietcombank"), tk("Ngân hàng OCB", { macDinh: true }), tk("Ngân hàng BIDV", { chiNhanhId: "dalat" }), tk("Ngân hàng Vietcombank")], "vinh", "chuyen_khoan");
    expect(ds).toEqual(["OCB", "Vietcombank", "Khác"]);
  });
  it("quẹt thẻ chỉ lấy tài khoản có chức năng quẹt thẻ; không tài khoản nào hợp thì về mặc định", () => {
    expect(dsNganHangNhan([tk("Ngân hàng ACB", { qt: false }), tk("Ngân hàng MBBank")], "vinh", "quet_the")).toEqual(["MBBank", "Khác"]);
    expect(dsNganHangNhan([tk("Ngân hàng ACB", { qt: false })], "vinh", "quet_the")).toContain("Techcombank");
  });
  it("chọn sẵn ngân hàng lần trước nếu còn trong danh sách, không thì ngân hàng đầu", () => {
    expect(nganHangChonSan(["A", "B", "Khác"], "B")).toBe("B");
    expect(nganHangChonSan(["A", "B", "Khác"], "Z")).toBe("A");
    expect(nganHangChonSan(["A", "B"], null)).toBe("A");
  });
  it("máy chủ: chỉ chuyển khoản / quẹt thẻ mới ghi ngân hàng, tên được chuẩn hoá, tiền mặt và thẻ tiền luôn null", () => {
    expect(nganHangKhoanThu("chuyen_khoan", "Ngân hàng Techcombank")).toBe("Techcombank");
    expect(nganHangKhoanThu("quet_the", " VCB ")).toBe("Vietcombank");
    expect(nganHangKhoanThu("chuyen_khoan", "")).toBeNull();
    expect(nganHangKhoanThu("chuyen_khoan", undefined)).toBeNull();
    expect(nganHangKhoanThu("tien_mat", "Techcombank")).toBeNull();
    expect(nganHangKhoanThu("the_tien", "Techcombank")).toBeNull();
  });
});
