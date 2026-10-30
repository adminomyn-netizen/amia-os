import { beforeEach, describe, expect, it, vi } from "vitest";

// Khoá quyền + chi nhánh + kỳ khoá ở máy chủ cho ghi/sửa/gỡ số hoá đơn điện tử, và kết nối nhà cung cấp (khoá mã hoá, không lộ).
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const VINH = "cn-vinh", DL = "cn-dl";
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; quyen: string[] } | null;
vi.mock("@/lib/auth", () => ({ kiemQuyen: async (q: string) => (nguoiDung && nguoiDung.quyen.includes(q) ? nguoiDung : null), KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));

const hoaDon: Record<string, Record<string, unknown>> = {
  "hd-vinh": { trang_thai: "hoan_thanh", chi_nhanh_id: VINH, ngay_hd: "2026-10-20", vat_hd_luc: null, vat_hd_so: null },
  "hd-vinh-co": { trang_thai: "hoan_thanh", chi_nhanh_id: VINH, ngay_hd: "2026-10-20", vat_hd_luc: "2026-10-21T00:00:00Z", vat_hd_so: "0000001" },
  "hd-dl": { trang_thai: "hoan_thanh", chi_nhanh_id: DL, ngay_hd: "2026-10-20", vat_hd_luc: null, vat_hd_so: null },
  "hd-nhap": { trang_thai: "nhap", chi_nhanh_id: VINH, ngay_hd: "2026-10-20", vat_hd_luc: null, vat_hd_so: null },
  "hd-huy": { trang_thai: "huy", chi_nhanh_id: VINH, ngay_hd: "2026-10-20", vat_hd_luc: null, vat_hd_so: null },
  "hd-ky-khoa": { trang_thai: "hoan_thanh", chi_nhanh_id: VINH, ngay_hd: "2026-08-15", vat_hd_luc: null, vat_hd_so: null },
};
const ghi: { bang: string; kieu: string; du?: unknown; loc: Record<string, unknown> }[] = [];
let capNhatTrung = true;
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (bang: string) => {
      const loc: Record<string, unknown> = {};
      let kieu = "select", du: unknown;
      const b: Record<string, unknown> = {
        select: () => b, eq: (c: string, v: unknown) => { loc[c] = v; return b; }, is: (c: string) => { loc[`is:${c}`] = true; return b; }, not: (c: string) => { loc[`not:${c}`] = true; return b; },
        maybeSingle: async () => {
          if (bang === "hoa_don") return { data: hoaDon[String(loc.id)] ?? null };
          if (bang === "ky_ke_toan") return { data: loc.thang === "2026-08" ? { trang_thai: "da_khoa" } : null };
          return { data: null };
        },
        insert: async (d: unknown) => { ghi.push({ bang, kieu: "insert", du: d, loc }); return { error: null }; },
        upsert: async (d: unknown) => { ghi.push({ bang, kieu: "upsert", du: d, loc }); return { error: null }; },
        update: (d: unknown) => { kieu = "update"; du = d; return b; },
        delete: () => { kieu = "delete"; return b; },
        then: (ok: (r: { error: null; data: unknown[] }) => unknown) => { if (kieu !== "select") ghi.push({ bang, kieu, du, loc: { ...loc } }); return ok({ error: null, data: kieu === "select" || capNhatTrung ? [{ id: loc.id }] : [] }); },
      };
      return b;
    },
  }),
}));

const KHONG = "Bạn không có quyền thực hiện thao tác này.";
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const hop = { vat_hd_so: "0000123", vat_hd_ngay: "2026-10-25", vat_hd_ky_hieu: "1C26TAA", vat_hd_mau_so: "1", vat_hd_tra_cuu: "" };
const quyenGhi = ["hd.vat", "ban.sua_khoa", "ban.xem"];
const capNhat = () => ghi.filter((g) => g.bang === "hoa_don");
beforeEach(() => { ghi.length = 0; capNhatTrung = true; process.env.SUPABASE_SERVICE_ROLE_KEY = "khoa-may-chu-thu-nghiem"; nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: quyenGhi }; });

