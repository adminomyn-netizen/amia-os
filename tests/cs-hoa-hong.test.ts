import { describe, expect, it } from "vitest";
import {
  CAU_HINH_MAC_DINH as C, doanhSoTelesale, doanhThuGiaSan, heSoTran, hoaHongGiamDoc, hoaHongMarketing, luyTien, phanLoaiDong, thuongGianTiep,
  thuongVuotChiTieu, tiLeThang, tinhHoaHongBan, tinhPhiTriLieu, type DongDoanhSo, type DongDonGia, type NguCanhGia,
} from "@/lib/cs-hoa-hong";

// Số liệu lấy nguyên từ phần VÍ DỤ trong PL05, PL06 và Quy định phí trị liệu (áp dụng 01/11/2026).
const ty = 1_000_000_000, tr = 1_000_000;

describe("lũy tiến theo từng phần", () => {
  it("đúng mốc 1,8 tỷ và 2,8 tỷ", () => {
    expect(luyTien(1.8 * ty, C.gd.bac)).toBeCloseTo(14.4 * tr);
    expect(luyTien(2.8 * ty, C.gd.bac)).toBeCloseTo(34.4 * tr);
    expect(luyTien(0, C.gd.bac)).toBe(0);
  });
});

describe("PL06 hoa hồng quản lý", () => {
  it("Giám đốc chi nhánh: 1,5 tỷ, giá sàn 150 triệu → 11,4 triệu", () => {
    const r = hoaHongGiamDoc(1.5 * ty, 150 * tr, C);
    expect(r.dsTinh).toBeCloseTo(1.425 * ty); expect(r.hh).toBeCloseTo(11.4 * tr);
  });
  it("Giám đốc chi nhánh: 3,2 tỷ, giá sàn 320 triệu → 41,6 triệu", () => {
    const r = hoaHongGiamDoc(3.2 * ty, 320 * tr, C);
    expect(r.dsTinh).toBeCloseTo(3.04 * ty); expect(r.hh).toBeCloseTo(41.6 * tr);
  });
  it("Trưởng phòng Marketing: 1,5 tỷ / mang về 700 triệu → 3,5 triệu; 3,2 tỷ / 1,6 tỷ → 0,78125% = 12,5 triệu", () => {
    expect(hoaHongMarketing(1.5 * ty, 700 * tr, 0.12 * 1.5 * ty, C).hh).toBeCloseTo(3.5 * tr);
    const r = hoaHongMarketing(3.2 * ty, 1.6 * ty, 0.12 * 3.2 * ty, C);
    expect(r.tl).toBeCloseTo(0.0078125); expect(r.hh).toBeCloseTo(12.5 * tr);
  });
  it("chi phí quảng cáo vượt 15% doanh số chi nhánh: không hưởng", () => {
    const r = hoaHongMarketing(2 * ty, 1 * ty, 0.16 * 2 * ty, C);
    expect(r.vuotQc).toBe(true); expect(r.hh).toBe(0);
  });
});

describe("PL05 telesale (tỉ lệ tháng)", () => {
  it("chi nhánh 1,5 tỷ → 0,5%; mang về 500 triệu → 2,5 triệu", () => expect(500 * tr * tiLeThang(1.5 * ty, C.telesale.bac)).toBeCloseTo(2.5 * tr));
  it("chi nhánh 2,4 tỷ → 0,575%; mang về 600 triệu → 3,45 triệu", () => {
    expect(tiLeThang(2.4 * ty, C.telesale.bac)).toBeCloseTo(0.00575);
    expect(600 * tr * tiLeThang(2.4 * ty, C.telesale.bac)).toBeCloseTo(3.45 * tr);
  });
  it("ghép lịch do telesale đặt trong 30 ngày (tên có mã MSC, khác hoa thường, không dấu)", () => {
    const r = doanhSoTelesale(
      [{ hoaDonId: "h1", khachId: "k1", ngay: "2026-11-20", tien: 10 * tr }, { hoaDonId: "h2", khachId: "k2", ngay: "2026-11-20", tien: 5 * tr }, { hoaDonId: "h3", khachId: "k1", ngay: "2026-12-30", tien: 7 * tr }],
      [{ khachId: "k1", ngay: "2026-11-01", nguoiTao: "dao thi NGUYEN" }, { khachId: "k2", ngay: "2026-11-02", nguoiTao: "Người lạ" }],
      [{ id: "ts1", ten: "MSC.CT-24.0001.Đào Thị Nguyên" }], 30,
    );
    expect(r.theoNv.get("ts1")).toEqual({ ds: 10 * tr, soHd: 1 });
    expect(r.nguoiDatChuaKhop).toEqual([["Người lạ", 1]]);
  });
});

