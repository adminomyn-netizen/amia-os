import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { docIn } from "@/lib/thiet-lap-in";
import { InTamTinh } from "@/components/ban-hang/InTamTinh";
import { CO_SO } from "@/lib/in-hoa-don";

/** In hoá đơn TRƯỚC khi chốt (SalonHero: nút "In hóa đơn" trong hộp thanh toán): Thu ngân để đơn đang dựng trong bộ nhớ trình duyệt, trang này in theo Thiết lập in của chi nhánh.
 *  Không đọc / ghi hoá đơn nào trên máy chủ. */
export default async function TrangInTamTinh({ searchParams }: { searchParams: Promise<{ cn?: string }> }) {
  const nd = await yeuCauQuyen("ban.tao");
  const q = (await searchParams).cn ?? "";
  const db = sb();
  // Chi nhánh của giỏ (?cn=); tài khoản gắn chi nhánh thì theo tài khoản. Không có (giỏ chưa chọn) thì lấy chi nhánh đang hoạt động đầu tiên (chỉ Vinh) để đầu tờ luôn có tên + địa chỉ.
  let cnId = nd.chiNhanhId || (/^[0-9a-f-]{36}$/i.test(q) ? q : "");
  if (!cnId) cnId = (await db.from("chi_nhanh").select("id").eq("hoat_dong", true).order("ten").limit(1).maybeSingle()).data?.id ?? "";
  const [{ data: ch }, { data: cn }, { data: ch1 }] = await Promise.all([
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
    cnId ? db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", cnId).maybeSingle() : Promise.resolve({ data: null }),
    db.from("cua_hang").select("ten_phap_nhan, dien_thoai").eq("id", 1).maybeSingle(),
  ]);
  const { cauHinh } = docIn("hoa_don", ch, cnId);
  // Đầu tờ y như hoá đơn đã chốt (dungToInHoaDon): tên cơ sở + lĩnh vực · giấy phép + "Chi nhánh: …" + địa chỉ + điện thoại.
  const cuaHang = { ten: cn?.ten ?? "AMIA", tenCoSo: ch1?.ten_phap_nhan || CO_SO.ten, phu: `${CO_SO.linhVuc} · ${cauHinh.ngonNgu === "en" ? "License" : "Giấy phép"} ${CO_SO.giayPhep}`, diaChi: cn?.dia_chi, dienThoai: cn?.dien_thoai ?? ch1?.dien_thoai };
  // Bản tạm tính không có mã QR (chưa có số tiền chốt), không in "chỉ đơn hoàn thành".
  return <InTamTinh cfg={{ ...cauHinh, qr: false }} cuaHang={cuaHang} />;
}
