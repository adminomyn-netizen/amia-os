import { redirect } from "next/navigation";
import { layNguoiDungHienTai } from "@/lib/auth";

/** Đã đăng nhập thật (phiên còn sống + hồ sơ đang hoạt động) thì vào thẳng phần mềm; phiên hỏng thì hiện form đăng nhập, không vòng lặp. */
export default async function KhungDangNhap({ children }: { children: React.ReactNode }) {
  if (await layNguoiDungHienTai()) redirect("/");
  return children;
}
