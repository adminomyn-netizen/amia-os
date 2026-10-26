import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layCanhBao } from "@/lib/canh-bao";

/** Chuông thông báo: danh sách việc đang chờ của người đang đăng nhập (không lưu đệm). */
export async function GET() {
  const nd = await layNguoiDungHienTai();
  if (!nd) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const ds = nd.phaiDoiMatKhau ? [] : await layCanhBao(nd);
  return NextResponse.json({ ds }, { headers: { "Cache-Control": "no-store" } });
}
