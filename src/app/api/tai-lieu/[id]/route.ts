import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { sb } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { KHO_HO_SO, quyenHoSo } from "@/lib/data-ho-so";

export const dynamic = "force-dynamic";

/** Mở giấy tờ nhân sự: chỉ người có quyền "hr.hoso" hoặc chính chủ; mỗi lần mở được ghi nhật ký; link ký sống 60 giây rồi hết hiệu lực. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const nd = await layNguoiDungHienTai();
  if (!nd || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Không có quyền", { status: 403 });
  const db = sb();
  const { data: tl } = await db.from("nhan_vien_tai_lieu").select("id, nhan_vien_id, duong_dan, da_go").eq("id", id).maybeSingle();
  if (!tl) return new NextResponse("Không tìm thấy", { status: 404 });
  const q = await quyenHoSo(nd, tl.nhan_vien_id);
  if (!q.xem || (tl.da_go && !q.quanTri)) return new NextResponse("Không có quyền", { status: 403 });
  const { data, error } = await createAdminClient().storage.from(KHO_HO_SO).createSignedUrl(tl.duong_dan, 60);
  if (error || !data) return new NextResponse("Chưa mở được tệp", { status: 502 });
  await db.from("nhan_vien_tai_lieu_xem").insert({ tai_lieu_id: tl.id, nguoi_id: nd.nhanVienId });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
