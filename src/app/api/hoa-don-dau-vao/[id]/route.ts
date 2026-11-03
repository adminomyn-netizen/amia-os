import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { KHO_HDDV } from "@/lib/hoa-don-dau-vao";

export const dynamic = "force-dynamic";

/** Tải về tệp hoá đơn đầu vào (nút "Tải về" như SalonHero): chỉ người có quyền xem mua hàng; nhân viên gắn chi nhánh chỉ tải hoá đơn chi nhánh mình; link ký sống 60 giây. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "mua.xem") || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Không có quyền", { status: 403 });
  const { data: h } = await sb().from("hoa_don_dau_vao").select("tep_duong_dan, tep_ten, chi_nhanh_id").eq("id", id).maybeSingle();
  if (!h?.tep_duong_dan) return new NextResponse("Không tìm thấy tệp", { status: 404 });
  if (nd.chiNhanhId && h.chi_nhanh_id && h.chi_nhanh_id !== nd.chiNhanhId) return new NextResponse("Không có quyền", { status: 403 });
  const { data, error } = await createAdminClient().storage.from(KHO_HDDV).createSignedUrl(h.tep_duong_dan, 60, { download: h.tep_ten ?? true });
  if (error || !data) return new NextResponse("Chưa mở được tệp", { status: 502 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
