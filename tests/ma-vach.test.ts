import { describe, expect, it } from "vitest";
import { kyHieu128, MAU_128, svgMaVach } from "@/lib/ma-vach";

describe("mã vạch Code 128", () => {
  it("bảng mẫu đủ 107 ký hiệu, không trùng, đúng số mô-đun", () => {
    expect(MAU_128.length).toBe(107);
    expect(new Set(MAU_128).size).toBe(107);
    MAU_128.forEach((m, i) => expect([...m].reduce((t, c) => t + Number(c), 0)).toBe(i === 106 ? 13 : 11));
  });
  it("tổng kiểm tra đúng ví dụ chuẩn", () => {
    // "PJJ123C" tính tay: 104 + 48·1 + 42·2 + 42·3 + 17·4 + 18·5 + 19·6 + 35·7 = 879; 879 mod 103 = 55.
    expect(kyHieu128("PJJ123C").at(-2)).toBe(55);
    expect(kyHieu128("KHAVI22006958")[0]).toBe(104);
  });
  it("SVG có vạch, chặn ký tự có dấu", () => {
    expect(svgMaVach("KH000123")).toContain("<path d=\"M");
    expect(() => kyHieu128("Khách")).toThrow();
  });
});
