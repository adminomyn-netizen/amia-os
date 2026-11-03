import { describe, expect, it } from "vitest";
import { apLocHoaDon, docLocHoaDon, tongToanKy } from "@/lib/loc-hoa-don";

/** Query builder giả: ghi lại từng lời gọi để so với điều kiện mong đợi. */
function gia() {
  const ghi: string[] = [];
  const b: Record<string, (...a: unknown[]) => unknown> = {};
  for (const ten of ["gte", "lte", "eq", "gt", "or", "is", "not", "ilike", "contains", "in"]) b[ten] = (...a: unknown[]) => { ghi.push(`${ten}(${a.map((x) => JSON.stringify(x)).join(",")})`); return b; };
  return { b, ghi };
}
const UUID = "9dd502fa-b6e1-4892-ab22-3b00de4e417f";

describe("docLocHoaDon", () => {
  it("bỏ giá trị lạ, giữ cỡ trang hợp lệ, đường dẫn cũ no=1 thành tra=no", () => {
    const l = docLocHoaDon({ tt: "xx", tra: "du", no: "1", nv: "khong-phai-uuid", vai: "abc", the: "mua_lan", ht: "momo", n: "7", tien_tu: "1.500.000đ" });
    expect(l.tt).toBe(""); expect(l.tra).toBe("no"); expect(l.nv).toBe(""); expect(l.vai).toBe(""); expect(l.ht).toBe(""); expect(l.n).toBe(40);
    expect(l.the).toBe("mua_lan"); expect(l.tienTu).toBe("1500000");
    expect(docLocHoaDon({ n: "100" }).n).toBe(100);
  });
});

describe("apLocHoaDon", () => {
  it("người gắn chi nhánh bị khoá chi nhánh, bỏ qua ô chọn chi nhánh", () => {
    const { b, ghi } = gia();
    apLocHoaDon(b as never, docLocHoaDon({ cn: UUID }), "cn-cua-toi", { khachIds: [], lapIds: [] });
    expect(ghi).toContain('eq("chi_nhanh_id","cn-cua-toi")'); expect(ghi.filter((x) => x.startsWith('eq("chi_nhanh_id"')).length).toBe(1);
    const g2 = gia();
    apLocHoaDon(g2.b as never, docLocHoaDon({ cn: UUID }), null, { khachIds: [], lapIds: [] });
    expect(g2.ghi).toContain(`eq("chi_nhanh_id","${UUID}")`);
  });
  it("tình trạng trả tiền, khoảng tiền, thẻ, voucher, hình thức, nhân viên theo vai", () => {
    const { b, ghi } = gia();
    apLocHoaDon(b as never, docLocHoaDon({ tra: "no", tien_tu: "1000000", tien_den: "5000000", the: "dung_tien", vc: "co", ht: "chuyen_khoan", nv: UUID, vai: "tu_van", pp: "co", tip: "khong" }), null, { khachIds: [], lapIds: [] });
    for (const x of ['gt("con_no",0)', 'gte("tong_phai_thu",1000000)', 'lte("tong_phai_thu",5000000)', 'gt("tien_tru_the",0)', 'gt("giam_voucher",0)', 'contains("hinh_thuc",["chuyen_khoan"])', `contains("nv_tu_van",["${UUID}"])`, 'gt("phu_phi",0)', 'eq("tip",0)']) expect(ghi).toContain(x);
  });
  it("Mã HD: tìm chính xác khớp trọn mã AMIA hoặc SalonHero, không tick thì có chứa; chọn nhiều thì lọc theo id", () => {
    const a = gia();
    apLocHoaDon(a.b as never, docLocHoaDon({ mhd: " HD000123 ", cx: "1" }), null, { khachIds: [], lapIds: [] });
    expect(a.ghi).toContain('or("ma.eq.HD000123,sh_ma.eq.HD000123")');
    const c = gia();
    apLocHoaDon(c.b as never, docLocHoaDon({ mhd: "HD%0,1(" }), null, { khachIds: [], lapIds: [] });
    expect(c.ghi).toContain('or("ma.ilike.%HD01%,sh_ma.ilike.%HD01%")');
    const d = gia();
    apLocHoaDon(d.b as never, docLocHoaDon({ ids: `${UUID},sai,${UUID}` }), null, { khachIds: [], lapIds: [] });
    expect(d.ghi).toContain(`in("id",["${UUID}"])`);
    expect(docLocHoaDon({}).ids).toEqual([]);
  });
  it("không chọn vai thì tìm nhân viên ở cả ba vai", () => {
    const { b, ghi } = gia();
    apLocHoaDon(b as never, docLocHoaDon({ nv: UUID }), null, { khachIds: [], lapIds: [] });
    expect(ghi.find((x) => x.startsWith("or("))).toContain(`nv_ban.cs.{${UUID}}`);
  });
  it("người lập khớp cả đơn tạo ở AMIA (theo mã) lẫn đơn nhập từ SalonHero (theo tên thu ngân)", () => {
    const { b, ghi } = gia();
    apLocHoaDon(b as never, docLocHoaDon({ lap: "Dương" }), null, { khachIds: [], lapIds: ["a1"] });
    const or = ghi.find((x) => x.startsWith("or("))!;
    expect(or).toContain("and(la_lich_su.eq.false,nguoi_lap_id.in.(a1))"); expect(or).toContain("thu_ngan_ten.ilike.%Dương%");
  });
});

describe("tongToanKy", () => {
  const dot = (n: number, tt: string, tien: number, no: number) => ({ data: Array.from({ length: n }, () => ({ trang_thai: tt, tong_phai_thu: tien, con_no: no })), error: null });
  it("cộng hết các đợt, tách hoàn thành / huỷ", async () => {
    const t = await tongToanKy(async (tu) => (tu === 0 ? dot(1000, "hoan_thanh", 10, 1) : { data: [...dot(5, "hoan_thanh", 100, 0).data, ...dot(2, "huy", 0, 0).data], error: null }), 1007);
    expect(t).toEqual({ hoanThanh: { don: 1005, phaiThu: 10500, conNo: 1000 }, huy: { don: 2 }, nhap: { don: 0 } });
  });
  it("đọc thiếu dòng hoặc lỗi thì trả null thay vì số sai", async () => {
    expect(await tongToanKy(async () => dot(10, "hoan_thanh", 1, 0), 1500)).toBeNull();
    expect(await tongToanKy(async () => ({ data: null, error: new Error("x") }), 10)).toBeNull();
  });
});
