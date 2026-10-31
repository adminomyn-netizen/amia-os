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

import { chotViec, mocChot, type ViecChot } from "@/lib/cong-viec-han";
const goc: ViecChot = { han: "2026-10-31", han_gio: "2026-10-31T03:00:00.000Z", trang_thai: "dang_lam", hoan_thanh_luc: null, danh_gia: "cho", danh_gia_luc: null, ket_nguoi_id: null, ket_luc: null }; // hạn 10:00 giờ VN
const m12 = mocChot("2026-10-31", "12:00"), m17 = mocChot("2026-10-31", "17:00");
describe("chotViec", () => {
  it("chưa nộp, quá hạn 2 giờ lúc 12h là trễ (cờ đỏ)", () => { const c = chotViec(goc, "2026-10-31", m12); expect(c.trongBang && c.tre && !c.daNop).toBe(true); });
  it("hạn 11:45, 12h mới quá 15 phút: vừa quá, chưa đỏ", () => { const c = chotViec({ ...goc, han_gio: "2026-10-31T04:45:00.000Z" }, "2026-10-31", m12); expect(c.vuaQua).toBe(true); expect(c.tre).toBe(false); });
  it("hạn 16:00 chưa tới ở mốc 12h", () => { const c = chotViec({ ...goc, han_gio: "2026-10-31T09:00:00.000Z" }, "2026-10-31", m12); expect(c.chuaDen).toBe(true); expect(c.trongBang).toBe(false); });
  it("nộp trước hạn và được chấm Đạt", () => { const c = chotViec({ ...goc, trang_thai: "xong", hoan_thanh_luc: "2026-10-31T02:00:00.000Z", danh_gia: "dat", danh_gia_luc: "2026-10-31T04:00:00.000Z" }, "2026-10-31", m12); expect(c.daNop && c.dat && !c.nopTre && !c.tre).toBe(true); });
  it("nộp sau mốc thì tại mốc vẫn là chưa nộp", () => { const c = chotViec({ ...goc, trang_thai: "xong", hoan_thanh_luc: "2026-10-31T06:00:00.000Z" }, "2026-10-31", m12); expect(c.daNop).toBe(false); expect(c.tre).toBe(true); expect(chotViec({ ...goc, trang_thai: "xong", hoan_thanh_luc: "2026-10-31T06:00:00.000Z" }, "2026-10-31", m17).nopTre).toBe(true); });
  it("nộp rồi chấm chưa đạt", () => expect(chotViec({ ...goc, trang_thai: "xong", hoan_thanh_luc: "2026-10-31T02:00:00.000Z", danh_gia: "chua_dat" }, "2026-10-31", m12).chuaDat).toBe(true));
  it("kẹt báo trước mốc", () => expect(chotViec({ ...goc, ket_nguoi_id: "a", ket_luc: "2026-10-31T01:00:00.000Z" }, "2026-10-31", m12).ket).toBe(true));
  it("kẹt báo sau mốc chưa tính", () => expect(chotViec({ ...goc, ket_nguoi_id: "a", ket_luc: "2026-10-31T08:00:00.000Z" }, "2026-10-31", m12).ket).toBe(false));
  it("việc tồn từ hôm trước chưa nộp vẫn vào bảng", () => { const c = chotViec({ ...goc, han: "2026-10-29", han_gio: "2026-10-29T10:00:00.000Z" }, "2026-10-31", m12); expect(c.trongBang && c.tonCu && c.tre).toBe(true); });
  it("việc đã huỷ hoặc không hạn không vào bảng", () => { expect(chotViec({ ...goc, trang_thai: "huy" }, "2026-10-31", m12).trongBang).toBe(false); expect(chotViec({ ...goc, han: null, han_gio: null }, "2026-10-31", m12).trongBang).toBe(false); });
});
