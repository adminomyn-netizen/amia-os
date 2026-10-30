import { chuanTenNganHang, coNganHang, NGAN_HANG_MAC_DINH } from "@/lib/ngan-hang-ten";
export type Vai = "phuc_vu" | "tu_van" | "ban";
export const VAI: { ma: Vai; ten: string }[] = [{ ma: "phuc_vu", ten: "Phục vụ" }, { ma: "tu_van", ten: "Tư vấn" }, { ma: "ban", ten: "Bán hàng" }];
/** SalonHero: mỗi dòng hàng có tối đa 5 người hưởng cho mỗi vai. DB cũng chặn (migration 0081). */
export const TOI_DA_NGUOI_HUONG = 5;
export const PHUONG_THUC = [
  { gia_tri: "tien_mat", nhan: "Tiền mặt" }, { gia_tri: "chuyen_khoan", nhan: "Chuyển khoản" }, { gia_tri: "quet_the", nhan: "Quẹt thẻ" }, { gia_tri: "the_tien", nhan: "Trừ thẻ tiền" },
];
export const NHAN_PHUONG_THUC = Object.fromEntries(PHUONG_THUC.map((p) => [p.gia_tri, p.nhan])) as Record<string, string>;

export type MucBan = { loai: "dich_vu" | "goi_the" | "san_pham"; id: string; ten: string; gia: number; nhom: string; vatPct?: number };
export type DongDon = { loai: MucBan["loai"]; ref: string; sl: number; giam: number; nv: Record<Vai, { id: string; ti: number }[]> };
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
export type DonBan = {
  khachId: string | null; lichId: string | null; chiNhanhId: string;
  dong: DongDon[]; giamDon: number; vatPct: number; phuPhi: number; tip: number; nguoiGioiThieu: string; ghiChu: string; thu: KhoanThu[];
  /** Số điểm thưởng khách đổi lấy giảm giá (0 = không đổi). Tiền giảm = điểm × tỉ lệ cấu hình, máy chủ tự tính lại. */
  doiDiem?: number;
  /** Mã voucher khách đưa (rỗng = không dùng). Máy chủ tự tính lại tiền giảm từ danh mục. */
  voucher?: string;
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
