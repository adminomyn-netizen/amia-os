import { describe, expect, it } from "vitest";
import { docDongGui, kiemBuoiThe, nguoiLamDong, TOI_DA_DONG_GUI } from "@/lib/don-nhieu-dich-vu";

// Chị Thuý / chị Lâm 11/11/2026: một Đơn làm dịch vụ gửi NHIỀU dịch vụ (kể cả nhiều dịch vụ của cùng một thẻ) cho chuyên viên trị liệu một lần.
const T1 = "11111111-1111-4111-8111-111111111111", T2 = "22222222-2222-4222-8222-222222222222";
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const NV = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("docDongGui", () => {
  it("đọc nhiều dịch vụ của cùng thẻ, gộp dòng trùng, bỏ dòng hỏng", () => {
    const r = docDongGui(JSON.stringify([{ theId: T1, dvId: A }, { theId: T1, dvId: B, nvIds: [NV, NV, "x"] }, { theId: T1, dvId: A }, { theId: "x", dvId: A }]));
    expect(r).toEqual({ dong: [{ theId: T1, dvId: A }, { theId: T1, dvId: B, nvIds: [NV] }] });
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
    expect(kiemBuoiThe([{ theId: T2 }, { theId: T2 }], the)[0]).toContain("1 lượt đang chờ");
  });
  it("thẻ lạ thì báo", () => expect(kiemBuoiThe([{ theId: C }], the)).toHaveLength(1));
});

it("người làm: riêng của dòng, không có thì người chung", () => {
  expect(nguoiLamDong({ theId: T1, dvId: A }, [NV])).toEqual([NV]);
  expect(nguoiLamDong({ theId: T1, dvId: A, nvIds: [C] }, [NV])).toEqual([C]);
});
