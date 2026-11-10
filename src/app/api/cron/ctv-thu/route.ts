import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { xuLyHangDoiThuCtv } from "@/lib/ctv-thu";

export const maxDuration = 60;

/** Thư CTV (0317): gửi các thư sự kiện đang chờ; từ 20:00 giờ VN xếp thư gộp "Cập nhật hoa hồng" của ngày (gọi lại không trùng); dọn mã xác thực > 30 ngày.
 *  Gọi kèm CRON_SECRET (Authorization: Bearer …), nên đặt mỗi 5–10 phút. */
export async function GET(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (!bi || req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const db = sb();
  const gio = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  let tongHop = 0;
  if (gio >= 20) tongHop = Number((await db.rpc("ctv_thu_tong_hop", { p_ngay: homNayHCM() })).data ?? 0);
  const kq = await xuLyHangDoiThuCtv();
  await db.rpc("ctv_don_ma_cu");
  return NextResponse.json({ ...kq, tongHop });
}
