import { describe, expect, it } from "vitest";
import { DON_VI_CHUAN, NHAN_VAN_DE_KHO, chuanDonVi, donViNghiVan, kiemDuLieuSua, loaiDoTrongTen, phanLoaiLech, tinhBoiCanh, vanDeVatTu, type VatTuKho } from "../src/lib/chuan-hoa-kho";

const sp = (o: Partial<VatTuKho> = {}): VatTuKho => ({ id: "a", ma: "VT-1", ten: "Kem gây tê Pleincell Cream 450g", nhom: "Vật tư tiêu hao", nhom_cap: "A", don_vi: "g", don_vi_mua: "g", he_so_quy_doi: 1, gia_nhap_don_vi: 2156, tieu_hao: true, theo_doi_kho: true, ban_le: false, ma_vach: null, hoat_dong: true, ...o });
const bc = (ds: VatTuKho[], dm: string[] = []) => tinhBoiCanh(ds, dm);

describe("đơn vị chuẩn", () => {
  it("gộp cách viết đồng nghĩa, không gộp loại khác nghĩa", () => {
    expect(chuanDonVi("cái")).toBe("Cái"); expect(chuanDonVi(" miếng ")).toBe("Miếng"); expect(chuanDonVi("Gr")).toBe("g"); expect(chuanDonVi("shoot")).toBe("Shot");
    expect(chuanDonVi("ui")).toBe("UI"); expect(chuanDonVi("line")).toBe("Line"); expect(chuanDonVi("đầu")).toBe("Đầu"); expect(chuanDonVi("ML")).toBe("ml");
    expect(chuanDonVi("Chai")).toBe("Chai"); expect(chuanDonVi("Lọ")).toBe("Lọ"); expect(chuanDonVi("Hộp")).toBe("Hộp");
    expect(chuanDonVi("lạ")).toBe("lạ"); expect(chuanDonVi(null)).toBeNull();
  });
  it("mọi đơn vị chuẩn tự chuẩn hoá về chính nó", () => { for (const d of DON_VI_CHUAN) expect(chuanDonVi(d)).toBe(d); });
});

describe("quy cách trong tên so với đơn vị", () => {
  it("đọc ml / g trong tên", () => {
    expect(loaiDoTrongTen("Tinh chất dưỡng môi 13ml")).toBe("ml"); expect(loaiDoTrongTen("Kem 450g")).toBe("g"); expect(loaiDoTrongTen("Kem 30g và 20 ml")).toBe("ca-hai"); expect(loaiDoTrongTen("Đầu MFU N4.5")).toBeNull();
  });
  it("tên ghi ml mà đơn vị là g thì nghi vấn; khớp thì không; đơn vị đếm không xét", () => {
    expect(donViNghiVan("Tinh chất dưỡng môi Sidmool JoJoBa Lip Essence 13ml", "g")).toBe(true);
    expect(donViNghiVan("Gel Thermage Coupling Fluid 60ML FLX", "ml")).toBe(false);
    expect(donViNghiVan("Kem gây tê Pleincell Cream 450g", "g")).toBe(false);
    expect(donViNghiVan("Serum 30ml", "Chai")).toBe(false);
  });
});

