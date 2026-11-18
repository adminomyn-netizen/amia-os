import { describe, expect, it } from "vitest";
import { cheDoDvThe, docDongGui, dvTheoGoi, goiCuaDv, kiemBuoiThe, nguoiLamDong, TOI_DA_DONG_GUI, TOI_DA_SO_LUONG_DONG } from "@/lib/don-nhieu-dich-vu";

// Chị Thuý / chị Lâm 11/11/2026: một Đơn làm dịch vụ gửi NHIỀU dịch vụ (kể cả nhiều dịch vụ của cùng một thẻ) cho chuyên viên trị liệu một lần.
const T1 = "11111111-1111-4111-8111-111111111111", T2 = "22222222-2222-4222-8222-222222222222";
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const NV = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("docDongGui", () => {
  it("đọc nhiều dịch vụ của cùng thẻ, gộp dòng trùng, bỏ dòng hỏng", () => {
    const r = docDongGui(JSON.stringify([{ theId: T1, dvId: A }, { theId: T1, dvId: B, nvIds: [NV, NV, "x"] }, { theId: T1, dvId: A }, { theId: "x", dvId: A }]));
    expect(r).toEqual({ dong: [{ theId: T1, dvId: A }, { theId: T1, dvId: B, nvIds: [NV] }] });
  });
  it("thẻ gói chưa gắn dịch vụ (EXION): nhận dòng chính thẻ goi:<id>, bỏ goi: hỏng", () => {
    const r = docDongGui(JSON.stringify([{ theId: T1, dvId: dvTheoGoi(C) }, { theId: T1, dvId: "goi:x" }, { theId: T2, dvId: "goi:" }]));
    expect(r).toEqual({ dong: [{ theId: T1, dvId: `goi:${C}` }] });
    expect(goiCuaDv(`goi:${C}`)).toBe(C);
    expect(goiCuaDv(A)).toBeNull();
  });
  it("rỗng / JSON hỏng / quá giới hạn thì báo lỗi", () => {
    expect(docDongGui("[]")).toHaveProperty("loi");
    expect(docDongGui("{")).toHaveProperty("loi");
    const nhieu = Array.from({ length: TOI_DA_DONG_GUI + 1 }, (_, i) => ({ theId: T1, dvId: `${String(i).padStart(8, "0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa` }));
    expect(docDongGui(JSON.stringify(nhieu))).toHaveProperty("loi");
  });
});

describe("kiemBuoiThe — chọn quá số buổi còn của thẻ thì chặn", () => {
  const the = new Map([[T1, { ten: "Thẻ nám", buoiCon: 2, dangMo: 0 }], [T2, { ten: "Thẻ mụn", buoiCon: 2, dangMo: 1 }]]);
  it("đủ buổi: hợp lệ", () => expect(kiemBuoiThe([{ theId: T1 }, { theId: T1 }, { theId: T2 }], the)).toEqual([]));
  it("quá buổi còn", () => {
    const loi = kiemBuoiThe([{ theId: T1 }, { theId: T1 }, { theId: T1 }], the);
    expect(loi).toHaveLength(1);
    expect(loi[0]).toContain("Thẻ nám");
    expect(loi[0]).toContain("còn 2 buổi");
  });
  it("tính cả lượt đang chờ / đang làm của thẻ", () => {
    expect(kiemBuoiThe([{ theId: T2 }, { theId: T2 }], the)[0]).toContain("1 buổi đang chờ");
  });
  it("thẻ lạ thì báo", () => expect(kiemBuoiThe([{ theId: C }], the)).toHaveLength(1));
  // Quản lý cơ sở 15/11/2026: 3 người cùng làm một dịch vụ trên một thẻ → một dòng trừ 3 buổi.
  it("dòng nhiều buổi: tính theo soLuong", () => {
    expect(kiemBuoiThe([{ theId: T1, soLuong: 2 }], the)).toEqual([]);
    expect(kiemBuoiThe([{ theId: T1, soLuong: 3 }], the)[0]).toContain("chọn 3 buổi");
    expect(kiemBuoiThe([{ theId: T2, soLuong: 2 }], the)).toHaveLength(1);
  });
});