describe("PL05 khối gián tiếp", () => {
  it("dưới 2 tỷ không thưởng; mốc 1; mốc 2", () => {
    expect(thuongGianTiep(1.99 * ty, "nv", C)).toBe(0);
    expect(thuongGianTiep(2.4 * ty, "nv", C)).toBe(300_000); expect(thuongGianTiep(2.4 * ty, "ql", C)).toBe(500_000);
    expect(thuongGianTiep(2.8 * ty, "nv", C)).toBe(500_000); expect(thuongGianTiep(4 * ty, "ql", C)).toBe(1_000_000);
  });
});

describe("PL05 tư vấn — ví dụ cả tháng (chỉ tiêu 400 triệu, bán 480 triệu)", () => {
  const g: NguCanhGia = {
    dichVu: new Map([["dvA", { km: 10 * tr, toiThieu: 6 * tr }]]),
    goi: new Map(),
    danhMuc: [{ id: "1", ten: "Thẻ Amia Gold", km: 100 * tr, goiId: "gold", dvId: null }, { id: "2", ten: "Ichi Lift Therapy", km: 50 * tr, goiId: "ichi", dvId: null }],
  };
  const tv = [{ nv: "A", vai: "tu_van", tl: 100 }];
  const d = (x: Partial<DongDoanhSo>): DongDoanhSo => ({ dongId: "x", cn: "cn", khachId: "k", khachNguon: "khac", khachMoi: false, loai: "dich_vu", dvId: null, goiId: null, giaRong: 0, tt: 0, nguoi: tv, ...x });
  const dong = [
    d({ dvId: "dvA", giaRong: 10 * tr, tt: 255 * tr }),
    d({ dvId: "dvA", giaRong: 8 * tr, tt: 50 * tr }),
    d({ loai: "goi_the", goiId: "gold", giaRong: 100 * tr, tt: 100 * tr }),
    d({ loai: "goi_the", goiId: "ichi", giaRong: 45 * tr, tt: 45 * tr }),
    d({ loai: "san_pham", tt: 30 * tr }),
  ];
  const kq = tinhHoaHongBan(dong, g, C).get("A")!;
  it("từng khoản đúng như phụ lục", () => {
    expect(kq.theoKhoan.dv_km!.hh).toBeCloseTo(3.825 * tr);
    expect(kq.theoKhoan.dv_san!.hh).toBeCloseTo(350_000);
    expect(kq.theoKhoan.goi_km!.hh).toBeCloseTo(2 * tr);
    expect(kq.theoKhoan.goi_duoi_km!.hh).toBeCloseTo(450_000);
    expect(kq.theoKhoan.my_pham!.hh).toBeCloseTo(900_000);
  });
  it("vượt chỉ tiêu (480 − 400) × 3% = 2,4 triệu", () => {
    expect(kq.ds).toBeCloseTo(480 * tr);
    expect(thuongVuotChiTieu(kq.ds, 400 * tr, C)).toBeCloseTo(2.4 * tr);
    expect(thuongVuotChiTieu(kq.ds, null, C)).toBe(0);
  });
  it("khách mới tự khai thác: 3% thay cho các mức khác; chia đơn 2 người theo tỉ lệ", () => {
    const r = tinhHoaHongBan([d({ dvId: "dvA", giaRong: 10 * tr, tt: 20 * tr, khachMoi: true, khachNguon: "tu_van", nguoi: [{ nv: "A", vai: "tu_van", tl: 50 }, { nv: "B", vai: "tu_van", tl: 50 }, { nv: "C", vai: "ban", tl: 100 }] })], g, C);
    expect(r.get("A")!.hh).toBeCloseTo(300_000); expect(r.get("B")!.hh).toBeCloseTo(300_000); expect(r.has("C")).toBe(false);
  });
  it("phân loại giá: dưới giá tối thiểu không tính, chưa có giá KM đánh dấu riêng", () => {
    expect(phanLoaiDong(d({ dvId: "dvA", giaRong: 5 * tr }), g).khoan).toBe("dv_duoi_tt");
    expect(phanLoaiDong(d({ dvId: "khac", giaRong: 5 * tr }), g).khoan).toBe("dv_chua_gia");
    expect(doanhThuGiaSan(dong, g)).toBeCloseTo(95 * tr);
  });
});

