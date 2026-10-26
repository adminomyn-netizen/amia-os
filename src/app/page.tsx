import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";
import { trangDau } from "@/lib/nav";

/** Cổng vào: chưa đăng nhập → đăng nhập; đã đăng nhập → trang đầu tiên người đó được phép (có thể không có dashboard). */
export default async function Goc() {
  const nd = await layNguoiDungHienTai();
  redirect(nd ? (nd.phaiDoiMatKhau ? "/tai-khoan?doi-mat-khau=1" : trangDau(nd)) : "/dang-nhap");
}
