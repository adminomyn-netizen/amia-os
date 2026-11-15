// Bộ lọc danh sách hoá đơn dùng CHUNG cho màn /hoa-don và tệp Excel xuất ra, để số dòng xuất luôn khớp đúng thứ đang xem.
// Đọc từ view v_hoa_don_loc (migration 0192): các cột hoá đơn + cột tra nhanh nhân viên theo vai / hình thức thu / mua-dùng thẻ.
import { boDau, homNayHCM } from "@/lib/dinh-dang";
import type { sb } from "@/lib/db";

/** Nhãn trạng thái hoá đơn (dùng ở danh sách và chi tiết; không để trong page.tsx vì Next chặn export lạ từ trang). */
export const TRANG_THAI_HD = { nhap: { nhan: "Đang xử lý", kieu: "tram" }, hoan_thanh: { nhan: "Hoàn thành", kieu: "tot" }, huy: { nhan: "Đã huỷ", kieu: "loi" } } as const;

/** Cỡ trang chọn được (như SalonHero: 10, 25, 50, 100). Mặc định 40 giữ như trước. */
export const CO_TRANG = [10, 25, 40, 50, 100] as const;
export const CO_TRANG_MAC_DINH = 40;
/** Tình trạng trả tiền (SalonHero: Chưa thanh toán / Thanh toán đủ / Còn nợ). Chỉ tính hoá đơn hoàn thành. */
export const TRA_TIEN = [{ gia_tri: "chua", nhan: "Chưa thanh toán" }, { gia_tri: "du", nhan: "Thanh toán đủ" }, { gia_tri: "no", nhan: "Còn nợ" }] as const;
/** Lọc theo thẻ: mua thẻ (dòng bán thẻ) hoặc dùng thẻ (trừ thẻ tiền khi thanh toán; dịch vụ dùng buổi thẻ liệu trình). */
export const LOC_THE = [
  { gia_tri: "dung_tien", nhan: "Sử dụng thẻ tiền" }, { gia_tri: "dung_lan", nhan: "Sử dụng thẻ lần" },
  { gia_tri: "khong_tien", nhan: "Không sử dụng thẻ tiền" }, { gia_tri: "khong_lan", nhan: "Không sử dụng thẻ lần" },
  { gia_tri: "mua_lan", nhan: "Mua thẻ lần" }, { gia_tri: "mua_tien", nhan: "Mua thẻ tiền" },
] as const;
export const LOC_VAI = [{ gia_tri: "phuc_vu", nhan: "Phục vụ" }, { gia_tri: "tu_van", nhan: "Tư vấn" }, { gia_tri: "ban", nhan: "Bán hàng" }] as const;
/** Mới chỉ có 4 hình thức thu trong sổ cái (xem báo cáo ketqua-thu-ngan-hoa-don-20261103.md). */
export const LOC_HINH_THUC = [{ gia_tri: "tien_mat", nhan: "Tiền mặt" }, { gia_tri: "chuyen_khoan", nhan: "Chuyển khoản" }, { gia_tri: "quet_the", nhan: "Quẹt thẻ" }, { gia_tri: "vi_dien_tu", nhan: "Ví điện tử" }, { gia_tri: "ship_cod", nhan: "Ship COD" }, { gia_tri: "the_tien", nhan: "Trừ thẻ tiền" }] as const;

