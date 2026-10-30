import { beforeEach, describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";

// Nhập cả bảng tỉ lệ hoa hồng: quyền, khoá chi nhánh, xem trước không ghi, có lỗi thì không ghi dòng nào, một câu upsert, nhật ký, chạy lại không trùng.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
let nd: { chiNhanhId: string | null; nhanVienId: string } | null;
vi.mock("@/lib/auth", () => ({ kiemQuyen: async () => nd, KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));
const ghi: { bang: string; thao: string; du: unknown; tuyChon?: unknown }[] = [];
const kho: Record<string, Record<string, unknown>[]> = {};
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (bang: string) => {
      const b: Record<string, unknown> = {
        select: () => b, order: () => b, range: () => b,
        upsert: async (du: unknown, tuyChon: unknown) => { ghi.push({ bang, thao: "upsert", du, tuyChon }); return { error: null }; },
        insert: async (du: unknown) => { ghi.push({ bang, thao: "insert", du }); return { error: null }; },
        then: (ok: (r: { error: null; data: unknown[] }) => unknown) => ok({ error: null, data: kho[bang] ?? [] }),
      };
      return b;
    },
  }),
}));
const fd = (o: Record<string, string | File>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const T = "\t";
const BANG = ["Loại", "Mã hoặc tên mục", "Vai", "Tỉ lệ (%)", "Số tiền cố định", "Đối tượng"].join(T) + "\n" + ["Dịch vụ", "DV-001", "Bán", "5", "", ""].join(T) + "\n" + ["Dịch vụ", "", "Phục vụ", "2", "10000", "nhóm: Điều dưỡng"].join(T);
beforeEach(() => {
  ghi.length = 0; nd = { chiNhanhId: null, nhanVienId: "nv1" };
  kho.dich_vu = [{ id: "d1", ma: "DV-001", ten: "Peel da" }]; kho.san_pham = []; kho.goi_the = [];
  kho.nhan_vien = [{ id: "n1", ma_nv: "NV001", ho_ten: "Lê An", chuc_danh: "Điều dưỡng", hoat_dong: true }];
  kho.hoa_hong_ti_le = [];
});

describe("nhập tỉ lệ hoa hồng: máy chủ", () => {
  it("không có quyền sửa danh mục hoặc gắn chi nhánh thì bị chặn, không ghi gì", async () => {
    const { xemTruocNhapTiLe, apDungNhapTiLe } = await import("../../src/app/(app)/hoa-hong/actions");
    nd = null;
    expect((await xemTruocNhapTiLe(fd({ van_ban: BANG }))).loi).toBe("Bạn không có quyền thực hiện thao tác này.");
    expect((await apDungNhapTiLe(fd({ van_ban: BANG }))).loi).toBe("Bạn không có quyền thực hiện thao tác này.");
    nd = { chiNhanhId: "cn-vinh", nhanVienId: "nv1" };
    expect((await xemTruocNhapTiLe(fd({ van_ban: BANG }))).loi).toMatch(/chi nhánh/);
    expect((await apDungNhapTiLe(fd({ van_ban: BANG }))).loi).toMatch(/chi nhánh/);
    expect(ghi).toEqual([]);
  });
  it("xem trước không ghi gì", async () => {
    const { xemTruocNhapTiLe } = await import("../../src/app/(app)/hoa-hong/actions");
    const r = await xemTruocNhapTiLe(fd({ van_ban: BANG }));
    expect(r.tong).toEqual({ them: 2, ghiDe: 0, giuNguyen: 0, loi: 0 });
    expect(ghi).toEqual([]);
  });
  it("còn một dòng lỗi thì không ghi dòng nào", async () => {
    const { apDungNhapTiLe } = await import("../../src/app/(app)/hoa-hong/actions");
    const r = await apDungNhapTiLe(fd({ van_ban: BANG + "\n" + ["Dịch vụ", "KHONG-CO", "Bán", "5"].join(T) }));
    expect(r.ok).toBeUndefined();
    expect(r.loi).toMatch(/1 dòng lỗi.*chưa ghi dòng nào/);
    expect(ghi).toEqual([]);
  });
  it("áp dụng: đúng một câu upsert theo khoá dòng + một dòng nhật ký; chạy lại không ghi thêm", async () => {
    const { apDungNhapTiLe } = await import("../../src/app/(app)/hoa-hong/actions");
    const r = await apDungNhapTiLe(fd({ van_ban: BANG }));
    expect(r.ok).toBe(true);
    expect(ghi.map((g) => `${g.bang}.${g.thao}`)).toEqual(["hoa_hong_ti_le.upsert", "nhat_ky_truy_cap.insert"]);
    expect(ghi[0].tuyChon).toEqual({ onConflict: "loai,muc_id,vai,nhan_vien_id,nhom_chuc_danh" });
    expect(ghi[0].du).toEqual([
      { loai: "dich_vu", vai: "ban", muc_id: "d1", nhan_vien_id: null, nhom_chuc_danh: null, ti_le: 5, so_tien: null },
      { loai: "dich_vu", vai: "phuc_vu", muc_id: null, nhan_vien_id: null, nhom_chuc_danh: "điều dưỡng", ti_le: 2, so_tien: 10000 },
    ]);
    expect(ghi[1].du).toMatchObject({ nguoi_id: "nv1", hanh_dong: "nhap_ti_le_hoa_hong", doi_tuong: "hoa_hong_ti_le", chi_tiet: { nguon: "dan", them: 2, ghi_de: 0, giu_nguyen: 0 } });
    // Chạy lại: bảng đã có đúng các dòng này.
    kho.hoa_hong_ti_le = (ghi[0].du as Record<string, unknown>[]).map((d, i) => ({ id: `r${i}`, ...d }));
    ghi.length = 0;
    const lai = await apDungNhapTiLe(fd({ van_ban: BANG }));
    expect(lai.tong).toEqual({ them: 0, ghiDe: 0, giuNguyen: 2, loi: 0 });
    expect(ghi.filter((g) => g.bang === "hoa_hong_ti_le")).toEqual([]);
  });
  it("đọc được tệp .xlsx (sheet Tỉ lệ, ô định dạng % tự về đúng số %) và từ chối đuôi lạ", async () => {
    const { xemTruocNhapTiLe } = await import("../../src/app/(app)/hoa-hong/actions");
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Hướng dẫn").addRow(["bỏ qua"]);
    const ws = wb.addWorksheet("Tỉ lệ");
    ws.addRow(["Loại", "Mã hoặc tên mục", "Vai", "Tỉ lệ (%)", "Số tiền cố định", "Đối tượng"]);
    ws.addRow(["Dịch vụ", "DV-001", "Bán", 0.075, null, null]); ws.getCell("D2").numFmt = "0.0%";
    ws.addRow(["Dịch vụ", "Peel da", "Tư vấn", 3, 15000, "NV001"]);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const r = await xemTruocNhapTiLe(fd({ tep: new File([buf], "ti-le.xlsx") }));
    expect(r.loi).toBeUndefined();
    expect(r.dong?.map((d) => [d.dong, d.ti_le, d.so_tien, d.nhan_vien_id])).toEqual([[2, 7.5, null, null], [3, 3, 15000, "n1"]]);
    expect((await xemTruocNhapTiLe(fd({ tep: new File(["x"], "ti-le.pdf") }))).loi).toMatch(/\.xlsx hoặc \.csv/);
    const csv = await xemTruocNhapTiLe(fd({ tep: new File(["Loại;Mã hoặc tên mục;Vai;Tỉ lệ (%)\nDịch vụ;DV-001;Bán;7,5\n"], "ti-le.csv") }));
    expect(csv.dong?.[0]).toMatchObject({ ti_le: 7.5, muc_id: "d1" });
    expect((await xemTruocNhapTiLe(fd({ van_ban: "  " }))).loi).toMatch(/dán bảng/);
  });
});
