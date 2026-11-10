import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layCaDangLam } from "@/lib/qua-gio-du-lieu";

/** Chuông quá giờ: các ca "Đang phục vụ" hôm nay mà người đang đăng nhập được báo (lọc vai trò + chi nhánh ở máy chủ).
 *  Trình duyệt tự đếm giờ từ danh sách này, chỉ hỏi lại khi lịch hẹn đổi (tín hiệu realtime) hoặc vài phút một lần. */
export async function GET() {
  const nd = await layNguoiDungHienTai();
  if (!nd) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const ds = await layCaDangLam(nd).catch(() => []);
  return NextResponse.json({ ds, bayGio: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}
