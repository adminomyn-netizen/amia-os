import "server-only";
import { sb } from "@/lib/db";
import { tienVN } from "@/lib/dinh-dang";

/** Khoản chi mới làm tổng chi của (tháng, phân loại, chi nhánh) vượt ngân sách đã đặt thì trả về câu giải thích, không thì null.
 *  Ưu tiên ngân sách riêng của chi nhánh, không có thì dùng ngân sách "Toàn công ty"; cả hai đều không có thì không chặn. Đã chi lấy từ sổ quỹ. */
export async function vuotNganSach(p: { ngay: string; loaiThuChiId: string; chiNhanhId: string; soTien: number }): Promise<string | null> {
  const db = sb(), thang = p.ngay.slice(0, 7), dau = `${thang}-01`;
  const [y, m] = [Number(thang.slice(0, 4)), Number(thang.slice(5))], tiep = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const { data: ns } = await db.from("ngan_sach_ky").select("chi_nhanh_id, so_tien").eq("thang", thang).eq("loai_thu_chi_id", p.loaiThuChiId).or(`chi_nhanh_id.eq.${p.chiNhanhId},chi_nhanh_id.is.null`);
  const rieng = (ns ?? []).find((n) => n.chi_nhanh_id === p.chiNhanhId), chung = (ns ?? []).find((n) => n.chi_nhanh_id === null);
  const ap = rieng ?? chung;
  if (!ap) return null;
  const { data: quy } = await db.from("quy").select("id, chi_nhanh_id");
  const hop = new Set((quy ?? []).filter((q) => !rieng ? true : q.chi_nhanh_id === p.chiNhanhId).map((q) => q.id));
  const { data: chi } = await db.from("so_quy").select("so_tien, quy_id").eq("loai", "chi").eq("loai_thu_chi_id", p.loaiThuChiId).gte("ngay", dau).lt("ngay", tiep).limit(5000);
  const daChi = (chi ?? []).filter((c) => hop.has(c.quy_id)).reduce((s, c) => s + Number(c.so_tien), 0);
  const han = Number(ap.so_tien);
  if (daChi + p.soTien <= han) return null;
  return `Khoản chi này làm tổng chi tháng ${thang.slice(5)}/${thang.slice(0, 4)} vượt ngân sách (${rieng ? "chi nhánh" : "toàn công ty"}): đã chi ${tienVN(daChi)}, thêm ${tienVN(p.soTien)}, ngân sách ${tienVN(han)}.`;
}
