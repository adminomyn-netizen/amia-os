import { describe, expect, it } from "vitest";
import { chuDoiTuongXuat, chuanLoai, chuanVai, docBangTiLe, docTiLe, docTien, kiemTraNhapTiLe, NHAN_LOAI, NHAN_VAI, TIEU_DE_NHAP, TIEU_DE_TEN_MUC, tachBang, type DanhMucNhap, type TiLeHienCo } from "../src/lib/hoa-hong-nhap";

const dm: DanhMucNhap = {
  dich_vu: [{ id: "d1", ma: "DV-001", ten: "Peel da" }, { id: "d2", ma: "DV-002", ten: "Laser trẻ hoá" }, { id: "d3", ma: "DV-003", ten: "Triệt lông" }, { id: "d4", ma: "DV-004", ten: "Triệt lông" }],
  san_pham: [{ id: "s1", ma: "MP-0001", ten: "Kem chống nắng" }],
  goi_the: [{ id: "g1", ma: "GT-01", ten: "Liệu trình 10 buổi" }],
  nhan_vien: [{ id: "n1", ma_nv: "NV001", ho_ten: "Lê An" }, { id: "n2", ma_nv: "NV002", ho_ten: "Trần Bình" }, { id: "n3", ma_nv: "NV003", ho_ten: "Trần Bình" }],
  nhom: ["điều dưỡng", "bác sĩ"],
};
const chay = (vb: string, hienCo: TiLeHienCo[] = []) => { const { dong, loiChung } = docBangTiLe(tachBang(vb)); expect(loiChung).toBeUndefined(); return kiemTraNhapTiLe(dong, dm, hienCo); };
const T = "\t";

describe("đọc bảng dán", () => {
  it("tách TSV, CSV có nháy, bỏ dòng trống và nhận cột theo tiêu đề bất kỳ thứ tự", () => {
    expect(tachBang("a\tb\r\nc\td")).toEqual([["a", "b"], ["c", "d"]]);
    expect(tachBang('a,"b,1","x""y"\n1,2,3')).toEqual([["a", "b,1", 'x"y'], ["1", "2", "3"]]);
    const { dong } = docBangTiLe(tachBang(["Vai", "Loại", "Tỉ lệ (%)", "Mã hoặc tên mục", "Ghi chú lạ"].join(T) + "\n\nBán" + T + "Dịch vụ" + T + "5" + T + "DV-001" + T + "x"));
    expect(dong).toEqual([{ dong: 3, loai: "Dịch vụ", muc: "DV-001", vai: "Bán", tiLe: "5", soTien: "", doiTuong: "" }]);
  });
  it("không có tiêu đề thì theo thứ tự 6 cột; thiếu cột bắt buộc thì báo", () => {
    expect(docBangTiLe(tachBang("Dịch vụ" + T + "" + T + "Bán" + T + "5")).dong[0]).toMatchObject({ loai: "Dịch vụ", muc: "", vai: "Bán", tiLe: "5" });
    expect(docBangTiLe(tachBang("Loại" + T + "Vai\nDịch vụ" + T + "Bán")).loiChung).toMatch(/Thiếu cột bắt buộc.*Mã hoặc tên mục.*Tỉ lệ/);
    expect(docBangTiLe([["", ""]]).loiChung).toMatch(/trống/);
  });
  it("hiểu loại, vai, tỉ lệ và tiền theo cách người ta hay gõ", () => {
    expect(["Dịch vụ", "dich vu", "SẢN PHẨM", "gói thẻ", "Bán thẻ / liệu trình", "liệu trình"].map(chuanLoai)).toEqual(["dich_vu", "dich_vu", "san_pham", "goi_the", "goi_the", "goi_the"]);
    expect(["Phục vụ", "tư vấn", "Bán", "Bán hàng", "Giới thiệu", "khác"].map(chuanVai)).toEqual(["phuc_vu", "tu_van", "ban", "ban", "gioi_thieu", null]);
    expect([docTiLe("10"), docTiLe("10%"), docTiLe("7,5"), docTiLe("abc"), docTiLe("-1")]).toEqual([10, 10, 7.5, null, null]);
    expect([docTien("50000"), docTien("50.000"), docTien("1,500,000"), docTien("50.000đ"), docTien("12,5"), docTien("x")]).toEqual([50000, 50000, 1500000, 50000, null, null]);
  });
});

