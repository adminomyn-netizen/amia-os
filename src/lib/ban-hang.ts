import { boDau } from "@/lib/dinh-dang";
import { chuanTenNganHang, coNganHang, NGAN_HANG_MAC_DINH } from "@/lib/ngan-hang-ten";
export type Vai = "phuc_vu" | "tu_van" | "ban";
export const VAI: { ma: Vai; ten: string }[] = [{ ma: "phuc_vu", ten: "Phục vụ" }, { ma: "tu_van", ten: "Tư vấn" }, { ma: "ban", ten: "Bán hàng" }];
/** SalonHero: mỗi dòng hàng có tối đa 5 người hưởng cho mỗi vai. DB cũng chặn (migration 0081). */
export const TOI_DA_NGUOI_HUONG = 5;
/** Hình thức trả tiền như SalonHero (Config.payment_type): Tiền mặt, Quẹt thẻ, Chuyển khoản, Ví điện tử (+ loại ví), Ship COD. "Nhiều hình thức" = thêm nhiều khoản thu.
 *  "Trừ thẻ tiền" là phần riêng của AMIA (SalonHero ghi ô "Trừ thẻ tiền"), không vào quỹ. DB: ràng buộc thanh_toan_phuong_thuc_check (migration 0199). */
export const PHUONG_THUC = [
  { gia_tri: "tien_mat", nhan: "Tiền mặt" }, { gia_tri: "chuyen_khoan", nhan: "Chuyển khoản" }, { gia_tri: "quet_the", nhan: "Quẹt thẻ" },
  { gia_tri: "vi_dien_tu", nhan: "Ví điện tử" }, { gia_tri: "ship_cod", nhan: "Ship COD" }, { gia_tri: "the_tien", nhan: "Trừ thẻ tiền" },
];
export const NHAN_PHUONG_THUC = Object.fromEntries(PHUONG_THUC.map((p) => [p.gia_tri, p.nhan])) as Record<string, string>;
/** Hình thức thu nợ / thu tiền thật (không gồm trừ thẻ tiền). */
export const PHUONG_THUC_TIEN = PHUONG_THUC.filter((p) => p.gia_tri !== "the_tien");
/** Ví điện tử hiện ở Việt Nam (SalonHero Config.wallet_types_by_country.VN), đúng thứ tự SalonHero. DB nhận thêm NETSPAY, PAYNOW, AIRTEL, MTN, KHAC cho dữ liệu đồng bộ. */
export const LOAI_VI = [
  { gia_tri: "ZALO", nhan: "Zalo Pay" }, { gia_tri: "MOMO", nhan: "Momo" }, { gia_tri: "GRAB", nhan: "Grab Pay" }, { gia_tri: "VNPAY", nhan: "VN Pay" },
  { gia_tri: "SAMSUNG", nhan: "Samsung Pay" }, { gia_tri: "SHOPEE", nhan: "Shopee Pay" }, { gia_tri: "VINID", nhan: "VinID" }, { gia_tri: "GOTIT", nhan: "GotIt" },
];
export const NHAN_LOAI_VI: Record<string, string> = { ...Object.fromEntries(LOAI_VI.map((v) => [v.gia_tri, v.nhan])), NETSPAY: "NETSPay", PAYNOW: "PayNow", AIRTEL: "Airtel MM", MTN: "MTN MoMo", KHAC: "Ví khác" };
/** Tên hiển thị một khoản thu: "Ví điện tử · Momo". */
export const nhanKhoanThu = (phuongThuc: string, loaiVi?: string | null) => (phuongThuc === "vi_dien_tu" && loaiVi ? `${NHAN_PHUONG_THUC.vi_dien_tu} · ${NHAN_LOAI_VI[loaiVi] ?? loaiVi}` : NHAN_PHUONG_THUC[phuongThuc] ?? phuongThuc);
/** Máy chủ: loại ví ghi vào thanh_toan. Chỉ ví điện tử mới có; ví điện tử mà không chọn / chọn sai loại thì trả undefined để báo lỗi. */
export function loaiViKhoanThu(phuongThuc: string, loaiVi: string | null | undefined): string | null | undefined {
  if (phuongThuc !== "vi_dien_tu") return null;
  return LOAI_VI.some((v) => v.gia_tri === loaiVi) ? loaiVi! : undefined;
}
/** Quỹ nhận tiền như SalonHero: tiền mặt → quỹ tiền mặt; quẹt thẻ, chuyển khoản, ví → quỹ ngân hàng; trừ thẻ tiền và Ship COD không vào quỹ (tiền COD còn ở bên giao hàng). Cùng luật với v_so_quy (0208). */
export const quyCuaPhuongThuc = (phuongThuc: string): "tien_mat" | "ngan_hang" | null => (phuongThuc === "the_tien" || phuongThuc === "ship_cod" ? null : phuongThuc === "tien_mat" ? "tien_mat" : "ngan_hang");

