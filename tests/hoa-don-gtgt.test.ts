import { describe, expect, it } from "vitest";
import { dungNoiDung, hinhThucTuThu, kiemNguoiBan, kiemNguoiMua, nguoiMuaTuKhach, taoXml, tenTepXml, thieuNguoiBan, thueSuatHoaDon, type DonNguon } from "@/lib/hoa-don-gtgt";

const don = (o: Partial<DonNguon> = {}): DonNguon => ({ vat_pct: 0, vat_tien: 0, giam_gia_don: 0, giam_voucher: 0, giam_diem: 0, phu_phi: 0, tip: 0, tong_phai_thu: 0, tien_tru_the: 0, ...o });
const mua = nguoiMuaTuKhach(null);

describe("Mẫu hoá đơn GTGT — dựng nội dung", () => {
  it("đơn đã cộng VAT riêng: giữ tiền trước thuế, tiền thuế đúng trên đơn", () => {
    const nd = dungNoiDung(don({ vat_pct: 10, vat_tien: 90_000, giam_gia_don: 100_000, tong_phai_thu: 990_000 }),
      [{ ten: "Chăm sóc da", loai: "dich_vu", so_luong: 1, don_gia: 1_000_000, giam_gia: 0, thanh_tien: 1_000_000 }, { ten: "Buổi trừ thẻ", loai: "dich_vu", so_luong: 1, don_gia: 0, giam_gia: 0, thanh_tien: 0 }],
      { nguoiMua: mua, thueSuat: thueSuatHoaDon({ vat_pct: 10, vat_tien: 90_000 }, "KCT", "8"), hinhThuc: "CK" });
    expect(nd.thue_suat).toBe("10%");
    expect(nd.dong.map((d) => [d.tinh_chat, d.thanh_tien])).toEqual([[1, 1_000_000], [3, 100_000]]);
    expect(nd.tong).toMatchObject({ truoc_thue: 900_000, tien_thue: 90_000, ck_tm: 100_000, thanh_toan: 990_000, bang_chu: "Chín trăm chín mươi nghìn đồng" });
    expect(nd.canh_bao).toEqual([]);
  });
  it("đơn không cộng VAT: tiền khách trả đã gồm thuế → tách ngược, tổng vẫn đúng số khách trả (trừ tip)", () => {
    const nd = dungNoiDung(don({ tong_phai_thu: 1_150_000, tip: 50_000, phu_phi: 0 }),
      [{ ten: "Kem", loai: "san_pham", so_luong: 2, don_gia: 300_000, giam_gia: 50_000, thanh_tien: 550_000 }, { ten: "Thẻ 10 buổi", loai: "goi_the", so_luong: 1, don_gia: 550_000, giam_gia: 0, thanh_tien: 550_000 }],
      { nguoiMua: mua, thueSuat: "10", hinhThuc: "TM" });
    expect(nd.gia_da_gom_thue).toBe(true);
    expect(nd.tong.thanh_toan).toBe(1_100_000);
    expect(nd.tong.truoc_thue).toBe(1_000_000);
    expect(nd.tong.tien_thue).toBe(100_000);
    expect(nd.dong[0]).toMatchObject({ dvt: "Cái", sl: 2, don_gia: 272_727.27, thanh_tien: 500_000 });
    expect(nd.tip).toBe(50_000);
    expect(nd.canh_bao).toEqual([]);
  });
  it("KCT: không tách thuế; tổng lệch thì cảnh báo, không làm tròn lặng lẽ", () => {
    const nd = dungNoiDung(don({ tong_phai_thu: 500_000 }), [{ ten: "A", loai: "dich_vu", so_luong: 1, don_gia: 400_000, giam_gia: 0, thanh_tien: 400_000 }], { nguoiMua: mua, thueSuat: "KCT", hinhThuc: "TM" });
    expect(nd.tong.tien_thue).toBe(0);
    expect(nd.canh_bao.join(" ")).toContain("khác số khách phải trả");
  });
  it("đơn chỉ có buổi trừ thẻ: cảnh báo không cần xuất", () => {
    const nd = dungNoiDung(don(), [{ ten: "Buổi", loai: "dich_vu", so_luong: 1, don_gia: 0, giam_gia: 0, thanh_tien: 0 }], { nguoiMua: mua, thueSuat: "10", hinhThuc: "TM" });
    expect(nd.dong).toEqual([]);
    expect(nd.canh_bao.join(" ")).toContain("không cần xuất");
  });
  it("hình thức thanh toán", () => {
    expect(hinhThucTuThu(["tien_mat"])).toBe("TM");
    expect(hinhThucTuThu(["chuyen_khoan", "quet_the"])).toBe("CK");
    expect(hinhThucTuThu(["tien_mat", "chuyen_khoan"])).toBe("TM/CK");
    expect(hinhThucTuThu(["the_tien"])).toBe("TM/CK");
  });
});

