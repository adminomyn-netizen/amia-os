import { describe, expect, it } from "vitest";
import { apLuaChonNhan, datTienNhanh, dsLuaChonNhan, kiemTaiKhoanKhoan, luaChonCuaKhoan, luaChonTaiKhoanForm, type KhoanThu, type TaiKhoanNhan } from "../src/lib/ban-hang";

// Số tài khoản trong test là số giả.
const tk = (id: string, ten: string, o: Partial<TaiKhoanNhan> = {}): TaiKhoanNhan => ({ id, ten, chu: "Chủ " + id, so: "0001234", chiNhanhId: null, cx: true, qt: true, macDinh: false, ...o });

describe("ô Tài khoản nhận ở Thu ngân (0323)", () => {
  it("mỗi tài khoản một lựa chọn (cùng ngân hàng vẫn tách), mặc định lên đầu, lọc chi nhánh + chức năng, cuối là Khác", () => {
    const ds = dsLuaChonNhan([tk("a", "Ngân hàng Vietcombank"), tk("b", "Ngân hàng Vietcombank", { macDinh: true }), tk("c", "Ngân hàng OCB", { qt: false }), tk("d", "Ngân hàng BIDV", { chiNhanhId: "dalat" })], "vinh", "chuyen_khoan");
    expect(ds.map((x) => x.gia_tri)).toEqual(["b", "a", "c", "Khác"]);
    expect(ds[0]).toMatchObject({ nhan: "Vietcombank 0001234 · Chủ b", ten: "Vietcombank", tkId: "b" });
    expect(dsLuaChonNhan([tk("c", "Ngân hàng OCB", { qt: false })], "vinh", "quet_the").some((x) => x.gia_tri === "c")).toBe(false);
  });
  it("chưa có tài khoản nào có id thì về danh sách tên ngân hàng như trước", () => {
    expect(dsLuaChonNhan([], "vinh", "chuyen_khoan").map((x) => x.gia_tri)).toEqual(["OCB", "Techcombank", "Vietcombank", "Khác"]);
  });
  it("chọn tài khoản ghi cả id + tên ngắn; chọn Khác bỏ id", () => {
    const ds = dsLuaChonNhan([tk("a", "Ngân hàng Vietcombank")], "vinh", "chuyen_khoan");
    const t: KhoanThu = { phuong_thuc: "chuyen_khoan", so_tien: 100 };
    const a = apLuaChonNhan(t, "a", ds);
    expect(a).toEqual({ phuong_thuc: "chuyen_khoan", so_tien: 100, tai_khoan_id: "a", ngan_hang: "Vietcombank" });
    expect(luaChonCuaKhoan(a)).toBe("a");
    const k = apLuaChonNhan(a, "Khác", ds);
    expect(k).toEqual({ phuong_thuc: "chuyen_khoan", so_tien: 100, ngan_hang: "Khác" });
    expect(luaChonCuaKhoan(k)).toBe("Khác");
  });
  it("ô nhập sẵn tạo khoản mới kèm tài khoản chọn sẵn; tiền mặt không kèm", () => {
    expect(datTienNhanh([], "chuyen_khoan", 500, "Vietcombank", "a")).toEqual([{ phuong_thuc: "chuyen_khoan", so_tien: 500, ngan_hang: "Vietcombank", tai_khoan_id: "a" }]);
    expect(datTienNhanh([], "tien_mat", 500, "Vietcombank", "a")).toEqual([{ phuong_thuc: "tien_mat", so_tien: 500 }]);
  });
});

describe("máy chủ kiểm tài khoản nhận", () => {
  const dong = { hoat_dong: true, chi_nhanh_id: null as string | null, dung_chuyen_khoan: true, dung_quet_the: false };
  it("hợp lệ / ẩn / chi nhánh khác / sai chức năng / tiền mặt", () => {
    expect(kiemTaiKhoanKhoan("chuyen_khoan", dong, "vinh")).toBeNull();
    expect(kiemTaiKhoanKhoan("chuyen_khoan", { ...dong, hoat_dong: false }, "vinh")).toMatch(/không còn dùng/);
    expect(kiemTaiKhoanKhoan("chuyen_khoan", undefined, "vinh")).toMatch(/không còn dùng/);
    expect(kiemTaiKhoanKhoan("chuyen_khoan", { ...dong, chi_nhanh_id: "dalat" }, "vinh")).toMatch(/chi nhánh khác/);
    expect(kiemTaiKhoanKhoan("quet_the", dong, "vinh")).toMatch(/quẹt thẻ/);
    expect(kiemTaiKhoanKhoan("tien_mat", dong, "vinh")).not.toBeNull();
  });
  it("hộp Thu nợ: tài khoản của chi nhánh hoặc dùng chung, ghi rõ chỉ một hình thức, cuối là Khác", () => {
    const r = (id: string, o = {}) => ({ id, ngan_hang: "Ngân hàng OCB", chu_tai_khoan: "A", so_tai_khoan: "00 1234 5678", chi_nhanh_id: null, dung_chuyen_khoan: true, dung_quet_the: true, mac_dinh: false, ...o });
    const ds = luaChonTaiKhoanForm([r("x", { dung_quet_the: false }), r("y", { chi_nhanh_id: "dalat" }), r("z", { mac_dinh: true })], "vinh");
    expect(ds.map((x) => x.gia_tri)).toEqual(["z", "x", "Khác"]);
    expect(ds[1].nhan).toBe("OCB 0012345678 · A (chỉ chuyển khoản)");
  });
});