export type MucBan = { loai: "dich_vu" | "goi_the" | "san_pham"; id: string; ten: string; gia: number; nhom: string; vatPct?: number; tao?: string; /** Mã và mã vạch để thu ngân tìm nhanh (gõ không dấu cũng ra). */ ma?: string; maVach?: string;
  /** "Nơi hiển thị" = chỉ đặt lịch / ẩn: không hiện ở ô chọn mục của Thu ngân (dòng cũ vẫn dùng được). */ anThuNgan?: boolean;
  /** "Địa điểm cung cấp" của dịch vụ: null/không có = mọi chi nhánh. */ chiNhanhIds?: string[] | null;
  /** "Sửa giá khi thanh toán": thu ngân được sửa đơn giá dòng (chỉ dịch vụ, sản phẩm). */ choSuaGia?: boolean;
  /** Gói thẻ: các dịch vụ của gói (goi_the_dich_vu) để lọc hai chiều thẻ ↔ dịch vụ ở thu ngân. */ dichVu?: string[] };
/** Cột noi_hien_thi (migration 0194): 'tat_ca' | 'thu_ngan' | 'dat_lich' | 'an'. Giá trị lạ coi như 'tat_ca' (giữ hành vi cũ). */
export const hienThuNgan = (noi: string | null | undefined) => noi !== "dat_lich" && noi !== "an";
export const hienDatLich = (noi: string | null | undefined) => noi !== "thu_ngan" && noi !== "an";
/** Giá trị noi_hien_thi được nhận đặt lịch (lọc truy vấn trang /dat-lich công khai). */
export const NOI_DAT_LICH = ["tat_ca", "dat_lich"];
/** Dịch vụ có cung cấp ở chi nhánh này không. Chưa chọn chi nhánh hoặc dịch vụ không giới hạn (null/rỗng) thì coi là có. */
export const coOChiNhanh = (ids: string[] | null | undefined, chiNhanhId: string | null | undefined) => !chiNhanhId || !ids || ids.length === 0 || ids.includes(chiNhanhId);
/** Mục hiện ở ô chọn của Thu ngân theo chi nhánh đang bán. */
export const hienOThuNgan = (m: Pick<MucBan, "anThuNgan" | "chiNhanhIds">, chiNhanhId: string | null | undefined) => !m.anThuNgan && coOChiNhanh(m.chiNhanhIds, chiNhanhId);
/** Ô tìm của thu ngân: khớp tên, mã hoặc mã vạch, không phân biệt hoa thường và dấu ("tre hoa" ra "Trẻ hóa"). */
export const khopMuc = (m: Pick<MucBan, "ten" | "ma" | "maVach">, tu: string) => {
  const k = boDau(tu.trim());
  return !k || boDau(`${m.ten} ${m.ma ?? ""} ${m.maVach ?? ""}`).includes(k);
};
export type DongDon = { loai: MucBan["loai"]; ref: string; sl: number; giam: number; nv: Record<Vai, { id: string; ti: number }[]>;
  /** Đơn giá thu ngân sửa (chỉ khi mục bật "Sửa giá khi thanh toán"); không có = giá danh mục. */ gia?: number;
  /** % giảm của dòng đang chọn ở ô "%" (chỉ để hiển thị lại; tiền giảm thật là `giam`). */ pct?: number;
  /** Ghi chú dòng (SalonHero: ghi chú thẻ dịch vụ / liệu trình); dòng bán thẻ thì chép sang ghi chú của thẻ. */ ghiChu?: string;
  /** Người giới thiệu của dòng (SalonHero: nguồn giới thiệu + mức hoa hồng % hoặc tiền cho từng dòng). */ gt?: GioiThieuDong | null;
  /** Phần nợ của dòng ("Xác nhận các mục còn nợ"); chỉ gửi khi đơn còn nợ. */ no?: number };
/** Người giới thiệu theo dòng: nguồn giới thiệu (bảng doi_tac_gt) + mức hoa hồng. */
export type GioiThieuDong = { id: string; kieu: "phan_tram" | "tien"; giaTri: number };
/** Nguồn giới thiệu rút gọn cho Thu ngân. Nhóm như SalonHero: Khách hàng / Nhân viên / Khác. */
export type NguonGt = { id: string; ten: string; ma: string; nhom: "khach" | "nhan_vien" | "khac"; kieu: "phan_tram" | "tien"; giaTri: number;
  /** Mức riêng theo mục (tab "Hoa hồng theo dịch vụ" của nguồn), khoá "<loai>:<id>". */ muc?: Record<string, { kieu: "phan_tram" | "tien"; giaTri: number }> };
