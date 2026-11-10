import { beforeEach, describe, expect, it, vi } from "vitest";

// Nút Xoá ở khung "Chờ thanh toán" (chị Lâm 10/11/2026): đơn nháp xoá được bởi người lập hoặc người có quyền huỷ đơn (ban.huy = pos.void SalonHero) hoặc Quản lý (ban.sua),
// khoá chi nhánh, xoá xong ghi nhật ký kèm nguyên nội dung đơn. Hoá đơn đã mở lại để sửa: "Bỏ sửa" (ban.sua / ban.huy) gọi bo_sua_hoa_don.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
const VINH = "11111111-1111-4111-8111-111111111111", DL = "22222222-2222-4222-8222-222222222222";
const NHAP_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", NHAP_DL = "dddddddd-dddd-4ddd-8ddd-dddddddddddd", HD = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; vaiTro: string; quyen: string[] } | null;
vi.mock("@/lib/auth", () => ({ kiemQuyen: async () => nguoiDung, KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));
vi.mock("@/lib/diem-thuong", () => ({ cauHinhDiem: async () => ({ bat: true, tienMoiDiem: 1000 }) }));

const bang: Record<string, Record<string, Record<string, unknown>>> = {};
const ghi: { bang: string; kieu: string; du_lieu?: unknown; id?: unknown }[] = [];
const rpc: { ten: string; tham: unknown }[] = [];
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String((e as { message?: string })?.message ?? e),
  sb: () => ({
    rpc: async (ten: string, tham: unknown) => { rpc.push({ ten, tham }); return { error: null }; },
    from: (ten: string) => {
      const loc: Record<string, unknown> = {};
      let kieu = "doc";
      const b: Record<string, unknown> = {
        select: () => b, eq: (c: string, v: unknown) => { loc[c] = v; return b; }, order: () => b, limit: () => b,
        insert: async (d: unknown) => { ghi.push({ bang: ten, kieu: "them", du_lieu: d }); return { error: null }; },
        delete: () => { kieu = "xoa"; return b; },
        maybeSingle: async () => ({ data: bang[ten]?.[String(loc.id)] ?? null }),
        then: (ok: (r: { error: null; data?: unknown[] }) => unknown) => { if (kieu === "xoa") ghi.push({ bang: ten, kieu, id: loc.id }); return ok({ error: null, data: kieu === "xoa" ? [{ id: loc.id }] : [] }); },
      };
      return b;
    },
  }),
}));

const ta = (chiNhanhId: string | null, quyen: string[], nhanVienId = "nv-a") => ({ chiNhanhId, nhanVienId, vaiTro: "thu_ngan", quyen });

beforeEach(() => {
  ghi.length = 0; rpc.length = 0;
  bang.don_nhap = {
    [NHAP_A]: { id: NHAP_A, chi_nhanh_id: VINH, nguoi_lap_id: "nv-a", khach_id: null, tieu_de: null, dong: [], tao_luc: "2026-11-10T07:27:00Z", cap_nhat_luc: "2026-11-10T07:27:00Z" },
    [NHAP_DL]: { id: NHAP_DL, chi_nhanh_id: DL, nguoi_lap_id: "nv-a", khach_id: null, tieu_de: null, dong: [], tao_luc: "2026-11-10T07:27:00Z", cap_nhat_luc: "2026-11-10T07:27:00Z" },
  };
  bang.hoa_don = { [HD]: { chi_nhanh_id: VINH, ma: "HD000123" } };
});

