import { beforeEach, describe, expect, it, vi } from "vitest";

// Trang chuẩn hoá vật tư: người gắn một chi nhánh chỉ XEM (danh mục vật tư là của cả hệ thống); sửa phải ghi nhật ký; tồn đầu theo chi nhánh của người tạo.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; quyen: string[] } | null;
vi.mock("@/lib/auth", () => ({
  kiemQuyen: async (q: string) => (nguoiDung && nguoiDung.quyen.includes(q) ? nguoiDung : null),
  KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này.",
}));
const ghi: { bang: string; thao: string; du: unknown }[] = [];
const rpc: { ham: string; tham: Record<string, unknown> }[] = [];
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    rpc: async (ham: string, tham: Record<string, unknown>) => { rpc.push({ ham, tham }); return { data: "phieu-1", error: null }; },
    from: (bang: string) => {
      const b: Record<string, unknown> = {
        select: () => b, eq: () => b,
        maybeSingle: async () => ({ data: { id: "sp1", ma: "VT-1", don_vi: "cái", don_vi_mua: null, he_so_quy_doi: 1, gia_nhap_don_vi: null, nhom_cap: null, tieu_hao: false } }),
        update: (du: unknown) => { ghi.push({ bang, thao: "update", du }); return b; },
        insert: async (du: unknown) => { ghi.push({ bang, thao: "insert", du }); return { error: null }; },
        then: (ok: (r: { error: null }) => unknown) => ok({ error: null }),
      };
      return b;
    },
  }),
}));

const KHONG = "Bạn không có quyền thực hiện thao tác này.";
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const dong = { id: "sp1", don_vi: "Gr", don_vi_mua: "Gói", he_so_quy_doi: "700", gia_nhap_don_vi: "", nhom_cap: "A", tieu_hao: "1" };
beforeEach(() => { ghi.length = 0; rpc.length = 0; nguoiDung = { chiNhanhId: null, nhanVienId: "nv1", quyen: ["kho.duyet", "kho.nhap"] }; });

describe("chuẩn hoá vật tư: khoá ở máy chủ", () => {
  it("người gắn một chi nhánh chỉ xem: không sửa được dù có quyền kho.duyet", async () => {
    const { luuChuanHoaVatTu } = await import("../../src/app/(app)/kho/chuan-hoa/actions");
    nguoiDung = { chiNhanhId: "cn-vinh", nhanVienId: "nv1", quyen: ["kho.duyet", "danhmuc.sua"] };
    expect((await luuChuanHoaVatTu(fd(dong))).loi).toMatch(/chỉ được xem/);
    expect(ghi).toEqual([]);
  });
  it("không có quyền thì bị từ chối", async () => {
    const { luuChuanHoaVatTu } = await import("../../src/app/(app)/kho/chuan-hoa/actions");
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv1", quyen: ["kho.xem"] };
    expect((await luuChuanHoaVatTu(fd(dong))).loi).toBe(KHONG);
  });
  it("quản lý chung sửa được: đơn vị về dạng chuẩn, giá trống giữ trống, có nhật ký trước/sau", async () => {
    const { luuChuanHoaVatTu } = await import("../../src/app/(app)/kho/chuan-hoa/actions");
    expect((await luuChuanHoaVatTu(fd(dong))).ok).toBe(true);
    const sua = ghi.find((g) => g.bang === "san_pham" && g.thao === "update")!.du as Record<string, unknown>;
    expect(sua).toMatchObject({ don_vi: "g", don_vi_mua: "Gói", he_so_quy_doi: 700, gia_nhap_don_vi: null, nhom_cap: "A", tieu_hao: true });
    const nk = ghi.find((g) => g.bang === "nhat_ky_truy_cap")!.du as { hanh_dong: string; chi_tiet: { truoc: { don_vi: string }; sau: { don_vi: string } } };
    expect(nk.hanh_dong).toBe("chuan_hoa_vat_tu");
    expect(nk.chi_tiet.truoc.don_vi).toBe("cái"); expect(nk.chi_tiet.sau.don_vi).toBe("g");
  });
  it("dữ liệu sai bị chặn trước khi ghi", async () => {
    const { luuChuanHoaVatTu } = await import("../../src/app/(app)/kho/chuan-hoa/actions");
    expect((await luuChuanHoaVatTu(fd({ ...dong, don_vi: "thùng" }))).loi).toMatch(/danh sách chuẩn/);
    expect(ghi).toEqual([]);
  });
  it("phiếu kiểm kê tồn đầu: người gắn chi nhánh chỉ tạo ở chi nhánh mình, loại ton_dau", async () => {
    const { taoKiemKeTonDau } = await import("../../src/app/(app)/kho/chuan-hoa/actions");
    nguoiDung = { chiNhanhId: "cn-vinh", nhanVienId: "nv1", quyen: ["kho.nhap"] };
    expect((await taoKiemKeTonDau(fd({ chi_nhanh_id: "cn-dalat" }))).ok).toBe(true);
    expect(rpc[0].tham).toMatchObject({ p_cn: "cn-vinh", p_loai: "ton_dau", p_nguoi: "nv1" });
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv1", quyen: ["kho.xem"] };
    expect((await taoKiemKeTonDau(fd({ chi_nhanh_id: "cn-dalat" }))).loi).toBe(KHONG);
  });
});
