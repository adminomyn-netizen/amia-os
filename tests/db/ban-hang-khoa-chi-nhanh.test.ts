import { beforeEach, describe, expect, it, vi } from "vitest";

// Khoá chi nhánh ở máy chủ cho phần Bán hàng: thẻ tiền, điểm, thẻ của khách, chốt đơn (tài khoản gắn chi nhánh không đụng khách chi nhánh khác).
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
const VINH = "cn-vinh", DL = "cn-dl";
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; vaiTro: string; quyen: string[] };
vi.mock("@/lib/auth", () => ({ kiemQuyen: async () => nguoiDung, KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));
vi.mock("@/lib/diem-thuong", () => ({ cauHinhDiem: async () => ({ bat: true, tienMoiDiem: 1000 }) }));
const dong: Record<string, Record<string, Record<string, unknown>>> = {
  khach_hang: { "k-vinh": { chi_nhanh_id: VINH, diem_so_du: 5 }, "k-dl": { chi_nhanh_id: DL, diem_so_du: 9 } },
  v_khach_hang: { "k-vinh": { chi_nhanh_id: VINH, hang: "Bạc" }, "k-dl": { chi_nhanh_id: DL, hang: "Vàng" } },
};
const bang_the = [{ id: "t1", ma: "T1", loai: "tien", goi_id: "g1", so_buoi_con: 0, so_buoi_tong: null, so_du_tien: 100000, han_dung: null, tinh_trang: "hoat_dong" }];
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (bang: string) => {
      const loc: Record<string, unknown> = {};
      const b: Record<string, unknown> = {
        select: () => b, eq: (c: string, v: unknown) => { loc[c] = v; return b; }, in: () => b, order: () => b, limit: () => b,
        maybeSingle: async () => ({ data: dong[bang]?.[String(loc.id)] ?? null }),
        then: (ok: (r: { data: unknown[] }) => unknown) => ok({ data: bang === "v_the_khach" ? bang_the : bang === "goi_the" ? [{ id: "g1", ten: "Thẻ tiền 1tr" }] : [] }),
      };
      return b;
    },
  }),
}));

beforeEach(() => { nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv", vaiTro: "thu_ngan", quyen: ["ban.tao", "khach.xem"] }; });

describe("Bán hàng: khoá chi nhánh ở máy chủ", () => {
  it("thẻ tiền, điểm và thẻ của khách chi nhánh khác không lấy được", async () => {
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect(await a.layTheTien("k-dl")).toEqual([]);
    expect(await a.layDiemKhach("k-dl")).toBeNull();
    expect(await a.layTheKhach("k-dl")).toBeNull();
  });
  it("khách cùng chi nhánh lấy được đủ thẻ, điểm, hạng", async () => {
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect(await a.layTheTien("k-vinh")).toEqual([{ id: "t1", ma: "T1", soDu: 100000 }]);
    expect((await a.layDiemKhach("k-vinh"))?.soDu).toBe(5);
    const kh = await a.layTheKhach("k-vinh");
    expect(kh?.hang).toBe("Bạc");
    expect(kh?.the[0]).toMatchObject({ ten: "Thẻ tiền 1tr", soDu: 100000, loai: "tien" });
  });
  it("chốt đơn cho khách chi nhánh khác bị chặn", async () => {
    const { chotDonBanHang } = await import("../../src/app/(app)/ban-hang/actions");
    const don = (khachId: string) => JSON.stringify({ khachId, lichId: null, chiNhanhId: VINH, dong: [{ loai: "dich_vu", ref: "x", sl: 1, giam: 0, nv: { phuc_vu: [], tu_van: [], ban: [] } }], giamDon: 0, vatPct: 0, phuPhi: 0, tip: 0, nguoiGioiThieu: "", ghiChu: "", thu: [], doiDiem: 0, voucher: "" });
    expect(await chotDonBanHang(don("k-dl"))).toEqual({ loi: "Khách này thuộc chi nhánh khác." });
  });
  it("tài khoản không gắn chi nhánh (Chủ) xem được khách mọi chi nhánh", async () => {
    nguoiDung = { chiNhanhId: null, nhanVienId: "chu", vaiTro: "chu", quyen: ["ban.tao", "khach.xem"] };
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect((await a.layDiemKhach("k-dl"))?.soDu).toBe(9);
    expect((await a.layTheKhach("k-dl"))?.hang).toBe("Vàng");
  });
});
