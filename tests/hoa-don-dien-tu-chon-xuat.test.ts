import { beforeEach, describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";

// Xuất Excel các hoá đơn đã chọn ở ngăn "Cần xuất": id từ trình duyệt chỉ là danh sách muốn xem, máy chủ lọc lại theo chi nhánh và quyền xem.
vi.mock("server-only", () => ({}));
const VINH = "cn-vinh", DL = "cn-dl";
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let nguoiDung: { chiNhanhId: string | null; nhanVienId: string; quyen: string[]; vaiTro: string } | null;
vi.mock("@/lib/auth", () => ({ kiemQuyen: async (q: string) => (nguoiDung && nguoiDung.quyen.includes(q) ? nguoiDung : null), KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này." }));

type Dong = Record<string, unknown>;
const hd = (n: number, o: Dong = {}): Dong => ({ id: ID(n), ma: `HD00000${n}`, ngay_hd: "2026-10-2" + n, trang_thai: "hoan_thanh", chi_nhanh_id: VINH, nguoi_lap_id: "nv-vinh", la_so_du_dau: false, khach_id: "k1", vat_pct: 8, vat_tien: 80000, giam_gia_don: 0, phu_phi: 0, tip: 0, tong_hang: 1000000, tong_phai_thu: 1080000, ...o });
const bang: Record<string, Dong[]> = {
  hoa_don: [hd(1), hd(2, { chi_nhanh_id: DL }), hd(3, { nguoi_lap_id: "nv-khac" }), hd(4, { trang_thai: "nhap" }), hd(5, { la_so_du_dau: true })],
  khach_hang: [{ id: "k1", ho_ten: "Nguyễn Thị A", cong_ty: "Công ty TNHH Hoa", ma_so_thue: "0123456789", dia_chi: "39A Lê Hồng Phong, Vinh" }],
  hoa_don_dong: [{ id: "d1", hoa_don_id: ID(1), ten: "Tiêm filler", so_luong: 1, don_gia: 1000000, giam_gia: 0, thanh_tien: 1000000, tao_luc: "2026-10-20" }],
  thanh_toan: [{ hoa_don_id: ID(1), loai: "thu", phuong_thuc: "chuyen_khoan", so_tien: 1080000, ngan_hang: "Techcombank" }],
  nhat_ky_truy_cap: [],
};
const nhatKy: Dong[] = [];
const loc: { bang: string; kieu: string; cot: string; v: unknown }[] = [];
vi.mock("@/lib/db", () => ({
  thongBaoLoi: (e: unknown) => String(e),
  sb: () => ({
    from: (ten: string) => {
      const dk: ((r: Dong) => boolean)[] = [];
      const b: Record<string, unknown> = {
        select: () => b, order: () => b, limit: () => b, range: () => b,
        eq: (c: string, v: unknown) => { loc.push({ bang: ten, kieu: "eq", cot: c, v }); dk.push((r) => r[c] === v); return b; },
        in: (c: string, v: unknown[]) => { loc.push({ bang: ten, kieu: "in", cot: c, v }); dk.push((r) => v.includes(r[c])); return b; },
        insert: async (d: Dong) => { nhatKy.push(d); return { error: null }; },
        then: (ok: (r: { data: Dong[]; error: null }) => unknown) => ok({ data: (bang[ten] ?? []).filter((r) => dk.every((f) => f(r))), error: null }),
      };
      return b;
    },
  }),
}));

const goi = async (q: string) => { const { GET } = await import("../src/app/api/xuat/hoa-don-dien-tu/route"); return GET(new Request(`http://x/api/xuat/hoa-don-dien-tu?${q}`)); };
const docXlsx = async (r: Response) => { const wb = new ExcelJS.Workbook(); await wb.xlsx.load(await r.arrayBuffer()); return wb; };
beforeEach(() => { nhatKy.length = 0; loc.length = 0; nguoiDung = { chiNhanhId: VINH, nhanVienId: "nv-vinh", vaiTro: "ke_toan", quyen: ["ban.xem", "hd.vat", "ban.toan_co_so"] }; });

describe("xuất Excel hoá đơn đã chọn", () => {
  it("thiếu quyền hd.vat thì 403, không chạm dữ liệu", async () => {
    nguoiDung = { ...nguoiDung!, quyen: ["ban.xem"] };
    expect((await goi(`ids=${ID(1)}`)).status).toBe(403);
    expect(loc).toEqual([]);
  });
  it("mã sai dạng, rỗng hoặc quá nhiều thì 400", async () => {
    expect((await goi("ids=abc")).status).toBe(400);
    expect((await goi("ids=")).status).toBe(400);
    expect((await goi(`ids=${Array.from({ length: 201 }, (_, i) => ID(i + 1)).join(",")}`)).status).toBe(400);
  });
  it("khoá chi nhánh ở máy chủ: đơn của chi nhánh khác, đơn nháp, số dư đầu kỳ bị bỏ dù có gửi id lên", async () => {
    const r = await goi(`ids=${[1, 2, 4, 5].map(ID).join(",")}`);
    expect(r.status).toBe(200);
    expect(loc).toContainEqual({ bang: "hoa_don", kieu: "eq", cot: "chi_nhanh_id", v: VINH });
    const wb = await docXlsx(r);
    const ma = wb.getWorksheet("Theo đơn")!.getColumn(1).values.slice(2);
    expect(ma).toEqual(["HD000001"]);
    expect(nhatKy[0]).toMatchObject({ hanh_dong: "xuat_excel", chi_tiet: { so_hoa_don: 1, bo_qua_ngoai_pham_vi: 3 } });
  });
  it("không có quyền xem toàn cơ sở thì chỉ đơn mình lập", async () => {
    nguoiDung = { ...nguoiDung!, quyen: ["ban.xem", "hd.vat"] };
    const r = await goi(`ids=${[1, 3].map(ID).join(",")}`);
    expect(r.status).toBe(200);
    expect((await docXlsx(r)).getWorksheet("Theo đơn")!.getColumn(1).values.slice(2)).toEqual(["HD000001"]);
    expect((await goi(`ids=${ID(3)}`)).status).toBe(404);
    expect(loc).toContainEqual({ bang: "hoa_don", kieu: "eq", cot: "nguoi_lap_id", v: "nv-vinh" });
  });
  it("người không gắn chi nhánh lấy được đơn mọi chi nhánh", async () => {
    nguoiDung = { ...nguoiDung!, chiNhanhId: null };
    const wb = await docXlsx(await goi(`ids=${[1, 2].map(ID).join(",")}`));
    expect(wb.getWorksheet("Theo đơn")!.getColumn(1).values.slice(2)).toEqual(["HD000001", "HD000002"]);
  });
  it("cột Excel: người mua là công ty, MST, địa chỉ, ngân hàng nhận, tên hàng, VAT, tổng", async () => {
    const wb = await docXlsx(await goi(`ids=${ID(1)}`));
    const dong = wb.getWorksheet("Dòng hàng")!.getRow(2);
    const gt = (c: string) => String(dong.getCell(c).value);
    expect([gt("D"), gt("E"), gt("F"), gt("G"), gt("H")]).toEqual(["Công ty TNHH Hoa", "0123456789", "39A Lê Hồng Phong, Vinh", "Techcombank 1.080.000", "Tiêm filler"]);
    expect([Number(dong.getCell("I").value), Number(dong.getCell("J").value), Number(dong.getCell("L").value), Number(dong.getCell("M").value), Number(dong.getCell("N").value), Number(dong.getCell("O").value)]).toEqual([1, 1000000, 1000000, 8, 80000, 1080000]);
  });
});
