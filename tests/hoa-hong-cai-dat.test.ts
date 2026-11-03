import { describe, expect, it } from "vitest";
import { docCaiDatNangCao } from "@/lib/hoa-hong";

const lay = (o: Record<string, string>) => (k: string) => o[k] ?? "";
const SALONHERO = { chia_dv: "giu_nguyen", chia_ban: "chia_deu", chia_tu_van: "chia_deu", thoi_diem: "sau", loai_giam: "ca_hai", so_nv_tieu_chuan: "1" };

describe("đọc Cài đặt nâng cao hoa hồng", () => {
  it("lựa chọn SalonHero đang dùng, hệ số để trống/100 → không lưu hệ số", () => {
    expect(docCaiDatNangCao(lay({ ...SALONHERO, gio_8: "100", sao_5: "" }))).toEqual({ gt: {
      chia_deu_dich_vu: false, chia_deu_ban: true, chia_deu_tu_van: true, so_nv_tieu_chuan: 1, tinh_sau_giam_gia: true, ap_giam_gia_tong_don: true, he_so_gio: {}, he_so_sao: {} } });
  });
  it("tính trước giảm giá thì bỏ qua loại giảm giá; hệ số khác 100 được lưu, nhận dấu phẩy", () => {
    const r = docCaiDatNangCao(lay({ ...SALONHERO, thoi_diem: "truoc", loai_giam: "", gio_22: "120", sao_1: "50,5" }));
    expect(r).toEqual({ gt: expect.objectContaining({ tinh_sau_giam_gia: false, ap_giam_gia_tong_don: true, he_so_gio: { "22": 120 }, he_so_sao: { "1": 50.5 } }) });
  });
  it("chỉ giảm giá từng dòng", () => {
    expect(docCaiDatNangCao(lay({ ...SALONHERO, loai_giam: "chi_dong" }))).toEqual({ gt: expect.objectContaining({ ap_giam_gia_tong_don: false }) });
  });
  it("báo lỗi tiếng Việt", () => {
    expect(docCaiDatNangCao(lay({ ...SALONHERO, chia_dv: "" }))).toEqual({ loi: "Chọn cách tính hoa hồng dịch vụ." });
    expect(docCaiDatNangCao(lay({ ...SALONHERO, so_nv_tieu_chuan: "0" }))).toEqual({ loi: "Số lượng nhân viên tiêu chuẩn phải là số nguyên từ 1 đến 20." });
    expect(docCaiDatNangCao(lay({ ...SALONHERO, gio_9: "-5" }))).toEqual({ loi: "Hệ số 9 giờ phải từ 0 đến 1000%." });
    expect(docCaiDatNangCao(lay({ ...SALONHERO, sao_3: "abc" }))).toEqual({ loi: "Hệ số 3 sao phải từ 0 đến 1000%." });
  });
});
