import { Calculator, ClipboardList, Settings2, Wallet } from "lucide-react";
import { coQuyen } from "@/lib/quyen";
import type { NguoiDung } from "@/lib/auth";

/** Các màn của chính sách hoa hồng mới, lọc theo quyền người xem. */
export function lienKetCs(nd: NguoiDung) {
  return [
    { href: "/hoa-hong/chinh-sach", ten: "Chính sách", icon: ClipboardList },
    { href: "/thu-nhap-cua-toi", ten: "Thu nhập tạm tính của tôi", icon: Wallet },
    ...(coQuyen(nd, "luong.xem") ? [{ href: "/hoa-hong/thang", ten: "Bảng tính tháng", icon: Calculator }] : []),
    ...(coQuyen(nd, "hethong.phanquyen") ? [{ href: "/hoa-hong/chinh-sach/cai-dat", ten: "Cài đặt chính sách", icon: Settings2 }] : []),
  ];
}