/** Người giới thiệu gợi ý cho một dòng: mức riêng của mục nếu có, không thì mức chung của nguồn. Nguồn không còn trong danh sách → null. */
export function gtGoiY(nguon: NguonGt[], doiTacId: string | null | undefined, loai: string, ref: string): GioiThieuDong | null {
  const g = doiTacId ? nguon.find((x) => x.id === doiTacId) : undefined;
  if (!g) return null;
  const m = g.muc?.[`${loai}:${ref}`];
  return { id: g.id, kieu: m?.kieu ?? g.kieu, giaTri: m?.giaTri ?? g.giaTri };
}
export const NHOM_GT: { ma: NguonGt["nhom"]; ten: string }[] = [{ ma: "khach", ten: "Khách hàng" }, { ma: "nhan_vien", ten: "Nhân viên" }, { ma: "khac", ten: "Khác" }];
/** doi_tac_gt → nhóm SalonHero: loai_sh STAFF = Nhân viên; loại khach_cu / CUSTOMER = Khách hàng; còn lại = Khác. */
export const nhomNguonGt = (loai: string, loaiSh: string | null | undefined): NguonGt["nhom"] => (loaiSh === "STAFF" ? "nhan_vien" : loai === "khach_cu" || loaiSh === "CUSTOMER" ? "khach" : "khac");
/** Máy chủ kiểm người giới thiệu dòng. Trả null khi không có. */
export function kiemGioiThieuDong(gt: unknown, coNguon: (id: string) => boolean): { ok: true; gt: GioiThieuDong | null } | { ok: false; loi: string } {
  if (gt == null) return { ok: true, gt: null };
  const o = gt as Partial<GioiThieuDong>;
  if (!o.id || !coNguon(String(o.id))) return { ok: false, loi: "Người giới thiệu của dòng không còn trong danh sách nguồn giới thiệu." };
  if (o.kieu !== "phan_tram" && o.kieu !== "tien") return { ok: false, loi: "Mức hoa hồng giới thiệu phải theo % hoặc theo tiền." };
  const v = Number(o.giaTri);
  if (!Number.isFinite(v) || v < 0 || (o.kieu === "phan_tram" && v > 100) || (o.kieu === "tien" && !Number.isInteger(v))) return { ok: false, loi: "Mức hoa hồng giới thiệu chưa hợp lệ." };
  return { ok: true, gt: { id: String(o.id), kieu: o.kieu, giaTri: v } };
}
/** Tiền giảm của dòng theo % (mốc 5% ở Thu ngân): làm tròn đồng, không quá thành tiền dòng. */
export const giamTheoPct = (donGia: number, sl: number, pct: number) => Math.min(Math.max(Math.round((donGia * sl * Math.min(Math.max(pct, 0), 100)) / 100), 0), donGia * sl);
/** Chia nợ cho các dòng theo tỉ lệ thành tiền (SalonHero "Xác nhận các mục còn nợ"); phần lẻ dồn vào dòng cuối có tiền. */
export function chiaNoTheoDong(thanh: number[], conNo: number): number[] {
  const n = Math.max(Math.round(conNo), 0);
  const co = thanh.map((t) => Math.max(t, 0));
  const tong = co.reduce((a, b) => a + b, 0);
  if (!n || !thanh.length) return thanh.map(() => 0);
  if (tong <= 0) return thanh.map((_, i) => (i === thanh.length - 1 ? n : 0));
  const ra = co.map((t) => Math.floor((n * t) / tong));
  const cuoi = co.reduce((j, t, i) => (t > 0 ? i : j), thanh.length - 1);
  ra[cuoi] += n - ra.reduce((a, b) => a + b, 0);
  return ra;
}
/** Máy chủ kiểm phần nợ theo dòng: mỗi phần là số nguyên không âm, cộng đúng số nợ. Không gửi phần nào = không chia (null). */
export function kiemNoDong(no: (number | undefined)[], conNo: number): { ok: true; no: number[] | null } | { ok: false; loi: string } {
  if (no.every((x) => x == null)) return { ok: true, no: null };
  if (conNo <= 0) return { ok: false, loi: "Đơn không còn nợ nên không chia nợ theo dòng." };
  const ds = no.map((x) => Number(x ?? 0));
  if (ds.some((x) => !Number.isInteger(x) || x < 0)) return { ok: false, loi: "Phần nợ của dòng chưa hợp lệ." };
  if (ds.reduce((a, b) => a + b, 0) !== conNo) return { ok: false, loi: "Các mục còn nợ phải cộng đúng số tiền còn nợ." };
  return { ok: true, no: ds };
}
/** Đơn giá tối đa thu ngân được gõ khi sửa giá (chặn gõ nhầm thừa số 0). */
export const GIA_SUA_TOI_DA = 10_000_000_000;
/** Loại dòng được sửa đơn giá theo cờ cho_sua_gia (SalonHero edit_price_in_order: dịch vụ, sản phẩm, thẻ).
 *  Thẻ: giá trị mỗi buổi tính theo giá bán thực của dòng (chot_hoa_don); số buổi / số tiền trong thẻ giữ theo gói (chế độ "cố định"). */