describe("vấn đề chuẩn hoá một vật tư", () => {
  it("vật tư sạch không có vấn đề", () => { expect(vanDeVatTu(sp(), bc([sp()]))).toEqual([]); });
  it("vật tư tiêu hao thiếu đơn vị mua vẫn bị báo (khác danh mục chung)", () => { expect(vanDeVatTu(sp({ don_vi_mua: null }), bc([sp()]))).toContain("thieu_don_vi_mua"); });
  it("thiếu giá nhập chỉ báo, đơn vị lạ báo, hệ số lạ báo", () => {
    expect(vanDeVatTu(sp({ gia_nhap_don_vi: null }), bc([]))).toEqual(["thieu_gia_nhap"]);
    expect(vanDeVatTu(sp({ don_vi: "cái" }), bc([]))).toContain("don_vi_la");
    expect(vanDeVatTu(sp({ don_vi: "Cái", don_vi_mua: "Hộp", he_so_quy_doi: 1 }), bc([]))).toContain("he_so_la");
    expect(vanDeVatTu(sp({ don_vi: "Cái", don_vi_mua: "Hộp", he_so_quy_doi: 20 }), bc([]))).not.toContain("he_so_la");
  });
  it("nhóm cấp: vật tư dùng trong ca hoặc có trong định mức mà không phải nhóm A", () => {
    expect(vanDeVatTu(sp({ nhom_cap: null }), bc([]))).toContain("thieu_nhom_cap");
    const c = sp({ nhom_cap: "C", tieu_hao: false });
    expect(vanDeVatTu(c, bc([c], ["a"]))).toEqual(expect.arrayContaining(["dm_khong_nhom_a", "thieu_co_tieu_hao"]));
  });
  it("vừa bán lẻ vừa tiêu hao bị cảnh báo (nguy cơ trừ kho hai lần)", () => { expect(vanDeVatTu(sp({ ban_le: true }), bc([]))).toContain("vua_ban_vua_tieu_hao"); });
  it("trùng tên (không phân biệt hoa thường, dấu) và trùng mã vạch", () => {
    const a = sp({ id: "1", ten: "Kem Chống Nắng 50ml", ma_vach: "8801234567890" }), b = sp({ id: "2", ma: "VT-2", ten: "kem chong nang 50ML", ma_vach: "8801234567890" });
    const ctx = bc([a, b]);
    expect(vanDeVatTu(a, ctx)).toEqual(expect.arrayContaining(["trung_ten", "trung_ma_vach"]));
    expect(vanDeVatTu(sp({ id: "3", ten: "Khác hẳn tên" }), ctx)).not.toContain("trung_ten");
  });
  it("hàng đã ngừng dùng thì bỏ qua", () => { expect(vanDeVatTu(sp({ hoat_dong: false, don_vi: "x", gia_nhap_don_vi: null }), bc([]))).toEqual([]); });
  it("mọi mã vấn đề đều có nhãn tiếng Việt", () => {
    const tat = [sp({ don_vi: "cái", don_vi_mua: null, gia_nhap_don_vi: null, nhom_cap: null, ban_le: true, tieu_hao: false, nhom: "Vật tư tiêu hao", ten: "Kem 13ml" })];
    for (const v of vanDeVatTu(tat[0], bc(tat, ["a"]))) expect(NHAN_VAN_DE_KHO[v]).toBeTruthy();
  });
});

describe("kiểm dữ liệu sửa tại chỗ", () => {
  const ok = { don_vi: "gr", don_vi_mua: "Gói", he_so: "700", gia_nhap: "", nhom_cap: "", tieu_hao: false };
  it("đơn vị đồng nghĩa được chuẩn hoá khi lưu; giá trống giữ trống", () => {
    const r = kiemDuLieuSua(ok);
    expect(r).toEqual({ ok: { don_vi: "g", don_vi_mua: "Gói", he_so_quy_doi: 700, gia_nhap_don_vi: null, nhom_cap: null, tieu_hao: false } });
  });
  it("chặn đơn vị lạ, hệ số không hợp lệ, giá âm, nhóm cấp ngoài A/B/C", () => {
    expect(kiemDuLieuSua({ ...ok, don_vi: "thùng" })).toHaveProperty("loi");
    expect(kiemDuLieuSua({ ...ok, he_so: "0" })).toHaveProperty("loi");
    expect(kiemDuLieuSua({ ...ok, don_vi_mua: "", he_so: "5" })).toHaveProperty("loi");
    expect(kiemDuLieuSua({ ...ok, gia_nhap: "-1" })).toHaveProperty("loi");
    expect(kiemDuLieuSua({ ...ok, nhom_cap: "D" })).toHaveProperty("loi");
  });
  it("giá nhập kiểu Việt Nam và nhóm cấp A", () => {
    expect(kiemDuLieuSua({ ...ok, gia_nhap: "2.156,5", nhom_cap: "A" })).toMatchObject({ ok: { gia_nhap_don_vi: 2156.5, nhom_cap: "A" } });
  });
});

describe("đối chiếu tồn với SalonHero", () => {
  it("khớp / SalonHero âm mà AMIA 0 / lệch thật", () => {
    expect(phanLoaiLech(5, 5)).toEqual({ loai: "khop", chenh: 0 });
    expect(phanLoaiLech(-3, 0)).toEqual({ loai: "sh_am", chenh: 3 });
    expect(phanLoaiLech(10, 7)).toEqual({ loai: "amia_it", chenh: -3 });
    expect(phanLoaiLech(2, 9)).toEqual({ loai: "amia_nhieu", chenh: 7 });
    expect(phanLoaiLech(-3, 4).loai).toBe("amia_nhieu");
    expect(phanLoaiLech(null, 0).loai).toBe("khop"); expect(phanLoaiLech(null, 6).loai).toBe("chi_co_amia");
  });
});
