import { beforeEach, describe, expect, it, vi } from "vitest";
import { taoSbGia, type KhoGia } from "./gia-lap-sb";
import { cheKhoa, giaiMaCauHinh, gopCauHinh, maHoaCauHinh, xemCauHinh } from "@/lib/ket-noi-ben-thu-ba";

vi.mock("server-only", () => ({}));
let kho: KhoGia = {};
vi.mock("@/lib/db", () => ({ sb: () => taoSbGia(kho) }));

const ZALO = { oa_id: "1234567890", app_id: "9876543210", secret: "bi-mat-rat-dai-abcd", access_token: "token-sieu-bi-mat-wxyz" };

describe("kết nối bên thứ ba: mã hoá", () => {
  it("mã hoá rồi giải mã đúng; bản mã không lộ khoá; sai khoá hoặc dữ liệu hỏng thì null", () => {
    const m = maHoaCauHinh(ZALO, "khoa-may-chu");
    expect(m).not.toContain("bi-mat");
    expect(Buffer.from(m, "base64").toString("utf8")).not.toContain("token-sieu");
    expect(giaiMaCauHinh(m, "khoa-may-chu")).toEqual(ZALO);
    expect(giaiMaCauHinh(m, "khoa-khac")).toBeNull();
    expect(giaiMaCauHinh("rac", "khoa-may-chu")).toBeNull();
    expect(maHoaCauHinh(ZALO, "k")).not.toBe(maHoaCauHinh(ZALO, "k"));
  });
  it("bản hiện ra chỉ có 4 ký tự cuối, không có khoá đầy đủ", () => {
    expect(cheKhoa("abcdefghij")).toBe("****ghij");
    expect(cheKhoa("ab")).toBe("****");
    const xem = xemCauHinh("zalo_oa", ZALO);
    const chuoi = JSON.stringify(xem);
    for (const v of Object.values(ZALO)) expect(chuoi).not.toContain(v);
    expect(xem.access_token).toBe("****wxyz");
    // SMS: nhà cung cấp và tên thương hiệu không phải khoá nên hiện nguyên.
    const sms = xemCauHinh("sms", { nha_cung_cap: "eSMS", api_key: "apikey-123456789", secret: "secret-987654321", ten_thuong_hieu: "AMIA" });
    expect(sms).toMatchObject({ nha_cung_cap: "eSMS", ten_thuong_hieu: "AMIA", api_key: "****6789" });
  });
  it("gộp cấu hình: ô trống giữ khoá cũ, thiếu ô bắt buộc hoặc nhà cung cấp lạ thì báo lỗi", () => {
    expect(gopCauHinh("zalo_oa", { oa_id: "", app_id: "", secret: "", access_token: "moi-1234567890" }, ZALO)).toEqual({ cauHinh: { ...ZALO, access_token: "moi-1234567890" } });
    expect(gopCauHinh("zalo_oa", { oa_id: "1" }, null)).toMatchObject({ loi: expect.stringContaining("App ID") });
    const sms = { nha_cung_cap: "eSMS", api_key: "k", secret: "s", ten_thuong_hieu: "AMIA" };
    expect(gopCauHinh("sms", { ...sms, nha_cung_cap: "Lạ" }, null)).toMatchObject({ loi: expect.stringContaining("Nhà cung cấp") });
    expect(gopCauHinh("messenger", { page_id: "p", page_access_token: "t", app_secret: "x".repeat(700) }, null)).toMatchObject({ loi: expect.stringContaining("quá dài") });
  });
});

describe("kết nối bên thứ ba: phía máy chủ", () => {
  beforeEach(() => { process.env.SUPABASE_SERVICE_ROLE_KEY = "khoa-may-chu-test"; kho = { ket_noi_ben_thu_ba: [] }; });
  it("trạng thái trả ra trình duyệt không chứa khoá thật", async () => {
    kho.ket_noi_ben_thu_ba.push({ kenh: "zalo_oa", cau_hinh_ma_hoa: maHoaCauHinh(ZALO, "khoa-may-chu-test"), ten_hien_thi: "Zalo OA", trang_thai: "da_noi", sua_luc: "2026-10-30T00:00:00Z" });
    const { trangThaiCacKenh } = await import("@/lib/ket-noi-ben-thu-ba-may-chu");
    const tt = await trangThaiCacKenh();
    const chuoi = JSON.stringify(tt);
    for (const v of Object.values(ZALO)) expect(chuoi).not.toContain(v);
    expect(tt.zalo_oa.daNoi).toBe(true);
    expect(tt.zalo_oa.xem.secret).toBe("****abcd");
    expect(tt.sms.daNoi).toBe(false);
  });
  it("gửi thử: chưa nối thì báo chưa nối; đã nối thì báo chưa gửi được, KHÔNG giả vờ thành công", async () => {
    const { guiThuNghiem, CHUA_GUI_DUOC } = await import("@/lib/ket-noi-ben-thu-ba-may-chu");
    expect(await guiThuNghiem("zalo_oa", "0912345678")).toContain("chưa kết nối");
    kho.ket_noi_ben_thu_ba.push({ kenh: "zalo_oa", cau_hinh_ma_hoa: maHoaCauHinh(ZALO, "khoa-may-chu-test"), trang_thai: "da_noi" });
    expect(await guiThuNghiem("zalo_oa", "0912345678")).toBe(CHUA_GUI_DUOC);
    expect(CHUA_GUI_DUOC).toBe("Chưa gửi được: cần kiểm tra khoá với nhà cung cấp");
    expect(await guiThuNghiem("zalo_oa", " ")).toBe("Nhập nơi nhận thử.");
  });
});
