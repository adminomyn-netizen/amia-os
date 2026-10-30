import { describe, expect, it } from "vitest";
import { bienDongQuanSo, gopLuongTheoPhong, tienDoOnboarding, tiLe, tomTatThuViec } from "@/lib/bao-cao-hr";

describe("báo cáo nhân sự", () => {
  it("tỉ lệ làm tròn một chữ số và không chia cho 0", () => {
    expect(tiLe(1, 3)).toBe(33.3);
    expect(tiLe(5, 0)).toBe(0);
  });
  it("thử việc: đếm đang thử, đạt, nghỉ khi thử và người sắp hết hạn", () => {
    const nv = [
      { id: "a", ngay_vao_lam: "2026-09-10", ngay_vao_chinh_thuc: null, ngay_nghi_viec: null, hoat_dong: true },
      { id: "b", ngay_vao_lam: "2026-06-01", ngay_vao_chinh_thuc: "2026-08-01", ngay_nghi_viec: null, hoat_dong: true },
      { id: "c", ngay_vao_lam: "2026-07-01", ngay_vao_chinh_thuc: null, ngay_nghi_viec: "2026-07-20", hoat_dong: false },
      { id: "d", ngay_vao_lam: "2026-05-01", ngay_vao_chinh_thuc: "2026-07-01", ngay_nghi_viec: null, hoat_dong: true },
    ];
    const kq = tomTatThuViec(nv, new Map(), "2026-10-30");
    expect(kq).toMatchObject({ dangThu: 1, daLen: 2, nghiKhiThu: 1, tiLeDat: 66.7 });
    expect(kq.sapHetHan).toEqual([{ id: "a", han: "2026-11-09", conLai: 10 }]);
  });
  it("lộ trình onboarding: mốc quá hạn chưa xong", () => {
    const moc = [{ id: "m1", sau_ngay: 0 }, { id: "m2", sau_ngay: 7 }, { id: "m3", sau_ngay: 60 }];
    expect(tienDoOnboarding("2026-10-01", moc, new Set(["m1"]), "2026-10-30")).toEqual({ xong: 1, tong: 3, quaHan: 1 });
  });
  it("gộp lương theo phòng, người chưa có phòng vào nhóm riêng", () => {
    const dong = [
      { nhan_vien_id: "a", gross: 10, hoa_hong: 1, bhxh_nld: 2, thuc_tra: 8 }, { nhan_vien_id: "b", gross: "20", hoa_hong: 0, bhxh_nld: 3, thuc_tra: "15" },
      { nhan_vien_id: "c", gross: 5, hoa_hong: 0, bhxh_nld: 0, thuc_tra: 5 },
    ];
    const kq = gopLuongTheoPhong(dong, (id) => (id === "c" ? null : "p1"), () => "Kinh doanh");
    expect(kq).toEqual([
      { phong: "Kinh doanh", soNguoi: 2, gross: 30, hoaHong: 1, bhxh: 5, thucTra: 23 },
      { phong: "Chưa gán phòng", soNguoi: 1, gross: 5, hoaHong: 0, bhxh: 0, thucTra: 5 },
    ]);
  });
  it("biến động quân số trong tháng", () => {
    const nv = [
      { ngay_vao_lam: "2025-01-01", ngay_nghi_viec: null }, { ngay_vao_lam: "2025-01-01", ngay_nghi_viec: "2026-10-12" },
      { ngay_vao_lam: "2026-10-05", ngay_nghi_viec: null }, { ngay_vao_lam: "2025-01-01", ngay_nghi_viec: "2026-03-01" },
    ];
    expect(bienDongQuanSo(nv, "2026-10-01", "2026-10-31")).toEqual({ dauKy: 2, vao: 1, nghi: 1, cuoiKy: 2, tiLeNghi: 50 });
  });
});
