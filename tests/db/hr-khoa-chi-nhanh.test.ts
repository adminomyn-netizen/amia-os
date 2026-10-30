import { beforeEach, describe, expect, it, vi } from "vitest";

// Khoá chi nhánh ở máy chủ cho các thao tác HR mới (tài sản, khen thưởng–kỷ luật, thử việc, thăng chức, bàn giao, KPI): không đụng nhân viên chi nhánh khác.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/push", () => ({ guiChoNhanVien: vi.fn() }));
const VINH = "cn-vinh", DL = "cn-dl";
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; quyen: string[] };
vi.mock("@/lib/auth", () => ({ kiemQuyen: async () => nguoiDung, KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));
const dong: Record<string, Record<string, Record<string, unknown>>> = {
  nhan_vien: { "nv-vinh": { chi_nhanh_id: VINH, chuc_danh: "A", phong_ban_id: null, ho_ten: "An", phong_ban_goc: null }, "nv-dl": { chi_nhanh_id: DL, chuc_danh: "B", phong_ban_id: null, ho_ten: "Bình" } },
  nghi_viec: { "nvi-dl": { nhan_vien_id: "nv-dl", trang_thai: "da_duyet" }, "nvi-vinh": { nhan_vien_id: "nv-vinh", trang_thai: "da_duyet" } },
};
const ghi: string[] = [];
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (bang: string) => {
      const loc: Record<string, unknown> = {};
      const b: Record<string, unknown> = {
        select: () => b, eq: (c: string, v: unknown) => { loc[c] = v; return b; },
        maybeSingle: async () => ({ data: dong[bang]?.[String(loc.id)] ?? null }),
        insert: async () => { ghi.push(`${bang}.insert`); return { error: null }; }, upsert: async () => { ghi.push(`${bang}.upsert`); return { error: null }; },
        update: () => { ghi.push(`${bang}.update`); return b; }, delete: () => { ghi.push(`${bang}.delete`); return b; },
        then: (ok: (r: { error: null; data: unknown[] }) => unknown) => ok({ error: null, data: [] }),
      };
      return b;
    },
  }),
}));

const KHONG = "Bạn không có quyền thực hiện thao tác này.";
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
beforeEach(() => { ghi.length = 0; nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["hr.hoso", "cong.xem", "luong.sua"] }; });

describe("HR mới: khoá chi nhánh ở máy chủ", () => {
  it("cấp tài sản cho nhân viên chi nhánh khác bị chặn, cùng chi nhánh ghi được", async () => {
    const { luuTaiSan } = await import("../../src/app/(app)/nhan-su/tai-san/actions");
    expect((await luuTaiSan(fd({ ten_tai_san: "Laptop", nhan_vien_id: "nv-dl" }))).loi).toBe(KHONG);
    expect(ghi).toEqual([]);
    expect((await luuTaiSan(fd({ ten_tai_san: "Laptop", nhan_vien_id: "nv-vinh" }))).ok).toBe(true);
    expect(ghi).toEqual(["hr_tai_san.insert"]);
  });
  it("ghi khen thưởng, mục tiêu thử việc, thăng chức cho người chi nhánh khác bị chặn", async () => {
    const kt = await import("../../src/app/(app)/nhan-su/khen-thuong-ky-luat/actions");
    const tv = await import("../../src/app/(app)/nhan-su/thu-viec/actions");
    const tc = await import("../../src/app/(app)/nhan-su/thang-tien/actions");
    expect((await kt.luuKhenKyLuat(fd({ nhan_vien_id: "nv-dl", loai: "thuong", ngay_lap: "2026-10-30", noi_dung: "Tốt", so_tien: "100000" }))).loi).toBe(KHONG);
    expect((await tv.luuMucTieuThuViec(fd({ nhan_vien_id: "nv-dl", moc: "30", noi_dung: "Học quy trình" }))).loi).toBe(KHONG);
    expect((await tv.luuDanhGiaThuViec(fd({ nhan_vien_id: "nv-dl", moc: "30", vai: "quan_ly", diem: "4" }))).loi).toBe(KHONG);
    expect((await tc.luuThangChuc(fd({ nhan_vien_id: "nv-dl", loai: "thang_chuc", hieu_luc_tu: "2026-10-30", den_chuc_danh: "Trưởng nhóm" }))).loi).toBe(KHONG);
    expect(ghi).toEqual([]);
  });
  it("bàn giao và chốt nghỉ việc của người chi nhánh khác bị chặn", async () => {
    const { danhDauBanGiao, luuChotNghiViec } = await import("../../src/app/(app)/nhan-su/offboarding/actions");
    expect((await danhDauBanGiao(fd({ nghi_viec_id: "nvi-dl", muc_id: "m1" }))).loi).toBe(KHONG);
    expect((await luuChotNghiViec(fd({ nghi_viec_id: "nvi-dl", cong_den_ngay: "2026-10-30" }))).loi).toBe(KHONG);
    expect(ghi).toEqual([]);
  });
  it("khung cấp bậc chỉ người không gắn chi nhánh được sửa", async () => {
    const { luuCapBac } = await import("../../src/app/(app)/nhan-su/thang-tien/actions");
    expect((await luuCapBac(fd({ ma: "B1", ten: "Bậc 1", bac: "1" }))).loi).toBe(KHONG);
    nguoiDung = { chiNhanhId: null, nhanVienId: "chu", quyen: ["hr.hoso"] };
    expect((await luuCapBac(fd({ ma: "B1", ten: "Bậc 1", bac: "1" }))).ok).toBe(true);
  });
});
