import { Users } from "lucide-react";

/** /khach-hang: máy tính hiện khung chờ ở cột phải (danh sách nằm ở layout bên trái); điện thoại ẩn khung này, chỉ thấy danh sách. */
export default function TrangKhachHang() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-the border border-dashed border-vien-dam px-6 py-16 text-center text-muc-3">
      <Users aria-hidden strokeWidth={1.4} className="h-10 w-10" />
      <p className="text-[15px]">Chọn một khách ở danh sách bên trái để xem hồ sơ.</p>
    </div>
  );
}