export const LOAI_SUA_GIA: MucBan["loai"][] = ["dich_vu", "san_pham", "goi_the"];
/** Đơn giá dùng để tính dòng: giá sửa nếu có, không thì giá danh mục. Dùng chung cho màn Thu ngân và máy chủ. */
export const giaDong = (d: Pick<DongDon, "gia">, m: { gia: number } | undefined) => d.gia ?? m?.gia ?? 0;
/** Máy chủ kiểm giá sửa: chỉ mục bật cờ, đúng loại, số nguyên 0..GIA_SUA_TOI_DA. Trả đơn giá dùng để ghi hoá đơn. */
export function kiemGiaDong(d: Pick<DongDon, "gia" | "loai">, m: { ten: string; gia: number; choSuaGia?: boolean }): { ok: true; gia: number } | { ok: false; loi: string } {
  if (d.gia == null) return { ok: true, gia: m.gia };
  if (!m.choSuaGia || !LOAI_SUA_GIA.includes(d.loai)) return { ok: false, loi: `"${m.ten}" không được sửa giá khi thanh toán (bật ở Danh mục).` };
  if (!Number.isInteger(d.gia) || d.gia < 0 || d.gia > GIA_SUA_TOI_DA) return { ok: false, loi: `Đơn giá sửa của "${m.ten}" chưa hợp lệ.` };
  return { ok: true, gia: d.gia };
}

const UUID_NHAP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Giữ lại đúng các trường hợp lệ của dòng hàng; dữ liệu lạ bị bỏ (đơn nháp chỉ là bản nhớ tạm, giá vẫn lấy lại từ danh mục khi chốt). */
export function lamSachDongNhap(v: unknown): DongDon[] {
  if (!Array.isArray(v)) return [];
  const ra: DongDon[] = [];
  for (const d of v.slice(0, 60)) {
    const o = d as Partial<DongDon> | null;
    if (!o || !["dich_vu", "goi_the", "san_pham"].includes(String(o.loai)) || !UUID_NHAP.test(String(o.ref))) continue;
    const nv = { phuc_vu: [], tu_van: [], ban: [] } as DongDon["nv"];
    for (const vai of ["phuc_vu", "tu_van", "ban"] as const) {
      const ds = (o.nv as Record<string, unknown> | undefined)?.[vai];
      if (Array.isArray(ds)) nv[vai] = ds.slice(0, TOI_DA_NGUOI_HUONG).filter((x) => x && UUID_NHAP.test(String((x as { id?: unknown }).id)) && Number.isFinite(Number((x as { ti?: unknown }).ti))).map((x) => ({ id: String((x as { id: string }).id), ti: Math.min(100, Math.max(0, Number((x as { ti: number }).ti))) }));
    }
    const gia = o.gia == null ? NaN : Number(o.gia);
    const gt = o.gt && UUID_NHAP.test(String(o.gt.id)) && (o.gt.kieu === "phan_tram" || o.gt.kieu === "tien") && Number.isFinite(Number(o.gt.giaTri)) ? { id: String(o.gt.id), kieu: o.gt.kieu, giaTri: Math.max(0, Number(o.gt.giaTri)) } : null;
    ra.push({ loai: o.loai as DongDon["loai"], ref: String(o.ref), sl: Math.min(999, Math.max(1, Math.floor(Number(o.sl) || 1))), giam: Math.max(0, Math.floor(Number(o.giam) || 0)), nv,
      ...(Number.isInteger(gia) && gia >= 0 && gia <= GIA_SUA_TOI_DA ? { gia } : {}),
      ...(typeof o.ghiChu === "string" && o.ghiChu.trim() ? { ghiChu: o.ghiChu.slice(0, 500) } : {}), ...(gt ? { gt } : {}) });
  }
  return ra;
}

export type KhoanThu = { phuong_thuc: string; so_tien: number; the_id?: string; /** Chỉ cho chuyển khoản / quẹt thẻ: ngân hàng nhận tiền (tên ngắn). */ ngan_hang?: string;
  /** Chỉ cho chuyển khoản / quẹt thẻ: tài khoản nhận (Cài đặt › Tài khoản Ngân Hàng, 0323). Trống = "Khác" / chưa chọn. */ tai_khoan_id?: string; /** Chỉ cho ví điện tử: mã ví (LOAI_VI). */ loai_vi?: string };

