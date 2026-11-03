import { boDau } from "@/lib/dinh-dang";

/** 8 tình trạng thẻ như SalonHero (+ "Đang dùng" là mặc định cũ của AMIA OS, và "Tất cả" gồm cả thẻ đã hết/thu hồi). Thứ tự = thứ tự ô chọn. */
export const TINH_TRANG_DUNG_THE = [
  { ma: "", nhan: "Đang dùng (mặc định)" }, { ma: "tat_ca", nhan: "Tất cả" }, { ma: "su_dung", nhan: "Sử dụng" }, { ma: "sap_het", nhan: "Sắp hết tiền/lần" },
  { ma: "thang", nhan: "Hết hạn sau 1 tháng" }, { ma: "tuan", nhan: "Hết hạn sau 1 tuần" }, { ma: "het_han", nhan: "Hết hạn" },
  { ma: "hoan_thanh", nhan: "Hoàn thành" }, { ma: "thu_hoi", nhan: "Thu hồi" }, { ma: "khoa", nhan: "Đã khoá" },
];
export const LOAI_DUNG_THE = [{ ma: "", nhan: "Tất cả loại thẻ" }, { ma: "lan", nhan: "Thẻ lần" }, { ma: "tien", nhan: "Thẻ tiền" }];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

export type LocDungThe = { cn: string | null; tt: string; loai: string; nhom: string; capTu: string; capDen: string; hanTu: string; hanDen: string; tuKhoa: string; hom: string };

/** Đọc & làm sạch tham số địa chỉ của màn "Khách dùng thẻ" (cũng dùng cho Xuất Excel). `cn` đã được màn hình/API quyết theo quyền người dùng. */
export function docLocDungThe(sp: Record<string, string | undefined>, cn: string | null, hom: string): LocDungThe {
  const ngay = (v?: string) => (v && NGAY.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");
  return {
    cn,
    tt: TINH_TRANG_DUNG_THE.some((x) => x.ma === sp.tt) ? (sp.tt ?? "") : "",
    loai: LOAI_DUNG_THE.some((x) => x.ma === sp.loai) ? (sp.loai ?? "") : "",
    nhom: sp.nhom && UUID.test(sp.nhom) ? sp.nhom : "",
    capTu: ngay(sp.cap_tu), capDen: ngay(sp.cap_den), hanTu: ngay(sp.han_tu), hanDen: ngay(sp.han_den),
    tuKhoa: (sp.q ?? "").trim().replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60),
    hom,
  };
}

/** Phần số để tìm theo SĐT: chỉ dùng khi gõ từ 3 chữ số (gõ "THU-D2" không được khớp mọi số có chữ 2). */
const sdtTim = (t: string) => { const d = t.replace(/\D/g, "").replace(/^0/, ""); return d.length >= 3 ? d : ""; };

/** Tham số gọi hàm CSDL `the_dung_loc` / `tong_khach_dung_the` (cùng một bộ điều kiện nên màn hình, ô tổng và Excel luôn khớp). */
export function thamSoRpc(f: LocDungThe) {
  return {
    p_cn: f.cn ?? undefined, p_loai: f.loai, p_tt: f.tt, p_hom: f.hom, p_nhom: f.nhom || undefined,
    p_cap_tu: f.capTu || undefined, p_cap_den: f.capDen || undefined, p_han_tu: f.hanTu || undefined, p_han_den: f.hanDen || undefined,
    p_tim: f.tuKhoa, p_tim_kd: boDau(f.tuKhoa), p_sdt: sdtTim(f.tuKhoa),
  };
}

/** Các tham số lọc đang bật, dạng chuỗi (để dựng link phân trang và nút Xuất Excel). */
export function thamSoDiaChi(f: LocDungThe): Record<string, string> {
  const o: Record<string, string | undefined> = { tt: f.tt || undefined, loai: f.loai || undefined, nhom: f.nhom || undefined, cap_tu: f.capTu || undefined, cap_den: f.capDen || undefined, han_tu: f.hanTu || undefined, han_den: f.hanDen || undefined, q: f.tuKhoa || undefined };
  return Object.fromEntries(Object.entries(o).filter((e): e is [string, string] => !!e[1]));
}
