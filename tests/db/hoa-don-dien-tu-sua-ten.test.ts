import { beforeEach, describe, expect, it, vi } from "vitest";

// Sửa tên khi xuất hoá đơn điện tử: cùng quyền + khoá chi nhánh + kỳ khoá với ghi số hoá đơn; dòng hàng phải thuộc đúng hoá đơn; chỉ ghi vào hai bảng riêng.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const VINH = "cn-vinh", DL = "cn-dl";
const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; quyen: string[] } | null;
vi.mock("@/lib/auth", () => ({ kiemQuyen: async (q: string) => (nguoiDung && nguoiDung.quyen.includes(q) ? nguoiDung : null), KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));

type Dong = Record<string, unknown>;
const HD_VINH = U(1), HD_DL = U(2), HD_KHOA = U(3), HD_KHAC = U(4);
const bang: Record<string, Dong[]> = {
  hoa_don: [
    { id: HD_VINH, ma: "HD1", trang_thai: "hoan_thanh", chi_nhanh_id: VINH, ngay_hd: "2026-10-20", khach_id: "k1", vat_hd_luc: null, vat_hd_so: null },
    { id: HD_DL, ma: "HD2", trang_thai: "hoan_thanh", chi_nhanh_id: DL, ngay_hd: "2026-10-20", khach_id: "k1", vat_hd_luc: null, vat_hd_so: null },
    { id: HD_KHOA, ma: "HD3", trang_thai: "hoan_thanh", chi_nhanh_id: VINH, ngay_hd: "2026-08-15", khach_id: "k1", vat_hd_luc: null, vat_hd_so: null },
    { id: HD_KHAC, ma: "HD4", trang_thai: "hoan_thanh", chi_nhanh_id: VINH, ngay_hd: "2026-10-20", khach_id: null, vat_hd_luc: null, vat_hd_so: null },
  ],
  khach_hang: [{ id: "k1", ho_ten: "Nguyễn A", cong_ty: "Công ty Hoa", ma_so_thue: "0123456789", dia_chi: "Vinh" }],
  hoa_don_dong: [
    { id: U(11), hoa_don_id: HD_VINH, ten: "Filler", tao_luc: "1" }, { id: U(12), hoa_don_id: HD_VINH, ten: "Botox", tao_luc: "2" },
    { id: U(21), hoa_don_id: HD_DL, ten: "Peel", tao_luc: "3" }, { id: U(41), hoa_don_id: HD_KHAC, ten: "Laser", tao_luc: "4" },
  ],
  ky_ke_toan: [{ thang: "2026-08", trang_thai: "da_khoa" }],
  hoa_don_xuat_tuy_chinh: [], hoa_don_xuat_dong: [{ hoa_don_dong_id: U(12), ten_xuat: "Tiêm Botox" }],
};
const ghi: { bang: string; kieu: string; du?: unknown; loc: Record<string, unknown> }[] = [];
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (ten: string) => {
      const loc: Record<string, unknown> = {}, dk: ((r: Dong) => boolean)[] = [];
      let kieu = "select", du: unknown;
      const b: Record<string, unknown> = {
        select: () => b, order: () => b, limit: () => b,
        eq: (c: string, v: unknown) => { loc[c] = v; dk.push((r) => r[c] === v); return b; },
        in: (c: string, v: unknown[]) => { loc[`in:${c}`] = v; dk.push((r) => v.includes(r[c])); return b; },
        maybeSingle: async () => ({ data: (bang[ten] ?? []).find((r) => dk.every((f) => f(r))) ?? null }),
        insert: async (d: unknown) => { ghi.push({ bang: ten, kieu: "insert", du: d, loc }); return { error: null }; },
        upsert: async (d: unknown) => { ghi.push({ bang: ten, kieu: "upsert", du: d, loc }); return { error: null }; },
        update: (d: unknown) => { kieu = "update"; du = d; return b; },
        delete: () => { kieu = "delete"; return b; },
        then: (ok: (r: { error: null; data: Dong[] }) => unknown) => { if (kieu !== "select") ghi.push({ bang: ten, kieu, du, loc: { ...loc } }); return ok({ error: null, data: (bang[ten] ?? []).filter((r) => dk.every((f) => f(r))) }); },
      };
      return b;
    },
  }),
}));

const KHONG = "Bạn không có quyền thực hiện thao tác này.";
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const quyenGhi = ["hd.vat", "ban.sua_khoa", "ban.xem"];
const nhap = (hd: string, them: Record<string, string> = {}) => fd({ hoa_don_id: hd, ten_nguoi_mua: "Công ty Hoa", ma_so_thue: "0123456789", dia_chi: "Vinh", [`d:${U(11)}`]: "Filler", [`d:${U(12)}`]: "Tiêm Botox", ...them });
const goc = ["hoa_don", "hoa_don_dong", "khach_hang"];
beforeEach(() => { ghi.length = 0; nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: quyenGhi }; });