/** Tài khoản ngân hàng đang hoạt động (cài đặt › Ngân hàng) rút gọn cho ô "Ngân hàng nhận" ở Thu ngân. Chỉ đưa 4 số cuối xuống trình duyệt. */
export type TaiKhoanNhan = { ten: string; chiNhanhId: string | null; cx: boolean; qt: boolean; macDinh: boolean; /** id tài khoản (0323) */ id?: string; /** chủ tài khoản */ chu?: string; /** 4 số cuối */ so4?: string };
/** Danh sách ngân hàng nhận cho khoản thu chuyển khoản / quẹt thẻ: tài khoản đang dùng của chi nhánh (tài khoản mặc định lên đầu) rồi "Khác"; bảng chưa có tài khoản nào dùng được thì danh sách mặc định. */
export function dsNganHangNhan(tk: TaiKhoanNhan[], chiNhanhId: string, phuongThuc: string): string[] {
  const ap = tk.filter((x) => (x.chiNhanhId === null || x.chiNhanhId === chiNhanhId) && (phuongThuc === "quet_the" ? x.qt : x.cx));
  const ten = [...new Set(ap.sort((a, b) => Number(b.macDinh) - Number(a.macDinh)).map((x) => chuanTenNganHang(x.ten)).filter((t): t is string => !!t && t !== "Khác"))];
  return ten.length ? [...ten, "Khác"] : [...NGAN_HANG_MAC_DINH];
}
/** Ô "Tài khoản nhận" (chị Lâm 10/11/2026, như SalonHero chọn tài khoản khi thu chuyển khoản / quẹt thẻ): mỗi lựa chọn là MỘT tài khoản
 *  (giá trị = id, nhãn "Vietcombank …1234 · Chủ TK"), tài khoản mặc định lên đầu, rồi "Khác". Chưa có tài khoản nào có id thì về danh sách tên ngân hàng như trước. */
export type LuaChonNhan = { gia_tri: string; nhan: string; /** tên ngắn ngân hàng ghi vào thanh_toan.ngan_hang */ ten: string; tkId?: string };
/** Nhãn ngắn: 4 số cuối đứng ngay sau tên ngân hàng để ô chọn hẹp (điện thoại) bị cắt chữ vẫn phân biệt được hai tài khoản cùng ngân hàng. */
export const nhanTaiKhoan = (x: { ten: string; chu?: string | null; so4?: string | null }) => [[chuanTenNganHang(x.ten) ?? x.ten, x.so4 ? `…${x.so4}` : null].filter(Boolean).join(" "), x.chu || null].filter(Boolean).join(" · ");
export function dsLuaChonNhan(tk: TaiKhoanNhan[], chiNhanhId: string, phuongThuc: string): LuaChonNhan[] {
  const ap = tk.filter((x) => x.id && (x.chiNhanhId === null || x.chiNhanhId === chiNhanhId) && (phuongThuc === "quet_the" ? x.qt : x.cx)).sort((a, b) => Number(b.macDinh) - Number(a.macDinh));
  if (!ap.length) return dsNganHangNhan(tk, chiNhanhId, phuongThuc).map((t) => ({ gia_tri: t, nhan: t, ten: t }));
  return [...ap.map((x) => ({ gia_tri: x.id!, nhan: nhanTaiKhoan(x), ten: chuanTenNganHang(x.ten) ?? x.ten, tkId: x.id })), { gia_tri: "Khác", nhan: "Khác (ngoài danh sách)", ten: "Khác" }];
}
/** Giá trị ô chọn của một khoản thu: id tài khoản nếu có, không thì tên ngân hàng. */
export const luaChonCuaKhoan = (t: Pick<KhoanThu, "tai_khoan_id" | "ngan_hang">) => t.tai_khoan_id ?? t.ngan_hang ?? "";
/** Gán lựa chọn vào khoản thu: tài khoản → tai_khoan_id + tên ngắn; tên (Khác / danh sách cũ) → chỉ ngan_hang. */
export function apLuaChonNhan<T extends KhoanThu>(t: T, v: string, ds: LuaChonNhan[]): T {
  const x = ds.find((y) => y.gia_tri === v);
  const { tai_khoan_id: _bo, ...con } = t; void _bo;
  return (x?.tkId ? { ...con, tai_khoan_id: x.tkId, ngan_hang: x.ten } : { ...con, ngan_hang: x?.ten ?? v }) as T;
}
/** Máy chủ: kiểm tài khoản nhận của một khoản thu. null = hợp lệ; chuỗi = lỗi. tk = dòng tai_khoan_ngan_hang (đã đọc theo id) hoặc undefined nếu không thấy. */
export function kiemTaiKhoanKhoan(phuongThuc: string, tk: { hoat_dong: boolean; chi_nhanh_id: string | null; dung_chuyen_khoan: boolean; dung_quet_the: boolean } | undefined, chiNhanhId: string): string | null {
  if (!coNganHang(phuongThuc)) return "Chỉ khoản chuyển khoản / quẹt thẻ mới chọn tài khoản nhận.";
  if (!tk || !tk.hoat_dong) return "Tài khoản nhận không còn dùng (đã ẩn hoặc xoá). Chọn lại tài khoản.";
  if (tk.chi_nhanh_id && tk.chi_nhanh_id !== chiNhanhId) return "Tài khoản nhận thuộc chi nhánh khác. Chọn lại tài khoản.";
  if (phuongThuc === "quet_the" ? !tk.dung_quet_the : !tk.dung_chuyen_khoan) return `Tài khoản này không dùng cho ${phuongThuc === "quet_the" ? "quẹt thẻ" : "chuyển khoản"}.`;
  return null;
}
/** Dòng tai_khoan_ngan_hang (đang dùng) → lựa chọn cho hộp Thu nợ: tài khoản của chi nhánh hoá đơn hoặc dùng chung, mặc định lên đầu, ghi rõ nếu chỉ dùng một hình thức; cuối là "Khác". */
export type DongTaiKhoan = { id: string; ngan_hang: string; chu_tai_khoan: string; so_tai_khoan: string; chi_nhanh_id: string | null; dung_chuyen_khoan: boolean; dung_quet_the: boolean; mac_dinh: boolean };
export function luaChonTaiKhoanForm(tk: DongTaiKhoan[], chiNhanhId: string | null): { gia_tri: string; nhan: string }[] {
  const ap = tk.filter((x) => !x.chi_nhanh_id || !chiNhanhId || x.chi_nhanh_id === chiNhanhId).sort((a, b) => Number(b.mac_dinh) - Number(a.mac_dinh));
  return [...ap.map((x) => ({ gia_tri: x.id, nhan: nhanTaiKhoan({ ten: x.ngan_hang, chu: x.chu_tai_khoan, so4: x.so_tai_khoan.replace(/\D/g, "").slice(-4) }) + (x.dung_chuyen_khoan && !x.dung_quet_the ? " (chỉ chuyển khoản)" : !x.dung_chuyen_khoan && x.dung_quet_the ? " (chỉ quẹt thẻ)" : "") })),
    { gia_tri: "Khác", nhan: "Khác (ngoài danh sách)" }];
}
/** Chọn sẵn: ngân hàng lần trước nếu còn trong danh sách, không thì ngân hàng đầu danh sách. */
export const nganHangChonSan = (ds: string[], lanTruoc: string | null | undefined) => (lanTruoc && ds.includes(lanTruoc) ? lanTruoc : ds[0]);
/** Máy chủ: ngân hàng ghi vào thanh_toan. Chỉ chuyển khoản / quẹt thẻ mới có; tiền mặt và trừ thẻ tiền luôn null; trống thì null. */
export const nganHangKhoanThu = (phuongThuc: string, ten: string | undefined | null) => (coNganHang(phuongThuc) ? chuanTenNganHang(ten) : null);
/** "Tiền khách đưa / Trả lại khách" của Thu ngân (chỉ để tính tiền thối tại quầy, KHÔNG ghi vào sổ thu tiền): khách đưa bao nhiêu so với phần thu bằng tiền mặt.
 *  Chưa nhập tiền khách đưa (0) thì chưa có kết quả; đưa thiếu thì báo còn thiếu. */
