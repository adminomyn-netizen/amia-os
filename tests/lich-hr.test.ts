import { describe, expect, it } from "vitest";
import { cuoiThang, kyDanhGiaSapToi, sinhNhatTiep, soNgayGiua, tuoiSapToi } from "@/lib/lich-hr";

describe("lịch nhân sự", () => {
  it("sinh nhật kế tiếp: năm nay nếu chưa qua, năm sau nếu đã qua, hôm nay tính là hôm nay", () => {
    expect(sinhNhatTiep("1995-11-05", "2026-10-30")).toBe("2026-11-05");
    expect(sinhNhatTiep("1995-03-01", "2026-10-30")).toBe("2027-03-01");
    expect(sinhNhatTiep("1995-10-30", "2026-10-30")).toBe("2026-10-30");
    expect(tuoiSapToi("1995-11-05", "2026-10-30")).toBe(31);
  });
  it("29/2 rơi vào năm không nhuận thì tính 28/2", () => {
    expect(sinhNhatTiep("2000-02-29", "2026-10-30")).toBe("2027-02-28");
    expect(sinhNhatTiep("2000-02-29", "2027-10-30")).toBe("2028-02-29");
  });
  it("số ngày giữa hai ngày và cuối tháng", () => {
    expect(soNgayGiua("2026-10-30", "2026-12-14")).toBe(45);
    expect(cuoiThang(2028, 2)).toBe("2028-02-29");
  });
  it("kỳ đánh giá sắp tới: cuối tháng, cuối quý đánh dấu quý, qua năm", () => {
    const k = kyDanhGiaSapToi("2026-10-30", 4);
    expect(k.map((x) => x.ngay)).toEqual(["2026-10-31", "2026-11-30", "2026-12-31", "2027-01-31"]);
    expect(k.map((x) => x.loai)).toEqual(["thang", "thang", "quy", "thang"]);
    expect(k[2].nhan).toBe("Quý 4/2026");
    expect(kyDanhGiaSapToi("2026-11-01", 1)[0].ngay).toBe("2026-11-30");
  });
});