describe("Xoá đơn nháp ở Chờ thanh toán", () => {
  it("người lập xoá được đơn của mình, xoá xong ghi nhật ký kèm nội dung đơn", async () => {
    nguoiDung = ta(VINH, ["ban.tao"]);
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect(await a.xoaDonCho(NHAP_A, "khách đổi ý")).toEqual({ ok: true });
    expect(ghi.map((g) => `${g.bang}:${g.kieu}`)).toEqual(["don_nhap:xoa", "nhat_ky_truy_cap:them"]);
    const nk = ghi[1].du_lieu as { hanh_dong: string; doi_tuong_id: string; chi_tiet: { ly_do: string; nguoi_lap_id: string } };
    expect(nk.hanh_dong).toBe("xoa_don_nhap");
    expect(nk.doi_tuong_id).toBe(NHAP_A);
    expect(nk.chi_tiet.ly_do).toBe("khách đổi ý");
    expect(nk.chi_tiet.nguoi_lap_id).toBe("nv-a");
  });
  it("thu ngân khác không có ban.huy thì không xoá được đơn của người khác", async () => {
    nguoiDung = ta(VINH, ["ban.tao"], "nv-b");
    const a = await import("../../src/app/(app)/ban-hang/actions");
    const r = await a.xoaDonCho(NHAP_A);
    expect("loi" in r && r.loi).toMatch(/người lập/);
    expect(ghi).toEqual([]);
  });
  it("người có ban.huy (Chủ/Kế toán như pos.void SalonHero) xoá được đơn của người khác", async () => {
    nguoiDung = ta(VINH, ["ban.tao", "ban.huy"], "nv-b");
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect(await a.xoaDonCho(NHAP_A)).toEqual({ ok: true });
  });
  it("Quản lý (ban.sua, không ban.huy) xoá được đơn nháp của người khác (chị Lâm 10/11/2026)", async () => {
    nguoiDung = ta(VINH, ["ban.tao", "ban.sua"], "nv-b");
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect(await a.xoaDonCho(NHAP_A)).toEqual({ ok: true });
    const { QUYEN_THEO_VAI_TRO } = await import("../../src/lib/quyen");
    const duoc = (v: keyof typeof QUYEN_THEO_VAI_TRO) => QUYEN_THEO_VAI_TRO[v].includes("ban.huy") || QUYEN_THEO_VAI_TRO[v].includes("ban.sua");
    expect([duoc("quan_ly"), duoc("ke_toan"), duoc("chu"), duoc("thu_ngan"), duoc("tu_van"), duoc("ktv")]).toEqual([true, true, true, false, false, false]);
  });
  it("khoá chi nhánh: đơn chi nhánh khác coi như không có", async () => {
    nguoiDung = ta(VINH, ["ban.tao", "ban.huy"]);
    const a = await import("../../src/app/(app)/ban-hang/actions");
    const r = await a.xoaDonCho(NHAP_DL);
    expect("loi" in r && r.loi).toMatch(/Không tìm thấy/);
    expect(ghi).toEqual([]);
  });
  it("không có quyền bán hàng / id sai thì từ chối", async () => {
    nguoiDung = null;
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect("loi" in (await a.xoaDonCho(NHAP_A))).toBe(true);
    nguoiDung = ta(VINH, ["ban.tao"]);
    expect("loi" in (await a.xoaDonCho("x'; drop"))).toBe(true);
    expect(ghi).toEqual([]);
  });
});

describe("Bỏ sửa hoá đơn đã mở lại", () => {
  it("thu ngân (không ban.sua/ban.huy) không bỏ sửa được", async () => {
    nguoiDung = ta(VINH, ["ban.tao"]);
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect("loi" in (await a.boSuaHoaDon(HD))).toBe(true);
    expect(rpc).toEqual([]);
  });
  it("quản lý (ban.sua) gọi bo_sua_hoa_don với người thao tác", async () => {
    nguoiDung = ta(VINH, ["ban.tao", "ban.sua"], "nv-ql");
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect(await a.boSuaHoaDon(HD)).toEqual({ ok: true, ma: "HD000123" });
    expect(rpc).toEqual([{ ten: "bo_sua_hoa_don", tham: { p_id: HD, p_nguoi: "nv-ql" } }]);
  });
  it("hoá đơn chi nhánh khác thì không gọi", async () => {
    nguoiDung = ta(DL, ["ban.tao", "ban.sua"]);
    const a = await import("../../src/app/(app)/ban-hang/actions");
    expect("loi" in (await a.boSuaHoaDon(HD))).toBe(true);
    expect(rpc).toEqual([]);
  });
});
