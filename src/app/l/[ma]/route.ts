import { NextResponse } from "next/server";
import { sb } from "@/lib/db";

/** Link theo dõi công khai: ghi một lượt bấm rồi chuyển tới địa chỉ đích. Link tắt hoặc không có thì về trang chủ. */
export async function GET(req: Request, { params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const goc = new URL(req.url);
  if (!/^[a-z0-9-]{3,40}$/.test(ma)) return NextResponse.redirect(new URL("/", goc));
  const { data } = await sb().rpc("ghi_click_link", { p_ma: ma });
  const den = typeof data === "string" ? data : null;
  if (!den || !/^(https?:\/\/|\/(?!\/))/.test(den)) return NextResponse.redirect(new URL("/", goc));
  return NextResponse.redirect(/^https?:/.test(den) ? den : new URL(den, goc), 302);
}
