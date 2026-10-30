import { describe, expect, it } from "vitest";
import { docIdsChon, gomDonXuat, nguoiMuaMacDinh, nguoiMuaXuat, TOI_DA_CHON } from "../src/lib/hoa-don-dien-tu-xuat";
import { tomTatThu } from "../src/lib/hoa-don-dien-tu-ngan-hang";

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const hd = { id: "h1", ma: "HD1", ngay_hd: "2026-10-20", khach_id: "k", vat_pct: 8, vat_tien: 80, giam_gia_don: 0, phu_phi: 5, tip: 5, tong_hang: 1000, tong_phai_thu: 1090 };
const khach = { ho_ten: "Nguyễn A", cong_ty: "Công ty Hoa", ma_so_thue: "0123456789", dia_chi: "Vinh" };
const dong = [{ id: "d1", hoa_don_id: "h1", ten: "Filler", so_luong: 2, don_gia: 500, giam_gia: 0, thanh_tien: 1000 }];

describe("đọc danh sách đơn đã chọn", () => {
  it("bỏ trùng, đổi chữ thường, kiểm dạng", () => {
    expect(docIdsChon(`${ID(1)}, ${ID(1)},${ID(2).toUpperCase()}`)).toEqual({ ids: [ID(1), ID(2)] });
    expect(docIdsChon("")).toHaveProperty("loi");
    expect(docIdsChon("x,y")).toHaveProperty("loi");
    expect(docIdsChon(Array.from({ length: TOI_DA_CHON + 1 }, (_, i) => ID(i + 1)).join(","))).toHaveProperty("loi");
    expect(docIdsChon(Array.from({ length: TOI_DA_CHON }, (_, i) => ID(i + 1)).join(","))).toHaveProperty("ids");
  });
});
describe("người mua và tên hàng xuất", () => {
  it("mặc định: công ty nếu có, không thì tên khách, không có khách là Khách lẻ", () => {
    expect(nguoiMuaMacDinh(khach)).toEqual({ ten: "Công ty Hoa", mst: "0123456789", diaChi: "Vinh" });
    expect(nguoiMuaMacDinh({ ...khach, cong_ty: " " }).ten).toBe("Nguyễn A");
    expect(nguoiMuaMacDinh(undefined).ten).toBe("Khách lẻ");
  });
  it("ô đã sửa riêng thay thế mặc định; ô trống giữ mặc định", () => {
    expect(nguoiMuaXuat(khach, { ten_nguoi_mua: "Công ty Hoa Hồng", ma_so_thue: null, dia_chi: "" })).toEqual({ ten: "Công ty Hoa Hồng", mst: "0123456789", diaChi: "Vinh" });
  });
  it("gom đơn: tên hàng đã sửa, cờ đã sửa, nơi nhận tiền, VAT và tổng", () => {
    const thu = tomTatThu([{ loai: "thu", phuong_thuc: "chuyen_khoan", so_tien: 1090, ngan_hang: "Ngân hàng Techcombank" }]);
    const d = gomDonXuat(hd, khach, dong, thu, undefined, new Map([["d1", "Tiêm filler môi"]]), (n) => String(n));
    expect(d).toMatchObject({ ma: "HD1", nguoiMua: "Công ty Hoa", mst: "0123456789", nganHang: "Techcombank 1090", phuPhiTip: 10, vatPct: 8, vatTien: 80, tongPhaiThu: 1090, daSuaNguoiMua: false });
    expect(d.dong).toEqual([{ ten: "Tiêm filler môi", sl: 2, donGia: 500, giamGia: 0, thanhTien: 1000, daSuaTen: true }]);
    expect(gomDonXuat(hd, khach, dong, thu, undefined, undefined, String).dong[0]).toMatchObject({ ten: "Filler", daSuaTen: false });
  });
});

import { kiemTenXuat, quyetSuaTenXuat } from "../src/lib/hoa-don-dien-tu-xuat";
describe("kiểm dữ liệu sửa tên xuất", () => {
  const nhap = { tenNguoiMua: "  Công   ty\tHoa ", mst: " 0123 456 789-001 ", diaChi: " Vinh ", dong: [{ id: "d1", ten: "  Tiêm   filler " }] };
  it("gọn khoảng trắng, bỏ khoảng trắng trong MST", () => {
    expect(kiemTenXuat(nhap)).toEqual({ ok: { ten_nguoi_mua: "Công ty Hoa", ma_so_thue: "0123456789-001", dia_chi: "Vinh", dong: [{ id: "d1", ten: "Tiêm filler" }] } });
  });
  it("MST: chấp nhận 10 số, 13 số, 12 số căn cước; chặn dạng khác; để trống được", () => {
    for (const m of ["0123456789", "0123456789-001", "001234567890", ""]) expect(kiemTenXuat({ ...nhap, mst: m })).toHaveProperty("ok");
    for (const m of ["12345", "0123456789-1", "abc1234567", "01234567890"]) expect(kiemTenXuat({ ...nhap, mst: m })).toHaveProperty("loi");
  });
  it("chặn quá dài và dòng trùng", () => {
    expect(kiemTenXuat({ ...nhap, tenNguoiMua: "a".repeat(201) })).toHaveProperty("loi");
    expect(kiemTenXuat({ ...nhap, diaChi: "a".repeat(301) })).toHaveProperty("loi");
    expect(kiemTenXuat({ ...nhap, dong: [{ id: "d1", ten: "x".repeat(301) }] })).toHaveProperty("loi");
    expect(kiemTenXuat({ ...nhap, dong: [{ id: "d1", ten: "a" }, { id: "d1", ten: "b" }] })).toHaveProperty("loi");
  });
  it("chỉ lưu phần khác mặc định; trống hoặc giống tên gốc thì xoá bản sửa", () => {
    const md = { ten: "Công ty Hoa", mst: "0123456789", diaChi: "Vinh" }, goc = new Map([["d1", "Filler"], ["d2", "Botox"], ["d3", "Peel"]]);
    const ok = { ten_nguoi_mua: "Công ty Hoa", ma_so_thue: "0123456789-001", dia_chi: "", dong: [{ id: "d1", ten: "Tiêm filler môi" }, { id: "d2", ten: "Botox" }, { id: "d3", ten: "" }] };
    const q = quyetSuaTenXuat(ok, md, goc);
    expect(q.nguoiMua).toEqual({ ten_nguoi_mua: null, ma_so_thue: "0123456789-001", dia_chi: null });
    expect(q.dongLuu).toEqual([{ id: "d1", ten: "Tiêm filler môi" }]);
    expect(q.dongXoa).toEqual(["d2", "d3"]);
    expect(quyetSuaTenXuat({ ...ok, ma_so_thue: "" }, md, goc).nguoiMua).toBeNull();
  });
});
