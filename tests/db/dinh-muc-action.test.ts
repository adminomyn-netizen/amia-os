import { beforeEach, describe, expect, it, vi } from "vitest";

// Định mức: nhập hàng loạt có chế độ "chỉ kiểm tra", ghi giá vốn dịch vụ tính ở máy chủ và có nhật ký.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
let quyen: string[];
vi.mock("@/lib/auth", () => ({ kiemQuyen: async (q: string) => (quyen.includes(q) ? { chiNhanhId: null, nhanVienId: "nv1" } : null), KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));
const ghi: { bang: string; thao: string; du: unknown }[] = [];
const kho: Record<string, unknown[]> = {
  dich_vu: [{ id: "d1", ma: "D1", ten: "MFU Basic", gia_von: 0 }],
  san_pham: [{ id: "s1", ma: "VT-1", ten: "Kem tê", nhom_cap: "A", gia_nhap_don_vi: 2000 }, { id: "s2", ma: "VT-2", ten: "Đầu MFU", nhom_cap: "A", gia_nhap_don_vi: null }],
  dinh_muc: [{ dich_vu_id: "d1", san_pham_id: "s1", so_luong: 20, chon_theo_chi_dinh: false }],
};
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (bang: string) => {
      const b: Record<string, unknown> = {
        select: () => b, eq: () => b, in: () => b,
        maybeSingle: async () => ({ data: (kho[bang] ?? [])[0] ?? null }),
        update: (du: unknown) => { ghi.push({ bang, thao: "update", du }); return b; },
        upsert: async (du: unknown) => { ghi.push({ bang, thao: "upsert", du }); return { error: null }; },
        insert: async (du: unknown) => { ghi.push({ bang, thao: "insert", du }); return { error: null }; },
        then: (ok: (r: { error: null; data: unknown[] }) => unknown) => ok({ error: null, data: kho[bang] ?? [] }),
      };
      return b;
    },
  }),
}));
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
beforeEach(() => { ghi.length = 0; quyen = ["danhmuc.sua"]; kho.dinh_muc = [{ dich_vu_id: "d1", san_pham_id: "s1", so_luong: 20, chon_theo_chi_dinh: false }]; });

describe("định mức: máy chủ", () => {
  it("chỉ kiểm tra thì không ghi gì và báo số dòng", async () => {
    const { nhapDinhMuc } = await import("../../src/app/(app)/dinh-muc/actions");
    const r = await nhapDinhMuc(fd({ van_ban: "D1\tVT-1\t5\nD1\tVT-9\t5", chi_kiem: "1" }));
    expect(r.loi).toMatch(/CHƯA lưu: 1 dòng hợp lệ, 1 dòng lỗi/);
    expect(ghi).toEqual([]);
  });
  it("tắt chỉ kiểm tra thì lưu các dòng hợp lệ", async () => {
    const { nhapDinhMuc } = await import("../../src/app/(app)/dinh-muc/actions");
    const r = await nhapDinhMuc(fd({ van_ban: "D1\tVT-1\t5\nD1\tVT-9\t5", chi_kiem: "0" }));
    expect(r.loi).toMatch(/Đã lưu 1 dòng/);
    expect(ghi.filter((g) => g.thao === "upsert")).toHaveLength(1);
  });
  it("không có quyền sửa danh mục thì bị từ chối", async () => {
    quyen = ["danhmuc.xem"];
    const { nhapDinhMuc, apDungGiaVonDichVu } = await import("../../src/app/(app)/dinh-muc/actions");
    expect((await nhapDinhMuc(fd({ van_ban: "x" }))).loi).toMatch(/không có quyền/);
    expect((await apDungGiaVonDichVu(fd({ id: "d1" }))).loi).toMatch(/không có quyền/);
  });
  it("ghi giá vốn theo định mức: tính ở máy chủ (20 × 2.000 = 40.000) và có nhật ký trước/sau", async () => {
    const { apDungGiaVonDichVu } = await import("../../src/app/(app)/dinh-muc/actions");
    expect((await apDungGiaVonDichVu(fd({ id: "d1", gia_von: "999999999" }))).ok).toBe(true);
    expect(ghi.find((g) => g.bang === "dich_vu" && g.thao === "update")!.du).toEqual({ gia_von: 40000 });
    expect((ghi.find((g) => g.bang === "nhat_ky_truy_cap")!.du as { chi_tiet: { truoc: number; sau: number } }).chi_tiet).toMatchObject({ truoc: 0, sau: 40000 });
  });
  it("còn vật tư cố định chưa có giá nhập thì từ chối ghi giá vốn", async () => {
    const { apDungGiaVonDichVu } = await import("../../src/app/(app)/dinh-muc/actions");
    kho.dinh_muc = [{ dich_vu_id: "d1", san_pham_id: "s1", so_luong: 20, chon_theo_chi_dinh: false }, { dich_vu_id: "d1", san_pham_id: "s2", so_luong: 3, chon_theo_chi_dinh: false }];
    expect((await apDungGiaVonDichVu(fd({ id: "d1" }))).loi).toMatch(/chưa có giá nhập/);
    expect(ghi.filter((g) => g.bang === "dich_vu")).toEqual([]);
  });
});