describe("ghi số hoá đơn điện tử", () => {
  it("thiếu quyền hd.vat hoặc quyền sửa hoá đơn khoá thì bị chặn (không yếu hơn ghi nhận HĐ VAT)", async () => {
    const { ghiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["hd.vat", "ban.xem"] };
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-vinh", moi: "1", ...hop }))).loi).toBe(KHONG);
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["ban.sua_khoa", "ban.xem"] };
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-vinh", moi: "1", ...hop }))).loi).toBe(KHONG);
    nguoiDung = null;
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-vinh", moi: "1", ...hop }))).loi).toBe(KHONG);
    expect(capNhat()).toEqual([]);
  });
  it("hoá đơn chi nhánh khác bị chặn, cùng chi nhánh ghi được và có nhật ký", async () => {
    const { ghiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-dl", moi: "1", ...hop }))).loi).toBe("Không tìm thấy hoá đơn.");
    expect(capNhat()).toEqual([]);
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-vinh", moi: "1", ...hop }))).ok).toBe(true);
    const cn = capNhat();
    expect(cn).toHaveLength(1);
    expect(cn[0].du).toMatchObject({ vat_hd_so: "0000123", vat_hd_ngay: "2026-10-25", vat_hd_ky_hieu: "1C26TAA", vat_hd_mau_so: "1", vat_hd_tra_cuu: null, vat_hd_nguoi_id: "nv-vinh" });
    expect(cn[0].loc).toMatchObject({ id: "hd-vinh", trang_thai: "hoan_thanh", "is:vat_hd_luc": true });
    expect(ghi.some((g) => g.bang === "nhat_ky_truy_cap" && (g.du as { hanh_dong: string }).hanh_dong === "ghi_hd_dien_tu")).toBe(true);
  });
  it("người không gắn chi nhánh ghi được hoá đơn mọi chi nhánh", async () => {
    const { ghiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv-cty", quyen: quyenGhi };
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-dl", moi: "1", ...hop }))).ok).toBe(true);
  });
  it("hoá đơn nháp, đã huỷ, thuộc kỳ kế toán đã khoá thì không ghi được", async () => {
    const { ghiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-nhap", moi: "1", ...hop }))).loi).toMatch(/đã hoàn thành/);
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-huy", moi: "1", ...hop }))).loi).toMatch(/đã hoàn thành/);
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-ky-khoa", moi: "1", ...hop }))).loi).toMatch(/đã khoá/);
    expect(capNhat()).toEqual([]);
  });
  it("dữ liệu sai bị chặn trước khi chạm DB; người khác vừa ghi trước thì báo lại", async () => {
    const { ghiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-vinh", moi: "1", ...hop, vat_hd_so: "" }))).loi).toBe("Nhập số hoá đơn.");
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-vinh", moi: "1", ...hop, vat_hd_ngay: "2999-01-01" }))).loi).toMatch(/tương lai/);
    expect(capNhat()).toEqual([]);
    capNhatTrung = false;
    expect((await ghiHoaDonDienTu(fd({ hoa_don_id: "hd-vinh", moi: "1", ...hop }))).loi).toMatch(/vừa được người khác ghi/);
  });
});

describe("gỡ số hoá đơn điện tử", () => {
  it("chặn chi nhánh khác, thiếu quyền; gỡ được thì xoá cả các cột mới và để nhật ký", async () => {
    const { goHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    expect((await goHoaDonDienTu(fd({ hoa_don_id: "hd-dl" }))).loi).toBe("Không tìm thấy hoá đơn.");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["hd.vat"] };
    expect((await goHoaDonDienTu(fd({ hoa_don_id: "hd-vinh-co" }))).loi).toBe(KHONG);
    expect(capNhat()).toEqual([]);
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: quyenGhi };
    expect((await goHoaDonDienTu(fd({ hoa_don_id: "hd-vinh-co" }))).ok).toBe(true);
    expect(capNhat()[0].du).toMatchObject({ vat_hd_so: null, vat_hd_ngay: null, vat_hd_mau_so: null, vat_hd_tra_cuu: null, vat_hd_ky_hieu: null, vat_hd_luc: null });
    expect(capNhat()[0].loc).toMatchObject({ "not:vat_hd_luc": true });
  });
});

describe("kết nối nhà cung cấp", () => {
  const dat = { nha_cung_cap: "viettel", ma_so_thue: "0123456789", ten_dang_nhap: "ketoan", khoa: "MatKhauBiMat1234", mau_so_mac_dinh: "1", ky_hieu_mac_dinh: "1C26TAA", dia_chi_may_chu: "" };
  it("người gắn chi nhánh hoặc không có quyền khoá kỳ không sửa được", async () => {
    const { luuKetNoiHoaDonDienTu, ngatKetNoiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: [...quyenGhi, "ky.khoa"] };
    expect((await luuKetNoiHoaDonDienTu(fd(dat))).loi).toBe(KHONG);
    expect((await ngatKetNoiHoaDonDienTu()).loi).toBe(KHONG);
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv-cty", quyen: quyenGhi };
    expect((await luuKetNoiHoaDonDienTu(fd(dat))).loi).toBe(KHONG);
    expect(ghi).toEqual([]);
  });
  it("lưu: khoá được mã hoá, giải mã lại đúng, chỉ giữ 4 ký tự cuối dạng rõ", async () => {
    const { luuKetNoiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    const { giaiMaThu } = await import("../../src/lib/email-tuyen-dung");
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv-cty", quyen: [...quyenGhi, "ky.khoa"] };
    expect((await luuKetNoiHoaDonDienTu(fd(dat))).ok).toBe(true);
    const up = ghi.find((g) => g.bang === "ket_noi_hoa_don_dien_tu" && g.kieu === "upsert")!.du as Record<string, string>;
    expect(JSON.stringify(up)).not.toContain("MatKhauBiMat1234");
    expect(up.khoa_cuoi4).toBe("1234");
    expect(giaiMaThu(up.khoa_ma_hoa, "khoa-may-chu-thu-nghiem")).toBe("MatKhauBiMat1234");
    expect(up).toMatchObject({ id: true, nha_cung_cap: "viettel", ma_so_thue: "0123456789", dia_chi_may_chu: null });
    const nk = ghi.find((g) => g.bang === "nhat_ky_truy_cap")!.du as { chi_tiet: Record<string, unknown> };
    expect(JSON.stringify(nk)).not.toContain("MatKhauBiMat1234");
  });
  it("để trống ô khoá thì giữ khoá cũ (không ghi đè khoá); sai dữ liệu thì chặn", async () => {
    const { luuKetNoiHoaDonDienTu } = await import("../../src/app/(app)/tai-chinh/hoa-don-dien-tu/actions");
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv-cty", quyen: [...quyenGhi, "ky.khoa"] };
    expect((await luuKetNoiHoaDonDienTu(fd({ ...dat, khoa: "" }))).ok).toBe(true);
    const up = ghi.find((g) => g.bang === "ket_noi_hoa_don_dien_tu" && g.kieu === "upsert")!.du as Record<string, unknown>;
    expect("khoa_ma_hoa" in up).toBe(false);
    expect("khoa_cuoi4" in up).toBe(false);
    expect((await luuKetNoiHoaDonDienTu(fd({ ...dat, ma_so_thue: "12" }))).loi).toMatch(/Mã số thuế/);
  });
  it("phát hành tự động luôn báo cần kết nối, không giả vờ thành công", async () => {
    const { phatHanhTuDong } = await import("../../src/lib/hoa-don-dien-tu-ket-noi");
    expect(await phatHanhTuDong("hd-vinh")).toEqual({ loi: expect.stringContaining("Cần kết nối nhà cung cấp") });
  });
});