/** Khung Thanh toán của Thu ngân: 3 hình thức nhập sẵn, ĐÚNG THỨ TỰ hàng đầu hộp "Thanh toán đơn hàng" của SalonHero (Tiền mặt, Quẹt thẻ, Chuyển khoản);
 *  hình thức thứ 4 của SalonHero là "Nhiều hình thức" = nút "Thêm phương thức thanh toán" (dòng thứ hai cùng hình thức, trừ thẻ tiền, ví, COD). */
export const HINH_THUC_NHANH = ["tien_mat", "quet_the", "chuyen_khoan"] as const;
/** Số tiền ô nhập sẵn của một hình thức = khoản thu ĐẦU TIÊN của hình thức đó (các khoản sau hiện ở danh sách bên dưới). */
export const viTriNhanh = (thu: KhoanThu[], pt: string) => thu.findIndex((t) => t.phuong_thuc === pt);
/** Gõ số tiền ở ô nhập sẵn: > 0 thì sửa / tạo khoản thu (tạo mới thì kèm ngân hàng chọn sẵn), 0 thì bỏ khoản thu (máy chủ không nhận khoản 0đ). */
export function datTienNhanh(thu: KhoanThu[], pt: string, soTien: number, nganHang?: string, taiKhoanId?: string): KhoanThu[] {
  const i = viTriNhanh(thu, pt);
  const n = Math.max(Math.floor(soTien) || 0, 0);
  if (i < 0) return n > 0 ? [...thu, { phuong_thuc: pt, so_tien: n, ...(coNganHang(pt) && nganHang ? { ngan_hang: nganHang } : {}), ...(coNganHang(pt) && taiKhoanId ? { tai_khoan_id: taiKhoanId } : {}) }] : thu;
  return n > 0 ? thu.map((t, j) => (j === i ? { ...t, so_tien: n } : t)) : thu.filter((_, j) => j !== i);
}
/** Bấm tên hình thức: ô đó nhận nốt phần còn phải thu (cộng cả số đang có trong ô, vì số đó đã trừ vào phần còn lại). */
export function dienPhanCon(thu: KhoanThu[], pt: string, phai: number, nganHang?: string, taiKhoanId?: string): KhoanThu[] {
  const i = viTriNhanh(thu, pt);
  const khac = thu.reduce((s, t, j) => (j === i ? s : s + t.so_tien), 0);
  return datTienNhanh(thu, pt, Math.max(phai - khac, 0), nganHang, taiKhoanId);
}
export const tinhTraLai =(khachDua: number, tienMat: number) => ({ traLai: khachDua > 0 ? Math.max(khachDua - tienMat, 0) : 0, thieu: khachDua > 0 ? Math.max(tienMat - khachDua, 0) : 0 });
export type DonBan = {
  khachId: string | null; lichId: string | null; chiNhanhId: string;
  dong: DongDon[]; giamDon: number; vatPct: number; phuPhi: number; tip: number; nguoiGioiThieu: string; ghiChu: string; thu: KhoanThu[];
  /** Số điểm thưởng khách đổi lấy giảm giá (0 = không đổi). Tiền giảm = điểm × tỉ lệ cấu hình, máy chủ tự tính lại. */
  doiDiem?: number;
  /** Mã voucher khách đưa (rỗng = không dùng). Máy chủ tự tính lại tiền giảm từ danh mục. */
  voucher?: string;
  /** Giờ vào / giờ ra của khách trong ngày (HH:MM giờ Việt Nam) và số khách đi cùng; để trống = không ghi. */
  gioVao?: string; gioRa?: string; soKhach?: number;
  /** Lùi ngày hoá đơn (SalonHero "Ngày tạo" có cây bút, chỉ lùi): "YYYY-MM-DDTHH:MM" giờ Việt Nam. Trống = lúc chốt. */
  ngayHd?: string;
  /** Sửa hoá đơn đã chốt (đã mở lại về nháp bằng mo_lai_hoa_don): chốt lại vào CHÍNH hoá đơn này, giữ mã + ngày. */
  hoaDonId?: string;
  /** Tiền khách đưa (tiền mặt) — chỉ để in "Trả lại khách" như SalonHero, không phải khoản thu. 0 = không ghi. */
  khachDua?: number;
};
/** Hoá đơn đang sửa mở ở Thu ngân (?sua=): phần đầu đơn điền sẵn từ hoá đơn cũ. */
export type SuaHoaDon = { id: string; ma: string; ngayHd: string; giamDon: number; vatPct: number; phuPhi: number; tip: number; ghiChu: string; gioVao: string; gioRa: string; soKhach: number };
/** Kiểm ngày hoá đơn lùi: đúng định dạng, không ở tương lai (so với `bayGio`). Trả ngày (YYYY-MM-DD) + mốc ISO; trống thì null (dùng giờ chốt). */
export function kiemNgayLui(s: string | null | undefined, bayGio: Date = new Date()): { ok: true; lui: null } | { ok: true; lui: { ngay: string; iso: string } } | { ok: false; loi: string } {
  if (!s) return { ok: true, lui: null };
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/.test(s)) return { ok: false, loi: "Ngày hoá đơn chưa đúng." };
  const d = new Date(`${s}:00+07:00`);
  const [y, m, n] = s.slice(0, 10).split("-").map(Number);
  if (Number.isNaN(d.getTime()) || new Date(Date.UTC(y, m - 1, n)).getUTCDate() !== n) return { ok: false, loi: "Ngày hoá đơn chưa đúng." };
  if (d.getTime() > bayGio.getTime() + 60_000) return { ok: false, loi: "Ngày hoá đơn chỉ được lùi về trước, không chọn ngày giờ ở tương lai." };
  return { ok: true, lui: { ngay: s.slice(0, 10), iso: d.toISOString() } };
}
export const tinhDon = (hang: number, giamDon: number, vatPct: number, phuPhi: number, tip: number) => {
  const sauGiam = Math.max(hang - giamDon, 0);
  const vat = Math.round((sauGiam * vatPct) / 100);
  return { vat, phai: sauGiam + vat + phuPhi + tip };
};

