import { beforeEach, describe, expect, it, vi } from "vitest";
import { taoSbGia, type KhoGia } from "../gia-lap-sb";

// Quyền và khoá chi nhánh ở máy chủ cho Zalo OA / SMS và Hộp thư.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const VINH = "cn-vinh", DL = "cn-dl";
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; quyen: string[] };
vi.mock("@/lib/auth", () => ({ kiemQuyen: async (q: string) => (nguoiDung.quyen.includes(q) ? nguoiDung : null), KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));
let kho: KhoGia = {};
vi.mock("@/lib/db", () => ({ thongBaoLoi: (e: unknown) => String(e), sb: () => taoSbGia(kho) }));

const KHONG = "Bạn không có quyền thực hiện thao tác này.";
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const ZALO = { kenh: "zalo_oa", oa_id: "oa-123", app_id: "app-456", secret: "secret-rat-dai-1111", access_token: "token-rat-dai-2222" };

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "khoa-may-chu-test";
  nguoiDung = { chiNhanhId: null, nhanVienId: "nv-chu", quyen: ["danhmuc.sua", "danhmuc.xem", "mkt.xem", "mkt.sua"] };
  kho = {
    ket_noi_ben_thu_ba: [],
    tin_nhan_mau: [{ ma: "nhac_lich", kenh: "zalo_oa", ten: "Nhắc lịch", noi_dung: "Chào {{ten}}", bat: false }],
    tin_nhan_hang_doi: [
      { id: "q-vinh", chi_nhanh_id: VINH, trang_thai: "cho_gui" }, { id: "q-dl", chi_nhanh_id: DL, trang_thai: "cho_gui" },
      { id: "q-chung", chi_nhanh_id: null, trang_thai: "cho_gui" }, { id: "q-xong", chi_nhanh_id: VINH, trang_thai: "da_gui" },
    ],
    hop_thu_hoi_thoai: [{ id: "h-vinh", kenh: "zalo_oa", chi_nhanh_id: VINH, chua_doc: 3 }, { id: "h-dl", kenh: "zalo_oa", chi_nhanh_id: DL, chua_doc: 1 }, { id: "h-chung", kenh: "messenger", chi_nhanh_id: null, chua_doc: 0 }],
    hop_thu_tin: [],
  };
});

