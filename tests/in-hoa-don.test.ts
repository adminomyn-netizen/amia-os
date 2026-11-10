import { describe, expect, it } from "vitest";
import { CO_SO, moTaThe, nhanTrangThaiHd, tenDongIn, tienTruThe } from "@/lib/in-hoa-don";
import { docSoTien } from "@/lib/phieu-thu";
import { MAC_DINH_IN, chuanHoaIn, CAU_KHONG_HOAN_LAI, loiIn } from "@/lib/thiet-lap-in";

describe("bản in hoá đơn dịch vụ (mẫu SalonHero)", () => {
  it("tình trạng dưới tiêu đề", () => {
    expect(nhanTrangThaiHd("nhap", 0, 0)).toBe("Chưa thanh toán");
    expect(nhanTrangThaiHd("hoan_thanh", 0, 1_000_000)).toBe("Đã thanh toán");
    expect(nhanTrangThaiHd("hoan_thanh", 0, 0)).toBe("Đã thanh toán"); // trả hết bằng thẻ
    expect(nhanTrangThaiHd("hoan_thanh", 500_000, 1_000_000)).toBe("Thanh toán một phần");
    expect(nhanTrangThaiHd("hoan_thanh", 500_000, 0)).toBe("Chưa thanh toán");
    expect(nhanTrangThaiHd("huy", 0, 0)).toBe("Đã huỷ");
    expect(nhanTrangThaiHd("hoan_thanh", 0, 1, "en")).toBe("Paid");
  });
  it("tổng tiền trừ vào thẻ: đơn SalonHero lấy cột, đơn AMIA cộng thẻ tiền thu − hoàn", () => {
    expect(tienTruThe(true, 2_000_000, [])).toBe(2_000_000);
    expect(tienTruThe(false, 0, [
      { loai: "thu", phuong_thuc: "the_tien", so_tien: 3_000_000 },
      { loai: "thu", phuong_thuc: "chuyen_khoan", so_tien: 6_400_000 },
      { loai: "hoan", phuong_thuc: "the_tien", so_tien: "500000" },
    ])).toBe(2_500_000);
  });
  it("tình trạng thẻ sau thanh toán", () => {
    expect(moTaThe({ ten: "Thermage FLX mặt 900short", ma: "M24713", loai: "lan", buoiCon: 0, buoiTong: 1, soDu: 0 })).toBe("Thermage FLX mặt 900short (#M24713): còn 0/1 buổi");
    expect(moTaThe({ ten: "Thẻ tiền 10 triệu", ma: "M100", loai: "tien", buoiCon: 0, buoiTong: null, soDu: 2_000_000 })).toBe(`Thẻ tiền 10 triệu (#M100): số dư ${(2_000_000).toLocaleString("vi-VN")} đ`);
  });
  it("dòng dùng buổi in 'Sử dụng <dịch vụ>'", () => {
    expect(tenDongIn("Triệt lông bikini", true)).toBe("Sử dụng Triệt lông bikini");
    expect(tenDongIn("Triệt lông bikini", false)).toBe("Triệt lông bikini");
  });
  it("đầu tờ: giấy phép, cơ sở", () => {
    expect(CO_SO.giayPhep).toBe("1233/NA-GPHĐ");
    expect(CO_SO.ten).toBe("AMIA Beauty Center");
  });
  it("số tiền bằng chữ trên hoá đơn", () => {
    expect(docSoTien(1_250_000)).toBe("Một triệu hai trăm năm mươi nghìn đồng");
    expect(docSoTien(0)).toBe("Không đồng");
    expect(docSoTien(24_000)).toBe("Hai mươi tư nghìn đồng");
    expect(docSoTien(25_000)).toBe("Hai mươi lăm nghìn đồng");
    expect(docSoTien(1_000_005_000)).toBe("Một tỷ không trăm linh năm nghìn đồng");
    expect(docSoTien(145_000_000)).toBe("Một trăm bốn mươi lăm triệu đồng");
    expect(docSoTien(8_400_000)).toBe("Tám triệu bốn trăm nghìn đồng");
  });
  it("câu KHÔNG HOÀN LẠI là ô cấu hình riêng, mặc định bật cho hoá đơn, xoá được", () => {
    expect(MAC_DINH_IN.hoa_don.cauKhongHoanLai).toBe(CAU_KHONG_HOAN_LAI);
    expect(MAC_DINH_IN.lich_hen.cauKhongHoanLai).toBe("");
    expect(chuanHoaIn("hoa_don", { khoGiay: "80mm" }).cauKhongHoanLai).toBe(CAU_KHONG_HOAN_LAI); // cấu hình đã lưu trước đây chưa có ô này
    expect(chuanHoaIn("hoa_don", { cauKhongHoanLai: "" }).cauKhongHoanLai).toBe("");
    expect(loiIn({ ...MAC_DINH_IN.hoa_don, cauKhongHoanLai: "x".repeat(301) })).toMatch(/300/);
  });
});
