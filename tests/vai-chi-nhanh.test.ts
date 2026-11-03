import { describe, expect, it } from "vitest";
import { QUYEN_MAC_DINH, quyenHieuLuc } from "@/lib/quyen";
import { dsCoSoDuocVao, tinhVaiHieuLuc, vaiTaiChiNhanh, type HoSoVai } from "@/lib/vai-chi-nhanh";

const VINH = "11111111-1111-1111-1111-111111111111";
const DL = "22222222-2222-2222-2222-222222222222";
const LA = "33333333-3333-3333-3333-333333333333";

describe("Vai trò theo từng chi nhánh — tính vai hiệu lực", () => {
  it("người một chi nhánh, không có dòng thêm: y như cũ (vai, quyền, phạm vi)", () => {
    const hs: HoSoVai = { vai_tro: "le_tan", chi_nhanh_id: VINH, quyen_rieng: null };
    const v = tinhVaiHieuLuc(hs, [], undefined);
    expect(v).toMatchObject({ vaiTro: "le_tan", chiNhanhId: VINH });
    expect(v.quyen).toEqual(quyenHieuLuc("le_tan", null));
    expect(v.dsCoSo).toHaveLength(1);
  });

  it("người một chi nhánh: cookie trỏ chi nhánh khác bị bỏ qua — không lọt dữ liệu chi nhánh khác", () => {
    const v = tinhVaiHieuLuc({ vai_tro: "quan_ly", chi_nhanh_id: VINH, quyen_rieng: null }, null, DL);
    expect(v.chiNhanhId).toBe(VINH);
    expect(v.vaiTro).toBe("quan_ly");
  });

  it("mọi chi nhánh (chi_nhanh_id null): phạm vi null như cũ, bỏ qua dòng thêm và cookie", () => {
    const v = tinhVaiHieuLuc({ vai_tro: "ke_toan", chi_nhanh_id: null, quyen_rieng: null }, [{ chi_nhanh_id: DL, vai_tro: "le_tan" }], DL);
    expect(v).toMatchObject({ vaiTro: "ke_toan", chiNhanhId: null, dsCoSo: [] });
  });

  it("Chủ / Kỹ thuật luôn theo hồ sơ chính, không nhận vai thêm", () => {
    const chu = tinhVaiHieuLuc({ vai_tro: "chu", chi_nhanh_id: null, quyen_rieng: null }, [{ chi_nhanh_id: DL, vai_tro: "le_tan" }], DL);
    expect(chu).toMatchObject({ vaiTro: "chu", chiNhanhId: null });
    expect(chu.quyen).toContain("hethong.phanquyen");
    const kt = tinhVaiHieuLuc({ vai_tro: "ky_thuat", chi_nhanh_id: VINH, quyen_rieng: null }, [{ chi_nhanh_id: DL, vai_tro: "le_tan" }], DL);
    expect(kt).toMatchObject({ vaiTro: "ky_thuat", chiNhanhId: VINH });
    expect(kt.dsCoSo).toHaveLength(1);
  });

  it("Quản lý ở Vinh, Lễ tân ở Đà Lạt: vai và phạm vi đổi theo chi nhánh đang chọn", () => {
    const hs: HoSoVai = { vai_tro: "quan_ly", chi_nhanh_id: VINH, quyen_rieng: null };
    const them = [{ chi_nhanh_id: DL, vai_tro: "le_tan" }];
    const oVinh = tinhVaiHieuLuc(hs, them, undefined);
    expect(oVinh).toMatchObject({ vaiTro: "quan_ly", chiNhanhId: VINH });
    const oDl = tinhVaiHieuLuc(hs, them, DL);
    expect(oDl).toMatchObject({ vaiTro: "le_tan", chiNhanhId: DL });
    expect(oDl.quyen).toEqual(QUYEN_MAC_DINH("le_tan"));
    expect(oDl.quyen).not.toContain("ban.huy");
    // phạm vi đúng 1 chi nhánh, không bao giờ null (null = thấy mọi chi nhánh)
    expect(oDl.chiNhanhId).not.toBeNull();
    // chi nhánh không được gán → về chi nhánh chính
    expect(tinhVaiHieuLuc(hs, them, LA)).toMatchObject({ vaiTro: "quan_ly", chiNhanhId: VINH });
  });

  it("quyền riêng chỉ áp ở chi nhánh chính", () => {
    const hs: HoSoVai = { vai_tro: "le_tan", chi_nhanh_id: VINH, quyen_rieng: ["khach.xem", "baocao.tien"] };
    const them = [{ chi_nhanh_id: DL, vai_tro: "le_tan" }];
    expect(tinhVaiHieuLuc(hs, them, VINH).quyen).toEqual(["khach.xem", "baocao.tien"]);
    expect(tinhVaiHieuLuc(hs, them, DL).quyen).toEqual(QUYEN_MAC_DINH("le_tan"));
  });

  it("dòng thêm lỗi bị bỏ: vai Chủ/Kỹ thuật, vai lạ, trùng chi nhánh chính", () => {
    const hs: HoSoVai = { vai_tro: "le_tan", chi_nhanh_id: VINH, quyen_rieng: null };
    const ds = dsCoSoDuocVao(hs, [{ chi_nhanh_id: DL, vai_tro: "chu" }, { chi_nhanh_id: LA, vai_tro: "ky_thuat" }, { chi_nhanh_id: DL, vai_tro: "khong_co" }, { chi_nhanh_id: VINH, vai_tro: "quan_ly" }]);
    expect(ds).toEqual([{ chiNhanhId: VINH, vaiTro: "le_tan", chinh: true }]);
    expect(tinhVaiHieuLuc(hs, [{ chi_nhanh_id: DL, vai_tro: "chu" }], DL)).toMatchObject({ vaiTro: "le_tan", chiNhanhId: VINH });
  });

  it("vaiTaiChiNhanh: người nhận thông báo theo chi nhánh", () => {
    const hs: HoSoVai = { vai_tro: "quan_ly", chi_nhanh_id: VINH, quyen_rieng: null };
    expect(vaiTaiChiNhanh(hs, [{ chi_nhanh_id: DL, vai_tro: "le_tan" }], DL)?.vaiTro).toBe("le_tan");
    expect(vaiTaiChiNhanh(hs, [], DL)).toBeNull();
    expect(vaiTaiChiNhanh({ vai_tro: "ke_toan", chi_nhanh_id: null, quyen_rieng: null }, [], DL)?.vaiTro).toBe("ke_toan");
  });
});