export type LocHoaDon = {
  tu: string; den: string; tt: string; no: boolean; q: string; vat: "" | "co" | "chua";
  /** Chi nhánh (chỉ có tác dụng với người xem mọi chi nhánh). */
  cn: string;
  /** Chữ trong tên "người lập": đơn tạo ở AMIA khớp tên nhân viên, đơn nhập từ SalonHero khớp tên thu ngân đã hoàn tất đơn (tài khoản SalonHero không trùng hẳn danh sách nhân viên nên không dùng ô chọn). */
  lap: string;
  /** Nhân viên đứng tên ở dòng hàng + vai (trống = bất kỳ vai). */
  nv: string; vai: "" | "phuc_vu" | "tu_van" | "ban";
  tra: "" | "chua" | "du" | "no";
  /** Khoảng "Tổng tiền hoá đơn" (phải thu), số nguyên đồng; trống = không giới hạn. */
  tienTu: string; tienDen: string;
  gc: string;
  /** SalonHero lọc "Hoá đơn không ghi chú": chỉ đơn ghi chú trống. */ kgc: boolean;
  the: "" | (typeof LOC_THE)[number]["gia_tri"];
  vc: "" | "co" | "khong";
  /** Xác nhận với kế toán: co = đã xác nhận, chua = hoá đơn hoàn thành chưa xác nhận. */ kt: "" | "co" | "chua";
  /** Có / không tính phí dịch vụ (phụ phí) và tip. */
  pp: "" | "co" | "khong"; tip: "" | "co" | "khong";
  ht: "" | (typeof LOC_HINH_THUC)[number]["gia_tri"];
  /** Cỡ trang (chỉ màn hình, không đổi tệp Excel). */
  n: number;
  /** Ô "Mã HD" như SalonHero (khớp mã AMIA hoặc mã SalonHero) + tick "Tìm chính xác" (khớp trọn mã, không chứa). */
  mhd: string; cx: boolean;
  /** Chỉ các hoá đơn đã chọn (ô chọn nhiều ở danh sách → in / xuất Excel các đơn đã chọn). Tối đa TOI_DA_CHON. */
  ids: string[];
};
/** Số hoá đơn chọn cùng lúc tối đa (một trang lớn nhất là 100). */
export const TOI_DA_CHON = 100;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const trong = (v: string | undefined, ds: readonly string[]) => (ds.includes(v ?? "") ? (v as string) : "");
/** Danh sách id cách nhau bằng dấu phẩy: chỉ giữ UUID hợp lệ, bỏ trùng, tối đa TOI_DA_CHON. */
export const docIds = (v: string | undefined) => [...new Set((v ?? "").split(",").map((x) => x.trim()).filter((x) => UUID.test(x)))].slice(0, TOI_DA_CHON);
const so = (v: string | undefined) => { const s = (v ?? "").replace(/\D/g, "").slice(0, 12); return s; };

