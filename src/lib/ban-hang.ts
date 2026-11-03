import { boDau } from "@/lib/dinh-dang";
import { chuanTenNganHang, coNganHang, NGAN_HANG_MAC_DINH } from "@/lib/ngan-hang-ten";
export type Vai = "phuc_vu" | "tu_van" | "ban";
export const VAI: { ma: Vai; ten: string }[] = [{ ma: "phuc_vu", ten: "Phục vụ" }, { ma: "tu_van", ten: "Tư vấn" }, { ma: "ban", ten: "Bán hàng" }];
/** SalonHero: mỗi dòng hàng có tối đa 5 người hưởng cho mỗi vai. DB cũng chặn (migration 0081). */
export const TOI_DA_NGUOI_HUONG = 5;
export const PHUONG_THUC = [
  { gia_tri: "tien_mat", nhan: "Tiền mặt" }, { gia_tri: "chuyen_khoan", nhan: "Chuyển khoản" }, { gia_tri: "quet_the", nhan: "Quẹt thẻ" }, { gia_tri: "the_tien", nhan: "Trừ thẻ tiền" },
];
export const NHAN_PHUONG_THUC = Object.fromEntries(PHUONG_THUC.map((p) => [p.gia_tri, p.nhan])) as Record<string, string>;

export type MucBan = { loai: "dich_vu" | "goi_the" | "san_pham"; id: string; ten: string; gia: number; nhom: string; vatPct?: number; tao?: string; /** Mã và mã vạch để thu ngân tìm nhanh (gõ không dấu cũng ra). */ ma?: string; maVach?: string;
  /** "Nơi hiển thị" = chỉ đặt lịch / ẩn: không hiện ở ô chọn mục của Thu ngân (dòng cũ vẫn dùng được). */ anThuNgan?: boolean;
  /** "Địa điểm cung cấp" của dịch vụ: null/không có = mọi chi nhánh. */ chiNhanhIds?: string[] | null;
  /** "Sửa giá khi thanh toán": thu ngân được sửa đơn giá dòng (chỉ dịch vụ, sản phẩm). */ choSuaGia?: boolean };
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
  /** Đơn giá thu ngân sửa (chỉ khi mục bật "Sửa giá khi thanh toán"); không có = giá danh mục. */ gia?: number };
/** Đơn giá tối đa thu ngân được gõ khi sửa giá (chặn gõ nhầm thừa số 0). */
export const GIA_SUA_TOI_DA = 10_000_000_000;
/** Loại dòng được sửa đơn giá theo cờ cho_sua_gia. Thẻ KHÔNG (giá thẻ đổi thì giá trị mỗi buổi đổi theo — chờ chị Lâm quyết). */
export const LOAI_SUA_GIA: MucBan["loai"][] = ["dich_vu", "san_pham"];
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
    ra.push({ loai: o.loai as DongDon["loai"], ref: String(o.ref), sl: Math.min(999, Math.max(1, Math.floor(Number(o.sl) || 1))), giam: Math.max(0, Math.floor(Number(o.giam) || 0)), nv,
      ...(Number.isInteger(gia) && gia >= 0 && gia <= GIA_SUA_TOI_DA ? { gia } : {}) });
  }
  return ra;
}

export type KhoanThu = { phuong_thuc: string; so_tien: number; the_id?: string; /** Chỉ cho chuyển khoản / quẹt thẻ: ngân hàng nhận tiền (tên ngắn). */ ngan_hang?: string };

/** Tài khoản ngân hàng đang hoạt động (cài đặt › Ngân hàng) rút gọn cho ô "Ngân hàng nhận" ở Thu ngân. */
export type TaiKhoanNhan = { ten: string; chiNhanhId: string | null; cx: boolean; qt: boolean; macDinh: boolean };
/** Danh sách ngân hàng nhận cho khoản thu chuyển khoản / quẹt thẻ: tài khoản đang dùng của chi nhánh (tài khoản mặc định lên đầu) rồi "Khác"; bảng chưa có tài khoản nào dùng được thì danh sách mặc định. */
export function dsNganHangNhan(tk: TaiKhoanNhan[], chiNhanhId: string, phuongThuc: string): string[] {
  const ap = tk.filter((x) => (x.chiNhanhId === null || x.chiNhanhId === chiNhanhId) && (phuongThuc === "quet_the" ? x.qt : x.cx));
  const ten = [...new Set(ap.sort((a, b) => Number(b.macDinh) - Number(a.macDinh)).map((x) => chuanTenNganHang(x.ten)).filter((t): t is string => !!t && t !== "Khác"))];
  return ten.length ? [...ten, "Khác"] : [...NGAN_HANG_MAC_DINH];
}
/** Chọn sẵn: ngân hàng lần trước nếu còn trong danh sách, không thì ngân hàng đầu danh sách. */
export const nganHangChonSan = (ds: string[], lanTruoc: string | null | undefined) => (lanTruoc && ds.includes(lanTruoc) ? lanTruoc : ds[0]);
/** Máy chủ: ngân hàng ghi vào thanh_toan. Chỉ chuyển khoản / quẹt thẻ mới có; tiền mặt và trừ thẻ tiền luôn null; trống thì null. */
export const nganHangKhoanThu = (phuongThuc: string, ten: string | undefined | null) => (coNganHang(phuongThuc) ? chuanTenNganHang(ten) : null);
/** "Tiền khách đưa / Trả lại khách" của Thu ngân (chỉ để tính tiền thối tại quầy, KHÔNG ghi vào sổ thu tiền): khách đưa bao nhiêu so với phần thu bằng tiền mặt.
 *  Chưa nhập tiền khách đưa (0) thì chưa có kết quả; đưa thiếu thì báo còn thiếu. */
export const tinhTraLai = (khachDua: number, tienMat: number) => ({ traLai: khachDua > 0 ? Math.max(khachDua - tienMat, 0) : 0, thieu: khachDua > 0 ? Math.max(tienMat - khachDua, 0) : 0 });
export type DonBan = {
  khachId: string | null; lichId: string | null; chiNhanhId: string;
  dong: DongDon[]; giamDon: number; vatPct: number; phuPhi: number; tip: number; nguoiGioiThieu: string; ghiChu: string; thu: KhoanThu[];
  /** Số điểm thưởng khách đổi lấy giảm giá (0 = không đổi). Tiền giảm = điểm × tỉ lệ cấu hình, máy chủ tự tính lại. */
  doiDiem?: number;
  /** Mã voucher khách đưa (rỗng = không dùng). Máy chủ tự tính lại tiền giảm từ danh mục. */
  voucher?: string;
  /** Giờ vào / giờ ra của khách trong ngày (HH:MM giờ Việt Nam) và số khách đi cùng; để trống = không ghi. */
  gioVao?: string; gioRa?: string; soKhach?: number;
};
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
