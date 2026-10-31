import { describe, expect, it } from "vitest";
import { doDai, hanGioTuNhap, thoiDiemHan, tinhTrangHan } from "@/lib/cong-viec-han";

const han = new Date("2026-10-31T10:00:00Z"); // 17:00 giờ Việt Nam
const phutSau = (p: number) => new Date(han.getTime() + p * 60_000);

describe("hanGioTuNhap", () => {
  it("đổi giờ Việt Nam sang giờ chuẩn", () => expect(hanGioTuNhap("2026-10-31", "17:00")).toBe("2026-10-31T10:00:00.000Z"));
  it("sai định dạng thì null", () => { expect(hanGioTuNhap("31/10/2026", "17:00")).toBeNull(); expect(hanGioTuNhap("2026-10-31", "25:00")).toBeNull(); expect(hanGioTuNhap("2026-10-31", "")).toBeNull(); });
});

describe("thoiDiemHan", () => {
  it("ưu tiên hạn giờ", () => expect(thoiDiemHan("2026-10-31T03:00:00.000Z", "2026-10-31")?.toISOString()).toBe("2026-10-31T03:00:00.000Z"));
  it("chỉ có hạn ngày thì 17:00 ngày đó", () => expect(thoiDiemHan(null, "2026-10-31")?.toISOString()).toBe("2026-10-31T10:00:00.000Z"));
  it("không có hạn", () => expect(thoiDiemHan(null, null)).toBeNull());
});

describe("tinhTrangHan", () => {
  it("không hạn", () => expect(tinhTrangHan(null, null, new Date()).loai).toBe("khong_han"));
  it("còn hạn", () => expect(tinhTrangHan(han, null, phutSau(-90))).toEqual({ loai: "con_han", phutCon: 90 }));
  it("vừa quá hạn dưới 30 phút chưa cờ đỏ", () => expect(tinhTrangHan(han, null, phutSau(29)).loai).toBe("vua_qua"));
  it("đúng 30 phút là cờ đỏ", () => expect(tinhTrangHan(han, null, phutSau(30))).toEqual({ loai: "tre", phutTre: 30 }));
  it("nộp đúng hạn", () => expect(tinhTrangHan(han, phutSau(-1).toISOString(), phutSau(500)).loai).toBe("nop_dung_han"));
  it("nộp đúng phút hạn vẫn đúng hạn", () => expect(tinhTrangHan(han, han.toISOString(), phutSau(500)).loai).toBe("nop_dung_han"));
  it("nộp trễ ghi số phút", () => expect(tinhTrangHan(han, phutSau(75).toISOString(), phutSau(500))).toEqual({ loai: "nop_tre", phutTre: 75 }));
});

describe("doDai", () => {
  it("phút và giờ", () => { expect(doDai(45)).toBe("45 phút"); expect(doDai(60)).toBe("1 giờ"); expect(doDai(125)).toBe("2 giờ 5 phút"); });
});
