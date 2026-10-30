import { describe, expect, it } from "vitest";
import { tinhCaCanPhieu } from "../src/lib/phieu-cap";

const nhom = new Map<string, string | null>([["kem", "A"], ["bong", "C"], ["tip", "A"]]);
describe("ca cần ra phiếu cấp vật tư", () => {
  const dm = [{ dich_vu_id: "mfu", san_pham_id: "kem" }, { dich_vu_id: "mfu", san_pham_id: "tip" }, { dich_vu_id: "peel", san_pham_id: "bong" }];
  it("chỉ dịch vụ có vật tư nhóm A trong định mức; dịch vụ chỉ có vật tư nhóm C hoặc chưa có định mức thì bỏ qua", () => {
    expect(tinhCaCanPhieu([{ lich_id: "l1", dich_vu_id: "mfu" }, { lich_id: "l1", dich_vu_id: "peel" }, { lich_id: "l2", dich_vu_id: "khac" }], dm, nhom, [])).toEqual([{ lichId: "l1", dichVuId: "mfu" }]);
  });
  it("đã có phiếu (không tính phiếu huỷ, do nơi gọi lọc) thì không cần nữa; mỗi cặp chỉ một lần", () => {
    expect(tinhCaCanPhieu([{ lich_id: "l1", dich_vu_id: "mfu" }, { lich_id: "l2", dich_vu_id: "mfu" }, { lich_id: "l2", dich_vu_id: "mfu" }], dm, nhom, [{ lich_hen_id: "l1", dich_vu_id: "mfu" }])).toEqual([{ lichId: "l2", dichVuId: "mfu" }]);
  });
});
