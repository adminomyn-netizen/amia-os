import { describe, expect, it } from "vitest";
import { docThietLapKhac, dongThietLapKhac, hoaDonDaKhoa, KHOA_GIO_KHOA_HD, loiThietLapKhac, macDinhThuNgan, THIET_LAP_KHAC_MAC_DINH, tienPhuPhi } from "@/lib/thiet-lap-khac";

describe("thiết lập khác (VAT, phụ phí, tip, khoá hoá đơn)", () => {
  it("chưa có dòng nào trong cau_hinh thì dùng giá trị SalonHero hiện tại", () => {
    expect(docThietLapKhac(null)).toEqual(THIET_LAP_KHAC_MAC_DINH);
    expect(THIET_LAP_KHAC_MAC_DINH).toMatchObject({ vatCheDo: "tuy_chon", vatPct: 10, khoaHdBat: false, phuPhiPct: 0, tipBat: false });
  });
  it("ghi rồi đọc lại ra đúng giá trị", () => {
    const moi = { vatCheDo: "ap_dung" as const, vatPct: 8, khoaHdBat: true, khoaHdGio: 24, phuPhiCheDo: "tuy_chon" as const, phuPhiPct: 2.5, tipBat: true };
    expect(docThietLapKhac(dongThietLapKhac(moi))).toEqual(moi);
    expect(dongThietLapKhac(moi).every((d) => (d.khoa.startsWith("tl.") || d.khoa === KHOA_GIO_KHOA_HD) && d.ghi_chu)).toBe(true);
  });
  it("giá trị hỏng trong DB thì rơi về mặc định, không ném lỗi", () => {
    expect(docThietLapKhac([{ khoa: "tl.vat_che_do", gia_tri: "linh tinh" }, { khoa: "tl.vat_pct", gia_tri: "abc" }])).toEqual(THIET_LAP_KHAC_MAC_DINH);
  });
  it("kiểm tra đầu vào", () => {
    const ok = { ...THIET_LAP_KHAC_MAC_DINH };
    expect(loiThietLapKhac(ok)).toBe("");
    expect(loiThietLapKhac({ ...ok, vatPct: 101 })).toMatch(/VAT/);
    expect(loiThietLapKhac({ ...ok, vatCheDo: "x" as never })).toMatch(/Chế độ/);
    expect(loiThietLapKhac({ ...ok, khoaHdBat: true, khoaHdGio: 0 })).toMatch(/từ 1/);
    expect(loiThietLapKhac({ ...ok, khoaHdGio: 1.5 })).toMatch(/số nguyên/);
    expect(loiThietLapKhac({ ...ok, phuPhiPct: 17 })).toMatch(/Phụ phí/);
  });
});

describe("tự khoá hoá đơn: lưu thêm khoá mo_lai_hoa_don đọc", () => {
  it("bật → số giờ; tắt → 0", () => {
    const gio = (t: typeof THIET_LAP_KHAC_MAC_DINH) => dongThietLapKhac(t).find((d) => d.khoa === KHOA_GIO_KHOA_HD)?.gia_tri;
    expect(gio({ ...THIET_LAP_KHAC_MAC_DINH, khoaHdBat: true, khoaHdGio: 48 })).toBe("48");
    expect(gio({ ...THIET_LAP_KHAC_MAC_DINH, khoaHdBat: false, khoaHdGio: 48 })).toBe("0");
  });
  it("chưa lưu ở màn này mà DB đã có hoa_don.khoa_sua_sau_gio > 0 thì hiện đang bật", () => {
    expect(docThietLapKhac([{ khoa: KHOA_GIO_KHOA_HD, gia_tri: "12" }])).toMatchObject({ khoaHdBat: true, khoaHdGio: 12 });
    expect(docThietLapKhac([{ khoa: KHOA_GIO_KHOA_HD, gia_tri: "0" }])).toMatchObject({ khoaHdBat: false });
  });
  it("hoaDonDaKhoa cùng luật hàm Postgres", () => {
    const bay = new Date("2026-11-03T12:00:00Z");
    expect(hoaDonDaKhoa("2026-11-03T09:00:00Z", 2, bay)).toBe(true);
    expect(hoaDonDaKhoa("2026-11-03T11:00:00Z", 2, bay)).toBe(false);
    expect(hoaDonDaKhoa("2026-11-01T00:00:00Z", 0, bay)).toBe(false);
    expect(hoaDonDaKhoa(null, 2, bay)).toBe(false);
  });
});

describe("Thu ngân áp VAT / phụ phí / tip theo cài đặt (như SalonHero)", () => {
  const goc = { vatCheDo: "tuy_chon" as const, vatPct: 10, phuPhiCheDo: "khong" as const, phuPhiPct: 0, tipBat: false };
  it("Tuỳ chọn tại thu ngân: hiện ô, mặc định chưa áp, bật thì đúng %", () => {
    expect(macDinhThuNgan(goc).vat).toEqual({ hien: true, choBatTat: true, pctKhiBat: 10, pctMacDinh: 0 });
  });
  it("Áp dụng cho mọi hoá đơn: tự áp, không cho tắt", () => {
    expect(macDinhThuNgan({ ...goc, vatCheDo: "ap_dung", vatPct: 8 }).vat).toEqual({ hien: true, choBatTat: false, pctKhiBat: 8, pctMacDinh: 8 });
  });
  it("Không áp dụng: ẩn, 0%", () => {
    expect(macDinhThuNgan({ ...goc, vatCheDo: "khong" }).vat).toEqual({ hien: false, choBatTat: false, pctKhiBat: 0, pctMacDinh: 0 });
    expect(macDinhThuNgan(goc).phuPhi.hien).toBe(false);
  });
  it("Tip tắt thì ẩn ô tip", () => {
    expect(macDinhThuNgan(goc).tip.hien).toBe(false);
    expect(macDinhThuNgan({ ...goc, tipBat: true }).tip.hien).toBe(true);
  });
  it("tiền phụ phí = % × tiền sau giảm, làm tròn đồng", () => {
    expect(tienPhuPhi(1_950_000, 2.5)).toBe(48_750);
    expect(tienPhuPhi(333, 1.5)).toBe(5);
    expect(tienPhuPhi(0, 10)).toBe(0);
    expect(tienPhuPhi(1_000_000, 0)).toBe(0);
  });
});