describe("Phí trị liệu", () => {
  const dg = (doiTuong: "bac_si" | "tri_lieu", stt: number, donGia: number, ten: string): DongDonGia => ({ id: `${doiTuong}${stt}`, doiTuong, stt, ten, dvt: "Lần", donGia, dvIds: new Set(), tenGhep: new Set([ten.toLowerCase()]) });
  const bang = [dg("bac_si", 17, 120_000, "Pico Plus Full"), dg("bac_si", 6, 500_000, "HA Volumax"), dg("tri_lieu", 1, 15_000, "Ha Facial")];
  const nhom = (nv: string) => ({ bs: "bac_si", tlv: "tri_lieu" })[nv] ?? null;
  const ca = (ten: string, soLuong: number, nguoi: string[]) => ({ dongId: ten + soLuong + nguoi.join(), ngay: "2026-11-02", maHd: "HD", khach: "K", dvId: null, ten, soLuong, nguoi: nguoi.map((nv) => ({ nv, tl: 100 })), loaiTru: null });
  it("10 ca Pico Plus Full + 5 cc HA Volumax = 3.700.000đ", () => {
    const r = tinhPhiTriLieu([...Array.from({ length: 10 }, () => ca("Pico Plus Full", 1, ["bs"])), ca("HA Volumax", 5, ["bs"])], bang, nhom, C);
    expect(r.dong.reduce((s, x) => s + x.tien, 0)).toBe(3_700_000);
  });
  it("ca có bác sĩ: trị liệu viên hỗ trợ 15.000đ; ca trị liệu viên tự làm theo PL02", () => {
    const r = tinhPhiTriLieu([ca("Pico Plus Full", 1, ["bs", "tlv"]), ca("Ha Facial", 1, ["tlv"])], bang, nhom, C);
    expect(r.dong.filter((x) => x.nv === "tlv").map((x) => x.tien)).toEqual([15_000, 15_000]);
  });
  it("chưa có đơn giá và ca không tính phí được tách riêng", () => {
    const r = tinhPhiTriLieu([ca("Dịch vụ lạ", 1, ["bs"]), { ...ca("Pico Plus Full", 1, ["bs"]), loaiTru: "Bảo hành" }, ca("Pico Plus Full", 1, ["le_tan"])], bang, nhom, C);
    expect(r.chuaDonGia).toHaveLength(1); expect(r.loaiTru).toHaveLength(1); expect(r.nguoiKhac).toHaveLength(1); expect(r.dong).toHaveLength(0);
  });
  it("trần chi: vượt 3% doanh số dịch vụ thì nhân hệ số", () => {
    const h = heSoTran(3.7 * tr, 100 * tr, 0.03); expect(h.tran).toBeCloseTo(3 * tr); expect(h.heSo).toBeCloseTo(3 / 3.7);
    expect(heSoTran(1 * tr, 100 * tr, 0.03).heSo).toBe(1);
  });
});

describe("Bảng tham khảo (khớp sheet PL05/PL06)", async () => {
  const { dongThamKhao } = await import("@/lib/cs-hoa-hong");
  const gd = { giaSan: 0.1, mkt: 0.5, telesale: 0.3, qc: 0.12, dsTuVan: 0.25, chiTieuTuVan: 0.22, tuVanKm: 0.6, tuVanGoiDungGia: 0.2, dsTlv: 0.03 };
  it("1,24 tỷ", () => {
    const r = dongThamKhao(1.24 * ty, gd, C);
    expect(Math.round(r.tuVan)).toBe(5_580_000); expect(Math.round(r.triLieu)).toBe(558_000); expect(Math.round(r.telesale)).toBe(1_860_000);
    expect(Math.round(r.giamDoc)).toBe(9_424_000); expect(Math.round(r.marketing)).toBe(3_100_000);
  });
  it("2 tỷ và 4 tỷ", () => {
    const a = dongThamKhao(2 * ty, gd, C), b = dongThamKhao(4 * ty, gd, C);
    expect(Math.round(a.telesale)).toBe(3_180_000); expect(Math.round(a.giamDoc)).toBe(16_400_000); expect(Math.round(a.marketing)).toBe(5_500_000);
    expect(Math.round(b.tuVan)).toBe(18_000_000); expect(Math.round(b.telesale)).toBe(8_700_000); expect(Math.round(b.giamDoc)).toBe(64_400_000); expect(Math.round(b.marketing)).toBe(18_500_000);
  });
});
