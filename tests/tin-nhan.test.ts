import { beforeEach, describe, expect, it, vi } from "vitest";
import { taoSbGia, type KhoGia } from "./gia-lap-sb";
import { bienLa, bienThieu, bienTrongMau, chuanHoaSdt, cheSdt, dienMauTin } from "@/lib/tin-nhan";

vi.mock("server-only", () => ({}));
let kho: KhoGia = {};
vi.mock("@/lib/db", () => ({ sb: () => taoSbGia(kho, { tin_nhan_hang_doi: { trang_thai: "cho_gui" } }) }));

describe("mẫu tin: điền biến", () => {
  const mau = "Chào {{ten}}, hẹn {{ngay_hen}} lúc {{ gio_hen }} tại {{co_so}}.";
  it("điền đủ biến, biến thiếu bị báo, biến lạ bị nhận ra", () => {
    expect(dienMauTin(mau, { ten: "An", ngay_hen: "01/11", gio_hen: "9:00", co_so: "Vinh" })).toBe("Chào An, hẹn 01/11 lúc 9:00 tại Vinh.");
    expect(bienTrongMau(mau)).toEqual(["ten", "ngay_hen", "gio_hen", "co_so"]);
    expect(bienThieu(mau, { ten: "An", ngay_hen: " ", gio_hen: null })).toEqual(["ngay_hen", "gio_hen", "co_so"]);
    expect(bienLa("Chào {{ten}} {{so_tien}}")).toEqual(["so_tien"]);
  });
  it("chuẩn hoá và che số điện thoại", () => {
    expect(chuanHoaSdt("+84 912 345 678")).toBe("0912345678");
    expect(chuanHoaSdt("84912345678")).toBe("0912345678");
    expect(chuanHoaSdt("0912.345.678")).toBe("0912345678");
    expect(chuanHoaSdt("12345")).toBeNull();
    expect(chuanHoaSdt(null)).toBeNull();
    expect(cheSdt("0912345678")).toBe("*******678");
  });
});

describe("xepTinNhan", () => {
  const MAU = "Chào {{ten}}, hẹn {{ngay_hen}} lúc {{gio_hen}}.";
  const bien = { ten: "An", ngay_hen: "01/11", gio_hen: "9:00" };
  beforeEach(() => {
    kho = {
      tin_nhan_mau: [{ ma: "nhac_lich", kenh: "zalo_oa", noi_dung: MAU, bat: true }, { ma: "tat", kenh: "sms", noi_dung: MAU, bat: false }],
      khach_hang: [
        { id: "k1", dien_thoai: "0912345678", chi_nhanh_id: "cn1", khong_gui_zns: false },
        { id: "k2", dien_thoai: "0987654321", chi_nhanh_id: "cn1", khong_gui_zns: true },
      ],
      tin_nhan_hang_doi: [],
    };
  });
  it("khách bình thường: xếp tin đã điền mẫu, trạng thái chờ gửi, mang chi nhánh của khách", async () => {
    const { xepTinNhan } = await import("@/lib/tin-nhan-hang-doi");
    const kq = await xepTinNhan({ mauMa: "nhac_lich", khachId: "k1", bien, nguoiId: "nv1" });
    expect(kq.ok).toBe(true);
    expect(kho.tin_nhan_hang_doi).toHaveLength(1);
    expect(kho.tin_nhan_hang_doi[0]).toMatchObject({ kenh: "zalo_oa", den_so_dien_thoai: "0912345678", khach_id: "k1", chi_nhanh_id: "cn1", noi_dung: "Chào An, hẹn 01/11 lúc 9:00.", trang_thai: "cho_gui", nguoi_tao_id: "nv1" });
  });
  it("khách có cờ khong_gui_zns: tuyệt đối không xếp, kể cả khi đưa số tay không kèm mã khách", async () => {
    const { xepTinNhan } = await import("@/lib/tin-nhan-hang-doi");
    const a = await xepTinNhan({ mauMa: "nhac_lich", khachId: "k2", bien });
    expect(a).toMatchObject({ ok: false, lyDo: "khach_chan" });
    const b = await xepTinNhan({ mauMa: "nhac_lich", soDienThoai: "+84 987 654 321", bien });
    expect(b).toMatchObject({ ok: false, lyDo: "khach_chan" });
    expect(kho.tin_nhan_hang_doi).toHaveLength(0);
  });
  it("mẫu tắt, mẫu không có, thiếu biến, số sai, khách không có: đều không xếp", async () => {
    const { xepTinNhan } = await import("@/lib/tin-nhan-hang-doi");
    expect(await xepTinNhan({ mauMa: "tat", khachId: "k1", bien })).toMatchObject({ ok: false, lyDo: "mau_tat" });
    expect(await xepTinNhan({ mauMa: "khong-co", khachId: "k1", bien })).toMatchObject({ ok: false, lyDo: "mau_khong_co" });
    expect(await xepTinNhan({ mauMa: "nhac_lich", khachId: "k1", bien: { ten: "An" } })).toMatchObject({ ok: false, lyDo: "thieu_bien" });
    expect(await xepTinNhan({ mauMa: "nhac_lich", soDienThoai: "123", bien })).toMatchObject({ ok: false, lyDo: "sdt_sai" });
    expect(await xepTinNhan({ mauMa: "nhac_lich", khachId: "khong-co", bien })).toMatchObject({ ok: false, lyDo: "khach_khong_co" });
    expect(kho.tin_nhan_hang_doi).toHaveLength(0);
  });
});
