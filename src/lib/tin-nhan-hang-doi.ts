import "server-only";
import { sb } from "@/lib/db";
import { bienThieu, chuanHoaSdt, dienMauTin, type KenhTin } from "@/lib/tin-nhan";

export type KetQuaXep =
  | { ok: true; id: string }
  | { ok: false; lyDo: "khach_chan" | "khach_khong_co" | "mau_khong_co" | "mau_tat" | "sdt_sai" | "thieu_bien" | "loi_luu"; thongBao: string };
const tu = (lyDo: Extract<KetQuaXep, { ok: false }>["lyDo"], thongBao: string): KetQuaXep => ({ ok: false, lyDo, thongBao });

/**
 * Xếp MỘT tin vào hàng đợi từ một mẫu đã bật. Chưa có bộ gửi tự động và chưa có việc nào gọi hàm này hàng loạt; hàm để sau này nối (nhắc lịch, sinh nhật, tái khám).
 * Khách có cờ khong_gui_zns (tìm theo mã khách và theo số điện thoại) thì TUYỆT ĐỐI không xếp. Mẫu tắt thì không xếp. Biến mẫu cần mà thiếu thì không xếp (tin không được thiếu chữ).
 */
export async function xepTinNhan(v: { mauMa: string; khachId?: string | null; soDienThoai?: string | null; bien: Record<string, string | null | undefined>; nguoiId?: string | null }): Promise<KetQuaXep> {
  const db = sb();
  let sdt = chuanHoaSdt(v.soDienThoai);
  let chiNhanhId: string | null = null;
  if (v.khachId) {
    const { data: k } = await db.from("khach_hang").select("id, dien_thoai, chi_nhanh_id, khong_gui_zns").eq("id", v.khachId).maybeSingle();
    if (!k) return tu("khach_khong_co", "Không tìm thấy khách.");
    if (k.khong_gui_zns) return tu("khach_chan", "Khách đã chặn tin nhắn, không xếp tin.");
    chiNhanhId = k.chi_nhanh_id;
    sdt = sdt ?? chuanHoaSdt(k.dien_thoai);
  }
  if (!sdt) return tu("sdt_sai", "Số điện thoại không hợp lệ.");
  // Gõ tay số của khách đã chặn (không kèm mã khách) cũng bị chặn.
  const { data: chan } = await db.from("khach_hang").select("id").eq("dien_thoai", sdt).eq("khong_gui_zns", true).limit(1);
  if (chan && chan.length > 0) return tu("khach_chan", "Số này của khách đã chặn tin nhắn, không xếp tin.");
  const { data: mau } = await db.from("tin_nhan_mau").select("ma, kenh, noi_dung, bat").eq("ma", v.mauMa).maybeSingle();
  if (!mau) return tu("mau_khong_co", "Không có mẫu tin này.");
  if (!mau.bat) return tu("mau_tat", "Mẫu tin đang tắt.");
  const thieu = bienThieu(mau.noi_dung, v.bien);
  if (thieu.length) return tu("thieu_bien", `Thiếu thông tin để điền mẫu: ${thieu.join(", ")}.`);
  const { data: moi, error } = await db.from("tin_nhan_hang_doi").insert({
    kenh: mau.kenh as KenhTin, den_so_dien_thoai: sdt, khach_id: v.khachId ?? null, chi_nhanh_id: chiNhanhId, mau_ma: mau.ma,
    noi_dung: dienMauTin(mau.noi_dung, v.bien), nguoi_tao_id: v.nguoiId ?? null,
  }).select("id").maybeSingle();
  if (error || !moi) return tu("loi_luu", "Chưa xếp được tin vào hàng đợi.");
  return { ok: true, id: moi.id };
}
