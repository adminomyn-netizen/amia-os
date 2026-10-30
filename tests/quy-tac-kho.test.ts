import { describe, expect, it } from "vitest";
import { docChanHetTon, giaTriChanHetTon } from "@/lib/quy-tac-kho";

describe("quy tắc kho", () => {
  it("đọc cờ chặn hết tồn", () => {
    expect(docChanHetTon("1")).toBe(true);
    expect(docChanHetTon(" 1 ")).toBe(true);
    expect(docChanHetTon("0")).toBe(false);
    expect(docChanHetTon(null)).toBe(false);
    expect(docChanHetTon(undefined)).toBe(false);
  });
  it("đổi bật/tắt sang chuỗi lưu", () => {
    expect(giaTriChanHetTon(true)).toBe("1");
    expect(giaTriChanHetTon(false)).toBe("0");
  });
});
