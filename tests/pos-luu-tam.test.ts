import { describe, expect, it } from "vitest";
import { CN_TTL_MS, docBoNhoPos, docCnNho, khoaPos, lamSachDon, POS_TTL_MS, tabCoNoiDung, type DonLuuTam } from "@/lib/pos-luu-tam";
import type { DongDon } from "@/lib/ban-hang";

// Chị Lâm 11/11/2026: đơn đang mở ở Thu ngân giữ 1 giờ theo tài khoản, mở lại vẫn còn cho tới khi tắt / xoá.
const nv = { phuc_vu: [], tu_van: [], ban: [] } as DongDon["nv"];
const don = (p: Partial<DonLuuTam> = {}): DonLuuTam => ({ khach: null, cnId: "cn1", dong: [], lichId: null, giamDon: 0, giamPct: "", vatPct: "0", phuPhi: 0, tip: 0, ghiChu: "", gioVao: "", gioRa: "", soKhach: "1", ngayHd: "", moLe: false, tab: "dich_vu", ...p });
const T0 = 1_800_000_000_000;

describe("docBoNhoPos", () => {
  const tho = (luc: number) => JSON.stringify({ luc, xem: 1, tabs: [{ kieu: "ban", don: don() }, { kieu: "dich_vu", nhapId: "n1" }] });
  it("trong 1 giờ: mở lại đúng", () => expect(docBoNhoPos(tho(T0), T0 + POS_TTL_MS - 1)?.tabs).toHaveLength(2));
  it("quá 1 giờ từ lần sửa cuối: bỏ", () => expect(docBoNhoPos(tho(T0), T0 + POS_TTL_MS + 1)).toBeNull());
  it("hỏng / rỗng / tab sai: bỏ", () => {
    expect(docBoNhoPos("{", T0)).toBeNull();
    expect(docBoNhoPos(null, T0)).toBeNull();
    expect(docBoNhoPos(JSON.stringify({ luc: T0, tabs: [{ kieu: "x" }] }), T0)).toBeNull();
  });
  it("mỗi tài khoản một khoá", () => expect(khoaPos("a")).not.toBe(khoaPos("b")));
});

describe("lamSachDon", () => {
  it("bỏ dòng của mục không còn bán, chi nhánh không còn thì về mặc định", () => {
    const d = lamSachDon(don({ cnId: "cu", dong: [{ loai: "dich_vu", ref: "a", sl: 2, giam: 0, nv }, { loai: "san_pham", ref: "b", sl: 1, giam: 0, nv }] }), (k) => k === "dich_vu:a", (id) => id === "cn1", "cn1");
    expect(d.dong.map((x) => x.ref)).toEqual(["a"]);
    expect(d.cnId).toBe("cn1");
  });
});

it("tab trống không cần lưu", () => {
  expect(tabCoNoiDung({ kieu: "ban", don: don() })).toBe(false);
  expect(tabCoNoiDung({ kieu: "ban", don: don({ ghiChu: "x" }) })).toBe(true);
  expect(tabCoNoiDung({ kieu: "ban", nhapId: "n1" })).toBe(true);
});

it("chi nhánh nhớ 30 ngày, chỉ khi còn được bán", () => {
  const tho = JSON.stringify({ id: "cn1", luc: T0 });
  expect(docCnNho(tho, T0 + 1000, () => true)).toBe("cn1");
  expect(docCnNho(tho, T0 + CN_TTL_MS + 1, () => true)).toBeNull();
  expect(docCnNho(tho, T0, () => false)).toBeNull();
});
