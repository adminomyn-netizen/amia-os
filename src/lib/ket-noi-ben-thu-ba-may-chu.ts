import "server-only";
import { sb } from "@/lib/db";
import { giaiMaCauHinh, laKenhNoi, xemCauHinh, type CauHinh, type KenhNoi } from "@/lib/ket-noi-ben-thu-ba";

/** Khoá mã hoá lấy từ khoá máy chủ có sẵn; không bao giờ trả về trình duyệt. Các hàm ở đây KHÔNG nằm trong tệp "use server" để không thành điểm gọi công khai. */
export const biMatKetNoi = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export type TrangThaiKenh = { kenh: KenhNoi; daNoi: boolean; tenHienThi: string | null; suaLuc: string | null; xem: Record<string, string>; hong: boolean };

/** Tình trạng các kênh để hiện lên trang: chỉ có bản đã che khoá (4 ký tự cuối), không có khoá thật. */
export async function trangThaiCacKenh(): Promise<Record<KenhNoi, TrangThaiKenh>> {
  const { data } = await sb().from("ket_noi_ben_thu_ba").select("kenh, cau_hinh_ma_hoa, ten_hien_thi, trang_thai, sua_luc");
  const ra = {} as Record<KenhNoi, TrangThaiKenh>;
  for (const k of ["zalo_oa", "sms", "messenger"] as const) ra[k] = { kenh: k, daNoi: false, tenHienThi: null, suaLuc: null, xem: {}, hong: false };
  for (const r of data ?? []) {
    if (!laKenhNoi(r.kenh)) continue;
    const c = giaiMaCauHinh(r.cau_hinh_ma_hoa, biMatKetNoi());
    ra[r.kenh] = { kenh: r.kenh, daNoi: r.trang_thai === "da_noi", tenHienThi: r.ten_hien_thi, suaLuc: r.sua_luc, xem: c ? xemCauHinh(r.kenh, c) : {}, hong: !c };
  }
  return ra;
}

/** Cấu hình thật của một kênh (đã giải mã) cho bộ gửi; null nếu chưa nối hoặc khoá hỏng. Chỉ dùng ở máy chủ. */
export async function layCauHinh(kenh: KenhNoi): Promise<CauHinh | null> {
  const { data } = await sb().from("ket_noi_ben_thu_ba").select("cau_hinh_ma_hoa, trang_thai").eq("kenh", kenh).maybeSingle();
  if (!data || data.trang_thai !== "da_noi") return null;
  return giaiMaCauHinh(data.cau_hinh_ma_hoa, biMatKetNoi());
}

export const CHUA_GUI_DUOC = "Chưa gửi được: cần kiểm tra khoá với nhà cung cấp";

/** Gửi thử một tin. Chưa có thư viện gọi API của nhà cung cấp nên KHÔNG giả vờ gửi: luôn trả lời chưa gửi được. Trả về null nếu gửi được, ngược lại là lời báo lỗi. */
export async function guiThuNghiem(kenh: KenhNoi, den: string): Promise<string | null> {
  if (!den.trim()) return "Nhập nơi nhận thử.";
  const c = await layCauHinh(kenh);
  if (!c) return "Kênh này chưa kết nối hoặc khoá đã hỏng, nhập lại khoá.";
  return CHUA_GUI_DUOC;
}
