import { NutHop } from "@/components/ui/BieuMau";
import { doiTrangThaiNhac } from "@/app/(app)/khach-hang/nhac-nho/actions";

/** Nút đổi trạng thái nhắc (dùng ở Lịch nhắc và tab Nhắc nhở của khách). */
export function NutTrangThaiNhac({ id, tt }: { id: string; tt: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {tt === "dang_nhac" && <NutHop kieu="chu" nhan="Đã thực hiện" tieuDe="Đánh dấu đã thực hiện" xacNhan="Đã gọi/nhắn khách theo nhắc này?" an={{ id, trang_thai: "da_xong" }} nhanLuu="Đã thực hiện" action={doiTrangThaiNhac} />}
      {tt === "dang_nhac" && <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ nhắc" xacNhan="Huỷ nhắc này? Nhắc vẫn được giữ trong lịch sử." an={{ id, trang_thai: "huy" }} nhanLuu="Huỷ nhắc" action={doiTrangThaiNhac} />}
      {tt !== "dang_nhac" && <NutHop kieu="chu" nhan="Mở lại" tieuDe="Mở lại nhắc" xacNhan="Chuyển nhắc về Chưa thực hiện?" an={{ id, trang_thai: "dang_nhac" }} nhanLuu="Mở lại" action={doiTrangThaiNhac} />}
    </span>
  );
}
