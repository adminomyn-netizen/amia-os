import "server-only";
import { sb } from "@/lib/db";
import { giaiMaThu, maHoaThu } from "@/lib/email-tuyen-dung";

/** Khoá mã hoá lấy từ khoá máy chủ có sẵn; không bao giờ trả về trình duyệt. Tệp này KHÔNG phải tệp "use server" nên các hàm bên dưới không thành điểm gọi công khai. */
export const biMatHddt = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Mã hoá khoá / mật khẩu nhà cung cấp để lưu; kèm 4 ký tự cuối để trang hiện "đã lưu" mà không phải giải mã. */
export function khoaDeLuu(khoa: string): { khoa_ma_hoa: string; khoa_cuoi4: string } {
  return { khoa_ma_hoa: maHoaThu(khoa, biMatHddt()), khoa_cuoi4: khoa.slice(-4) };
}

export type KetNoiHienThi = { nhaCungCap: string; maSoThue: string; tenDangNhap: string; coKhoa: boolean; khoaCuoi4: string; mauSo: string; kyHieu: string; diaChi: string; suaLuc: string };

/** Thông tin kết nối để HIỆN trên trang: tuyệt đối không có khoá đã mã hoá lẫn khoá gốc. */
export async function docKetNoiHienThi(): Promise<KetNoiHienThi | null> {
  const { data: k } = await sb().from("ket_noi_hoa_don_dien_tu").select("nha_cung_cap, ma_so_thue, ten_dang_nhap, khoa_ma_hoa, khoa_cuoi4, mau_so_mac_dinh, ky_hieu_mac_dinh, dia_chi_may_chu, sua_luc").eq("id", true).maybeSingle();
  if (!k) return null;
  return { nhaCungCap: k.nha_cung_cap, maSoThue: k.ma_so_thue, tenDangNhap: k.ten_dang_nhap ?? "", coKhoa: !!k.khoa_ma_hoa, khoaCuoi4: k.khoa_cuoi4 ?? "", mauSo: k.mau_so_mac_dinh ?? "", kyHieu: k.ky_hieu_mac_dinh ?? "", diaChi: k.dia_chi_may_chu ?? "", suaLuc: k.sua_luc };
}

/** Giải mã khoá nhà cung cấp để gọi API (CHỈ dùng trong máy chủ). Sai khoá máy chủ hoặc dữ liệu hỏng thì báo nhập lại. */
export async function layKhoaNhaCungCap(): Promise<{ khoa: string } | { loi: string }> {
  const { data: k } = await sb().from("ket_noi_hoa_don_dien_tu").select("khoa_ma_hoa").eq("id", true).maybeSingle();
  if (!k?.khoa_ma_hoa) return { loi: "Chưa có khoá nhà cung cấp." };
  const khoa = giaiMaThu(k.khoa_ma_hoa, biMatHddt());
  return khoa ? { khoa } : { loi: "Khoá đã lưu bị hỏng, nhập lại ở tab Kết nối." };
}

/** Phát hành hoá đơn điện tử tự động. CHƯA nối API nhà cung cấp nên luôn trả lỗi, không bao giờ giả vờ phát hành thành công. */
export async function phatHanhTuDong(hoaDonId: string): Promise<{ loi: string }> {
  void hoaDonId;
  return { loi: "Cần kết nối nhà cung cấp: chưa nối API nên chưa phát hành tự động được." };
}