describe("Zalo OA / SMS: quyền và khoá chi nhánh", () => {
  it("người gắn chi nhánh hoặc không có quyền sửa danh mục không đổi được kết nối, mẫu tin, không gửi thử", async () => {
    const a = await import("../../src/app/(app)/cai-dat/zalo-sms/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["danhmuc.sua", "danhmuc.xem"] };
    expect((await a.luuKetNoi(fd(ZALO))).loi).toBe(KHONG);
    expect((await a.ngatKetNoi(fd({ kenh: "zalo_oa" }))).loi).toBe(KHONG);
    expect((await a.guiThu(fd({ kenh: "zalo_oa", den: "0912345678" }))).loi).toBe(KHONG);
    expect((await a.luuMauTin(fd({ ma: "nhac_lich", ten: "Nhắc", kenh: "zalo_oa", noi_dung: "Chào {{ten}}", bat: "1" }))).loi).toBe(KHONG);
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv-xem", quyen: ["danhmuc.xem"] };
    expect((await a.luuKetNoi(fd(ZALO))).loi).toBe(KHONG);
    expect(kho.ket_noi_ben_thu_ba).toHaveLength(0);
    expect(kho.tin_nhan_mau[0].bat).toBe(false);
  });
  it("người toàn công ty nối được; khoá lưu dạng mã hoá, không lộ chữ thật; gửi thử báo chưa gửi được", async () => {
    const a = await import("../../src/app/(app)/cai-dat/zalo-sms/actions");
    expect((await a.luuKetNoi(fd(ZALO))).ok).toBe(true);
    expect(kho.ket_noi_ben_thu_ba).toHaveLength(1);
    const luu = JSON.stringify(kho.ket_noi_ben_thu_ba[0]);
    for (const v of ["oa-123", "secret-rat-dai-1111", "token-rat-dai-2222"]) expect(luu).not.toContain(v);
    expect(kho.ket_noi_ben_thu_ba[0]).toMatchObject({ kenh: "zalo_oa", trang_thai: "da_noi", nguoi_id: "nv-chu" });
    expect((await a.luuKetNoi(fd({ kenh: "tiktok" }))).loi).toBe("Kênh không hợp lệ.");
    expect((await a.luuKetNoi(fd({ kenh: "sms", nha_cung_cap: "eSMS" }))).loi).toContain("API key");
    expect((await a.guiThu(fd({ kenh: "zalo_oa", den: "0912345678" }))).loi).toBe("Chưa gửi được: cần kiểm tra khoá với nhà cung cấp");
    expect((await a.ngatKetNoi(fd({ kenh: "zalo_oa" }))).ok).toBe(true);
    expect(kho.ket_noi_ben_thu_ba).toHaveLength(0);
  });
  it("mẫu tin: dùng biến lạ bị từ chối, biến hợp lệ lưu được", async () => {
    const a = await import("../../src/app/(app)/cai-dat/zalo-sms/actions");
    expect((await a.luuMauTin(fd({ ma: "nhac_lich", ten: "Nhắc", kenh: "zalo_oa", noi_dung: "Chào {{ten}} {{so_tien}}" }))).loi).toContain("{{so_tien}}");
    expect((await a.luuMauTin(fd({ ma: "nhac_lich", ten: "Nhắc", kenh: "email", noi_dung: "Chào {{ten}}" }))).loi).toBe("Chọn kênh gửi.");
    expect((await a.luuMauTin(fd({ ma: "nhac_lich", ten: "Nhắc đổi", kenh: "sms", noi_dung: "Chào {{ten}}", bat: "1" }))).ok).toBe(true);
    expect(kho.tin_nhan_mau[0]).toMatchObject({ ten: "Nhắc đổi", kenh: "sms", bat: true });
  });
  it("huỷ tin hàng đợi: không huỷ tin chi nhánh khác hoặc tin đã gửi; tin cùng chi nhánh và tin chung thì được", async () => {
    const a = await import("../../src/app/(app)/cai-dat/zalo-sms/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["danhmuc.sua"] };
    expect((await a.huyTinTrongHangDoi(fd({ id: "q-dl" }))).loi).toBe(KHONG);
    expect((await a.huyTinTrongHangDoi(fd({ id: "q-xong" }))).loi).toContain("không còn");
    expect((await a.huyTinTrongHangDoi(fd({ id: "q-vinh" }))).ok).toBe(true);
    expect((await a.huyTinTrongHangDoi(fd({ id: "q-chung" }))).ok).toBe(true);
    expect(kho.tin_nhan_hang_doi.map((t) => [t.id, t.trang_thai])).toEqual([["q-vinh", "huy"], ["q-dl", "cho_gui"], ["q-chung", "huy"], ["q-xong", "da_gui"]]);
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv-xem", quyen: ["danhmuc.xem"] };
    expect((await a.huyTinTrongHangDoi(fd({ id: "q-dl" }))).loi).toBe(KHONG);
  });
});

describe("Hộp thư: quyền và khoá chi nhánh", () => {
  it("trả lời hội thoại chi nhánh khác bị chặn; cùng chi nhánh hoặc hội thoại chung thì được; chỉ xem thì không trả lời", async () => {
    const a = await import("../../src/app/(app)/marketing/hop-thu/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["mkt.xem", "mkt.sua"] };
    expect((await a.traLoiKhach(fd({ hoi_thoai_id: "h-dl", noi_dung: "Chào" }))).loi).toBe(KHONG);
    expect(kho.hop_thu_tin).toHaveLength(0);
    const ok = await a.traLoiKhach(fd({ hoi_thoai_id: "h-vinh", noi_dung: "Chào chị" }));
    expect(ok.ok).toBe(true);
    expect(ok.ghiChu).toContain("chưa gửi tới khách vì kênh chưa nối");
    expect((await a.traLoiKhach(fd({ hoi_thoai_id: "h-chung", noi_dung: "Chào" }))).ok).toBe(true);
    expect(kho.hop_thu_tin.map((t) => [t.hoi_thoai_id, t.huong, t.trang_thai])).toEqual([["h-vinh", "di", "cho_gui"], ["h-chung", "di", "cho_gui"]]);
    nguoiDung = { chiNhanhId: null, nhanVienId: "nv-xem", quyen: ["mkt.xem"] };
    expect((await a.traLoiKhach(fd({ hoi_thoai_id: "h-vinh", noi_dung: "Chào" }))).loi).toBe(KHONG);
  });
  it("đánh dấu đã đọc: đúng chi nhánh mới đổi số chưa đọc", async () => {
    const a = await import("../../src/app/(app)/marketing/hop-thu/actions");
    nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", quyen: ["mkt.xem"] };
    expect((await a.danhDauDaDoc(fd({ hoi_thoai_id: "h-dl" }))).loi).toBe(KHONG);
    expect(kho.hop_thu_hoi_thoai.find((h) => h.id === "h-dl")?.chua_doc).toBe(1);
    expect((await a.danhDauDaDoc(fd({ hoi_thoai_id: "h-vinh" }))).ok).toBe(true);
    expect(kho.hop_thu_hoi_thoai.find((h) => h.id === "h-vinh")?.chua_doc).toBe(0);
  });
});
