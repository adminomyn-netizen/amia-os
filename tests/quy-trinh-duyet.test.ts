import { describe, expect, it } from "vitest";
import { buocHienTai, duocDuyetBuoc, kiemTraDuyet, soTienBangChu, type BuocDuyet } from "@/lib/quy-trinh-duyet";

const buoc = (o: Partial<BuocDuyet>): BuocDuyet => ({ id: "b", thu_tu: 1, ten: "Kế toán trưởng duyệt", nguoi_duyet_loai: "chuc_danh", nguoi_duyet_gia_tri: "ke_toan_truong", du_phong_vai_tro: ["ke_toan"], kiem_han_muc: true, trang_thai: "cho", nguoi_id: null, luc: null, ghi_chu: null, han_xu_ly: null, duyet_thay: false, ...o });
const nguoi = (vaiTro: string, chucDanhTaiChinh: string | null = null, nhanVienId = "u1") => ({ nhanVienId, vaiTro, chucDanhTaiChinh });

describe("soTienBangChu", () => {
  it("đọc đúng số tiền thường gặp", () => {
    expect(soTienBangChu(15_000_000)).toBe("Mười lăm triệu đồng");
    expect(soTienBangChu(1_250_000)).toBe("Một triệu hai trăm năm mươi nghìn đồng");
    expect(soTienBangChu(2_005_000)).toBe("Hai triệu không trăm lẻ năm nghìn đồng");
    expect(soTienBangChu(21_000)).toBe("Hai mươi mốt nghìn đồng");
    expect(soTienBangChu(3_940_000)).toBe("Ba triệu chín trăm bốn mươi nghìn đồng");
    expect(soTienBangChu(0)).toBe("Không đồng");
    expect(soTienBangChu(null)).toBe("");
  });
});

describe("duocDuyetBuoc", () => {
  const khongAiGiu = () => false, coNguoiGiu = () => true;
  it("người giữ chức danh được duyệt", () => expect(duocDuyetBuoc(nguoi("ke_toan", "ke_toan_truong"), buoc({}), coNguoiGiu)).toBe(true));
  it("chưa ai giữ chức danh thì vai trò dự phòng được duyệt", () => expect(duocDuyetBuoc(nguoi("ke_toan"), buoc({}), khongAiGiu)).toBe(true));
  it("đã có người giữ chức danh thì vai trò dự phòng KHÔNG còn được duyệt", () => expect(duocDuyetBuoc(nguoi("ke_toan"), buoc({}), coNguoiGiu)).toBe(false));
  it("vai trò khác không duyệt", () => expect(duocDuyetBuoc(nguoi("le_tan"), buoc({}), khongAiGiu)).toBe(false));
  it("quản lý đơn vị: quản lý và chủ", () => {
    const b = buoc({ nguoi_duyet_loai: "quan_ly_chi_nhanh", nguoi_duyet_gia_tri: null });
    expect(duocDuyetBuoc(nguoi("quan_ly"), b, khongAiGiu)).toBe(true);
    expect(duocDuyetBuoc(nguoi("chu"), b, khongAiGiu)).toBe(true);
    expect(duocDuyetBuoc(nguoi("ke_toan"), b, khongAiGiu)).toBe(false);
  });
});

describe("kiemTraDuyet", () => {
  const coNguoiGiuChucDanh = () => false;
  const goc = { nguoiGuiId: "gui", daDuyetBoi: new Set<string>(), coNguoiGiuChucDanh };
  it("người gửi không tự duyệt", () => expect(kiemTraDuyet({ ...goc, nguoi: nguoi("ke_toan", null, "gui"), buoc: buoc({}) }).loi).toMatch(/không tự duyệt/));
  it("một người được duyệt nhiều bước của cùng đề xuất (như Lark)", () => expect(kiemTraDuyet({ ...goc, daDuyetBoi: new Set(["u1"]), nguoi: nguoi("ke_toan"), buoc: buoc({}) }).loi).toBeNull());
  it("sai vị trí thì báo rõ ai duyệt", () => expect(kiemTraDuyet({ ...goc, nguoi: nguoi("le_tan"), buoc: buoc({}) }).loi).toMatch(/Kế toán trưởng duyệt/));
  it("đúng vị trí thì qua", () => expect(kiemTraDuyet({ ...goc, nguoi: nguoi("ke_toan"), buoc: buoc({}) })).toEqual({ loi: null, thay: false }));
  it("Kỹ thuật duyệt thay mọi bước và được ghi là duyệt thay", () => expect(kiemTraDuyet({ ...goc, nguoi: nguoi("ky_thuat"), buoc: buoc({}) })).toEqual({ loi: null, thay: true }));
});

describe("buocHienTai", () => {
  it("lấy bước chưa duyệt nhỏ nhất", () => expect(buocHienTai([buoc({ thu_tu: 1, trang_thai: "da_duyet" }), buoc({ thu_tu: 3 }), buoc({ thu_tu: 2 })])?.thu_tu).toBe(2));
  it("hết bước thì null", () => expect(buocHienTai([buoc({ trang_thai: "da_duyet" })])).toBeNull());
});

import { phanTichHangMuc } from "@/lib/de-xuat";
describe("phanTichHangMuc (hạng mục tạm ứng)", () => {
  it("cộng tổng các dòng", () => expect(phanTichHangMuc("Vé máy bay | 2.500.000\nKhách sạn | 1500000")).toEqual({ ds: [{ ten: "Vé máy bay", so_tien: 2500000 }, { ten: "Khách sạn", so_tien: 1500000 }], tong: 4000000 }));
  it("dòng thiếu tiền hoặc tiền không phải số thì báo lỗi", () => {
    expect(phanTichHangMuc("Vé máy bay")).toHaveProperty("loi");
    expect(phanTichHangMuc("Vé | abc")).toHaveProperty("loi");
    expect(phanTichHangMuc("Vé | 0")).toHaveProperty("loi");
  });
  it("trống thì tổng 0", () => expect(phanTichHangMuc("")).toEqual({ ds: [], tong: 0 }));
});