/** Voucher (thẻ giảm giá) như trang Bán hàng cần: đủ để tính tiền giảm khi người bán đổi dòng hàng, không cần hỏi lại máy chủ. */
export type GioiHanVoucher = "tong_don" | "dich_vu_the" | "san_pham" | "the" | "dich_vu" | "dich_vu_san_pham" | "tuy_chon";
export type VoucherDon = { loai_giam: "tien" | "phan_tram"; gia_tri: number; giam_toi_da: number | null; gioi_han: GioiHanVoucher; /** Chỉ khi gioi_han = "tuy_chon": các dịch vụ được giảm. */ dich_vu_ids?: string[] | null };
/** Cột "Giới hạn dịch vụ áp dụng" của SalonHero → loại dòng hàng được tính giảm. Cùng bảng với hàm voucher_loai_dong của DB (migration 0080). */
export const GIOI_HAN_VOUCHER: { gia_tri: GioiHanVoucher; nhan: string; loai: MucBan["loai"][] }[] = [
  { gia_tri: "tong_don", nhan: "Tổng giá trị đơn hàng", loai: ["dich_vu", "goi_the", "san_pham"] },
  { gia_tri: "dich_vu_the", nhan: "Tất cả dịch vụ và thẻ", loai: ["dich_vu", "goi_the"] },
  { gia_tri: "san_pham", nhan: "Tất cả sản phẩm", loai: ["san_pham"] },
  { gia_tri: "the", nhan: "Thẻ dịch vụ", loai: ["goi_the"] },
  { gia_tri: "dich_vu", nhan: "Tất cả dịch vụ", loai: ["dich_vu"] },
  { gia_tri: "dich_vu_san_pham", nhan: "Cả d.vụ & s.phẩm (không thẻ)", loai: ["dich_vu", "san_pham"] },
  { gia_tri: "tuy_chon", nhan: "Tùy chọn (chọn từng dịch vụ)", loai: ["dich_vu"] },
];
/** Tiền giảm của voucher cho các dòng (thành tiền sau giảm giá dòng). Cùng công thức với hàm tinh_giam_voucher của DB (migration 0080):
 *  phần trăm làm tròn đồng, chặn bởi mức giảm tối đa; tiền không quá phần tiền hàng áp dụng. Dùng số nguyên (phần trăm × 100) để không lệch so với DB. */
