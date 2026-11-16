import { beforeEach, describe, expect, it, vi } from "vitest";

// Khoá chi nhánh ở máy chủ cho lưu/sửa lịch và đổi trạng thái lịch (tài khoản gắn chi nhánh không được đụng chi nhánh khác).
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/push", () => ({ guiChoNhanVien: vi.fn() }));
const VINH = "cn-vinh", DL = "cn-dl";
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; vaiTro?: string };
vi.mock("@/lib/auth", () => ({ kiemQuyen: async () => nguoiDung, KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));
const dong: Record<string, Record<string, Record<string, unknown>>> = {
  khach_hang: { "k-vinh": { chi_nhanh_id: VINH }, "k-dl": { chi_nhanh_id: DL } },
  lich_hen: { "l-vinh": { trang_thai: "hoan_thanh", chi_nhanh_id: VINH, tao_boi: "nv", khach_id: "k-vinh" }, "l-vinh-khac": { trang_thai: "chua_xac_nhan", chi_nhanh_id: VINH, tao_boi: "nguoi-khac" }, "l-sh": { trang_thai: "da_xac_nhan", chi_nhanh_id: VINH, tao_boi: null }, "l-dl": { trang_thai: "hoan_thanh", chi_nhanh_id: DL } },
};
const ghi: string[] = [];
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (bang: string) => {
      const loc: Record<string, unknown> = {};
      const b: Record<string, unknown> = {
        select: () => b, eq: (c: string, v: unknown) => { loc[c] = v; return b; }, neq: () => b, not: () => b, lt: () => b, gt: () => b, limit: () => b, order: () => b, or: () => b, in: () => b,
        maybeSingle: async () => ({ data: dong[bang]?.[String(loc.id)] ?? null }),
        update: () => { ghi.push(`${bang}.update`); return b; }, insert: () => { ghi.push(`${bang}.insert`); return b; }, delete: () => { ghi.push(`${bang}.delete`); return b; },
      };
      return b;
    },
  }),
}));

const KHONG = "Bạn không có quyền thực hiện thao tác này.";
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
beforeEach(() => { ghi.length = 0; nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv" }; });

describe("Lịch hẹn: khoá chi nhánh ở máy chủ", () => {
  it("đặt lịch cho khách chi nhánh khác bị chặn, khách cùng chi nhánh đi tiếp (tới bước kiểm ngày)", async () => {
    const { luuLichHen } = await import("../../src/app/(app)/lich-hen/actions");
    expect((await luuLichHen(fd({ khach_id: "k-dl", ngay: "", gio: "" }))).loi).toBe(KHONG);
    expect((await luuLichHen(fd({ khach_id: "k-vinh", ngay: "", gio: "" }))).loi).toBe("Chọn ngày và giờ hẹn.");
  });
  it("sửa lịch của chi nhánh khác bị chặn dù khách là của mình", async () => {
    const { luuLichHen } = await import("../../src/app/(app)/lich-hen/actions");
    expect((await luuLichHen(fd({ id: "l-dl", khach_id: "k-vinh", ngay: "", gio: "" }))).loi).toBe(KHONG);
    expect((await luuLichHen(fd({ id: "l-vinh", khach_id: "k-vinh", ngay: "", gio: "" }))).loi).toBe("Chọn ngày và giờ hẹn.");
  });
  it("sửa lịch: ai có quyền sửa lịch đều sửa được lịch người khác tạo (chị Lâm 16/11), kiểm ở máy chủ", async () => {
    const { luuLichHen } = await import("../../src/app/(app)/lich-hen/actions");
    expect((await luuLichHen(fd({ id: "l-vinh-khac", khach_id: "k-vinh", ngay: "", gio: "" }))).loi).toBe("Chọn ngày và giờ hẹn.");
    expect((await luuLichHen(fd({ id: "l-sh", khach_id: "k-vinh", ngay: "", gio: "" }))).loi).toBe("Chọn ngày và giờ hẹn.");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "ql", vaiTro: "quan_ly" };
    expect((await luuLichHen(fd({ id: "l-vinh-khac", khach_id: "k-vinh", ngay: "", gio: "" }))).loi).toBe("Chọn ngày và giờ hẹn.");
    expect((await luuLichHen(fd({ id: "l-sh", khach_id: "k-vinh", ngay: "", gio: "" }))).loi).toBe("Chọn ngày và giờ hẹn.");
    expect(ghi).toEqual([]);
  });
  it("đặt lịch mới thiếu loại lịch bị chặn", async () => {
    const { luuLichHen } = await import("../../src/app/(app)/lich-hen/actions");
    expect((await luuLichHen(fd({ khach_id: "k-vinh", ngay: "2026-12-01", gio: "09:00", dich_vu_ids: "dv1" }))).loi).toMatch(/^Chọn loại lịch/);
    expect((await luuLichHen(fd({ khach_id: "k-vinh", ngay: "2026-12-01", gio: "09:00", dich_vu_ids: "dv1", loai_lich: "linh_tinh" }))).loi).toBe("Loại lịch không hợp lệ.");
    expect(ghi).toEqual([]);
  });
  it("đổi trạng thái lịch chi nhánh khác bị chặn, lịch của mình tới được bước kiểm chuyển trạng thái", async () => {
    const { doiTrangThaiLich } = await import("../../src/app/(app)/lich-hen/actions");
    expect((await doiTrangThaiLich(fd({ id: "l-dl", trang_thai: "da_xac_nhan" }))).loi).toBe(KHONG);
    expect((await doiTrangThaiLich(fd({ id: "l-vinh", trang_thai: "da_xac_nhan" }))).loi).toBe("Không chuyển được sang trạng thái này.");
    expect(ghi).toEqual([]);
  });
  it("tài khoản không gắn chi nhánh (Chủ) đi xuyên chi nhánh được", async () => {
    nguoiDung = { chiNhanhId: null, nhanVienId: "chu" };
    const { luuLichHen, doiTrangThaiLich } = await import("../../src/app/(app)/lich-hen/actions");
    expect((await luuLichHen(fd({ khach_id: "k-dl", ngay: "", gio: "" }))).loi).toBe("Chọn ngày và giờ hẹn.");
    expect((await doiTrangThaiLich(fd({ id: "l-dl", trang_thai: "da_xac_nhan" }))).loi).toBe("Không chuyển được sang trạng thái này.");
  });
});
