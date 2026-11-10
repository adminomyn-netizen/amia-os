import { describe, expect, it } from "vitest";
import { datTienNhanh, dienPhanCon, HINH_THUC_NHANH, PHUONG_THUC, viTriNhanh, type KhoanThu } from "../src/lib/ban-hang";

const tong = (thu: KhoanThu[]) => thu.reduce((s, t) => s + t.so_tien, 0);

describe("khung Thanh toán: 3 hình thức nhập sẵn như SalonHero", () => {
  it("đúng thứ tự hàng đầu SalonHero: Tiền mặt, Quẹt thẻ, Chuyển khoản (đều là mã DB nhận)", () => {
    expect([...HINH_THUC_NHANH]).toEqual(["tien_mat", "quet_the", "chuyen_khoan"]);
    for (const pt of HINH_THUC_NHANH) expect(PHUONG_THUC.some((p) => p.gia_tri === pt)).toBe(true);
  });
  it("gõ số > 0 thì tạo khoản thu; chuyển khoản / quẹt thẻ kèm ngân hàng chọn sẵn, tiền mặt không có ngân hàng", () => {
    let thu: KhoanThu[] = [];
    thu = datTienNhanh(thu, "tien_mat", 500_000, "OCB");
    thu = datTienNhanh(thu, "chuyen_khoan", 1_000_000, "Vietcombank");
    expect(thu).toEqual([{ phuong_thuc: "tien_mat", so_tien: 500_000 }, { phuong_thuc: "chuyen_khoan", so_tien: 1_000_000, ngan_hang: "Vietcombank" }]);
  });
  it("gõ lại thì sửa đúng khoản đó, giữ ngân hàng đã chọn; xoá về 0 thì bỏ khoản (máy chủ không nhận khoản 0đ)", () => {
    let thu: KhoanThu[] = [{ phuong_thuc: "quet_the", so_tien: 100, ngan_hang: "Techcombank" }];
    thu = datTienNhanh(thu, "quet_the", 2_000_000, "OCB");
    expect(thu).toEqual([{ phuong_thuc: "quet_the", so_tien: 2_000_000, ngan_hang: "Techcombank" }]);
    expect(datTienNhanh(thu, "quet_the", 0)).toEqual([]);
    expect(datTienNhanh([], "tien_mat", 0)).toEqual([]);
  });
  it("ô nhập sẵn gắn với khoản ĐẦU TIÊN của hình thức; khoản chuyển khoản thứ hai và trừ thẻ tiền giữ nguyên", () => {
    const thu: KhoanThu[] = [{ phuong_thuc: "the_tien", so_tien: 300, the_id: "t1" }, { phuong_thuc: "chuyen_khoan", so_tien: 200, ngan_hang: "OCB" }, { phuong_thuc: "chuyen_khoan", so_tien: 100, ngan_hang: "Vietcombank" }];
    expect(viTriNhanh(thu, "chuyen_khoan")).toBe(1);
    expect(datTienNhanh(thu, "chuyen_khoan", 250)).toEqual([thu[0], { ...thu[1], so_tien: 250 }, thu[2]]);
  });
  it("bấm tên hình thức = điền nốt phần còn phải thu (tính cả số đang có trong ô)", () => {
    const phai = 3_000_000;
    let thu: KhoanThu[] = [{ phuong_thuc: "tien_mat", so_tien: 1_000_000 }];
    thu = dienPhanCon(thu, "chuyen_khoan", phai, "OCB");
    expect(thu[1]).toEqual({ phuong_thuc: "chuyen_khoan", so_tien: 2_000_000, ngan_hang: "OCB" });
    expect(phai - tong(thu)).toBe(0);
    // ô tiền mặt đã có 1tr, chuyển khoản 2tr: bấm Tiền mặt → tiền mặt = 3tr − 2tr = 1tr (không cộng dồn thành 2tr).
    expect(dienPhanCon(thu, "tien_mat", phai)[0].so_tien).toBe(1_000_000);
    // các khoản khác đã đủ (hoặc thừa) thì ô bấm về 0 và bị bỏ.
    expect(dienPhanCon([{ phuong_thuc: "quet_the", so_tien: 3_500_000 }, { phuong_thuc: "tien_mat", so_tien: 5 }], "tien_mat", phai)).toEqual([{ phuong_thuc: "quet_the", so_tien: 3_500_000 }]);
  });
  it("đã thu = tổng các ô, còn nợ = phải thu − đã thu (công thức không đổi)", () => {
    const phai = 5_000_000;
    let thu: KhoanThu[] = [];
    thu = datTienNhanh(thu, "tien_mat", 1_000_000);
    thu = datTienNhanh(thu, "quet_the", 1_500_000, "OCB");
    thu = datTienNhanh(thu, "chuyen_khoan", 500_000, "OCB");
    expect(tong(thu)).toBe(3_000_000);
    expect(phai - tong(thu)).toBe(2_000_000);
  });
});
