import { describe, expect, it } from "vitest";
import { chiaDeuTi, lamTron, TOI_DA_NGUOI_HUONG } from "../src/lib/ban-hang";

describe("chia đều phần hưởng", () => {
  it.each([1, 2, 3, 4, 5, 6, 7])("%i người cộng đủ đúng 100", (n) => {
    const t = chiaDeuTi(n);
    expect(t).toHaveLength(n);
    expect(lamTron(t.reduce((s, x) => s + x, 0))).toBe(100);
    for (const x of t) expect(x).toBeGreaterThan(0);
  });
  it("ví dụ", () => {
    expect(chiaDeuTi(3)).toEqual([33.33, 33.33, 33.34]);
    expect(chiaDeuTi(4)).toEqual([25, 25, 25, 25]);
    expect(TOI_DA_NGUOI_HUONG).toBe(5);
  });
});
