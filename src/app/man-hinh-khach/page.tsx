import { yeuCauQuyen } from "@/lib/auth";
import { ManHinhKhach } from "@/components/ban-hang/ManHinhKhach";

export const metadata = { title: "Màn hình khách" };

/** Cửa sổ phụ cho khách xem đơn đang tính, mở từ nút "Màn hình khách" ở Thu ngân. Nằm ngoài khung ứng dụng để chiếu toàn màn hình. */
export default async function TrangManHinhKhach() {
  await yeuCauQuyen("ban.tao");
  return <ManHinhKhach />;
}