describe("lấy dữ liệu hộp sửa tên", () => {
  it("thiếu quyền, hoá đơn chi nhánh khác, kỳ đã khoá đều bị chặn", async () => {
    const { layTenXuat } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv", quyen: ["ban.xem"] };
    expect(await layTenXuat(HD_VINH)).toEqual({ loi: KHONG });
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv", quyen: quyenGhi };
    expect(await layTenXuat(HD_DL)).toEqual({ loi: "Không tìm thấy hoá đơn." });
    expect(await layTenXuat(HD_KHOA)).toHaveProperty("loi");
  });
  it("trả tên đang dùng: bản đã sửa nếu có, tên trong đơn nếu chưa; kèm tên gốc và mặc định", async () => {
    const { layTenXuat } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    const kq = await layTenXuat(HD_VINH);
    expect(kq).toEqual({ ok: { macDinh: { ten: "Công ty Hoa", mst: "0123456789", diaChi: "Vinh" }, nguoiMua: { ten: "Công ty Hoa", mst: "0123456789", diaChi: "Vinh" },
      dong: [{ id: U(11), tenGoc: "Filler", tenXuat: "Filler" }, { id: U(12), tenGoc: "Botox", tenXuat: "Tiêm Botox" }] } });
  });
});

describe("lưu tên xuất", () => {
  it("chặn thiếu quyền và hoá đơn chi nhánh khác; không ghi gì", async () => {
    const { luuTenXuat } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv", quyen: ["hd.vat", "ban.xem"] };
    expect((await luuTenXuat(nhap(HD_VINH))).loi).toBe(KHONG);
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv", quyen: quyenGhi };
    expect((await luuTenXuat(nhap(HD_DL))).loi).toBe("Không tìm thấy hoá đơn.");
    expect((await luuTenXuat(nhap(HD_KHOA))).loi).toMatch(/đã khoá/);
    expect(ghi).toEqual([]);
  });
  it("dòng hàng của hoá đơn khác (kể cả chi nhánh khác) bị từ chối, không ghi gì", async () => {
    const { luuTenXuat } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    const kq = await luuTenXuat(nhap(HD_VINH, { [`d:${U(21)}`]: "Tên lạ" }));
    expect(kq.loi).toMatch(/không thuộc hoá đơn/);
    expect((await luuTenXuat(nhap(HD_VINH, { [`d:khong-phai-uuid`]: "x" }))).loi).toMatch(/chưa hợp lệ/);
    expect(ghi).toEqual([]);
  });
  it("sửa tên: chỉ ghi vào hai bảng riêng + nhật ký; không đụng đơn bán, dòng hàng, hồ sơ khách", async () => {
    const { luuTenXuat } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    const kq = await luuTenXuat(nhap(HD_VINH, { ten_nguoi_mua: "Công ty TNHH Hoa Hồng", ma_so_thue: "0123456789-001", [`d:${U(11)}`]: "Tiêm filler môi" }));
    expect(kq.ok).toBe(true);
    expect(ghi.every((g) => !goc.includes(g.bang) || g.kieu === "select")).toBe(true);
    const tc = ghi.find((g) => g.bang === "hoa_don_xuat_tuy_chinh" && g.kieu === "upsert")!.du;
    expect(tc).toMatchObject({ hoa_don_id: HD_VINH, ten_nguoi_mua: "Công ty TNHH Hoa Hồng", ma_so_thue: "0123456789-001", dia_chi: null, sua_boi: "nv-vinh" });
    const dg = ghi.find((g) => g.bang === "hoa_don_xuat_dong" && g.kieu === "upsert")!.du as Dong[];
    expect(dg).toHaveLength(2); // dòng 2 đã sửa từ trước, gửi lại vẫn khác tên gốc nên ghi lại cùng giá trị
    expect(dg[0]).toMatchObject({ hoa_don_dong_id: U(11), ten_xuat: "Tiêm filler môi" });
    expect(dg[1]).toMatchObject({ hoa_don_dong_id: U(12), ten_xuat: "Tiêm Botox" });
    expect(ghi.some((g) => g.bang === "nhat_ky_truy_cap" && (g.du as { hanh_dong: string }).hanh_dong === "sua_ten_hd_xuat")).toBe(true);
  });
  it("ô giống mặc định hoặc để trống thì bỏ bản sửa (xoá), dòng khớp tên gốc thì xoá bản sửa cũ", async () => {
    const { luuTenXuat } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    expect((await luuTenXuat(nhap(HD_VINH, { [`d:${U(12)}`]: "Botox" }))).ok).toBe(true);
    expect(ghi.some((g) => g.bang === "hoa_don_xuat_tuy_chinh" && g.kieu === "delete" && g.loc.hoa_don_id === HD_VINH)).toBe(true);
    expect(ghi.some((g) => g.bang === "hoa_don_xuat_tuy_chinh" && g.kieu === "upsert")).toBe(false);
    const xoa = ghi.find((g) => g.bang === "hoa_don_xuat_dong" && g.kieu === "delete")!;
    expect(xoa.loc["in:hoa_don_dong_id"]).toEqual(expect.arrayContaining([U(11), U(12)]));
  });
  it("dữ liệu sai bị chặn: MST sai dạng, tên quá dài", async () => {
    const { luuTenXuat } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    expect((await luuTenXuat(nhap(HD_VINH, { ma_so_thue: "12345" }))).loi).toMatch(/Mã số thuế/);
    expect((await luuTenXuat(nhap(HD_VINH, { ten_nguoi_mua: "a".repeat(201) }))).loi).toMatch(/dài quá/);
    expect(ghi).toEqual([]);
  });
});
