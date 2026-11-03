import { describe, expect, it } from "vitest";
import { coOChiNhanh, giaDong, hienDatLich, hienOThuNgan, hienThuNgan, kiemGiaDong, lamSachDongNhap, tinhDon, tinhGiamVoucher, type DongDon } from "@/lib/ban-hang";

const CN1 = "11111111-1111-4111-8111-111111111111", CN2 = "22222222-2222-4222-8222-222222222222";
describe("Nơi hiển thị + Địa điểm cung cấp (cột 0194)", () => {
  it("tat_ca hiện cả hai; thu_ngan chỉ thu ngân; dat_lich chỉ đặt lịch; an ẩn cả hai", () => {
    expect([hienThuNgan("tat_ca"), hienDatLich("tat_ca")]).toEqual([true, true]);
    expect([hienThuNgan("thu_ngan"), hienDatLich("thu_ngan")]).toEqual([true, false]);
    expect([hienThuNgan("dat_lich"), hienDatLich("dat_lich")]).toEqual([false, true]);
    expect([hienThuNgan("an"), hienDatLich("an")]).toEqual([false, false]);
  });
  it("giá trị lạ / trống giữ hành vi cũ (hiện)", () => { expect(hienThuNgan(null)).toBe(true); expect(hienDatLich(undefined)).toBe(true); });
  it("chi nhánh: null hoặc rỗng = mọi chi nhánh; chưa chọn chi nhánh thì không lọc", () => {
    expect(coOChiNhanh(null, CN1)).toBe(true);
    expect(coOChiNhanh([], CN1)).toBe(true);
    expect(coOChiNhanh([CN2], CN1)).toBe(false);
    expect(coOChiNhanh([CN1, CN2], CN1)).toBe(true);
    expect(coOChiNhanh([CN2], "")).toBe(true);
  });
  it("ô chọn thu ngân gộp hai điều kiện", () => {
    expect(hienOThuNgan({ anThuNgan: false, chiNhanhIds: [CN1] }, CN1)).toBe(true);
    expect(hienOThuNgan({ anThuNgan: true, chiNhanhIds: null }, CN1)).toBe(false);
    expect(hienOThuNgan({ chiNhanhIds: [CN2] }, CN1)).toBe(false);
  });
});

const dv = { ten: "[THỬ] Dịch vụ", gia: 500_000, choSuaGia: true };
describe("Sửa giá khi thanh toán (cho_sua_gia)", () => {
  it("không sửa giá thì dùng giá danh mục, kể cả mục không bật cờ", () => {
    expect(kiemGiaDong({ loai: "dich_vu" }, { ...dv, choSuaGia: false })).toEqual({ ok: true, gia: 500_000 });
    expect(giaDong({}, dv)).toBe(500_000);
  });
  it("mục bật cờ thì nhận giá sửa (cả tăng lẫn giảm, cả 0đ)", () => {
    expect(kiemGiaDong({ loai: "dich_vu", gia: 350_000 }, dv)).toEqual({ ok: true, gia: 350_000 });
    expect(kiemGiaDong({ loai: "san_pham", gia: 700_000 }, dv)).toEqual({ ok: true, gia: 700_000 });
    expect(kiemGiaDong({ loai: "dich_vu", gia: 0 }, dv)).toEqual({ ok: true, gia: 0 });
    expect(giaDong({ gia: 350_000 }, dv)).toBe(350_000);
  });
  it("mục KHÔNG bật cờ mà có giá sửa thì chặn", () => expect(kiemGiaDong({ loai: "dich_vu", gia: 1 }, { ...dv, choSuaGia: false }).ok).toBe(false));
  // Đợt 2 câu 6 (03/11): y SalonHero, thẻ bật "Sửa giá khi thanh toán" cũng sửa được đơn giá dòng.
  it("thẻ bật cờ thì sửa được giá, tắt cờ thì không", () => {
    expect(kiemGiaDong({ loai: "goi_the", gia: 1 }, dv)).toEqual({ ok: true, gia: 1 });
    expect(kiemGiaDong({ loai: "goi_the", gia: 1 }, { ...dv, choSuaGia: false }).ok).toBe(false);
  });
  it("giá lẻ, âm hoặc quá lớn thì chặn", () => {
    for (const g of [-1, 1.5, Number.NaN, 20_000_000_000]) expect(kiemGiaDong({ loai: "dich_vu", gia: g }, dv).ok).toBe(false);
  });
  it("đơn nháp giữ giá sửa hợp lệ, bỏ giá rác", () => {
    const ref = "33333333-3333-4333-8333-333333333333";
    const nv = { phuc_vu: [], tu_van: [], ban: [] };
    const [a, b] = lamSachDongNhap([{ loai: "dich_vu", ref, sl: 1, giam: 0, nv, gia: 350_000 }, { loai: "dich_vu", ref, sl: 1, giam: 0, nv, gia: "abc" }]);
    expect(a.gia).toBe(350_000);
    expect("gia" in b).toBe(false);
  });
  it("tổng đơn, voucher % và giảm dòng tính trên giá đã sửa như giá gốc", () => {
    const d: DongDon = { loai: "dich_vu", ref: "x", sl: 2, giam: 50_000, nv: { phuc_vu: [], tu_van: [], ban: [] }, gia: 300_000 };
    const thanh = giaDong(d, dv) * d.sl - d.giam; // 550.000
    expect(thanh).toBe(550_000);
    const voucher = tinhGiamVoucher({ loai_giam: "phan_tram", gia_tri: 10, giam_toi_da: null, gioi_han: "dich_vu" }, [{ loai: "dich_vu", thanh }]);
    expect(voucher).toBe(55_000);
    expect(tinhDon(thanh, voucher, 0, 0, 0).phai).toBe(495_000);
  });
});