export function docLocHoaDon(sp: Record<string, string | undefined>): LocHoaDon {
  const homNay = homNayHCM();
  const n = Number(sp.n);
  return {
    tu: NGAY.test(sp.tu ?? "") ? sp.tu! : homNay.slice(0, 8) + "01",
    den: NGAY.test(sp.den ?? "") ? sp.den! : homNay,
    tt: ["nhap", "hoan_thanh", "huy"].includes(sp.tt ?? "") ? sp.tt! : "",
    no: sp.no === "1",
    q: (sp.q ?? "").trim().slice(0, 80),
    vat: sp.vat === "co" || sp.vat === "chua" ? sp.vat : "",
    cn: UUID.test(sp.cn ?? "") ? sp.cn! : "",
    lap: (sp.lap ?? "").replace(/[%,()*"\\]/g, " ").trim().slice(0, 40),
    nv: UUID.test(sp.nv ?? "") ? sp.nv! : "",
    vai: trong(sp.vai, LOC_VAI.map((x) => x.gia_tri)) as LocHoaDon["vai"],
    // Đường dẫn cũ ?no=1 (Còn nợ) vẫn dùng được: coi như tình trạng trả tiền = còn nợ.
    tra: (sp.no === "1" ? "no" : trong(sp.tra, TRA_TIEN.map((x) => x.gia_tri))) as LocHoaDon["tra"],
    tienTu: so(sp.tien_tu), tienDen: so(sp.tien_den),
    gc: (sp.gc ?? "").trim().slice(0, 80), kgc: sp.kgc === "1",
    the: trong(sp.the, LOC_THE.map((x) => x.gia_tri)) as LocHoaDon["the"],
    vc: sp.vc === "co" || sp.vc === "khong" ? sp.vc : "",
    kt: sp.kt === "co" || sp.kt === "chua" ? sp.kt : "",
    pp: sp.pp === "co" || sp.pp === "khong" ? sp.pp : "", tip: sp.tip === "co" || sp.tip === "khong" ? sp.tip : "",
    ht: trong(sp.ht, LOC_HINH_THUC.map((x) => x.gia_tri)) as LocHoaDon["ht"],
    n: (CO_TRANG as readonly number[]).includes(n) ? n : CO_TRANG_MAC_DINH,
    mhd: (sp.mhd ?? "").replace(/[%,()*"\\\s]/g, "").slice(0, 40),
    cx: sp.cx === "1",
    ids: docIds(sp.ids),
  };
}

/** Các bộ lọc cần dùng của query builder PostgREST (khai báo theo cấu trúc để dùng được cho mọi câu select). */
interface BoLoc<T> {
  gte(cot: string, v: string | number): T; lte(cot: string, v: string | number): T; eq(cot: string, v: string | number | boolean): T; gt(cot: string, v: number): T;
  or(dk: string): T; is(cot: string, v: null): T; not(cot: string, op: string, v: null): T;
  ilike(cot: string, mau: string): T; contains(cot: string, v: string[]): T; in(cot: string, v: string[]): T;
}

/** Kết quả tra trước các điều kiện không viết thẳng được vào truy vấn (tên khách, người lập). Dùng chung màn hình và Excel. */
export type TraCuuLoc = { khachIds: string[]; lapIds: string[] };

/** Khách khớp ô tìm (tên / SĐT) + người lập đang chọn. Tra trước, rồi đưa vào apLocHoaDon. */
export async function traCuuLoc(db: ReturnType<typeof sb>, loc: LocHoaDon): Promise<TraCuuLoc> {
  const khachIds = await khachKhopTim(db, loc);
  let lapIds: string[] = [];
  if (loc.lap) {
    const { data } = await db.from("nhan_vien").select("id").ilike("ho_ten", `%${loc.lap.replace(/[%_]/g, " ")}%`).limit(50);
    lapIds = (data ?? []).map((x) => x.id);
  }
  return { khachIds, lapIds };
}

/** Chỉ khách khớp ô tìm (tên / SĐT). Giữ lại cho màn hoá đơn điện tử dùng chung ô tìm. */
export async function khachKhopTim(db: ReturnType<typeof sb>, loc: Pick<LocHoaDon, "q">): Promise<string[]> {
  if (!loc.q) return [];
  const an = loc.q.replace(/[%,()]/g, " ");
  const { data } = await db.from("khach_hang").select("id").or(`ho_ten_khong_dau.ilike.%${boDau(an)}%,dien_thoai.like.%${loc.q.replace(/\D/g, "") || "~"}%`).limit(50);
  return (data ?? []).map((k) => k.id);
}

/** Áp bộ lọc lên câu truy vấn v_hoa_don_loc (hàm thường, KHÔNG async: builder là thenable, trả qua async sẽ chạy truy vấn sớm).
 *  Chi nhánh: người gắn chi nhánh chỉ thấy chi nhánh của mình (bắt buộc ở máy chủ), ô chọn chi nhánh chỉ có tác dụng với người xem mọi chi nhánh. */
export function apLocHoaDon<T extends BoLoc<T>>(q: T, loc: LocHoaDon, chiNhanhId: string | null, tra: TraCuuLoc): T {
  let r = q.gte("ngay_hd", loc.tu).lte("ngay_hd", loc.den);
  if (chiNhanhId) r = r.eq("chi_nhanh_id", chiNhanhId);
  else if (loc.cn) r = r.eq("chi_nhanh_id", loc.cn);
  if (loc.tt) r = r.eq("trang_thai", loc.tt);
  if (loc.vat === "co") r = r.not("vat_hd_luc", "is", null);
  if (loc.vat === "chua") r = r.is("vat_hd_luc", null).eq("trang_thai", "hoan_thanh");
  // Tình trạng trả tiền: chỉ hoá đơn hoàn thành. Chưa thanh toán = chưa thu đồng nào dù có tiền phải thu; đủ = hết nợ; còn nợ = nợ > 0.
  if (loc.tra === "chua") r = r.eq("trang_thai", "hoan_thanh").eq("da_thu", 0).gt("tong_phai_thu", 0);
  if (loc.tra === "du") r = r.eq("trang_thai", "hoan_thanh").eq("con_no", 0).gt("tong_phai_thu", 0);
  if (loc.tra === "no") r = r.eq("trang_thai", "hoan_thanh").gt("con_no", 0);
  if (loc.tienTu) r = r.gte("tong_phai_thu", Number(loc.tienTu));
  if (loc.tienDen) r = r.lte("tong_phai_thu", Number(loc.tienDen));
  if (loc.gc) r = r.ilike("ghi_chu", `%${loc.gc.replace(/[%_\\]/g, " ")}%`);
  if (loc.kgc) r = r.or("ghi_chu.is.null,ghi_chu.eq.");
  if (loc.kt === "co") r = r.not("ke_toan_xac_nhan_luc", "is", null);
  if (loc.kt === "chua") r = r.is("ke_toan_xac_nhan_luc", null).eq("trang_thai", "hoan_thanh");
  if (loc.vc === "co") r = r.gt("giam_voucher", 0);
  if (loc.vc === "khong") r = r.eq("giam_voucher", 0);
  if (loc.pp === "co") r = r.gt("phu_phi", 0);
  if (loc.pp === "khong") r = r.eq("phu_phi", 0);
  if (loc.tip === "co") r = r.gt("tip", 0);
  if (loc.tip === "khong") r = r.eq("tip", 0);
  if (loc.the === "dung_tien") r = r.gt("tien_tru_the", 0);
  if (loc.the === "khong_tien") r = r.eq("tien_tru_the", 0);
  if (loc.the === "dung_lan") r = r.eq("dung_the_lan", true);
  if (loc.the === "khong_lan") r = r.eq("dung_the_lan", false);
  if (loc.the === "mua_lan") r = r.eq("mua_the_lan", true);
  if (loc.the === "mua_tien") r = r.eq("mua_the_tien", true);
  if (loc.ht) r = r.contains("hinh_thuc", [loc.ht]);
  if (loc.nv) {
    if (loc.vai) r = r.contains(`nv_${loc.vai}`, [loc.nv]);
    else r = r.or(["nv_phuc_vu", "nv_tu_van", "nv_ban"].map((c) => `${c}.cs.{${loc.nv}}`).join(","));
  }
  // Người lập: đơn tạo ở AMIA theo mã người lập; đơn nhập từ SalonHero (người lập là tài khoản hệ thống) theo tên thu ngân hoàn tất đơn.
  if (loc.lap) {
    r = r.or([tra.lapIds.length ? `and(la_lich_su.eq.false,nguoi_lap_id.in.(${tra.lapIds.join(",")}))` : "", `thu_ngan_ten.ilike.%${loc.lap.replace(/[%_]/g, " ")}%`].filter(Boolean).join(","));
  }
  if (loc.mhd) r = loc.cx ? r.or(`ma.eq.${loc.mhd},sh_ma.eq.${loc.mhd}`) : r.or(`ma.ilike.%${loc.mhd}%,sh_ma.ilike.%${loc.mhd}%`);
  if (loc.ids.length) r = r.in("id", loc.ids);
  if (loc.q) r = r.or([`ma.ilike.%${loc.q.replace(/[%,()]/g, " ")}%`, `sh_ma.ilike.%${loc.q.replace(/[%,()]/g, " ")}%`, tra.khachIds.length ? `khach_id.in.(${tra.khachIds.join(",")})` : ""].filter(Boolean).join(","));
  return r;
}

/** Tổng toàn kỳ như SalonHero ("Hoàn thành: N đơn - Tổng tiền - Còn nợ | Đã huỷ: N đơn"): cộng trên MỌI hoá đơn đang lọc, không chỉ trang đang xem.
 *  PostgREST không cho hàm gộp nên đọc 3 cột hẹp theo từng đợt 1000 dòng, các đợt chạy song song. Quá GIOI_HAN_TONG dòng thì bỏ qua (trả null) để khỏi làm nặng máy chủ. */
export const GIOI_HAN_TONG = 20000;
export type TongKy = { hoanThanh: { don: number; phaiThu: number; conNo: number }; huy: { don: number; phaiThu: number }; nhap: { don: number; phaiThu: number } };
export async function tongToanKy(doc: (tu: number, den: number) => PromiseLike<{ data: { trang_thai: string | null; tong_phai_thu: number | null; con_no: number | null }[] | null; error: unknown }>, tong: number): Promise<TongKy | null> {
  if (tong > GIOI_HAN_TONG) return null;
  const dot = Math.ceil(tong / 1000);
  const kq = await Promise.all(Array.from({ length: dot }, (_, i) => doc(i * 1000, i * 1000 + 999)));
  if (kq.some((x) => x.error)) return null;
  const dong = kq.flatMap((x) => x.data ?? []);
  if (dong.length !== tong) return null;
  const t: TongKy = { hoanThanh: { don: 0, phaiThu: 0, conNo: 0 }, huy: { don: 0, phaiThu: 0 }, nhap: { don: 0, phaiThu: 0 } };
  for (const h of dong) {
    if (h.trang_thai === "hoan_thanh") { t.hoanThanh.don++; t.hoanThanh.phaiThu += Number(h.tong_phai_thu ?? 0); t.hoanThanh.conNo += Number(h.con_no ?? 0); }
    else if (h.trang_thai === "huy") { t.huy.don++; t.huy.phaiThu += Number(h.tong_phai_thu ?? 0); }
    else { t.nhap.don++; t.nhap.phaiThu += Number(h.tong_phai_thu ?? 0); }
  }
  return t;
}
