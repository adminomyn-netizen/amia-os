import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { KHO_LEAD_TEP } from "@/lib/lead";
import { layLeadDuocXem } from "@/lib/lead-quyen";

export const dynamic = "force-dynamic";

/** Mở / tải tệp của lead (ảnh khách là dữ liệu nhạy cảm): cần quyền xử lý lead hoặc xem marketing, lead cùng chi nhánh; link ký sống 60 giây. ?tai=1 để tải về. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const nd = await layNguoiDungHienTai();
  if (!nd || !(coQuyen(nd, "lead.xu_ly") || coQuyen(nd, "mkt.xem")) || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Không có quyền", { status: 403 });
  const { data: t } = await sb().from("lead_tep").select("lead_id, ten, duong_dan").eq("id", id).maybeSingle();
  if (!t) return new NextResponse("Không tìm thấy tệp", { status: 404 });
  if (!(await layLeadDuocXem(t.lead_id, nd))) return new NextResponse("Không có quyền", { status: 403 });
  const tai = new URL(req.url).searchParams.get("tai") === "1";
  const { data, error } = await createAdminClient().storage.from(KHO_LEAD_TEP).createSignedUrl(t.duong_dan, 60, tai ? { download: t.ten } : undefined);
  if (error || !data) return new NextResponse("Chưa mở được tệp", { status: 502 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
