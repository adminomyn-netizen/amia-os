import { describe, expect, it } from "vitest";
import { dongTuHoaDon, khoangHoaDonNgay, phanLoaiHoaDon, tomTatHang, tongHoaDonNgay } from "@/lib/bao-cao-hoa-don-ngay";

// Báo cáo › Hoá đơn trong ngày (chi nhánh Vinh 18/11/2026): chia nhóm theo quy tắc Thu ngân, tổng chỉ cộng hoá đơn hoàn thành.
const hd = (o: Partial<Parameters<typeof dongTuHoaDon>[0]> = {}) => dongTuHoaDon({
  id: "h1", ma: "HD0001", sh_ma: null, ngay_hd: "2026-11-18", tao_luc: "2026-11-18T02:30:00Z", trang_thai: "hoan_thanh", tong_phai_thu: 1000000, da_thu: 1000000, con_no: 0,
  khach_id: "k1", la_lich_su: false, thu_ngan_ten: null, khach: { ma: "KH1", ho_ten: "Nguyễn Thị A" }, lap: { ho_ten: "Vân Anh" }, dong: [{ loai: "dich_vu", ten: "Peel da", so_luong: 1 }], ...o,
});

describe("phân loại hoá đơn dịch vụ / bán hàng", () => {
  it("mọi dòng dịch vụ → dịch vụ; có sản phẩm / thẻ (kể cả lẫn) → bán hàng; không dòng → bán hàng", () => {
    expect(phanLoaiHoaDon([{ loai: "dich_vu" }, { loai: "dich_vu" }])).toBe("dich_vu");
    expect(phanLoaiHoaDon([{ loai: "dich_vu" }, { loai: "san_pham" }])).toBe("ban");
    expect(phanLoaiHoaDon([{ loai: "goi_the" }])).toBe("ban");
    expect(phanLoaiHoaDon([])).toBe("ban");
  });
});

describe("dòng báo cáo", () => {
  it("khách lẻ, người lập SalonHero, gộp tên hàng trùng", () => {
    const r = hd({ khach_id: null, khach: null, la_lich_su: true, thu_ngan_ten: "Thu ngân SH", dong: [{ loai: "san_pham", ten: "Kem", so_luong: 1 }, { loai: "san_pham", ten: "Kem", so_luong: 2 }, { loai: "dich_vu", ten: "Peel da", so_luong: 1 }] });
    expect(r).toMatchObject({ khach: "Khách lẻ", maKhach: "", nguoiLap: "Thu ngân SH", loai: "ban", hang: "Kem × 3, Peel da" });
    expect(tomTatHang([])).toBe("");
  });
  it("đơn đang xử lý không tính nợ", () => {
    expect(hd({ trang_thai: "nhap", con_no: 500000 }).conNo).toBe(0);
  });
});

describe("tổng cuối bảng", () => {
  it("chỉ cộng hoá đơn hoàn thành, đếm riêng đơn đang xử lý", () => {
    const t = tongHoaDonNgay([hd(), hd({ id: "h2", tong_phai_thu: 2000000, da_thu: 1500000, con_no: 500000 }), hd({ id: "h3", trang_thai: "nhap", tong_phai_thu: 9000000, da_thu: 0 })]);
    expect(t).toEqual({ soDon: 2, phaiThu: 3000000, daThu: 2500000, conNo: 500000, soDangXuLy: 1 });
  });
});

describe("khoảng ngày", () => {
  it("tối đa 31 ngày tính lùi từ ngày cuối", () => {
    expect(khoangHoaDonNgay("2026-11-18", "2026-11-18")).toEqual({ tu: "2026-11-18", den: "2026-11-18", quaDai: false });
    expect(khoangHoaDonNgay("2026-10-01", "2026-11-18")).toEqual({ tu: "2026-10-19", den: "2026-11-18", quaDai: true });
    expect(khoangHoaDonNgay("2026-10-19", "2026-11-18").quaDai).toBe(false);
  });
});
