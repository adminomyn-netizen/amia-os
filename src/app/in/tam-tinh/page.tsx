import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { docIn } from "@/lib/thiet-lap-in";
import { InTamTinh } from "@/components/ban-hang/InTamTinh";

/** In hoá đơn TRƯỚC khi chốt (SalonHero: nút "In hóa đơn" trong hộp thanh toán): Thu ngân để đơn đang dựng trong bộ nhớ trình duyệt, trang này in theo Thiết lập in của chi nhánh.
 *  Không đọc / ghi hoá đơn nào trên máy chủ. */
export default async function TrangInTamTinh({ searchParams }: { searchParams: Promise<{ cn?: string }> }) {
  const nd = await yeuCauQuyen("ban.tao");
  const q = (await searchParams).cn ?? "";
  const cnId = nd.chiNhanhId ?? (/^[0-9a-f-]{36}$/i.test(q) ? q : "");
  const db = sb();
  const [{ data: ch }, { data: cn }] = await Promise.all([
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
    cnId ? db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", cnId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const { cauHinh } = docIn("hoa_don", ch, cnId);
  // Bản tạm tính không có mã QR (chưa có số tiền chốt), không in "chỉ đơn hoàn thành".
  return <InTamTinh cfg={{ ...cauHinh, qr: false }} cuaHang={cn ? { ten: cn.ten, diaChi: cn.dia_chi, dienThoai: cn.dien_thoai } : null} />;
}
