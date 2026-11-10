import { describe, expect, it } from "vitest";
import { cotDoi, moTaDoi } from "@/lib/lich-su-sua-khach";

describe("lịch sử sửa khách", () => {
  it("chỉ ghi cột thật sự đổi, rỗng = null", () => {
    expect(cotDoi({ ho_ten: "A", email: null, zalo: "", cap_nhat_luc: "x" }, { ho_ten: "B", email: "", zalo: null, cap_nhat_luc: "y" })).toEqual({ ho_ten: ["A", "B"] });
    expect(cotDoi({ dong_y_dung_hinh: false }, { dong_y_dung_hinh: true })).toEqual({ dong_y_dung_hinh: [false, true] });
  });
  it("mô tả: đổi id ra tên, che SĐT khi không có quyền", () => {
    const doi = { dien_thoai: ["0901", "0902"], nguoi_phu_trach_id: ["a", "b"], ghi_chu: [null, "khách quen"] } as Record<string, [string | null, string]>;
    expect(moTaDoi(doi, { xemSdt: false, ten: (_c, id) => ({ a: "Lan", b: "Mai" })[id] })).toEqual(["Điện thoại: ••• → •••", "Người phụ trách: Lan → Mai", "Ghi chú: (trống) → khách quen"]);
  });
});