describe("Kiểm người bán / người mua", () => {
  it("người bán: để trống được, sai dạng thì báo", () => {
    expect(kiemNguoiBan({})).toMatchObject({ ok: { mau_so: "1", thue_suat: "10", ky_hieu: "" } });
    expect(kiemNguoiBan({ ky_hieu: "1c26taa" })).toMatchObject({ ok: { ky_hieu: "C26TAA" } });
    expect(kiemNguoiBan({ ky_hieu: "C26XAA" })).toHaveProperty("loi");
    expect(kiemNguoiBan({ ma_so_thue: "12345" })).toHaveProperty("loi");
    expect(thieuNguoiBan({ ten_don_vi: "A", ma_so_thue: "", dia_chi: "x", ky_hieu: "" })).toEqual(["mã số thuế", "ký hiệu hoá đơn"]);
  });
  it("người mua như SalonHero: doanh nghiệp bắt buộc MST + tên + địa chỉ; khách lẻ bỏ MST", () => {
    expect(kiemNguoiMua({ loai: "doanh_nghiep", ten_don_vi: "Cty", dia_chi: "x" })).toEqual({ loi: "Xuất cho doanh nghiệp phải có mã số thuế." });
    expect(kiemNguoiMua({ loai: "ca_nhan", cccd: "123" })).toHaveProperty("loi");
    expect(kiemNguoiMua({ loai: "khach_le", mst: "0100109106" })).toMatchObject({ ok: { mst: "" } });
    expect(nguoiMuaTuKhach({ ho_ten: "Lan", cong_ty: "Cty B", ma_so_thue: "0100109106" })).toMatchObject({ loai: "doanh_nghiep", ten_don_vi: "Cty B", ho_ten: "Lan" });
    expect(nguoiMuaTuKhach({ ho_ten: "Lan" })).toMatchObject({ loai: "ca_nhan", mst: "" });
  });
});

describe("XML theo cấu trúc HĐĐT của Tổng cục Thuế", () => {
  it("đủ thẻ, đúng thứ tự, thoát ký tự đặc biệt", () => {
    const nd = dungNoiDung(don({ vat_pct: 8, vat_tien: 80_000, tong_phai_thu: 1_080_000 }), [{ ten: "Peel <da> & nám", loai: "dich_vu", so_luong: 1, don_gia: 1_000_000, giam_gia: 0, thanh_tien: 1_000_000 }],
      { nguoiMua: { loai: "doanh_nghiep", ten_don_vi: "Cty B", mst: "0100109106", cccd: "", dia_chi: "Vinh", ho_ten: "Lan", dien_thoai: "", email: "a@b.vn" }, thueSuat: "8", hinhThuc: "CK" });
    const x = taoXml({ mau_so: "1", ky_hieu: "C26TAA", so: 12, ngay_lap: "2026-11-03" }, { ten: "Cty A", mst: "2901234567", dia_chi: "Vinh" }, nd);
    for (const t of ["<PBan>2.0.1</PBan>", "<THDon>Hóa đơn giá trị gia tăng</THDon>", "<KHMSHDon>1</KHMSHDon>", "<KHHDon>C26TAA</KHHDon>", "<SHDon>12</SHDon>", "<NLap>2026-11-03</NLap>", "<HTTToan>Chuyển khoản</HTTToan>",
      "<NMua><Ten>Cty B</Ten><MST>0100109106</MST><DChi>Vinh</DChi><DCTDTu>a@b.vn</DCTDTu><HVTNMHang>Lan</HVTNMHang></NMua>", "<THHDVu>Peel &lt;da&gt; &amp; nám</THHDVu>",
      "<LTSuat><TSuat>8%</TSuat><ThTien>1000000</ThTien><TThue>80000</TThue></LTSuat>", "<TgTTTBSo>1080000</TgTTTBSo>", "<TgTTTBChu>Một triệu không trăm tám mươi nghìn đồng</TgTTTBChu>"]) expect(x).toContain(t);
    expect(x.indexOf("<TTChung>")).toBeLessThan(x.indexOf("<NDHDon>"));
    expect(x.indexOf("<NBan>")).toBeLessThan(x.indexOf("<NMua>"));
    expect(tenTepXml({ mau_so: "1", ky_hieu: "C26TAA", so: 12 }, "2901234567")).toBe("2901234567_1C26TAA_00000012.xml");
  });
});
