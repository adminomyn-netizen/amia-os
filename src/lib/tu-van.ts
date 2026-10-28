// Phiếu tư vấn theo phễu (migration 0105): đặt vấn đề → phân tích → chứng minh → kết quả. Tự thiết kế theo mục "tư vấn" của VTTech (chưa đối chiếu giao diện gốc).
import type { Truong } from "@/components/ui/BieuMau";
import type { sb } from "@/lib/db";

type Db = ReturnType<typeof sb>;
type LC = { gia_tri: string; nhan: string };

export const KET_QUA_TV: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_chot: { ten: "Chờ chốt", kieu: "cho" }, chot: { ten: "Chốt", kieu: "tot" }, khong_chot: { ten: "Không chốt", kieu: "loi" },
};
const LUA_CHON_KQ: LC[] = Object.entries(KET_QUA_TV).map(([gia_tri, v]) => ({ gia_tri, nhan: v.ten }));

/** Biểu mẫu phiếu tư vấn. `coDienThoai`: màn danh sách chung (chưa biết khách) nhập theo số điện thoại; hồ sơ khách thì đã biết. */
export const truongPhieuTuVan = (nhanVien: LC[], dichVu: LC[], coDienThoai: boolean): Truong[] => [
  ...(coDienThoai ? [{ ten: "dien_thoai", nhan: "Số điện thoại khách", loai: "chu" as const, batBuoc: true, rong: true, chiKhiTao: true, goiY: "0912345678" }] : []),
  { ten: "tu_van_vien_id", nhan: "Tư vấn viên", loai: "chon", batBuoc: true, luaChon: nhanVien },
  { ten: "ngay_tu_van", nhan: "Ngày tư vấn", loai: "ngay", batBuoc: true },
  { ten: "dich_vu_id", nhan: "Dịch vụ quan tâm", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa rõ / không có" }, ...dichVu] },
  { ten: "goi_quan_tam", nhan: "Gói / liệu trình quan tâm", loai: "chu", goiY: "Ví dụ: liệu trình 6 buổi" },
  { ten: "dat_van_de", nhan: "1. Đặt vấn đề", loai: "nhieu_dong", rong: true, goiY: "Khách đang lo gì, muốn gì (ghi ngắn)." },
  { ten: "phan_tich", nhan: "2. Phân tích", loai: "nhieu_dong", rong: true, goiY: "Nguyên nhân, tình trạng, hướng giải quyết." },
  { ten: "chung_minh", nhan: "3. Chứng minh", loai: "nhieu_dong", rong: true, goiY: "Ca tương tự, hình ảnh trước/sau, cam kết đã đưa khách xem." },
  { ten: "ket_qua", nhan: "4. Kết quả", loai: "chon", batBuoc: true, luaChon: LUA_CHON_KQ },
  { ten: "bao_gia", nhan: "Báo giá dự kiến", loai: "tien" },
  { ten: "ngay_hen_lai", nhan: "Ngày hẹn quay lại", loai: "ngay" },
  { ten: "ly_do_khong_chot", nhan: "Lý do không chốt", loai: "nhieu_dong", rong: true, batBuoc: true, hienKhi: { ten: "ket_qua", la: ["khong_chot"] }, goiY: "Chê giá, cần hỏi người nhà, so sánh nơi khác..." },
  { ten: "nhu_cau", nhan: "Nhu cầu phát sinh", loai: "nhieu_dong", rong: true, ghiChu: "Mỗi nhu cầu khách nói thêm một dòng. Chỉ thêm mới, không sửa hay xoá các dòng đã ghi.", goiY: "Muốn hỏi thêm triệt nách..." },
];

export type TiLeChotDong = { tuVanVienId: string; ten: string; soPhieu: number; choChot: number; chot: number; khongChot: number; tiLe: number; tongBaoGiaChot: number; tongBaoGia: number };

/** Tỉ lệ chốt theo từng tư vấn viên trong khoảng NGÀY TƯ VẤN (và chi nhánh). Tỉ lệ = phiếu chốt / TỔNG phiếu (phiếu còn chờ chốt tính vào mẫu số). Nhiều phiếu nhất trước. */
export async function layTiLeChot(db: Db, tu: string, den: string, cn: string | undefined): Promise<TiLeChotDong[]> {
  const { data, error } = await db.rpc("bc_ti_le_chot", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.tu_van_vien_id);
  const { data: nv } = ids.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", ids) : { data: [] };
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  return (data ?? []).map((r) => ({
    tuVanVienId: r.tu_van_vien_id, ten: ten.get(r.tu_van_vien_id) ?? "", soPhieu: Number(r.so_phieu), choChot: Number(r.cho_chot), chot: Number(r.chot), khongChot: Number(r.khong_chot),
    tiLe: Number(r.so_phieu) ? (Number(r.chot) / Number(r.so_phieu)) * 100 : 0, tongBaoGiaChot: Number(r.tong_bao_gia_chot), tongBaoGia: Number(r.tong_bao_gia),
  })).sort((a, b) => b.soPhieu - a.soPhieu || b.chot - a.chot);
}
export const phanTram = (n: number) => `${n.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
