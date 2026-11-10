import { describe, expect, it } from "vitest";
import { lichSuSuaThe, tachSuaThe } from "@/lib/lich-su-sua-the";
import { TINH_TRANG_THE, tinhTrangThe } from "@/components/the/NhanTinhTrangThe";

describe("Lịch sử sửa thẻ (từ sổ cái)", () => {
  it("tách dòng sua_the thành từng trường cũ → mới + lý do", () => {
    const kq = tachSuaThe("Hạn: 01/01/2027 → không hạn · Giá 1 buổi: 0 → 150.000 · Ghi chú: a · b → (trống) · Lý do: khách xin gia hạn");
    expect(kq.thayDoi).toEqual([
      { truong: "Hạn", cu: "01/01/2027", moi: "không hạn" },
      { truong: "Giá 1 buổi", cu: "0", moi: "150.000" },
      { truong: "Ghi chú", cu: "a · b", moi: "(trống)" },
    ]);
    expect(kq.lyDo).toBe("khách xin gia hạn");
  });

  it("chỉ lấy dòng sửa (bỏ cấp thẻ, dùng buổi), giữ người + giờ", () => {
    const so = [
      { id: 3, loai: "khoa", tao_luc: "2026-11-10T03:00:00Z", nguoi_id: "nv1", ghi_chu: "tranh chấp", so_buoi: 0, so_tien: 0 },
      { id: 2, loai: "dung_buoi", tao_luc: "2026-11-09T03:00:00Z", nguoi_id: "nv2", ghi_chu: null, so_buoi: -1, so_tien: 0 },
      { id: 1, loai: "dieu_chinh", tao_luc: "2026-11-08T03:00:00Z", nguoi_id: "nv1", ghi_chu: "bù buổi", so_buoi: 2, so_tien: 0 },
      { id: 0, loai: "cap", tao_luc: "2026-11-01T03:00:00Z", nguoi_id: "nv1", ghi_chu: null, so_buoi: 10, so_tien: 0 },
    ];
    const kq = lichSuSuaThe(so, "lan");
    expect(kq.map((x) => x.viec)).toEqual(["Khoá thẻ", "Điều chỉnh số dư"]);
    expect(kq[0]).toMatchObject({ nguoiId: "nv1", lyDo: "tranh chấp", thayDoi: [{ truong: "Tình trạng", cu: "Đang dùng", moi: "Đang khoá" }] });
    expect(kq[1].thayDoi[0]).toEqual({ truong: "Số buổi", cu: null, moi: "+2" });
  });
});

describe("Màu tình trạng thẻ", () => {
  it("mỗi tình trạng một màu riêng, có nhãn chữ", () => {
    const lop = Object.values(TINH_TRANG_THE).map((t) => t.lop);
    expect(new Set(lop).size).toBe(lop.length);
    expect(Object.keys(TINH_TRANG_THE).sort()).toEqual(["het_han", "hoan_thanh", "hoat_dong", "khoa", "sap_het", "thu_hoi"]);
    expect(tinhTrangThe("khoa").nhan).toBe("Đang khoá");
    expect(tinhTrangThe(null).nhan).toBe("Đang dùng");
  });
});