describe("docDongGui — số buổi của dòng", () => {
  it("giữ soLuong hợp lệ, kẹp trần, sai thì 1", () => {
    const r = docDongGui(JSON.stringify([{ theId: T1, dvId: A, soLuong: 3 }, { theId: T1, dvId: B, soLuong: 0 }, { theId: T2, dvId: A, soLuong: 500 }]));
    expect(r).toEqual({ dong: [{ theId: T1, dvId: A, soLuong: 3 }, { theId: T1, dvId: B }, { theId: T2, dvId: A, soLuong: TOI_DA_SO_LUONG_DONG }] });
  });
});

it("người làm: riêng của dòng, không có thì người chung", () => {
  expect(nguoiLamDong({ theId: T1, dvId: A }, [NV])).toEqual([NV]);
  expect(nguoiLamDong({ theId: T1, dvId: A, nvIds: [C] }, [NV])).toEqual([C]);
});

describe("cheDoDvThe (hộp Gửi chuyên viên làm một thẻ)", () => {
  it("thẻ chưa gắn dịch vụ: gửi chính thẻ, ẩn ô dịch vụ", () => {
    expect(cheDoDvThe([], C)).toEqual({ kieu: "the", dvId: `goi:${C}` });
  });
  it("đúng một dịch vụ: gửi thẳng, không cần chọn", () => {
    expect(cheDoDvThe([{ gia_tri: A, nhan: "Peel" }], C)).toEqual({ kieu: "mot", dvId: A, ten: "Peel" });
  });
  it("nhiều dịch vụ hoặc thẻ không có gói: chọn trong danh sách", () => {
    expect(cheDoDvThe([{ gia_tri: A, nhan: "a" }, { gia_tri: B, nhan: "b" }], C)).toEqual({ kieu: "chon" });
    expect(cheDoDvThe([], null)).toEqual({ kieu: "chon" });
  });
});

// Chi nhánh Vinh 18/11/2026: khách làm cùng dịch vụ 2 lần trong ngày, lần trước còn đang chờ → dòng mang luotId + slCu (cộng vào lượt đó).
describe("docDongGui — thêm lần vào lượt đang chờ", () => {
  const L = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  it("giữ luotId + slCu, bỏ người làm riêng (theo lượt đang chờ); dòng mới cùng dịch vụ vẫn tách riêng", () => {
    const r = docDongGui(JSON.stringify([{ theId: T1, dvId: A, luotId: L, slCu: 2, soLuong: 2, nvIds: [NV] }, { theId: T1, dvId: A }, { theId: T1, dvId: A, luotId: L, slCu: 2 }]));
    expect(r).toEqual({ dong: [{ theId: T1, dvId: A, luotId: L, slCu: 2, soLuong: 2 }, { theId: T1, dvId: A }] });
  });
  it("luotId hỏng thì coi như dòng mới; slCu thiếu / sai thì bỏ dòng", () => {
    expect(docDongGui(JSON.stringify([{ theId: T1, dvId: A, luotId: "x" }]))).toEqual({ dong: [{ theId: T1, dvId: A }] });
    expect(docDongGui(JSON.stringify([{ theId: T1, dvId: A, luotId: L }]))).toHaveProperty("loi");
  });
  it("kiemBuoiThe: buổi đang chờ + số lần thêm vượt số buổi còn thì chặn", () => {
    const the = new Map([[T1, { ten: "Amia Basic 30 buổi", buoiCon: 3, dangMo: 2 }]]);
    expect(kiemBuoiThe([{ theId: T1 }], the)).toEqual([]);
    expect(kiemBuoiThe([{ theId: T1, soLuong: 2 }], the)[0]).toContain("chỉ còn 1 buổi");
  });
});
