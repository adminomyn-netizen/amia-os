import { describe, expect, it } from "vitest";
import { kiemNgayLui } from "@/lib/ban-hang";

describe("lùi ngày hoá đơn ở Thu ngân (chỉ quá khứ, như SalonHero)", () => {
  const bayGio = new Date("2026-11-03T03:00:00Z"); // 10:00 giờ VN
  it("trống = dùng giờ chốt", () => expect(kiemNgayLui("", bayGio)).toEqual({ ok: true, lui: null }));
  it("lùi về quá khứ: ngày theo giờ VN, mốc ISO đúng múi giờ", () => {
    expect(kiemNgayLui("2026-07-20T08:58", bayGio)).toEqual({ ok: true, lui: { ngay: "2026-07-20", iso: "2026-07-20T01:58:00.000Z" } });
    expect(kiemNgayLui("2026-11-01T06:30", bayGio)).toEqual({ ok: true, lui: { ngay: "2026-11-01", iso: "2026-10-31T23:30:00.000Z" } });
  });
  it("không cho tương lai, sai định dạng, ngày không có thật", () => {
    expect(kiemNgayLui("2026-11-03T11:00", bayGio).ok).toBe(false);
    expect(kiemNgayLui("2026-11-04T08:00", bayGio).ok).toBe(false);
    expect(kiemNgayLui("2026-02-30T08:00", bayGio).ok).toBe(false);
    expect(kiemNgayLui("20/07/2026", bayGio).ok).toBe(false);
  });
});