export const tinhGiamVoucher = (v: VoucherDon, dong: { loai: string; thanh: number; ref?: string }[]) => {
  const loai = GIOI_HAN_VOUCHER.find((g) => g.gia_tri === v.gioi_han)?.loai ?? [];
  const coSo = dong.filter((d) => (loai as string[]).includes(d.loai) && (v.gioi_han !== "tuy_chon" || (!!d.ref && !!v.dich_vu_ids?.includes(d.ref)))).reduce((s, d) => s + d.thanh, 0);
  let giam = v.loai_giam === "phan_tram" ? Math.round((coSo * Math.round(v.gia_tri * 100)) / 10000) : Math.floor(v.gia_tri);
  if (v.loai_giam === "phan_tram" && v.giam_toi_da != null) giam = Math.min(giam, v.giam_toi_da);
  return Math.max(Math.min(giam, coSo), 0);
};

export const lamTron = (n: number) => Math.round(n * 100) / 100;
/** Chia đều 100% cho n người (hai chữ số lẻ): phần dư dồn vào người cuối để cộng đủ đúng 100. */
export const chiaDeuTi = (n: number) => Array.from({ length: n }, (_, i) => (i < n - 1 ? lamTron(100 / n) : lamTron(100 - lamTron(100 / n) * (n - 1))));

/** Doanh thu chia cho từng người hưởng (nút "Hoa hồng & doanh thu" ở Thu ngân): thành tiền dòng × phần chia của người đó, theo từng vai. Mỗi vai cộng đủ 100% nên tổng mỗi vai bằng tiền hàng dòng có gán vai đó. */
export const chiaDoanhThuNguoiHuong = (dong: { nv: DongDon["nv"]; thanh: number }[]) => {
  const kq = new Map<string, { id: string; vai: Record<Vai, number>; tong: number }>();
  for (const d of dong) {
    for (const v of VAI) {
      for (const x of d.nv[v.ma]) {
        const tien = Math.round((Math.max(d.thanh, 0) * x.ti) / 100);
        const cu = kq.get(x.id) ?? { id: x.id, vai: { phuc_vu: 0, tu_van: 0, ban: 0 }, tong: 0 };
        cu.vai[v.ma] += tien; cu.tong += tien; kq.set(x.id, cu);
      }
    }
  }
  return [...kq.values()].sort((a, b) => b.tong - a.tong);
};

/** "Màn hình khách" của Thu ngân: cửa sổ phụ cho khách xem đơn. Hai cửa sổ cùng trình duyệt nói chuyện qua BroadcastChannel, không gửi gì lên máy chủ; chỉ gửi tên khách, dòng hàng và số tiền (không SĐT, không ghi chú). */
export const KENH_MAN_HINH_KHACH = "amia-man-hinh-khach";
export type DonChoKhach = {
  khach: string; dong: { ten: string; sl: number; thanh: number }[];
  hang: number; giam: number; vat: number; phuPhiTip: number; phai: number; daThu: number; conNo: number;
};
