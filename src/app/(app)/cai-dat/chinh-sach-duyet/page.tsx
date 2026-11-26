import { redirect } from "next/navigation";

/** Gộp vào "Quy trình phê duyệt" (26/11/2026): ngưỡng tiền, người giữ chức danh và chuỗi bước ở một trang. */
export default function TrangChinhSachDuyet() {
  redirect("/cai-dat/quy-trinh-duyet");
}
