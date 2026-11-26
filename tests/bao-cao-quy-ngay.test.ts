import { describe, expect, it } from "vitest";
import { dungBaoCaoQuy } from "@/lib/bao-cao-quy-ngay";

const quy = [{ id: "a", ten: "Tiền mặt", dau: 1000 }, { id: "b", ten: "Ngân hàng", dau: 5000 }];
describe("dungBaoCaoQuy", () => {
  const dong = [
    { ngay: "2026-11-01", quy_id: "a", nhom: "Thu từ khách", huong: "thu", tien: 300 },
    { ngay: "2026-11-01", quy_id: "a", nhom: "Chi nội bộ", huong: "chi", tien: 100 },
    { ngay: "2026-11-02", quy_id: "a", nhom: null, huong: "rut", tien: 400 },
    { ngay: "2026-11-02", quy_id: "b", nhom: null, huong: "nap", tien: 400 },
    { ngay: "2026-11-03", quy_id: "b", nhom: "Nhóm lạ", huong: "chi", tien: 50 },
  ];
  const kq = dungBaoCaoQuy(quy, dong, "2026-11-01", "2026-11-03");
  const dong_ = (ngay: string, id: string | null) => kq.find((r) => r.ngay === ngay && r.quyId === id)!;
  it("mỗi ngày có 2 quỹ + 1 dòng tổng", () => expect(kq).toHaveLength(9));
  it("tồn cuối ngày này là tồn đầu ngày sau", () => {
    expect(dong_("2026-11-01", "a").cuoi).toBe(1200);
    expect(dong_("2026-11-02", "a").dau).toBe(1200);
    expect(dong_("2026-11-02", "a").cuoi).toBe(800);
    expect(dong_("2026-11-03", "b").dau).toBe(5400);
  });
  it("chuyển quỹ rút/nạp triệt tiêu ở dòng tổng", () => {
    expect(dong_("2026-11-02", null).chuyen).toBe(0);
    expect(dong_("2026-11-02", null).cuoi).toBe(dong_("2026-11-02", null).dau);
  });
  it("nhóm lạ tính vào chi nội bộ", () => expect(dong_("2026-11-03", "b").chi["Chi nội bộ"]).toBe(50));
  it("tổng cộng = cộng các quỹ", () => { expect(dong_("2026-11-01", null).tongThu).toBe(300); expect(dong_("2026-11-03", null).cuoi).toBe(6150); });
  it("ngày không phát sinh vẫn có dòng, tồn giữ nguyên", () => expect(dungBaoCaoQuy(quy, [], "2026-11-05", "2026-11-06").map((r) => r.cuoi)).toEqual([1000, 5000, 6000, 1000, 5000, 6000]));
});
