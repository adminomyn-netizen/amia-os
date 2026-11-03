import { describe, expect, it } from "vitest";
import { tiLeApDung, type DongTl, type Muc } from "@/components/hoa-hong/LuoiTiLe";

const muc: Muc = { id: "m1", ten: "Peel", ma: "DV1", loai: "dich_vu" };
const d = (x: Partial<DongTl>): DongTl => ({ id: Math.random().toString(), loai: "dich_vu", vai: "phuc_vu", muc_id: null, nhan_vien_id: null, nhom_chuc_danh: null, ti_le: 0, so_tien: null, ...x });

describe("lưới hoa hồng: tỉ lệ đang áp dụng theo đúng thứ tự thắng của hàm tính", () => {
  const tl = [d({ ti_le: 1 }), d({ ti_le: 2, muc_id: "m1" }), d({ ti_le: 3, nhom_chuc_danh: "ktv" }), d({ ti_le: 4, nhom_chuc_danh: "ktv", muc_id: "m1" }), d({ ti_le: 5, nhan_vien_id: "a" }), d({ ti_le: 9, vai: "ban", muc_id: "m1" })];
  it("nhân viên có dòng riêng cả loại thắng nhóm + mục", () => expect(tiLeApDung(tl, "nv:a", "ktv", muc, "phuc_vu")).toMatchObject({ dong: { ti_le: 5 }, nguon: "mặc định loại" }));
  it("nhân viên không có dòng riêng → nhóm + mục", () => expect(tiLeApDung(tl, "nv:b", "ktv", muc, "phuc_vu")).toMatchObject({ dong: { ti_le: 4 }, nguon: "theo nhóm" }));
  it("nhân viên không nhóm → chung + mục", () => expect(tiLeApDung(tl, "nv:c", null, muc, "phuc_vu")).toMatchObject({ dong: { ti_le: 2 }, nguon: "theo chung" }));
  it("xem cài đặt chung: dòng chung theo mục là dòng riêng", () => expect(tiLeApDung(tl, "", null, muc, "phuc_vu")).toMatchObject({ dong: { ti_le: 2 }, nguon: "" }));
  it("đúng vai, đúng loại; không có gì thì null", () => {
    expect(tiLeApDung(tl, "nv:c", null, muc, "ban")).toMatchObject({ dong: { ti_le: 9 } });
    expect(tiLeApDung(tl, "nv:c", null, { ...muc, loai: "san_pham" }, "phuc_vu")).toBeNull();
  });
});