describe("kiểm từng dòng", () => {
  it("dòng hợp lệ: thêm mới, khớp theo mã hoặc theo tên không phân biệt dấu", () => {
    const { dong, tong } = chay(["Dịch vụ", "DV-001", "Bán", "5", "", ""].join(T) + "\n" + ["dich vu", "laser tre hoa", "Phục vụ", "10", "20.000", "nhóm: Điều dưỡng"].join(T) + "\n" + ["Sản phẩm", "", "Bán", "3", "", "NV001"].join(T) + "\n" + ["Gói thẻ", "Liệu trình 10 buổi", "Giới thiệu", "2%", "", "Nhân viên: Lê An"].join(T));
    expect(tong).toEqual({ them: 4, ghiDe: 0, giuNguyen: 0, loi: 0 });
    expect(dong[0]).toMatchObject({ loai: "dich_vu", vai: "ban", muc_id: "d1", ti_le: 5, so_tien: null, nhan_vien_id: null, nhom_chuc_danh: null });
    expect(dong[1]).toMatchObject({ muc_id: "d2", so_tien: 20000, nhom_chuc_danh: "điều dưỡng" });
    expect(dong[2]).toMatchObject({ muc_id: null, nhan_vien_id: "n1", mucNhan: "Mặc định cả loại" });
    expect(dong[3]).toMatchObject({ loai: "goi_the", muc_id: "g1", nhan_vien_id: "n1" });
  });
  it("lỗi: mục không có, tên mơ hồ, tỉ lệ ngoài 0-100, tiền sai, vai và loại lạ, nhóm lạ, nhân viên mơ hồ, thiếu số", () => {
    const { dong, tong } = chay([
      ["Dịch vụ", "Không có", "Bán", "5"], ["Dịch vụ", "Triệt lông", "Bán", "5"], ["Dịch vụ", "DV-001", "Bán", "101"], ["Dịch vụ", "DV-001", "Bán", "-5"], ["Dịch vụ", "DV-001", "Bán", "5", "12,5"],
      ["Dịch vụ", "DV-001", "Mua", "5"], ["Xe cộ", "DV-001", "Bán", "5"], ["Dịch vụ", "DV-001", "Bán", "5", "", "nhóm: Kế toán"], ["Dịch vụ", "DV-001", "Bán", "5", "", "Trần Bình"], ["Dịch vụ", "DV-001", "Bán", "", ""], ["Dịch vụ", "DV-001", "Bán", "5,555"], ["Dịch vụ", "DV-001", "Bán", "5", "2000000000"], ["Dịch vụ", "DV-001", "Bán", "5", "", "Ai đó"],
    ].map((c) => c.join(T)).join("\n"));
    expect(tong.loi).toBe(13);
    const l = dong.map((d) => d.loi ?? "");
    expect(l[0]).toMatch(/Không tìm thấy dịch vụ/); expect(l[1]).toMatch(/trùng nhiều mục.*mã/); expect(l[2]).toMatch(/vượt 100/); expect(l[3]).toMatch(/không phải số/);
    expect(l[4]).toMatch(/Số tiền/); expect(l[5]).toMatch(/Vai "Mua"/); expect(l[6]).toMatch(/Loại "Xe cộ"/); expect(l[7]).toMatch(/Nhóm "Kế toán" chưa có/);
    expect(l[8]).toMatch(/trùng nhiều người.*mã nhân viên/); expect(l[9]).toMatch(/Cần ghi tỉ lệ hoặc số tiền/); expect(l[10]).toMatch(/2 số lẻ/); expect(l[11]).toMatch(/vượt 1 tỷ/); expect(l[12]).toMatch(/Không tìm thấy nhân viên/);
    expect(dong.every((d) => d.hanh_dong === "loi")).toBe(true);
  });
  it("tên trùng nhiều mục nhưng dùng mã thì khớp; tỉ lệ 0 là hợp lệ (loại khỏi hoa hồng)", () => {
    const { dong } = chay(["Dịch vụ", "DV-003", "Bán", "0"].join(T));
    expect(dong[0]).toMatchObject({ hanh_dong: "them", muc_id: "d3", ti_le: 0 });
  });
  it("thêm / ghi đè / giữ nguyên theo bảng đang có, và hai dòng cùng khoá trong tệp là lỗi", () => {
    const co: TiLeHienCo[] = [
      { loai: "dich_vu", vai: "ban", muc_id: "d1", nhan_vien_id: null, nhom_chuc_danh: null, ti_le: 5, so_tien: null },
      { loai: "dich_vu", vai: "ban", muc_id: "d2", nhan_vien_id: null, nhom_chuc_danh: null, ti_le: 8, so_tien: 1000 },
      { loai: "dich_vu", vai: "ban", muc_id: "d1", nhan_vien_id: null, nhom_chuc_danh: "bác sĩ", ti_le: 1, so_tien: null },
    ];
    const { dong, tong } = chay([["Dịch vụ", "DV-001", "Bán", "5"], ["Dịch vụ", "DV-002", "Bán", "9", "1000"], ["Dịch vụ", "DV-001", "Bán", "4", "", "nhóm: Bác sĩ"], ["Dịch vụ", "DV-003", "Bán", "7"], ["Dịch vụ", "DV-003", "Bán", "7"]].map((c) => c.join(T)).join("\n"), co);
    expect(dong.map((d) => d.hanh_dong)).toEqual(["giu_nguyen", "ghi_de", "ghi_de", "them", "loi"]);
    expect(dong[1]).toMatchObject({ ti_le_cu: 8, so_tien_cu: 1000, ti_le: 9, so_tien: 1000 });
    expect(dong[2]).toMatchObject({ ti_le_cu: 1, ti_le: 4 }); // dòng của nhóm không đè lên dòng chung
    expect(dong[4].loi).toMatch(/Trùng dòng 4/);
    expect(tong).toEqual({ them: 1, ghiDe: 2, giuNguyen: 1, loi: 1 });
  });
  it("chạy lại cùng bảng sau khi đã áp dụng thì toàn giữ nguyên (không tạo trùng)", () => {
    const vb = [["Dịch vụ", "", "Bán", "5"], ["Dịch vụ", "DV-002", "Tư vấn", "10", "5000", "NV001"], ["Sản phẩm", "MP-0001", "Bán", "3", "", "nhóm: bác sĩ"]].map((c) => c.join(T)).join("\n");
    const lan1 = chay(vb);
    expect(lan1.tong).toMatchObject({ them: 3, loi: 0 });
    const daCo: TiLeHienCo[] = lan1.dong.map((d) => ({ loai: d.loai, vai: d.vai, muc_id: d.muc_id, nhan_vien_id: d.nhan_vien_id, nhom_chuc_danh: d.nhom_chuc_danh, ti_le: d.ti_le!, so_tien: d.so_tien }));
    expect(chay(vb, daCo).tong).toEqual({ them: 0, ghiDe: 0, giuNguyen: 3, loi: 0 });
  });
  it("định dạng XUẤT đọc lại được: cùng tiêu đề, nhãn loại/vai, đối tượng", () => {
    const nv = new Map([["n1", { ma_nv: "NV001", ho_ten: "Lê An" }], ["n2", { ma_nv: null, ho_ten: "Lê Hoa" }]]);
    const hang = [
      { loai: "goi_the", vai: "gioi_thieu", muc: "GT-01", ti: "2", tien: "", r: { nhan_vien_id: null, nhom_chuc_danh: null } },
      { loai: "san_pham", vai: "ban", muc: "", ti: "3.5", tien: "20000", r: { nhan_vien_id: "n1", nhom_chuc_danh: null } },
      { loai: "dich_vu", vai: "tu_van", muc: "Peel da", ti: "10", tien: "0", r: { nhan_vien_id: null, nhom_chuc_danh: "điều dưỡng" } },
    ];
    const vb = [[...TIEU_DE_NHAP, TIEU_DE_TEN_MUC], ...hang.map((h) => [NHAN_LOAI[h.loai], h.muc, NHAN_VAI[h.vai], h.ti, h.tien, chuDoiTuongXuat(h.r, nv), "tên"])].map((c) => c.join(T)).join("\n");
    const { dong, tong } = chay(vb);
    expect(tong).toMatchObject({ them: 3, loi: 0 });
    expect(dong.map((d) => [d.loai, d.vai, d.muc_id, d.nhan_vien_id, d.nhom_chuc_danh, d.ti_le, d.so_tien])).toEqual([["goi_the", "gioi_thieu", "g1", null, null, 2, null], ["san_pham", "ban", null, "n1", null, 3.5, 20000], ["dich_vu", "tu_van", "d1", null, "điều dưỡng", 10, null]]);
    expect(chuDoiTuongXuat({ nhan_vien_id: "n2", nhom_chuc_danh: null }, nv)).toBe("Nhân viên: Lê Hoa");
  });
});
